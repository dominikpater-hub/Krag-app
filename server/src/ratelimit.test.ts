import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLimiter, envInt } from './ratelimit.ts';

test('przepuszcza do limitu, potem blokuje', () => {
  const lim = createLimiter({ windowMs: 1000, max: 3 });
  assert.ok(lim.check('a'));
  assert.ok(lim.check('a'));
  assert.ok(lim.check('a'));
  assert.equal(lim.check('a'), false, 'czwarte trafienie ponad limit');
});

test('koszyki są niezależne per klucz', () => {
  const lim = createLimiter({ windowMs: 1000, max: 1 });
  assert.ok(lim.check('a'));
  assert.equal(lim.check('a'), false);
  assert.ok(lim.check('b'), 'inny klucz ma własny koszyk');
});

test('limit zwalnia po upływie okna', () => {
  let t = 0;
  const lim = createLimiter({ windowMs: 1000, max: 1, now: () => t });
  assert.ok(lim.check('a'));
  assert.equal(lim.check('a'), false);
  t = 1001;
  assert.ok(lim.check('a'), 'po oknie znów wolno');
});

test('retryAfter podaje sensowny czas oczekiwania', () => {
  let t = 0;
  const lim = createLimiter({ windowMs: 10_000, max: 1, now: () => t });
  lim.check('a');
  t = 4000;
  const ra = lim.retryAfter('a');
  assert.ok(ra > 0 && ra <= 10, 'w sekundach, w granicach okna: ' + ra);
  assert.equal(createLimiter({ windowMs: 10_000, max: 5 }).retryAfter('x'), 0, 'w limicie → 0');
});

/* SEC-04 z audytu 4×: poprzedni licznik filtrował znaczniki czasu, ale NIGDY nie usuwał
 * kluczy z mapy — powolny wyciek pamięci. Tu nieużywane klucze muszą znikać. */
test('stare klucze są usuwane z pamięci (brak wycieku)', () => {
  let t = 0;
  const lim = createLimiter({ windowMs: 1000, max: 5, now: () => t });
  for (let i = 0; i < 500; i++) lim.check('k' + i);
  assert.equal(lim.size(), 500);
  t = 5000;
  lim.check('nowy');            // dowolne wywołanie po oknie uruchamia sprzątanie
  assert.ok(lim.size() < 10, 'mapa skurczyła się po sprzątaniu, było 500, jest ' + lim.size());
});

test('envInt: bierze wartość z env, odrzuca śmieci', () => {
  delete process.env.KRAG_TEST_RL;
  assert.equal(envInt('KRAG_TEST_RL', 7), 7);
  process.env.KRAG_TEST_RL = '42';
  assert.equal(envInt('KRAG_TEST_RL', 7), 42);
  process.env.KRAG_TEST_RL = 'abc';
  assert.equal(envInt('KRAG_TEST_RL', 7), 7, 'nie-liczba → domyślna');
  process.env.KRAG_TEST_RL = '-5';
  assert.equal(envInt('KRAG_TEST_RL', 7), 7, 'ujemna → domyślna');
  delete process.env.KRAG_TEST_RL;
});
