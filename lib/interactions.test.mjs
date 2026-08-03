/* Checker interakcji — logika dopasowania. Uruchom: node --test lib/interactions.test.mjs */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyMeds, checkSubstance, knownFor } from './interactions.js';

test('rozpoznaje klasy ARV po nazwie handlowej i INN', () => {
  assert.ok(classifyMeds(['Biktarvy']).has('insti'));
  assert.ok(classifyMeds(['Dolutegravir 50 mg']).has('insti'));
  assert.ok(classifyMeds(['Odefsey']).has('rilpivirine'));
  assert.ok(classifyMeds(['Symtuza']).has('boosted'));
  assert.equal(classifyMeds(['Truvada']).size, 0);   // brak reguły = brak fałszywej flagi
});

test('INSTI + wapń/suplement → flaga kationów', () => {
  const hits = checkSubstance(['Biktarvy'], 'wapń z witaminą D');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].key, 'insti-cations');
  assert.equal(hits[0].sev, 'high');
});

test('rylpiwiryna + omeprazol → przeciwwskazane (PPI)', () => {
  const hits = checkSubstance(['Odefsey'], 'omeprazol na zgagę');
  assert.ok(hits.some((h) => h.key === 'rpv-acid'));
});

test('dziurawiec → flaga niezależnie od leku (induktor)', () => {
  assert.ok(checkSubstance(['cokolwiek'], 'dziurawiec').some((h) => h.key === 'sjw-inducer'));
});

test('brak interakcji → pusto (np. INSTI + paracetamol)', () => {
  assert.equal(checkSubstance(['Biktarvy'], 'paracetamol').length, 0);
});

test('knownFor: proaktywne klasy dla schematu z INSTI', () => {
  const k = knownFor(['Biktarvy']);
  assert.ok(k.some((r) => r.key === 'insti-cations'));
});

test('EN: komunikaty po angielsku', () => {
  const hits = checkSubstance(['Biktarvy'], 'calcium', 'en');
  assert.match(hits[0].msg, /Calcium|absorption/);
});
