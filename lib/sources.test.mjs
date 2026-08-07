/* Krąg — poziom wiarygodności wynika ze ŹRÓDŁA (audyt R-1a). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { srcTier, SRC_KIND, KIND_TIER } from './sources.js';
import { confBadge, FACTS } from './ida.js';

test('ta sama organizacja ma ten sam poziom, niezależnie od zapisu nazwy', () => {
  // W bazie „NAM" miało poziom społeczności, a „NAM Publications" — zweryfikowany.
  assert.equal(srcTier('NAM', 'bezpieczenstwo'), srcTier('NAM Publications', 'bezpieczenstwo'));
  assert.equal(srcTier('NAM', 'bezpieczenstwo'), 'verified');
});

test('punkt konsultacyjno-diagnostyczny to nie forum internetowe', () => {
  assert.equal(srcTier('PKD Poznań', 'pep'), 'verified');
});

test('baza cen leków jest właściwym źródłem do pytania o cenę leku', () => {
  assert.equal(SRC_KIND['GdziePoLek.pl'], 'SPECIALIST_DB');
  assert.equal(srcTier('GdziePoLek.pl', 'prep-pl'), 'verified');
});

test('prasa branżowa stoi wyżej niż media ogólne w sprawach klinicznych', () => {
  assert.equal(srcTier('Rynek Zdrowia (prasa branżowa)', 'leczenie'), 'verified');
  assert.equal(srcTier('Termedia (prasa branżowa)', 'prawo'), 'verified');
});

/* DECYZJA właściciela 2026-08-06: autorytet jest DZIEDZINOWY. Media ogólne są kompetentne
 * w sprawach społecznych, języku i relacjonowaniu wydarzeń — a nie w twierdzeniach
 * klinicznych, gdzie referują z drugiej ręki. */
test('media ogólne są pełnoprawne w swojej dziedzinie', () => {
  assert.equal(srcTier('naTemat.pl', 'stygma'), 'verified', 'język i stygmatyzacja to dziedzina mediów');
  assert.equal(srcTier('naTemat.pl', 'prawo'), 'verified', 'relacjonowanie wydarzeń prawnych — też');
  assert.equal(srcTier('naTemat.pl', 'epidemiologia'), 'verified');
});

test('media ogólne NIE ugruntowują twierdzeń klinicznych', () => {
  assert.equal(srcTier('naTemat.pl', 'leczenie'), 'community');
  assert.equal(srcTier('naTemat.pl', 'transmisja'), 'community');
  assert.equal(srcTier('naTemat.pl', 'przebieg'), 'community');
});

test('fakt 0102 („nosiciel" jest stygmatyzujący) jest u siebie w domu', () => {
  const f = FACTS.find((x) => x.id === '0102');
  assert.equal(f.b, 'stygma');
  assert.equal(confBadge(f.c, f.s, f.b)[0], 'verified');
});

test('zasada Kręgu jest poza drabiną wiarygodności (kategoria, nie ocena)', () => {
  assert.equal(srcTier('Projekt Krąg', 'granice'), 'rule');
  assert.equal(KIND_TIER.PROJECT_RULE, 'rule');
});

test('źródło niesprawdzone nie jest ruszane — zostaje poziom z bazy', () => {
  assert.equal(srcTier('Jakieś Nieznane Źródło', 'leczenie'), null);
  assert.equal(confBadge('OFFICIAL', 'Jakieś Nieznane Źródło', 'leczenie')[0], 'official');
  assert.equal(confBadge('VERIFIED', 'Jakieś Nieznane Źródło', 'leczenie')[0], 'verified');
});

test('mapowanie po źródle NIE obniża żadnego faktu w bazie', () => {
  const rank = { community: 0, verified: 1, official: 2 };
  const plain = { OFFICIAL: 'official', VERIFIED: 'verified', COMMUNITY: 'community' };
  for (const f of FACTS) {
    const before = plain[f.c] || 'community';
    const after = confBadge(f.c, f.s, f.b)[0];
    if (after === 'rule') continue;                       // wyjęte z drabiny świadomie
    assert.ok(rank[after] >= rank[before],
      `${f.id} (${f.s}): ${before} → ${after} to obniżenie, a takiego nie chcemy`);
  }
});

test('po naprawie żaden fakt medyczny nie zostaje „do potwierdzenia"', () => {
  const med = FACTS.filter((f) => f.b !== 'miejsca');
  const low = med.filter((f) => confBadge(f.c, f.s, f.b)[0] === 'community');
  assert.equal(low.length, 0, 'zostało: ' + low.map((f) => f.id + '/' + f.s).join(', '));
});
