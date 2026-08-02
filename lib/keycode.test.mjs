/* Klucz Kręgu — kodowanie/parsowanie/QR. Uruchom: node --test lib/keycode.test.mjs */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newKeycode, parseKeycode, qrSvg } from './keycode.js';
import { fromSecretBytes } from './vault.js';

test('newKeycode → parseKeycode odzyskuje te same bajty', () => {
  const { bytes, code } = newKeycode();
  assert.match(code, /^krag1:[A-Za-z0-9\-_]+$/);
  const back = parseKeycode(code);
  assert.deepEqual(Array.from(back), Array.from(bytes));
});

test('parseKeycode toleruje link i białe znaki, odrzuca śmieci', () => {
  const { bytes, code } = newKeycode();
  const b = parseKeycode('  https://krag.app/#' + code + '  ');
  assert.deepEqual(Array.from(b), Array.from(bytes));
  assert.equal(parseKeycode('to nie jest klucz'), null);
  assert.equal(parseKeycode(''), null);
});

test('ten sam Klucz Kręgu → ten sam sejf (fromSecretBytes)', async () => {
  const { bytes, code } = newKeycode();
  const a = await fromSecretBytes(bytes);
  const b = await fromSecretBytes(parseKeycode(code));
  assert.equal(a.lookupId, b.lookupId);
});

test('qrSvg zwraca poprawny SVG z modułami', () => {
  const svg = qrSvg(newKeycode().code);
  assert.match(svg, /^<svg[\s\S]+<\/svg>$/);
  assert.ok(svg.includes('<rect'), 'ma moduły QR');
});
