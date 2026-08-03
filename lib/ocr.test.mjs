/* Odczyt wyników ze zdjęcia — parser (#3/#5). Uruchom: node --test lib/ocr.test.mjs */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLabValues, pickPrefill } from './ocr.js';

test('CD4 bezwzględne wyłuskane, odsetek pominięty', () => {
  const txt = 'Limfocyty T CD4 268 kom/µl (24%)';
  const v = parseLabValues(txt);
  assert.equal(v.cd4, 268);
});

test('wiremia liczbowa (kopie/ml)', () => {
  const v = parseLabValues('HIV-RNA (wiremia): 1 250 kopii/ml');
  assert.equal(v.vl, 1250);
});

test('wiremia niewykrywalna → 0 + flaga', () => {
  const v = parseLabValues('HIV RNA: niewykrywalna (<20 kopii/ml)');
  assert.equal(v.vl, 0);
  assert.equal(v.undetectable, true);
});

test('„poniżej progu" i „<50" też liczą się jako niewykrywalne', () => {
  assert.equal(parseLabValues('wiremia poniżej progu').undetectable, true);
  assert.equal(parseLabValues('HIV RNA < 50 c/ml').vl, 0);
});

test('pełny wynik: CD4 + wiremia, prefill wybiera CD4', () => {
  const txt = 'Wynik badania\nCD4: 512 kom/µl 29%\nHIV RNA: niewykrywalny <20';
  const v = parseLabValues(txt);
  assert.equal(v.cd4, 512);
  assert.equal(v.vl, 0);
  assert.deepEqual(pickPrefill(v), { marker: 'cd4', value: 512 });
});

test('brak rozpoznania → null i pickPrefill null', () => {
  const v = parseLabValues('to nie jest wynik badania');
  assert.equal(v.cd4, null);
  assert.equal(v.vl, null);
  assert.equal(pickPrefill(v), null);
});

test('sam wynik wiremii → prefill vl', () => {
  const v = parseLabValues('Oznaczenie HIV RNA metodą PCR: 340 copies/ml');
  assert.deepEqual(pickPrefill(v), { marker: 'vl', value: 340 });
});
