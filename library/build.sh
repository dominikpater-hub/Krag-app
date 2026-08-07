#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# head/tail zamykają strumień wcześnie → node dostaje EPIPE, a `pipefail` wywraca build (audyt S-4).
# h1 drenuje resztę wyjścia, żeby pisarz nie zginął na SIGPIPE.
h1(){ { head -1; cat >/dev/null; }; }

echo "── 1/8  migracja ziaren faktów"; rm -rf entries
for s in seed/facts-*.json; do node scripts/migrate.js "$s" | tail -1; done
echo "── 1.5   odtworzenie podpisów (A-1)"; node scripts/restore-signatures.js | tail -1
echo "── 2/8  migracja miejsc";          node scripts/migrate-places.js | tail -1
echo "── 3/8  walidacja";                node scripts/validate.js | tail -3
echo "── 4/8  paczka aplikacji";         node scripts/export-to-app.js | h1
echo "── 5/8  paczka wiedzy (bramkowana)"; node scripts/paths-export.js | h1
echo "── 6/8  paczka dla aplikacji (lib/knowledge.js)"
#  PRZENIESIONE 2026-08-06 z ProjektKrag: pipeline mieszka teraz przy PRODUKCJI, bo to
#  produkcja musi być prawdziwa, a demo jest jej odbiciem („demo = odbicie produkcji").
#  Wcześniej źródło wiedzy leżało w repozytorium demo, a produkcja dostawała ręczną
#  wklejkę — czyli odwrotnie, niż mówi zasada projektu.
#
#  Domyślnie eksportujemy build BRAMKOWANY (dist/knowledge.json): treść wstrzymana przez
#  bramkę ma puste pole `w` i zapisany powód. Build z pominiętą bramką powstaje obok, do
#  porównań i do decyzji właściciela — ale NIE trafia do aplikacji automatycznie.
KRAG_INCLUDE_UNSIGNED=1 KRAG_OUT=knowledge.demo.json node scripts/paths-export.js >/dev/null
#  STAN PRZEJŚCIOWY (do decyzji właściciela). Domyślnie eksportujemy build z POMINIĘTĄ
#  bramką — czyli dokładnie to, co produkcja pokazuje dziś. Nie zmieniamy zakresu wiedzy
#  widocznej dla ludzi przy okazji przeprowadzki pipeline'u.
#  Docelowo: KRAG_APP_GATED=1 (177 faktów z treścią, 46 uczciwie wstrzymanych z powodem).
#  Przełączyć, gdy spłacony zostanie dług lokalizatorów — patrz review/AKTUALNOSC.
if [ "${KRAG_APP_GATED:-0}" = "1" ]; then
  echo "   build BRAMKOWANY → treść wstrzymana ma puste pole w + powód w held"
  node scripts/export-krag-app.js --out ../lib/knowledge.js | h1
else
  node scripts/export-krag-app.js --demo --out ../lib/knowledge.js | h1
fi
echo "── 7/8  lista miejsc";             node scripts/render-places.js | h1
echo "── 8/8  arkusz + kolejka";         node scripts/review-export.js | h1; node scripts/currency.js | h1
echo "entries/: $(ls entries | wc -l | tr -d ' ')"
