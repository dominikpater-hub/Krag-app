/* Narzędzia tekstowe. Uruchom: node --test lib/text.test.mjs */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { near, toks, norm } from './text.js';

test('near: odległość edycyjna ≤ 1', () => {
  assert.ok(near('wiremia', 'wiremja'));      // zamiana
  assert.ok(near('niewykrywalny', 'niewykrywlny')); // usunięcie
  assert.ok(near('test', 'testt'));           // wstawienie
  assert.ok(near('cd4', 'cd4'));              // identyczne
  assert.ok(!near('wiremia', 'wynik'));       // za daleko
  assert.ok(!near('lek', 'terapia'));
});

test('toks: akronimy ≤3 przechodzą, pospolite czasowniki odpadają', () => {
  assert.ok(toks('HPV').includes('hpv'));
  assert.ok(!toks('jestem samotny').includes('jest'));  // „jestem" wycięte
  assert.deepEqual(norm('Zażółć #C3D4!'), 'zazolc c3d4');
});
