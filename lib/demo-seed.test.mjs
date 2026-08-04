/* Dane demo (#3). Uruchom: node --test lib/demo-seed.test.mjs */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDemoData } from './demo-seed.js';

const NOW = 1_700_000_000_000;

test('buduje spójny, bogaty zestaw demo', () => {
  const d = buildDemoData('Ja #0000', NOW);
  const cd4 = d.diary.filter((i) => i.kind === 'result' && i.marker === 'cd4').map((i) => i.v);
  assert.deepEqual(cd4, [180, 240, 360, 470]);            // trend rosnący (trener pokaże wzrost)
  const vl = d.diary.filter((i) => i.kind === 'result' && i.marker === 'vl');
  assert.equal(vl[vl.length - 1].v, 20);                  // ostatnia wiremia < 50 → U=U w trenerze
  assert.ok(d.diary.some((i) => i.kind === 'med'));
  assert.ok(d.diary.some((i) => i.kind === 'cotest' && i.name === 'HPV'));
  assert.ok(d.diary.some((i) => i.kind === 'visit') && d.diary.some((i) => i.kind === 'note'));
});

test('klucze główne są unikalne (nie nadpiszą się w IndexedDB)', () => {
  const d = buildDemoData('Ja #0000', NOW);
  const tss = d.diary.map((i) => i.ts);
  assert.equal(new Set(tss).size, tss.length);           // diary po ts
  assert.equal(new Set(d.messages.map((m) => m.id)).size, d.messages.length);
});

test('rozmowy: jest buddy i pokój tematyczny', () => {
  const d = buildDemoData('Ja #0000', NOW);
  assert.ok(d.threads.some((t) => t.buddy === true));
  assert.ok(d.threads.some((t) => t.peer.startsWith('room:')));
  assert.equal(d.rooms[0].name, 'Świeżo po diagnozie');
});
