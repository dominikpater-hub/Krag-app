import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { newDb } from 'pg-mem';
import { buildApp, type RateLimits } from './app.ts';

const here = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(join(here, '..', 'schema.sql'), 'utf8');

let app: ReturnType<typeof buildApp>;

/** Świeża instancja (własna baza w pamięci). limits: nadpisania liczników S-1. */
function freshApp(limits?: RateLimits) {
  const mem = newDb();
  mem.public.none(schema);
  const { Pool } = mem.adapters.createPg();
  return buildApp(new Pool(), { limits });
}

// Wspólna instancja: limity podniesione, żeby zestaw testów nie wpadał we własne bramki S-1.
const ROOMY = { authIp: 10_000, authHandle: 10_000, registerIp: 10_000, ida: 10_000, join: 10_000, keys: 10_000 };

before(() => { app = freshApp(ROOMY); });

// ——— pomocnicze: prawdziwe klucze P-256, jak w kliencie ———
async function genKey() {
  return crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
}
async function rawPub(kp: CryptoKeyPair) {
  const raw = await crypto.subtle.exportKey('raw', kp.publicKey);
  return Buffer.from(new Uint8Array(raw)).toString('base64');
}
async function sign(kp: CryptoKeyPair, msg: string) {
  const s = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, kp.privateKey,
    new TextEncoder().encode(msg));
  return Buffer.from(new Uint8Array(s)).toString('base64');
}
async function login(pseudonym: string, kp: CryptoKeyPair) {
  const ch = await app.inject({ method: 'POST', url: '/auth/challenge', payload: { pseudonym } });
  assert.equal(ch.statusCode, 200, ch.body);
  const { nonce } = ch.json();
  const signature = await sign(kp, nonce);
  const v = await app.inject({ method: 'POST', url: '/auth/verify', payload: { pseudonym, nonce, signature } });
  assert.equal(v.statusCode, 200, v.body);
  return v.json().token as string;
}
const bearer = (t: string) => ({ authorization: `Bearer ${t}` });

test('health', async () => {
  const r = await app.inject({ method: 'GET', url: '/health' });
  assert.equal(r.statusCode, 200);
  assert.equal(r.json().ok, true);
});

