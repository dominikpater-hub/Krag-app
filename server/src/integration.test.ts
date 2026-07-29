import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { newDb } from 'pg-mem';
import { buildApp } from './app.ts';
// kod KLIENTA (te same pliki, co PWA):
import { generateAuthKeyPair, authPublicB64, signNonce } from '../../lib/identity.js';
import { generateKeyPair, publicKeyB64, deriveSessionKey, encrypt, decrypt, envelope } from '../../lib/e2e.js';
import { makeClient } from '../../lib/api.js';

const here = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(join(here, '..', 'schema.sql'), 'utf8');

let app: ReturnType<typeof buildApp>;
let base: string;

before(async () => {
  const mem = newDb();
  mem.public.none(schema);
  const { Pool } = mem.adapters.createPg();
  app = buildApp(new Pool());
  await app.listen({ port: 0, host: '127.0.0.1' });
  const addr = app.server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  base = `http://127.0.0.1:${port}`;
});
after(async () => { await app.close(); });

test('SPIĘCIE 1:1: rejestracja z zaproszenia, logowanie kluczem, zaszyfrowana koperta tam i z powrotem', async () => {
  // — Założyciel —
  const founder = 'Cichy Świt #A1B2';
  const fAuth = await generateAuthKeyPair();
  const fMsg = await generateKeyPair();
  const fClient = makeClient(base);

  await fClient.bootstrap(founder, await authPublicB64(fAuth));
  await fClient.login(founder, (n: string) => signNonce(fAuth, n));
  await fClient.publishKeys(await publicKeyB64(fMsg), await publicKeyB64(fMsg), []);
  const { code } = await fClient.createInvite();
  assert.match(code, /^KRAG-[A-Z0-9]{4}-[A-Z0-9]{4}$/);

  // — Nowa osoba z zaproszenia —
  const member = 'Spokojna Rzeka #C3D4';
  const mAuth = await generateAuthKeyPair();
  const mMsg = await generateKeyPair();
  const mClient = makeClient(base);

  await mClient.redeem(code, member, await authPublicB64(mAuth));
  await mClient.login(member, (n: string) => signNonce(mAuth, n));
  await mClient.publishKeys(await publicKeyB64(mMsg), await publicKeyB64(mMsg), []);

  // — Założyciel szyfruje i wysyła kopertę do membera —
  const text = 'Cześć. Jestem tu, gdybyś chciał pogadać po diagnozie.';
  const bundle = await fClient.fetchKeys(member);            // klucz publiczny odbiorcy
  const sKeyOut = await deriveSessionKey(fMsg, bundle.identityKey);
  const wire = envelope.pack(await encrypt(sKeyOut, text));
  assert.ok(!wire.includes('diagnozie'), 'ciphertext nie może zawierać jawnego tekstu');
  await fClient.sendEnvelope(member, wire);

  // — Member odbiera, ustala klucz nadawcy i odszyfrowuje —
  const inbox = await mClient.pullEnvelopes();
  assert.equal(inbox.envelopes.length, 1);
  const got = inbox.envelopes[0];
  assert.equal(got.from, founder);
  const senderBundle = await mClient.fetchKeys(got.from);    // klucz publiczny nadawcy
  const sKeyIn = await deriveSessionKey(mMsg, senderBundle.identityKey);
  const decrypted = await decrypt(sKeyIn, envelope.unpack(got.ciphertext));
  assert.equal(decrypted, text);

  // skrzynka pusta po odbiorze (kasowanie po dostarczeniu)
  const inbox2 = await mClient.pullEnvelopes();
  assert.equal(inbox2.envelopes.length, 0);

  // — Zgłoszenie do moderacji działa z klienta —
  const rep = await mClient.report(founder, 'ujawniony fragment + tag');
  assert.equal(rep.status, 'open');
});

test('SPIĘCIE bezpieczeństwo: bez ważnej sesji API odrzuca', async () => {
  const anon = makeClient(base);
  await assert.rejects(() => anon.createInvite()); // brak tokenu → 401
});
