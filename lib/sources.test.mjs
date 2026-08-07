/* Krąg — poziom wiarygodności wynika ze ŹRÓDŁA (audyt R-1a). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { srcTier, SRC_KIND, KIND_TIER } from './sources.js';
import { confBadge, FACTS } from './ida.js';

test('ta sama organizacja ma ten sam poziom, niezależnie od zapisu nazwy', () => {
  // W bazie „NAM" miało poziom społeczności, a „NAM Publications" — zweryfikowany.
  assert.equal(srcTier('NAM'), srcTier('NAM Publications'));
  assert.equal(srcTier('NAM'), 'verified');
});

test('punkt konsultacyjno-diagnostyczny to nie forum internetowe', () => {
  assert.equal(srcTier('PKD Poznań'), 'verified');
});

test('baza cen leków jest właściwym źródłem do pytania o cenę leku', () => {
  assert.equal(SRC_KIND['GdziePoLek.pl'], 'SPECIALIST_DB');
  assert.equal(srcTier('GdziePoLek.pl'), 'verified');
});

test('prasa branżowa stoi wyżej niż media ogólne', () => {
  assert.equal(srcTier('Rynek Zdrowia (prasa branżowa)'), 'verified');
  assert.equal(srcTier('Termedia (prasa branżowa)'), 'verified');
  assert.equal(srcTier('naTemat.pl'), 'community', 'media ogólne zostają niżej');
});

test('zasada Kręgu jest poza drabiną wiarygodności (kategoria, nie ocena)', () => {
  assert.equal(srcTier('Projekt Krąg'), 'rule');
  assert.equal(KIND_TIER.PROJECT_RULE, 'rule');
});

test('źródło niesprawdzone nie jest ruszane — zostaje poziom z bazy', () => {
  assert.equal(srcTier('Jakieś Nieznane Źródło'), null);
  assert.equal(confBadge('OFFICIAL', 'Jakieś Nieznane Źródło')[0], 'official');
  assert.equal(confBadge('VERIFIED', 'Jakieś Nieznane Źródło')[0], 'verified');
});

test('mapowanie po źródle NIE obniża żadnego faktu w bazie', () => {
  const rank = { community: 0, verified: 1, official: 2 };
  const plain = { OFFICIAL: 'official', VERIFIED: 'verified', COMMUNITY: 'community' };
  for (const f of FACTS) {
    const before = plain[f.c] || 'community';
    const after = confBadge(f.c, f.s)[0];
    if (after === 'rule') continue;                       // wyjęte z drabiny świadomie
    assert.ok(rank[after] >= rank[before],
      `${f.id} (${f.s}): ${before} → ${after} to obniżenie, a takiego nie chcemy`);
  }
});

test('po naprawie w warstwie medycznej zostaje najwyżej garść „do potwierdzenia"', () => {
  const med = FACTS.filter((f) => f.b !== 'miejsca');
  const low = med.filter((f) => confBadge(f.c, f.s)[0] === 'community');
  assert.ok(low.length <= 2, 'zostało ' + low.length + ': ' + low.map((f) => f.id + '/' + f.s).join(', '));
});