test('pełny przepływ: bootstrap → zaproszenie → rejestracja → klucze → koperta → moderacja', async () => {
  const founderKp = await genKey();
  const founder = 'Cichy Świt #A1B2';

  // 1) bootstrap założyciela
  const boot = await app.inject({ method: 'POST', url: '/accounts/bootstrap',
    payload: { pseudonym: founder, publicKey: await rawPub(founderKp) } });
  assert.equal(boot.statusCode, 200, boot.body);

  // drugi bootstrap musi odpaść — wejście tylko z zaproszenia
  const boot2 = await app.inject({ method: 'POST', url: '/accounts/bootstrap',
    payload: { pseudonym: 'X #0000', publicKey: 'AA==' } });
  assert.equal(boot2.statusCode, 403);

  // 2) założyciel się loguje (dowód klucza) i tworzy zaproszenie
  const tokF = await login(founder, founderKp);
  const inv = await app.inject({ method: 'POST', url: '/invites', headers: bearer(tokF) });
  assert.equal(inv.statusCode, 200, inv.body);
  const code = inv.json().code as string;
  assert.match(code, /^KRAG-[A-Z0-9]{4}-[A-Z0-9]{4}$/);

  // 3) nowa osoba wykorzystuje kod
  const memberKp = await genKey();
  const member = 'Spokojna Rzeka #C3D4';
  const red = await app.inject({ method: 'POST', url: '/invites/redeem',
    payload: { code, pseudonym: member, publicKey: await rawPub(memberKp) } });
  assert.equal(red.statusCode, 200, red.body);

  // ten sam kod drugi raz → odrzucony
  const red2 = await app.inject({ method: 'POST', url: '/invites/redeem',
    payload: { code, pseudonym: 'Ktoś #9999', publicKey: 'AA==' } });
  assert.equal(red2.statusCode, 409);

  // 4) member publikuje klucze (PreKeys)
  const tokM = await login(member, memberKp);
  const pub = await app.inject({ method: 'POST', url: '/keys', headers: bearer(tokM),
    payload: { identityKey: 'idk_member', signedPrekey: 'spk_member', oneTimePrekeys: ['otk1', 'otk2'] } });
  assert.equal(pub.statusCode, 200, pub.body);

  // 5) założyciel pobiera paczkę kluczy membera (zdejmuje jeden one-time prekey)
  const kb = await app.inject({ method: 'GET', url: `/keys/${encodeURIComponent(member)}`, headers: bearer(tokF) });
  assert.equal(kb.statusCode, 200, kb.body);
  assert.equal(kb.json().identityKey, 'idk_member');
  assert.equal(kb.json().oneTimePrekey, 'otk1');

  // 6) założyciel wysyła kopertę E2E do membera
  const env = await app.inject({ method: 'POST', url: '/envelopes', headers: bearer(tokF),
    payload: { toPseudonym: member, ciphertext: 'BASE64_CIPHERTEXT' } });
  assert.equal(env.statusCode, 200, env.body);

  // 7) member pobiera koperty (i znikają po odbiorze)
  const pull1 = await app.inject({ method: 'GET', url: '/envelopes', headers: bearer(tokM) });
  assert.equal(pull1.statusCode, 200);
  assert.equal(pull1.json().envelopes.length, 1);
  assert.equal(pull1.json().envelopes[0].from, founder);
  assert.equal(pull1.json().envelopes[0].ciphertext, 'BASE64_CIPHERTEXT');
  const pull2 = await app.inject({ method: 'GET', url: '/envelopes', headers: bearer(tokM) });
  assert.equal(pull2.json().envelopes.length, 0); // skasowane po dostarczeniu

  // 8) member zgłasza do moderacji (message franking)
  const rep = await app.inject({ method: 'POST', url: '/reports', headers: bearer(tokM),
    payload: { reportedPseudonym: founder, revealed: 'ujawniony fragment + tag' } });
  assert.equal(rep.statusCode, 200, rep.body);
  assert.equal(rep.json().status, 'open');

  // 9) zły podpis: wyzwanie dla membera, ale podpisane obcym kluczem → 401
  const ch = await app.inject({ method: 'POST', url: '/auth/challenge', payload: { pseudonym: member } });
  const fakeKp = await genKey();
  const badSig = await sign(fakeKp, ch.json().nonce);
  const bad = await app.inject({ method: 'POST', url: '/auth/verify',
    payload: { pseudonym: member, nonce: ch.json().nonce, signature: badSig } });
  assert.equal(bad.statusCode, 401);
});

test('bezpieczeństwo: brak tokenu jest odrzucany', async () => {
  const noTok = await app.inject({ method: 'POST', url: '/invites' });
  assert.equal(noTok.statusCode, 401);
});

/* S-1: dawniej /auth/challenge zwracało 404 „Nieznany pseudonim" dla nieistniejącego konta,
 * a 200 {nonce} dla istniejącego — czyli ktokolwiek mógł sprawdzić, czy dany uchwyt ma konto
 * w Kręgu. W tej populacji to przesłanka o statusie zdrowotnym. Odpowiedzi muszą być
 * NIEODRÓŻNIALNE. Poprzednia wersja tego testu utrwalała podatność (assert 404). */
test('S-1: /auth/challenge nie zdradza, czy uchwyt ma konto', async () => {
  const a = freshApp(ROOMY);
  const kp = await genKey();
  const real = 'Ciepły Wiatr #S101';
  const boot = await a.inject({ method: 'POST', url: '/accounts/bootstrap',
    payload: { pseudonym: real, publicKey: await rawPub(kp) } });
  assert.equal(boot.statusCode, 200, boot.body);

  const known = await a.inject({ method: 'POST', url: '/auth/challenge', payload: { pseudonym: real } });
  const unknown = await a.inject({ method: 'POST', url: '/auth/challenge', payload: { pseudonym: 'Nikt Nieznany #0000' } });
  assert.equal(known.statusCode, unknown.statusCode, 'ten sam kod odpowiedzi');
  assert.equal(known.statusCode, 200);
  assert.deepEqual(Object.keys(known.json()).sort(), Object.keys(unknown.json()).sort(), 'ten sam kształt odpowiedzi');
  assert.ok(unknown.json().nonce, 'nieistniejący uchwyt też dostaje wyzwanie (ślepe)');
});

