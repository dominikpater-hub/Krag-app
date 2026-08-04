/* Kopia zapasowa — scalanie i ładunek (#5). Uruchom: node --test lib/backup.test.mjs */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickNew, makePayload, readPayload, countPayload, BACKUP_STORES } from './backup.js';

test('pickNew zwraca tylko brakujące wpisy (istniejące wygrywają)', () => {
  const existing = [{ ts: 1, v: 'a' }, { ts: 2, v: 'b' }];
  const incoming = [{ ts: 2, v: 'STARE' }, { ts: 3, v: 'c' }];
  const news = pickNew('diary', existing, incoming);
  assert.deepEqual(news, [{ ts: 3, v: 'c' }]);            // ts:2 pominięte (lokalne zostaje)
});

test('pickNew po właściwym kluczu (messages=id, threads=peer, rooms=roomId)', () => {
  assert.equal(pickNew('messages', [{ id: 'x' }], [{ id: 'x' }, { id: 'y' }]).length, 1);
  assert.equal(pickNew('threads', [{ peer: 'A' }], [{ peer: 'A' }]).length, 0);
  assert.equal(pickNew('rooms', [], [{ roomId: 'r1' }, { roomId: 'r2' }]).length, 2);
});

test('makePayload → readPayload round-trip; obce dane odrzucone', () => {
  const p = makePayload({ diary: [{ ts: 1 }], rooms: [{ roomId: 'r' }] });
  assert.equal(p.kind, 'krag-backup');
  const back = readPayload(p);
  assert.deepEqual(back.diary, [{ ts: 1 }]);
  assert.deepEqual(back.rooms, [{ roomId: 'r' }]);
  assert.deepEqual(back.messages, []);
  assert.equal(readPayload({ kind: 'coś innego' }), null);
  assert.equal(readPayload(null), null);
});

test('countPayload liczy wszystkie wpisy', () => {
  assert.equal(countPayload({ diary: [1, 2], messages: [3] }), 3);
  assert.equal(BACKUP_STORES.length, 4);
});
