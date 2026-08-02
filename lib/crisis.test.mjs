/* Bramka regresji warstwy kryzysowej (SEC-01). Uruchom: node --test lib/crisis.test.mjs
 * Korpus zawiera 11 sformułowań, które poprzednia wersja (indexOf) PRZEPUSZCZAŁA —
 * jeśli któreś znów przejdzie, ten test padnie, zanim trafi do użytkownika.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { risky, stopMeds } from './crisis.js';

// Frazy, które MUSZĄ zostać wykryte (w tym 11 z audytu AUDYT4x, sekcja SEC-01).
const MUST_CATCH = [
  // łapane już wcześniej
  'nie chcę żyć', 'nie chce zyc', 'mam dość', 'chcę zniknąć', 'skończyć ze sobą', 'не хочу жити',
  // 11 przepuszczanych przez indexOf — sedno SEC-01
  'nie chce mi się już żyć',
  'nie chce mi się dłużej żyć',
  'chyba nie chcę już żyć',
  'po co mi to życie',
  'wolałbym nie żyć',
  'lepiej gdyby mnie nie było',
  'myślę o tym żeby ze sobą skończyć',
  'wszystko straciło sens',
  'planuję odejść',
  'nikomu nie będzie mnie brakowało',
  // dodatkowe warianty z wtrąceniami
  'nie chcę już dłużej tego ciągnąć i nie chcę żyć',
  'nie widzę sensu w niczym',
  'chcę odebrać sobie życie',
  'nie mam już siły',
  'kill myself', 'i want to die', 'i just want to end it all', 'no reason to go on',
];

// Frazy, które NIE są kryzysem — nie mogą fałszować (poza tym: nad-wykrycie jest OK wg zasady kosztu).
const MUST_NOT = [
  'jak dbać o zdrowie',
  'chcę żyć pełnią życia',
  'jak zacząć żyć zdrowo',
  'chcę odejść z pracy',
  'planuję wizytę u lekarza',
  'co robić po ryzykownym seksie',
  'ile kosztuje PrEP w Polsce',
];

for (const q of MUST_CATCH) {
  test(`kryzys WYKRYTY: "${q}"`, () => assert.equal(risky(q), true));
}
for (const q of MUST_NOT) {
  test(`kryzys NIE fałszuje: "${q}"`, () => assert.equal(risky(q), false));
}

test('stopMeds: chęć odstawienia leków wykryta', () => {
  assert.equal(stopMeds('chcę przestać brać leki'), true);
  assert.equal(stopMeds('myślę żeby odstawić terapię'), true);
});
test('stopMeds: zwykłe zapomnienie to nie odstawienie', () => {
  assert.equal(stopMeds('zapomniałem wziąć tabletkę'), false);
});
