/* Proof-of-work solver. Uruchom: node --test lib/pow.test.mjs */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solvePow, leadingZeroBits } from './pow.js';
import { sha256hex } from './sha256.js';

test('leadingZeroBits liczy poprawnie', () => {
  assert.equal(leadingZeroBits('ffff'), 0);
  assert.equal(leadingZeroBits('0fff'), 4);
  assert.equal(leadingZeroBits('00ff'), 8);
  assert.equal(leadingZeroBits('1abc'), 3);
});

test('solvePow znajduje nonce o wymaganej trudności', () => {
  const challenge = '1700000000000.abc123.deadbeefdeadbeef';
  const bits = 12;   // szybkie w teście
  const nonce = solvePow(challenge, bits);
  assert.ok(leadingZeroBits(sha256hex(challenge + ':' + nonce)) >= bits, 'rozwiązanie spełnia trudność');
});
