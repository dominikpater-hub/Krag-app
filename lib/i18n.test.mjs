/* Krąg — kompletność i spójność tłumaczeń UI.
 * Chroni przed „cichym fallbackiem": każdy język oznaczony jako covered MUSI mieć
 * wszystkie klucze co polski, a placeholdery ({var}) muszą się zgadzać.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LANGS, missingKeys, t, setLang } from './i18n.js';

const covered = LANGS.filter((l) => l.covered).map((l) => l.code);

test('są zadeklarowane języki covered (min. pl + sąsiedzi)', () => {
  for (const c of ['pl', 'en', 'uk', 'ru', 'de', 'cs', 'sk', 'be', 'lt']) {
    assert.ok(covered.includes(c), `${c} powinien być covered`);
  }
});

test('każdy język covered ma komplet kluczy (brak cichego fallbacku)', () => {
  for (const c of covered) {
    const miss = missingKeys(c);
    assert.equal(miss.length, 0, `${c} — brakuje ${miss.length} kluczy: ${miss.slice(0, 10).join(', ')}`);
  }
});

test('placeholdery {var} zgadzają się z polskim we wszystkich językach covered', () => {
  const vars = (s) => (String(s).match(/\{[a-z]+\}/gi) || []).sort().join(',');
  setLang('pl');
  const sample = ['coach.cd4now', 'room.count', 'bk.done', 'lang.reqDone', 'ida.clinicNear', 'ida.base', 'd.ocrAdded'];
  const plVars = {}; for (const k of sample) plVars[k] = vars(t(k));
  for (const c of covered) {
    setLang(c);
    for (const k of sample) assert.equal(vars(t(k)), plVars[k], `${c}/${k}: placeholdery się nie zgadzają`);
  }
  setLang('pl');
});
