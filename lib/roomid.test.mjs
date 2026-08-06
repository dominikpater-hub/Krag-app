/* Krąg — tożsamość osobna dla pokoju (audyt S-2, faza 2). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRoomIdentity, packRoomIdentity, unpackRoomIdentity } from './roomid.js';
import { pseudoFrom } from './identity.js';

test('pseudoFrom: ta sama treść skrótu → ta sama nazwa (uchwyt jest pochodną klucza)', () => {
  const h = new Uint8Array([3, 5, 0xab, 0xcd, 9, 9]);
  assert.equal(pseudoFrom(h), pseudoFrom(new Uint8Array([3, 5, 0xab, 0xcd, 1, 1])));
  assert.match(pseudoFrom(h), /^.+ .+ #[0-9A-F]{4}$/);
});

test('każda tożsamość pokojowa jest inna (brak powiązania między pokojami)', async () => {
  const a = await createRoomIdentity();
  const b = await createRoomIdentity();
  assert.notEqual(a.pseudo, b.pseudo, 'dwa pokoje → dwie różne nazwy');
  assert.ok(a.authKeyPair && a.msgKeyPair, 'własne klucze: logowanie + wiadomości');
});

test('zapis i odczyt tożsamości zachowuje uchwyt oraz klucze', async () => {
  const ident = await createRoomIdentity();
  const rec = await packRoomIdentity('room-123', ident);
  assert.equal(rec.roomId, 'room-123');
  assert.equal(rec.pseudo, ident.pseudo);
  assert.ok(rec.auth?.priv && rec.msg?.priv, 'klucze prywatne zapisane lokalnie');

  const back = await unpackRoomIdentity(rec);
  assert.equal(back.pseudo, ident.pseudo);
  // Klucz musi realnie działać po odtworzeniu — inaczej po restarcie apki pokój przepada.
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' },
    back.authKeyPair.privateKey, new TextEncoder().encode('nonce'));
  assert.ok(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' },
    ident.authKeyPair.publicKey, sig, new TextEncoder().encode('nonce')),
  'podpis odtworzonym kluczem weryfikuje się kluczem pierwotnym');
});

test('nazwa pokojowa nie zdradza uchwytu głównego (inny materiał klucza)', async () => {
  const a = await createRoomIdentity();
  const b = await createRoomIdentity();
  const rawA = new Uint8Array(await crypto.subtle.exportKey('raw', a.authKeyPair.publicKey));
  const rawB = new Uint8Array(await crypto.subtle.exportKey('raw', b.authKeyPair.publicKey));
  assert.notDeepEqual(rawA, rawB, 'osobne pary kluczy, więc nic ich nie łączy');
});
