/* Testy bramek publikacji (audyt S-7) — jedyny kod, który MUSI mieć testy.
 * Uruchom: node --test library/scripts/gate.test.mjs */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const gate = require('./gate.js');
const policy = require('../policy.json');

const V = (over = {}) => ({ rights: 'PUBLIC_DOMAIN', verifiedBy: null, source: { id: 'x', locator: 'https://x' }, ...over });

test('wpis bez podpisu NIE wychodzi (unverified)', () => {
  assert.equal(gate.heldReason(policy, { status: 'DRAFT' }, V()), 'unverified');
});

test('cytat dosłowny QUOTE_ONLY NIE wychodzi, nawet podpisany (rights)', () => {
  // po K-35 parafraza QUOTE_ONLY jest publikowalna; cytat dosłowny (verbatim) nadal nie
  const v = V({ rights: 'QUOTE_ONLY', verifiedBy: 'dr X', verbatim: true });
  assert.equal(gate.heldReason(policy, { status: 'PUBLISHED' }, v), 'rights');
});

test('podpisany + redystrybuowalny, ale bez lokalizatora NIE wychodzi (W-5)', () => {
  const v = V({ verifiedBy: 'dr X', source: { id: 'x' } });
  assert.equal(gate.heldReason(policy, { status: 'PUBLISHED' }, v), 'locator');
});

test('podpisany + redystrybuowalny + lokalizator = publikowalny (null)', () => {
  const v = V({ verifiedBy: 'dr X' });
  assert.equal(gate.heldReason(policy, { status: 'PUBLISHED' }, v), null);
});

test('A-2/K-35: parafraza QUOTE_ONLY publikowalna (włączona); cytat dosłowny i UNKNOWN nie', () => {
  const v = V({ rights: 'QUOTE_ONLY', verifiedBy: 'dr X' });
  const pub = { status: 'PUBLISHED' };
  // polityka ma publishParaphrased=true (decyzja właściciela) → parafraza po podpisie publikowalna
  assert.equal(gate.heldReason(policy, pub, v), null);
  // gdyby wyłączyć flagę → wstrzymane bramką praw
  const off = { ...policy, derivedRights: { ...policy.derivedRights, publishParaphrased: false } };
  assert.equal(gate.heldReason(off, pub, v), 'rights');
  // cytat dosłowny nadal nie
  assert.equal(gate.heldReason(policy, pub, V({ rights: 'QUOTE_ONLY', verifiedBy: 'dr X', verbatim: true })), 'rights');
  // UNKNOWN nadal nie
  assert.equal(gate.heldReason(policy, pub, V({ rights: 'UNKNOWN', verifiedBy: 'dr X' })), 'rights');
});

test('D-2: miejsca publikują się z autorytetu źródła (bez podpisu), ale wymagają lokalizatora', () => {
  const place = { status: 'DRAFT', block: 'miejsca' };   // niepodpisane
  assert.equal(gate.heldReason(policy, place, V({ rights: 'QUOTE_ONLY', source: { id: 'x', locator: 'https://gov.pl' } })), null);
  assert.equal(gate.heldReason(policy, place, V({ rights: 'QUOTE_ONLY', source: { id: 'x' } })), 'locator');
  // zwykły blok medyczny niepodpisany dalej wstrzymany
  assert.equal(gate.heldReason(policy, { status: 'DRAFT', block: 'pep' }, V({ verifiedBy: null })), 'unverified');
});

test('gatedBlocks = suma obu list z policy (K-4)', () => {
  const g = gate.gatedBlocks(policy);
  assert.ok(g.has('pep'), 'blok medyczny z requireVerifierForBlocks');
  assert.ok(g.has('prawo'), 'blok z verifierByBlock');
  assert.ok(g.has('stygma'), 'blok z verifierByBlock');
});