test('S-1: ślepe wyzwanie nie loguje, a błąd jest nieodróżnialny od złego podpisu', async () => {
  const a = freshApp(ROOMY);
  const kp = await genKey();
  const real = 'Spokojna Rzeka #S102';
  const boot = await a.inject({ method: 'POST', url: '/accounts/bootstrap',
    payload: { pseudonym: real, publicKey: await rawPub(kp) } });
  assert.equal(boot.statusCode, 200, boot.body);

  const ghost = 'Duch Nieistniejacy #0000';
  const chG = await a.inject({ method: 'POST', url: '/auth/challenge', payload: { pseudonym: ghost } });
  const vGhost = await a.inject({ method: 'POST', url: '/auth/verify',
    payload: { pseudonym: ghost, nonce: chG.json().nonce, signature: await sign(kp, chG.json().nonce) } });
  assert.equal(vGhost.statusCode, 401, 'konto-widmo nie dostaje sesji');

  const obcy = await genKey();
  const chR = await a.inject({ method: 'POST', url: '/auth/challenge', payload: { pseudonym: real } });
  const vBad = await a.inject({ method: 'POST', url: '/auth/verify',
    payload: { pseudonym: real, nonce: chR.json().nonce, signature: await sign(obcy, chR.json().nonce) } });
  assert.equal(vBad.statusCode, vGhost.statusCode);
  assert.equal(vBad.json().error, vGhost.json().error, 'ten sam komunikat — brak wyroczni');
});

test('S-1: limit chroni przed uporczywym odpytywaniem o JEDEN uchwyt', async () => {
  const a = freshApp({ authHandle: 3, authIp: 10_000 });
  const target = 'Sprawdzany Uchwyt #S103';
  let limited = false;
  for (let i = 0; i < 8; i++) {
    const r = await a.inject({ method: 'POST', url: '/auth/challenge', payload: { pseudonym: target } });
    if (r.statusCode === 429) { limited = true; assert.ok(r.headers['retry-after'], 'jest Retry-After'); break; }
  }
  assert.ok(limited, 'po kilku próbach ten sam uchwyt musi zostać przytrzymany');
});

test('S-1: limit uchwytu nie blokuje INNYCH uchwytów (koszyki niezależne)', async () => {
  const a = freshApp({ authHandle: 2, authIp: 10_000 });
  for (let i = 0; i < 3; i++) await a.inject({ method: 'POST', url: '/auth/challenge', payload: { pseudonym: 'Jeden #0001' } });
  const inny = await a.inject({ method: 'POST', url: '/auth/challenge', payload: { pseudonym: 'Drugi #0002' } });
  assert.equal(inny.statusCode, 200, 'inny uchwyt działa normalnie');
});

