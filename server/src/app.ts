import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify';
import type { Queryable } from './db.ts';
import * as repo from './repo.ts';
import { verifySignature, newToken, newNonce, minutesFromNow } from './auth.ts';
import { issue as powIssue, verify as powVerify } from './pow.ts';
import { idaAnswer } from './ida-ai.ts';
import { createLimiter, envInt, type Limiter } from './ratelimit.ts';

const SESSION_MINUTES = 60;
const CHALLENGE_MINUTES = 5;
const INVITE_DAYS = 14;
const MIN = 60_000;

/* S-1: JEDEN komunikat dla każdej przyczyny nieudanego logowania.
 * Rozróżnialne błędy („Nieznany pseudonim" vs „Podpis nie zgadza się") są wyrocznią:
 * pozwalają sprawdzić, czy dany uchwyt ma konto w Kręgu. W tej populacji taki wniosek
 * jest przesłanką o statusie zdrowotnym, więc odpowiedzi muszą być nieodróżnialne. */
const AUTH_FAIL = 'Nie udało się zalogować';

declare module 'fastify' {
  interface FastifyRequest { account?: { id: string; pseudonym: string } }
}

/** Nadpisania limitów (S-1) — produkcja bierze wartości z env, testy wstrzykują własne. */
export interface RateLimits {
  authIp?: number; authHandle?: number; registerIp?: number;
  ida?: number; join?: number; keys?: number;
}

