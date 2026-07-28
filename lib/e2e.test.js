import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, publicKeyB64, deriveSessionKey, encrypt, decrypt, envelope } from './e2e.js';

test('A i B wyliczają ten sam klucz sesji i wymieniają szyfrogram', async () => {
  const a = await generateKeyPair();
  const b = await generateKeyPair();
  const aPub = await publicKeyB64(a);
  const bPub = await publicKeyB64(b);

  const kA = await deriveSessionKey(a, bPub); // u nadawcy
  const kB = await deriveSessionKey(b, aPub); // u odbiorcy

  const env = await encrypt(kA, 'Cześć, jak sobie radzisz po diagnozie?');
  // to, co realnie leci do serwera jako `ciphertext` — nieczytelne
  const wire = envelope.pack(env);
  assert.ok(!wire.includes('diagnozie'));

  const got = await decrypt(kB, envelope.unpack(wire));
  assert.equal(got, 'Cześć, jak sobie radzisz po diagnozie?');
});

test('osoba trzecia (inny klucz) nie odszyfruje koperty', async () => {
  const a = await generateKeyPair();
  const b = await generateKeyPair();
  const c = await generateKeyPair(); // podsłuchujący / serwer
  const aPub = await publicKeyB64(a);

  const kA = await deriveSessionKey(a, await publicKeyB64(b));
  const kC = await deriveSessionKey(c, aPub); // zły klucz sesji

  const env = await encrypt(kA, 'wiadomość prywatna');
  await assert.rejects(() => decrypt(kC, env)); // AES-GCM tag się nie zgadza
});

test('naruszony szyfrogram jest odrzucany (integralność GCM)', async () => {
  const a = await generateKeyPair();
  const b = await generateKeyPair();
  const kA = await deriveSessionKey(a, await publicKeyB64(b));
  const kB = await deriveSessionKey(b, await publicKeyB64(a));

  const env = await encrypt(kA, 'nienaruszalne');
  const tampered = { iv: env.iv, ct: env.ct.slice(0, -4) + 'AAAA' };
  await assert.rejects(() => decrypt(kB, tampered));
});