test('otwarta rejestracja: bez PoW = 403; z poprawnym PoW = konto; duplikat = 409', async () => {
  const { createHash } = await import('node:crypto');
  const lzb = (hex: string) => { let n = 0; for (const ch of hex) { const v = parseInt(ch, 16); if (v === 0) { n += 4; continue; } n += Math.clz32(v) - 28; break; } return n; };
  const solve = (challenge: string, bits: number) => { for (let i = 0; ; i++) { if (lzb(createHash('sha256').update(`${challenge}:${i}`).digest('hex')) >= bits) return String(i); } };

  const pk = 'AAAApublickey==';
  // bez PoW
  const noPow = await app.inject({ method: 'POST', url: '/accounts/register', payload: { pseudonym: 'Nowy Ktoś #1111', publicKey: pk } });
  assert.equal(noPow.statusCode, 403, noPow.body);
  // z PoW
  const ch = (await app.inject({ method: 'GET', url: '/pow' })).json();
  const nonce = solve(ch.challenge, ch.bits);
  const reg = await app.inject({ method: 'POST', url: '/accounts/register', payload: { pseudonym: 'Nowy Ktoś #1111', publicKey: pk, pow: { challenge: ch.challenge, nonce } } });
  assert.equal(reg.statusCode, 200, reg.body);
  // duplikat pseudonimu (nowy PoW)
  const ch2 = (await app.inject({ method: 'GET', url: '/pow' })).json();
  const dup = await app.inject({ method: 'POST', url: '/accounts/register', payload: { pseudonym: 'Nowy Ktoś #1111', publicKey: pk, pow: { challenge: ch2.challenge, nonce: solve(ch2.challenge, ch2.bits) } } });
  assert.equal(dup.statusCode, 409);
  // sfałszowane wyzwanie odrzucone
  const fake = await app.inject({ method: 'POST', url: '/accounts/register', payload: { pseudonym: 'Inny #2222', publicKey: pk, pow: { challenge: '9999999999999.deadbeef.0000000000000000', nonce: '0' } } });
  assert.equal(fake.statusCode, 403);
});

test('katalog: publikacja ogłoszenia, przeglądanie z filtrem okolicy/tematu, usunięcie', async () => {
  const mem = newDb(); mem.public.none(schema);
  const { Pool } = mem.adapters.createPg();
  const app2 = buildApp(new Pool());
  const login2 = async (pseudonym: string, kp: CryptoKeyPair) => {
    const ch = await app2.inject({ method: 'POST', url: '/auth/challenge', payload: { pseudonym } });
    const v = await app2.inject({ method: 'POST', url: '/auth/verify', payload: { pseudonym, nonce: ch.json().nonce, signature: await sign(kp, ch.json().nonce) } });
    return v.json().token as string;
  };
  const kpA = await genKey(); const A = 'Wschodni Wiatr #AAAA';
  await app2.inject({ method: 'POST', url: '/accounts/bootstrap', payload: { pseudonym: A, publicKey: await rawPub(kpA) } });
  const tokA = await login2(A, kpA);

  // publikacja
  const put = await app2.inject({ method: 'PUT', url: '/catalog', headers: bearer(tokA), payload: { region: 'Warszawa', tags: 'świeżo po diagnozie, PrEP', bio: 'Otwarty na rozmowę.' } });
  assert.equal(put.statusCode, 200, put.body);
  // wymaga auth
  assert.equal((await app2.inject({ method: 'GET', url: '/catalog' })).statusCode, 401);
  // przeglądanie (authed)
  const all = await app2.inject({ method: 'GET', url: '/catalog', headers: bearer(tokA) });
  assert.equal(all.json().listings.length, 1);
  assert.equal(all.json().listings[0].pseudonym, A);
  // filtr po okolicy
  assert.equal((await app2.inject({ method: 'GET', url: '/catalog?region=warsz', headers: bearer(tokA) })).json().listings.length, 1);
  assert.equal((await app2.inject({ method: 'GET', url: '/catalog?region=krakow', headers: bearer(tokA) })).json().listings.length, 0);
  // filtr po temacie
  assert.equal((await app2.inject({ method: 'GET', url: '/catalog?tag=prep', headers: bearer(tokA) })).json().listings.length, 1);
  // #2 buddy/mentor: A nie jest mentorem → filtr mentor=1 pusty; po oznaczeniu → widoczny z flagą
  assert.equal((await app2.inject({ method: 'GET', url: '/catalog?mentor=1', headers: bearer(tokA) })).json().listings.length, 0);
  await app2.inject({ method: 'PUT', url: '/catalog', headers: bearer(tokA), payload: { region: 'Warszawa', tags: 'PrEP', bio: '', mentor: true } });
  const mlist = (await app2.inject({ method: 'GET', url: '/catalog?mentor=1', headers: bearer(tokA) })).json().listings;
  assert.equal(mlist.length, 1);
  assert.equal(mlist[0].mentor, true);
  // usunięcie
  await app2.inject({ method: 'DELETE', url: '/catalog', headers: bearer(tokA) });
  assert.equal((await app2.inject({ method: 'GET', url: '/catalog', headers: bearer(tokA) })).json().listings.length, 0);
});

