/* Strażnik zgodności DWÓCH warstw autorytetu źródeł (K-42, 2026-08-07).
 *
 * Skąd się wziął. Decyzja K-34 mówiła, że o wiarygodności rozstrzyga autorytet źródła,
 * i to autorytet dziedzinowy. Wykonała ją warstwa aplikacji (lib/sources.js). Pipeline
 * (library/policy.json) został ze starym układem, a nikt tego nie zauważył — przez dwa dni
 * fakty z PKD Poznań i Fundacji Edukacji Społecznej były w pipelinie „społecznością",
 * w aplikacji „zweryfikowane", a bramka publikacji wstrzymywała ich treść.
 *
 * Dwie tabele opisujące to samo zawsze się rozjadą, jeśli nic ich nie pilnuje. Ten test
 * pilnuje. Nie scalamy ich w jedną, bo aplikacja i pipeline są osobnymi światami:
 * jeden mówi o etykiecie na ekranie, drugi o tym, czy treść w ogóle wyjdzie z builda.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { KIND_TIER, SOCIAL_BLOCKS } from './sources.js';

const policy = JSON.parse(fs.readFileSync(new URL('../library/policy.json', import.meta.url), 'utf8'));

/* Aplikacja mówi małymi literami, pipeline wielkimi. „rule" nie ma odpowiednika po stronie
 * pipeline'u i to jest w porządku: reguły projektu publikują się z autorytetu projektu
 * (publishOnSourceAuthority), więc ich poziom nie decyduje o niczym w bramce. */
const NA_PIPELINE = { official: 'OFFICIAL', verified: 'VERIFIED', community: 'COMMUNITY' };

test('tabela autorytetu źródeł jest ta sama w aplikacji i w pipelinie', () => {
  const rozjazd = [];
  for (const [kind, tier] of Object.entries(KIND_TIER)) {
    const oczekiwany = NA_PIPELINE[tier];
    if (!oczekiwany) continue;                       // 'rule' — patrz komentarz wyżej
    const wPipeline = policy.ceiling[kind];
    if (wPipeline !== oczekiwany) rozjazd.push(`${kind}: aplikacja=${tier} vs pipeline=${wPipeline}`);
  }
  assert.deepEqual(rozjazd, [], 'warstwy rozjechały się co do autorytetu:\n  ' + rozjazd.join('\n  '));
});

test('każdy rodzaj źródła znany aplikacji ma sufit w pipelinie', () => {
  const brak = Object.keys(KIND_TIER).filter((k) => !policy.ceiling[k]);
  assert.deepEqual(brak, [], 'rodzaje bez sufitu w policy.json: ' + brak.join(', '));
});

test('lista bloków z autorytetem dziedzinowym jest ta sama po obu stronach', () => {
  const app = [...SOCIAL_BLOCKS].sort();
  const pipeline = [...(policy.domainAuthority?.blocks || [])].sort();
  assert.deepEqual(pipeline, app,
    'aplikacja i pipeline inaczej rozumieją, gdzie medium ogólne jest u siebie w domu');
});

test('reguła projektu publikuje się z autorytetu projektu, nie z poziomu', () => {
  /* Fakty 0110–0112 to nasze WŁASNE granice („Krąg nie interpretuje wyników"). Ich źródłem
   * jest projekt, więc nie ma tu żadnego cudzego autorytetu do zważenia ani licencji do
   * sprawdzenia. Zanim to naprawiliśmy, bramka wstrzymywała je jako „za niski poziom" —
   * czyli aplikacja ukrywała własne oświadczenie o tym, czego NIE robi. */
  const lista = policy.publishGate?.publishOnSourceAuthority || [];
  assert.ok(lista.includes('granice'), 'blok „granice" musi publikować się z autorytetu projektu');
});
