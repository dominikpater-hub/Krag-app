/* Sejf E2E — krypto. Uruchom: node --test lib/vault.test.mjs */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fromPhrase, seal, open, vaultLookupId } from './vault.js';

const PHRASE = ['akacja', 'brzoza', 'cien', 'dab', 'echo', 'fala', 'gaj', 'horyzont', 'iskra', 'jodla', 'klucz', 'lisc'];
const OTHER = ['most', 'nurt', 'oblok', 'pole', 'rosa', 'sopel', 'tarcza', 'ul', 'wrzos', 'zorza', 'agat', 'bor'];

test('roundtrip: seal → open tą samą frazą odzyskuje dane', async () => {
  const { key } = await fromPhrase(PHRASE);
  const data = { pseudonym: 'Cichy Świt #7030', lang: 'pl', role: 'plhiv', secret: 'klucz prywatny (JWK)' };
  const ct = await seal(data, key);
  const back = await open(ct, key);
  assert.deepEqual(back, data);
});

test('zła fraza NIE odszyfruje (AES-GCM odrzuca)', async () => {
  const a = await fromPhrase(PHRASE);
  const b = await fromPhrase(OTHER);
  const ct = await seal({ x: 1 }, a.key);
  await assert.rejects(() => open(ct, b.key));
});

test('lookupId jest deterministyczny dla frazy i różny dla innej', async () => {
  const id1 = await vaultLookupId(PHRASE);
  const id2 = await vaultLookupId(PHRASE);
  const id3 = await vaultLookupId(OTHER);
  assert.equal(id1, id2);
  assert.notEqual(id1, id3);
  assert.match(id1, /^[0-9a-f]{64}$/);
});

test('normalizacja frazy: różnice w spacjach/wielkości liter nie zmieniają wyniku', async () => {
  const a = await vaultLookupId('Akacja  BRZOZA cien');
  const b = await vaultLookupId('akacja brzoza cien');
  assert.equal(a, b);
});
