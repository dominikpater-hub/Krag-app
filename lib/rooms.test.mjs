/* Pokoje tematyczne — rozgłaszanie E2E per-odbiorca. Uruchom: node --test lib/rooms.test.mjs */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roomPayload, parseRoomPayload, fanout, roomPeerKey, isRoomPeer, roomIdFromPeer } from './rooms.js';

test('payload → parse round-trip', () => {
  const p = roomPayload('r-123', 'Cześć wszystkim');
  const back = parseRoomPayload(p);
  assert.deepEqual(back, { roomId: 'r-123', text: 'Cześć wszystkim' });
});

test('parseRoomPayload zwraca null dla zwykłej wiadomości 1:1', () => {
  assert.equal(parseRoomPayload('zwykły tekst'), null);
  assert.equal(parseRoomPayload(JSON.stringify({ k: 'other', r: 'x', t: 'y' })), null);
});

test('fanout szyfruje osobno do każdego członka i POMIJA nadawcę', async () => {
  const members = ['A #0001', 'B #0002', 'C #0003'];
  const self = 'A #0001';
  const calls = [];
  const sealFor = async (member, plaintext) => { calls.push([member, plaintext]); return 'ct→' + member; };
  const out = await fanout({ roomId: 'r-9', members, self, text: 'ping' }, sealFor);

  assert.equal(out.length, 2, 'dwie koperty (bez siebie)');
  assert.deepEqual(out.map((o) => o.to).sort(), ['B #0002', 'C #0003']);
  // każdy dostaje ten sam ładunek (routing po roomId w środku)
  for (const [, pt] of calls) assert.deepEqual(parseRoomPayload(pt), { roomId: 'r-9', text: 'ping' });
  assert.ok(!out.some((o) => o.to === self), 'nadawca nie dostaje własnej koperty');
});

test('fanout na pustej/jednoosobowej grupie → brak kopert', async () => {
  const seal = async () => 'x';
  assert.equal((await fanout({ roomId: 'r', members: ['A #0001'], self: 'A #0001', text: 't' }, seal)).length, 0);
  assert.equal((await fanout({ roomId: 'r', members: [], self: 'A #0001', text: 't' }, seal)).length, 0);
});

test('klucze wątku pokoju', () => {
  assert.equal(roomPeerKey('abc'), 'room:abc');
  assert.ok(isRoomPeer('room:abc'));
  assert.ok(!isRoomPeer('Spokojna Rzeka #C3D4'));
  assert.equal(roomIdFromPeer('room:abc'), 'abc');
  assert.equal(roomIdFromPeer('nie-pokój'), null);
});