test('pokoje: utworzenie → dołączenie → lista członków (tylko członek) → wyjście', async () => {
  const mem = newDb(); mem.public.none(schema);
  const { Pool } = mem.adapters.createPg();
  const app2 = buildApp(new Pool());
  const mkAcc = async (pseudonym: string) => {
    const kp = await genKey();
    await app2.inject({ method: 'POST', url: '/accounts/bootstrap', payload: { pseudonym, publicKey: await rawPub(kp) } })
      .then(async (r) => { if (r.statusCode !== 200) { // po pierwszym bootstrapie kolejne przez register+PoW
        const { createHash } = await import('node:crypto');
        const lzb = (hex: string) => { let n = 0; for (const ch of hex) { const v = parseInt(ch, 16); if (v === 0) { n += 4; continue; } n += Math.clz32(v) - 28; break; } return n; };
        const ch = (await app2.inject({ method: 'GET', url: '/pow' })).json();
        let i = 0; while (lzb(createHash('sha256').update(`${ch.challenge}:${i}`).digest('hex')) < ch.bits) i++;
        await app2.inject({ method: 'POST', url: '/accounts/register', payload: { pseudonym, publicKey: await rawPub(kp), pow: { challenge: ch.challenge, nonce: String(i) } } });
      } });
    const c = await app2.inject({ method: 'POST', url: '/auth/challenge', payload: { pseudonym } });
    const v = await app2.inject({ method: 'POST', url: '/auth/verify', payload: { pseudonym, nonce: c.json().nonce, signature: await sign(kp, c.json().nonce) } });
    return v.json().token as string;
  };
  const A = 'Cichy Świt #AA01', B = 'Spokojna Rzeka #BB02', C = 'Nocny Brzeg #CC03';
  const tokA = await mkAcc(A), tokB = await mkAcc(B), tokC = await mkAcc(C);

  // A tworzy pokój (i jest w nim automatycznie)
  const cr = await app2.inject({ method: 'POST', url: '/rooms', headers: bearer(tokA), payload: { name: 'Świeżo po diagnozie' } });
  assert.equal(cr.statusCode, 200, cr.body);
  const roomId = cr.json().id as string;

  // lista pokojów pokazuje 1 członka; filtr po nazwie działa
  const list = await app2.inject({ method: 'GET', url: '/rooms', headers: bearer(tokB) });
  assert.equal(list.json().rooms.length, 1);
  assert.equal(list.json().rooms[0].members, 1);
  assert.equal((await app2.inject({ method: 'GET', url: '/rooms?q=diagnoz', headers: bearer(tokB) })).json().rooms.length, 1);
  assert.equal((await app2.inject({ method: 'GET', url: '/rooms?q=xyz', headers: bearer(tokB) })).json().rooms.length, 0);

  // nie-członek NIE widzi listy członków (403)
  assert.equal((await app2.inject({ method: 'GET', url: `/rooms/${roomId}/members`, headers: bearer(tokB) })).statusCode, 403);

  // B i C dołączają
  assert.equal((await app2.inject({ method: 'POST', url: `/rooms/${roomId}/join`, headers: bearer(tokB) })).statusCode, 200);
  assert.equal((await app2.inject({ method: 'POST', url: `/rooms/${roomId}/join`, headers: bearer(tokC) })).statusCode, 200);
  // ponowne dołączenie idempotentne
  assert.equal((await app2.inject({ method: 'POST', url: `/rooms/${roomId}/join`, headers: bearer(tokB) })).statusCode, 200);

  // członek widzi pełną listę (do rozgłaszania)
  const mem2 = await app2.inject({ method: 'GET', url: `/rooms/${roomId}/members`, headers: bearer(tokA) });
  assert.equal(mem2.statusCode, 200);
  assert.deepEqual(mem2.json().members.slice().sort(), [A, B, C].slice().sort());

  // licznik członków = 3
  assert.equal((await app2.inject({ method: 'GET', url: '/rooms', headers: bearer(tokA) })).json().rooms[0].members, 3);

  // B wychodzi → nie widzi już listy członków, licznik = 2
  assert.equal((await app2.inject({ method: 'POST', url: `/rooms/${roomId}/leave`, headers: bearer(tokB) })).statusCode, 200);
  assert.equal((await app2.inject({ method: 'GET', url: `/rooms/${roomId}/members`, headers: bearer(tokB) })).statusCode, 403);
  assert.equal((await app2.inject({ method: 'GET', url: '/rooms', headers: bearer(tokA) })).json().rooms[0].members, 2);

  // dołączenie do nieistniejącego (ale poprawnego) pokoju = 404
  const ghost = '00000000-0000-0000-0000-000000000000';
  assert.equal((await app2.inject({ method: 'POST', url: `/rooms/${ghost}/join`, headers: bearer(tokA) })).statusCode, 404);
});

