#!/usr/bin/env node
'use strict';
/* export-krag-app.js — dist/knowledge*.json → lib/knowledge.js dla repozytorium Krag-app.
 *
 * PO CO (audyt P-1). Do tej pory `Krag-app/lib/knowledge.js` był RĘCZNĄ WKLEJKĄ wyniku
 * pipeline'u. Skutki widać było w audycie: paczka niosła `demo: true`, poziomy wiarygodności
 * rozjechały się z katalogiem źródeł, a nikt nie potrafił powiedzieć, z którego builda
 * pochodzi produkcja. Ręczna wklejka nie ma wersji, nie ma daty i nie da się jej powtórzyć.
 *
 * Ten skrypt zamyka tę lukę: produkuje moduł ES dokładnie w formacie, którego oczekuje
 * aplikacja, z nagłówkiem mówiącym, z CZEGO powstał.
 *
 * Użycie:
 *   node scripts/export-krag-app.js                        # z dist/knowledge.json (bramkowany)
 *   node scripts/export-krag-app.js --demo                 # z dist/knowledge.demo.json (bramka pominięta)
 *   node scripts/export-krag-app.js --out ../../krag-app/lib/knowledge.js
 *
 * Domyślnie pisze do dist/knowledge.js, żeby nie nadpisać cudzego repozytorium bez proszenia.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const useDemo = args.includes('--demo');
const outIdx = args.indexOf('--out');
const DIST = path.join(__dirname, '..', 'dist');
const src = path.join(DIST, useDemo ? 'knowledge.demo.json' : 'knowledge.json');
const out = outIdx > -1 && args[outIdx + 1] ? path.resolve(args[outIdx + 1]) : path.join(DIST, 'knowledge.js');

if (!fs.existsSync(src)) {
  console.error(`Brak ${path.relative(process.cwd(), src)} — najpierw uruchom build.sh (albo scripts/paths-export.js).`);
  process.exit(1);
}

const bundle = JSON.parse(fs.readFileSync(src, 'utf8'));
const withText = bundle.facts.filter((f) => f.w && String(f.w).trim()).length;
const heldBy = {};
for (const f of bundle.facts) if (f.held) heldBy[f.held] = (heldBy[f.held] || 0) + 1;

/* Nagłówek ma mówić prawdę o pochodzeniu — żeby następny audyt nie musiał zgadywać,
 * czy produkcja stoi na buildzie bramkowanym, czy na tym z pominiętą bramką. */
const gateLine = useDemo
  ? ' * UWAGA: build z POMINIĘTĄ bramką publikacji (KRAG_INCLUDE_UNSIGNED=1) — pokazuje także treść,'
    + '\n *        którą bramka wstrzymała. Do produkcji właściwy jest build bramkowany.'
  : ' * Build BRAMKOWANY: treść wstrzymana przez bramkę ma puste pole `w` i powód w `held`.';

const heldLine = Object.keys(heldBy).length
  ? ` * Wstrzymane: ${Object.entries(heldBy).map(([k, v]) => `${k}=${v}`).join(', ')}.`
  : ' * Wstrzymane: brak.';

/* PROV zasila stopkę „Baza wiedzy {ed}" w aplikacji — wyprowadzamy je z paczki,
 * a nie wpisujemy na sztywno, żeby nie rozjechało się przy kolejnym buildzie. */
const prov = {
  ed: `hiv-${String(bundle.generatedAt || '').slice(0, 7) || 'nieznana'}`,
  prov: bundle.provenance || 'AI_RESEARCH',
  lang: bundle.language || 'pl',
};

const header = `/* Baza wiedzy Kręgu — WYGENEROWANE przez ProjektKrag/library/scripts/export-krag-app.js.
 * NIE edytuj ręcznie: zmiany nadpisze najbliższy build. Poprawki wprowadza się w library/seed
 * albo library/entries, a potem uruchamia build.sh.
 *
 * Źródło:  library/dist/${path.basename(src)}
 * Edycja:  ${bundle.edition} · wygenerowano ${bundle.generatedAt}
 * Fakty:   ${bundle.facts.length} (z treścią: ${withText}) · ścieżki: ${bundle.paths.length} · lekcje: ${(bundle.lessons || []).length}
${gateLine}
${heldLine}
 */`;

const body = `${header}
export const KB_BUNDLE = ${JSON.stringify(bundle)};
export const FACTS = KB_BUNDLE.facts;
export const PATHS_DB = KB_BUNDLE.paths;
export const LESSONS = KB_BUNDLE.lessons;
export const PROV = { ed: "${prov.ed}", prov: "${prov.prov}", lang: "${prov.lang}" };
`;

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, body);

console.log(`export-krag-app: ${path.relative(process.cwd(), src)} → ${out}`);
console.log(`  fakty: ${bundle.facts.length} · z treścią: ${withText} · wstrzymane: ${bundle.facts.length - withText}`);
if (Object.keys(heldBy).length) console.log(`  powody wstrzymania: ${JSON.stringify(heldBy)}`);
if (useDemo) console.log('  UWAGA: to build z pominiętą bramką — do produkcji właściwy jest build bramkowany.');
