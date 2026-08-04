import { test } from 'node:test';
import assert from 'node:assert/strict';
import { idaAnswer, validate, systemPrompt, userPrompt } from './ida-ai.ts';

const FACTS = [
  { id: '0001', text: 'U=U: niewykrywalny = nieprzenoszący HIV drogą płciową.', src: 'CDC' },
  { id: '0002', text: 'PrEP to leki brane, żeby zapobiec zakażeniu.', src: 'CDC' },
];

test('idaAnswer: ugruntowana odpowiedź, usedFactIds zawężone do podanych', async () => {
  const callModel = async () => JSON.stringify({ answer: 'Niewykrywalny nie przenosi HIV drogą płciową.', usedFactIds: ['0001', '9999'], confident: true, refer: null });
  const out = await idaAnswer({ q: 'co to U=U', facts: FACTS }, { callModel });
  assert.deepEqual(out.usedFactIds, ['0001']);          // 9999 odrzucone (nie było podane)
  assert.equal(out.confident, true);
});

test('validate: brak trafnych faktów → confident=false (klient zrobi fallback)', () => {
  const raw = JSON.stringify({ answer: 'nie mam tego w bazie', usedFactIds: [], confident: true, refer: 'pomoc' });
  const out = validate(raw, new Set(['0001']));
  assert.equal(out.confident, false);                   // brak usedFactIds → nie ufamy
  assert.equal(out.refer, 'pomoc');
});

test('validate: usuwa wymyślone linki/numery (nie było ich w faktach)', () => {
  const raw = JSON.stringify({ answer: 'Zadzwoń 500 600 700 albo https://zmyslone.pl teraz.', usedFactIds: ['0001'], confident: true, refer: null });
  const out = validate(raw, new Set(['0001']));
  assert.ok(!/https?:\/\//.test(out.answer));
  assert.ok(!/500 600 700/.test(out.answer));
});

test('validate: kryzys przechodzi jako refer=crisis', () => {
  const raw = JSON.stringify({ answer: '…', usedFactIds: ['0001'], confident: true, refer: 'crisis' });
  assert.equal(validate(raw, new Set(['0001'])).refer, 'crisis');
});

test('prompt zawiera zasady groundingu i format JSON', () => {
  assert.match(systemPrompt('pl'), /WY[ŁL]|wyłącznie|JSON/i);
  assert.match(userPrompt('pyt', FACTS), /\[0001\]/);
});

test('bez klucza i bez atrapy → funkcja wyłączona (503)', async () => {
  const prev = process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_API_KEY;
  await assert.rejects(() => idaAnswer({ q: 'x', facts: FACTS }), /ai-off/);
  if (prev) process.env.ANTHROPIC_API_KEY = prev;
});