test('sejf E2E: zapis (authed) → odczyt po lookupId (bez auth); cudze konto nie nadpisze', async () => {
  // świeża baza, żeby móc zbootstrapować konto A
  const mem = newDb(); mem.public.none(schema);
  const { Pool } = mem.adapters.createPg();
  const app2 = buildApp(new Pool());

  const kpA = await genKey(); const A = 'Cichy Świt #AAAA';
  await app2.inject({ method: 'POST', url: '/accounts/bootstrap', payload: { pseudonym: A, publicKey: await rawPub(kpA) } });
  const tokA = await (async () => {
    const ch = await app2.inject({ method: 'POST', url: '/auth/challenge', payload: { pseudonym: A } });
    const { nonce } = ch.json();
    const signature = await sign(kpA, nonce);
    const v = await app2.inject({ method: 'POST', url: '/auth/verify', payload: { pseudonym: A, nonce, signature } });
    return v.json().token as string;
  })();

  const lookupId = 'lookup_' + 'a'.repeat(40);
  // zapis wymaga auth
  const noAuth = await app2.inject({ method: 'PUT', url: '/vault', payload: { lookupId, ciphertext: 'CT1' } });
  assert.equal(noAuth.statusCode, 401);
  // zapis authed
  const put = await app2.inject({ method: 'PUT', url: '/vault', headers: bearer(tokA), payload: { lookupId, ciphertext: 'CT1' } });
  assert.equal(put.statusCode, 200, put.body);
  // odczyt bez auth po lookupId
  const get = await app2.inject({ method: 'GET', url: `/vault/${lookupId}` });
  assert.equal(get.statusCode, 200, get.body);
  assert.equal(get.json().ciphertext, 'CT1');
  // aktualizacja przez to samo konto działa (LWW)
  const put2 = await app2.inject({ method: 'PUT', url: '/vault', headers: bearer(tokA), payload: { lookupId, ciphertext: 'CT2' } });
  assert.equal(put2.statusCode, 200);
  assert.equal((await app2.inject({ method: 'GET', url: `/vault/${lookupId}` })).json().ciphertext, 'CT2');

  // inne konto (B) nie może nadpisać sejfu A pod tym samym lookupId → 403
  const inv = await app2.inject({ method: 'POST', url: '/invites', headers: bearer(tokA) });
  const code = inv.json().code as string;
  const kpB = await genKey(); const B = 'Spokojny Ogród #BBBB';
  await app2.inject({ method: 'POST', url: '/invites/redeem', payload: { code, pseudonym: B, publicKey: await rawPub(kpB) } });
  const chB = await app2.inject({ method: 'POST', url: '/auth/challenge', payload: { pseudonym: B } });
  const sigB = await sign(kpB, chB.json().nonce);
  const tokB = (await app2.inject({ method: 'POST', url: '/auth/verify', payload: { pseudonym: B, nonce: chB.json().nonce, signature: sigB } })).json().token;
  const hijack = await app2.inject({ method: 'PUT', url: '/vault', headers: bearer(tokB), payload: { lookupId, ciphertext: 'EVIL' } });
  assert.equal(hijack.statusCode, 403);

  // nieistniejący sejf = 404
  assert.equal((await app2.inject({ method: 'GET', url: '/vault/nope' })).statusCode, 404);
});