export function buildApp(
  db: Queryable,
  opts: { trustProxy?: boolean; limits?: RateLimits } = {},
): FastifyInstance {
  // trustProxy: włączane w produkcji za reverse proxy (Caddy), by rate-limit widział realne IP (SEC-04).
  const app = Fastify({ logger: false, trustProxy: opts.trustProxy ?? false });

  // Jednolita obsługa błędów z warstwy repo (statusCode).
  app.setErrorHandler((err, _req, reply) => {
    const code = (err as any).statusCode ?? 500;
    const ra = (err as any).retryAfter;
    if (ra) reply.header('retry-after', String(ra));
    reply.code(code >= 400 && code < 600 ? code : 500).send({ error: (err as Error).message });
  });

  /* S-1: realne limity. Do tej pory komentarze w kodzie („authed, rate-limited") opisywały
   * kontrolę, której nie było w ogóle. Limity per-IP chronią przed masowym skanowaniem,
   * per-uchwyt — przed uporczywym odpytywaniem O JEDEN konkretny pseudonim (to jest ten
   * groźny przypadek: „czy moja była ma konto w Kręgu"), per-konto — przed żniwem i kosztem. */
  const L = opts.limits ?? {};
  const limits = {
    authIp: createLimiter({ windowMs: 10 * MIN, max: L.authIp ?? envInt('KRAG_RL_AUTH_IP', 20) }),
    authHandle: createLimiter({ windowMs: 10 * MIN, max: L.authHandle ?? envInt('KRAG_RL_AUTH_HANDLE', 5) }),
    registerIp: createLimiter({ windowMs: 60 * MIN, max: L.registerIp ?? envInt('KRAG_RL_REGISTER_IP', 5) }),
    idaAcct: createLimiter({ windowMs: 10 * MIN, max: L.ida ?? envInt('KRAG_RL_IDA', 30) }),
    joinAcct: createLimiter({ windowMs: 60 * MIN, max: L.join ?? envInt('KRAG_RL_JOIN', 20) }),
    keysAcct: createLimiter({ windowMs: 10 * MIN, max: L.keys ?? envInt('KRAG_RL_KEYS', 60) }),
  };

  const gate = (lim: Limiter, key: string) => {
    if (lim.check(key)) return;
    const err = repo.httpError(429, 'Za dużo prób — spróbuj później');
    (err as any).retryAfter = lim.retryAfter(key);
    throw err;
  };
  // Uchwyt normalizujemy, żeby „Kot #AB12" i „kot #ab12" trafiały do tego samego koszyka.
  const handleKey = (p: unknown) => 'h:' + String(p ?? '').trim().toLowerCase();

  const requireAuth = async (req: FastifyRequest) => {
    const h = req.headers.authorization ?? '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : '';
    if (!token) throw repo.httpError(401, 'Brak tokenu');
    const acc = await repo.accountForToken(db, token);
    if (!acc) throw repo.httpError(401, 'Sesja nieważna');
    req.account = { id: acc.id, pseudonym: acc.pseudonym };
  };

  app.get('/health', async () => ({ ok: true, service: 'krag-server', ts: new Date().toISOString() }));

  // ——— Rejestracja / bootstrap ———
  app.post('/accounts/bootstrap', async (req) => {
    const { pseudonym, publicKey } = req.body as any;
    requireFields({ pseudonym, publicKey });
    return repo.bootstrapAccount(db, pseudonym, publicKey);
  });

  app.post('/invites/redeem', async (req) => {
    const { code, pseudonym, publicKey } = req.body as any;
    requireFields({ code, pseudonym, publicKey });
    return repo.redeemInvite(db, code, pseudonym, publicKey);
  });

  // ——— Otwarta rejestracja (bez zaproszeń), chroniona proof-of-work ———
  app.get('/pow', async () => powIssue());
  app.post('/accounts/register', async (req) => {
    const { pseudonym, publicKey, pow } = req.body as any;
    requireFields({ pseudonym, publicKey });
    gate(limits.registerIp, 'ip:' + req.ip);   // S-1: PoW nie był żadnym limitem ilościowym
    if (!pow || !powVerify(pow.challenge, pow.nonce)) throw repo.httpError(403, 'Nieprawidłowy dowód pracy');
    return repo.registerAccount(db, pseudonym, publicKey);
  });

  // ——— „Logowanie" = dowód posiadania klucza prywatnego ———
  app.post('/auth/challenge', async (req) => {
    const { pseudonym } = req.body as any;
    requireFields({ pseudonym });
    gate(limits.authIp, 'ip:' + req.ip);
    gate(limits.authHandle, handleKey(pseudonym));
    // S-1: wyzwanie zapisujemy ZAWSZE — także dla nieistniejącego uchwytu. Dzięki temu
    // odpowiedź i praca serwera są takie same w obu przypadkach; ślepe wyzwanie i tak
    // nie przejdzie /auth/verify (nie ma konta ani klucza), a wygasa po 5 minutach.
    const nonce = newNonce();
    await repo.createChallenge(db, pseudonym, nonce, minutesFromNow(CHALLENGE_MINUTES));
    return { nonce };
  });

  app.post('/auth/verify', async (req) => {
    const { pseudonym, nonce, signature } = req.body as any;
    requireFields({ pseudonym, nonce, signature });
    gate(limits.authIp, 'ip:' + req.ip);
    const ch = await repo.takeChallenge(db, nonce, pseudonym);
    const acc = ch ? await repo.findAccountByPseudonym(db, pseudonym) : null;
    // S-1: podpis weryfikujemy ZAWSZE — przy braku konta wobec klucza-atrapy. Bez tego
    // „konto nie istnieje" wracałoby bez kosztownej kryptografii i różnica czasu byłaby
    // wyrocznią nawet przy identycznej treści odpowiedzi.
    const ok = await verifySignature(
      acc ? acc.public_key : await dummyPublicKey(),
      new TextEncoder().encode(String(nonce)) as unknown as BufferSource,
      signature,
    );
    if (!ch || !acc || !ok) throw repo.httpError(401, AUTH_FAIL);
    const token = newToken();
    const expires = minutesFromNow(SESSION_MINUTES);
    await repo.createSession(db, token, acc.id, expires);
    return { token, expiresAt: expires.toISOString() };
  });

  // ——— Zaproszenia (authed, rate-limited) ———
  app.post('/invites', async (req) => {
    await requireAuth(req);
    const code = 'KRAG-' + rand4() + '-' + rand4();
    return repo.createInvite(db, req.account!.id, code, daysFromNow(INVITE_DAYS));
  });

  // ——— PreKeys (Signal): publikacja i pobranie kluczy publicznych ———
  app.post('/keys', async (req) => {
    await requireAuth(req);
    const { identityKey, signedPrekey, oneTimePrekeys } = req.body as any;
    requireFields({ identityKey, signedPrekey });
    await repo.publishKeys(db, req.account!.id, identityKey, signedPrekey,
      Array.isArray(oneTimePrekeys) ? oneTimePrekeys : []);
    return { ok: true };
  });

  app.get('/keys/:pseudonym', async (req) => {
    await requireAuth(req);
    // S-1 (poszerzenie): to też wyrocznia istnienia uchwytu, tyle że za logowaniem.
    // Limit ogranicza masowe sprawdzanie listy pseudonimów z jednego konta.
    gate(limits.keysAcct, 'a:' + req.account!.id);
    const { pseudonym } = req.params as any;
    return repo.fetchKeyBundle(db, pseudonym);
  });

  // ——— Koperty E2E (serwer nie czyta treści) ———
  app.post('/envelopes', async (req) => {
    await requireAuth(req);
    const { toPseudonym, ciphertext } = req.body as any;
    requireFields({ toPseudonym, ciphertext });
    return repo.sendEnvelope(db, toPseudonym, req.account!.pseudonym, ciphertext);
  });

  app.get('/envelopes', async (req) => {
    await requireAuth(req);
    return { envelopes: await repo.pullEnvelopes(db, req.account!.id) };
  });

  // ——— Sejf E2E (profil + kopia kluczy). Serwer trzyma tylko szyfrogram. ———
  app.get('/vault/:lookupId', async (req) => {
    const { lookupId } = req.params as any;
    const v = await repo.getVault(db, lookupId);
    if (!v) throw repo.httpError(404, 'Sejf nie istnieje');
    return { ciphertext: v.ciphertext, updatedAt: v.updated_at };
  });

  app.put('/vault', async (req) => {
    await requireAuth(req);
    const { lookupId, ciphertext } = req.body as any;
    requireFields({ lookupId, ciphertext });
    return repo.putVault(db, lookupId, req.account!.id, ciphertext);
  });

  // ——— Katalog (#6): opt-in ogłoszenia (widoczne dla członków) ———
  app.get('/catalog', async (req) => {
    await requireAuth(req);
    const { region, tag, mentor } = (req.query as any) || {};
    return { listings: await repo.listListings(db, region, tag, mentor === '1' || mentor === 'true') };
  });
  app.put('/catalog', async (req) => {
    await requireAuth(req);
    const { region, tags, bio, mentor } = (req.body as any) || {};
    return repo.putListing(db, req.account!.pseudonym, region, tags, bio, !!mentor);
  });
  app.delete('/catalog', async (req) => {
    await requireAuth(req);
    return repo.deleteListing(db, req.account!.pseudonym);
  });

  // ——— Pokoje tematyczne (#6/2): grupa = E2E per-odbiorca. Serwer trzyma nazwę + członków. ———
  app.get('/rooms', async (req) => {
    await requireAuth(req);
    const { q } = (req.query as any) || {};
    return { rooms: await repo.listRooms(db, q) };
  });
  app.post('/rooms', async (req) => {
    await requireAuth(req);
    const { name } = (req.body as any) || {};
    requireFields({ name });
    return repo.createRoom(db, req.account!.pseudonym, name);
  });
  app.post('/rooms/:id/join', async (req) => {
    await requireAuth(req);
    gate(limits.joinAcct, 'a:' + req.account!.id);   // S-2 (część 1): hamuje żniwo list członków
    const { id } = req.params as any;
    return repo.joinRoom(db, id, req.account!.pseudonym);
  });
  app.post('/rooms/:id/leave', async (req) => {
    await requireAuth(req);
    const { id } = req.params as any;
    return repo.leaveRoom(db, id, req.account!.pseudonym);
  });
  app.get('/rooms/:id/members', async (req) => {
    await requireAuth(req);
    const { id } = req.params as any;
    // Listę odbiorców rozgłaszania widzi tylko członek pokoju.
    if (!(await repo.isRoomMember(db, id, req.account!.pseudonym))) throw repo.httpError(403, 'Nie jesteś w tym pokoju');
    return { members: await repo.roomMembers(db, id) };
  });

  // ——— Ida Rozumie (LLM proxy): klient przysyła pytanie + wybrane fakty; klucz API tylko z env ———
  app.post('/ida/ask', async (req) => {
    await requireAuth(req);
    gate(limits.idaAcct, 'a:' + req.account!.id);   // S-1: nielimitowany koszt i kanał do modelu
    const { q, facts, lang, history } = (req.body as any) || {};
    requireFields({ q });
    return idaAnswer({ q, facts, lang, history });
  });

  // ——— Moderacja (message franking) ———
  app.post('/reports', async (req) => {
    await requireAuth(req);
    const { reportedPseudonym, revealed } = req.body as any;
    requireFields({ reportedPseudonym, revealed });
    return repo.fileReport(db, req.account!.pseudonym, reportedPseudonym, revealed);
  });

  return app;
}

/* Klucz-atrapa do wyrównania czasu weryfikacji podpisu (S-1). Generowany raz, leniwie;
 * jest prawdziwym kluczem P-256, więc importKey/verify wykonuje tę samą pracę co dla
 * istniejącego konta — po prostu nigdy nie potwierdzi żadnego podpisu. */
let dummyKeyPromise: Promise<string> | null = null;
function dummyPublicKey(): Promise<string> {
  if (!dummyKeyPromise) {
    dummyKeyPromise = (async () => {
      const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
      const raw = await crypto.subtle.exportKey('raw', kp.publicKey);
      return Buffer.from(raw).toString('base64');
    })();
  }
  return dummyKeyPromise;
}

function requireFields(obj: Record<string, unknown>) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') throw repo.httpError(400, `Brak pola: ${k}`);
  }
}
function rand4() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}
function daysFromNow(d: number) { return new Date(Date.now() + d * 86_400_000); }
