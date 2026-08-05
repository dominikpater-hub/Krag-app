/* Krąg — checker interakcji: rozpoznawanie marek (rejestr ARV) + reguły na tagach. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { medTags, checkSubstance, knownFor, leafletFor } from './interactions.js';

test('rozpoznaje markę → tagi substancji (także generyki z rejestru)', () => {
  assert.ok(medTags(['Biktarvy']).has('insti'));           // bic = INSTI
  assert.ok(medTags(['Dolutegravir 50 mg']).has('insti'));
  assert.ok(medTags(['Odefsey']).has('rpv'));
  assert.ok(medTags(['Genvoya']).has('cobi'));
  assert.ok(medTags(['Kivexa']).has('arv'));               // generyk abc+3tc z rejestru
  assert.equal(medTags(['Valhit']).size, 0);               // nieistniejący → brak fałszywej flagi
});

test('knownFor: interakcje pokazują się AUTOMATYCZNIE dla dodanego leku', () => {
  const k = knownFor(['Biktarvy']);
  assert.ok(k.length > 0, 'schemat z INSTI ma proaktywne interakcje');
  assert.ok(k.some((h) => h.key === 'insti-kation'));       // kationy
  assert.ok(k.some((h) => h.key === 'arv-sjw' && h.sev === 'high')); // dziurawiec
});

test('check: kationy wobec INSTI → flaga wysoka', () => {
  const hits = checkSubstance(['Biktarvy'], 'wapń z witaminą D');
  assert.ok(hits.some((h) => h.key === 'insti-kation' && h.sev === 'high'));
});

test('check: PPI wobec rylpiwiryny (Odefsey) → nie łączyć', () => {
  const hits = checkSubstance(['Odefsey'], 'omeprazol na zgagę');
  assert.ok(hits.some((h) => h.key === 'rpv-ppi' && h.sev === 'high'));
});

test('check: paracetamol → brak znanej interakcji (uczciwie)', () => {
  assert.equal(checkSubstance(['Biktarvy'], 'paracetamol').length, 0);
});

test('check: dziurawiec przy ARV → przeciwwskazanie', () => {
  assert.ok(checkSubstance(['Biktarvy'], 'dziurawiec').some((h) => h.key === 'arv-sjw'));
});

test('język EN działa', () => {
  const hits = checkSubstance(['Biktarvy'], 'calcium', 'en');
  assert.ok(hits.length && /integrase|absorption/i.test(hits[0].msg));
});

test('ulotka: rozpoznany generyk ma link do RPL', () => {
  assert.ok(/rejestry\.ezdrowie\.gov\.pl/.test(leafletFor('Darunavir Accord') || ''));
});
