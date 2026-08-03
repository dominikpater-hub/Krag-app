/* Warstwa wsparcia emocjonalnego. Uruchom: node --test lib/emotion.test.mjs */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emotional } from './emotion.js';
import { risky } from './crisis.js';

test('samotność wykryta (to był błąd: trafiało na fakt o „nosicielu")', () => {
  assert.equal(emotional('Jestem samotny'), 'lonely');
  assert.equal(emotional('nie mam nikogo'), 'lonely');
  assert.equal(emotional('czuję się sam'), 'lonely');
  assert.equal(emotional('I feel so lonely'), 'lonely');
});

test('przygnębienie / brak nadziei', () => {
  assert.equal(emotional('jest mi smutno'), 'low');
  assert.equal(emotional('mam depresję'), 'low');
  assert.equal(emotional('nienawidzę siebie'), 'low');
  assert.equal(emotional('I feel hopeless'), 'low');
});

test('lęk i wstyd', () => {
  assert.equal(emotional('boję się'), 'fear');
  assert.equal(emotional('wstyd mi'), 'fear');
  assert.equal(emotional("I'm scared"), 'fear');
});

test('cyrylica (UA/RU)', () => {
  assert.equal(emotional('я самотній'), 'lonely');
  assert.equal(emotional('мне грустно'), 'low');
  assert.equal(emotional('боюся'), 'fear');
});

test('pytania o fakty NIE są łapane jako emocje', () => {
  assert.equal(emotional('co to znaczy niewykrywalny'), null);
  assert.equal(emotional('jak się przenosi HIV'), null);
  assert.equal(emotional('czy HIV powoduje depresję'), null);   // pytanie o fakt, nie „mam depresję"
  assert.equal(emotional('HPV'), null);
});

test('sygnały kryzysowe zostają w warstwie kryzysowej (sprawdzana wcześniej)', () => {
  // te MUSZĄ łapać się w risky() — emocje są tylko dla nie-kryzysu
  assert.equal(risky('mam dość siebie'), true);
  assert.equal(risky('nie chcę żyć'), true);
});
