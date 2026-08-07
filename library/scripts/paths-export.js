#!/usr/bin/env node
/**
 * paths-export.js — buduje paczkę wiedzy dla aplikacji.
 *
 * Do tej pory lekcje były stringami w HTML-u, a Ida czytała z bazy.
 * Dwa źródła prawdy w jednej aplikacji. Ten skrypt kasuje to rozdwojenie:
 * ścieżki i lekcje powstają z tych samych wpisów, które idą do recenzji.
 *
 * Skutki uboczne, dla których to robimy:
 *  - zdanie poprawione przez lekarza zmienia treść lekcji bez dotykania kodu
 *  - odznaka podpisu w aplikacji bierze się z verifiedBy, a nie z mojej klawiatury
 *  - tłumaczy się bazę raz, zamiast stu stringów rozrzuconych po pliku
 *
 * Ścieżka to uporządkowana lista bloków plus tekst spajający. Tekst spajający
 * NIE jest treścią medyczną — to jedno zdanie ramy, które nie wymaga podpisu.
 */
const fs = require('fs');
const path = require('path');
const GATE = require('./gate');

const ROOT = path.resolve(__dirname, '..');
const entries = fs.readdirSync(path.join(ROOT, 'entries'))
  .filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(fs.readFileSync(path.join(ROOT, 'entries', f), 'utf8')));
const sources = JSON.parse(fs.readFileSync(path.join(ROOT, 'library/sources.json'), 'utf8')).sources;
const policy = JSON.parse(fs.readFileSync(path.join(ROOT, 'policy.json'), 'utf8'));
const gatedBlocks = GATE.gatedBlocks(policy);                 // K-4: suma obu list z policy
const DEMO = process.env.KRAG_INCLUDE_UNSIGNED === '1';       // build demo: treść mimo braku podpisu, głośno oznaczona
const OUT = process.env.KRAG_OUT || 'knowledge.json';

/* ---------- ŚCIEŻKI ----------
   Kolejność bloków w ścieżce to kolejność uczenia, nie alfabet.
   Rola decyduje, komu ścieżka się pokazuje: osoba żyjąca z HIV widzi inne
   niż partner czy osoba bliska. Ten sam materiał, inne wejście. */
const PATHS = [
  { id: 'podstawy', roles: ['plhiv', 'partner', 'bliska'],
    n: { pl: 'Podstawy', en: 'Basics' },
    lead: { pl: 'Od czego zacząć, jeśli nie wiesz nic.', en: 'Where to start if you know nothing.' },
    blocks: ['transmisja', 'uu', 'testowanie'] },

  { id: 'pierwsze-dni', roles: ['plhiv'],
    n: { pl: 'Pierwsze dni', en: 'The first days' },
    lead: { pl: 'Co jest pilne w pierwszym tygodniu, a co może poczekać.', en: 'What is urgent in the first week, and what can wait.' },
    blocks: ['pierwsze-dni'] },

  { id: 'terapia', roles: ['plhiv'],
    n: { pl: 'Leczenie i jak działa', en: 'Treatment and how it works' },
    lead: { pl: 'Co robią leki, co znaczą wyniki i czego się spodziewać.', en: 'What the medication does, what the numbers mean.' },
    blocks: ['leczenie', 'przebieg', 'wspolistniejace', 'dlugoterminowo'] },

  { id: 'odbudowa', roles: ['plhiv'],
    n: { pl: 'Odbudowa odporności', en: 'Rebuilding immunity' },
    lead: { pl: 'Ile trwa, od czego zależy i czego nie zmienisz.', en: 'How long it takes and what you cannot change.' },
    blocks: ['odbudowa', 'bezpieczenstwo'] },

  { id: 'glowa', roles: ['plhiv', 'partner', 'bliska'],
    n: { pl: 'Głowa też się odbudowuje', en: 'The mind rebuilds too' },
    lead: { pl: 'Pierwszy rok, stygmatyzacja i to, co naprawdę pomaga.', en: 'The first year, stigma, and what actually helps.' },
    blocks: ['psyche', 'stygma'] },

  { id: 'ryzyko', roles: ['partner', 'bliska', 'plhiv'],
    n: { pl: 'Po ryzykownej sytuacji', en: 'After a risky situation' },
    lead: { pl: 'Co zrobić dziś, a nie jutro. Ta ścieżka ma zegar.', en: 'What to do today, not tomorrow. This path has a clock.' },
    blocks: ['pep', 'ekspozycja'], urgent: true },

  { id: 'zapobieganie', roles: ['partner', 'bliska'],
    n: { pl: 'Zapobieganie', en: 'Prevention' },
    lead: { pl: 'PrEP, testy i to, jak wygląda ochrona w praktyce.', en: 'PrEP, testing and what protection looks like.' },
    blocks: ['prep', 'prep-pl'] },

  { id: 'zycie', roles: ['plhiv', 'partner', 'bliska'],
    n: { pl: 'Praca, prawo, codzienność', en: 'Work, law, everyday life' },
    lead: { pl: 'Komu trzeba powiedzieć, a komu nie.', en: 'Who you must tell, and who you need not.' },
    blocks: ['prawo', 'leczenie-pl'] },

  { id: 'rodzina', roles: ['plhiv', 'partner'],
    n: { pl: 'Dzieci i związki', en: 'Children and relationships' },
    lead: { pl: 'Ciąża, karmienie i decyzje, które da się zaplanować.', en: 'Pregnancy, feeding and decisions you can plan.' },
    blocks: ['ciaza'] },

  { id: 'kontekst', roles: ['plhiv', 'partner', 'bliska'],
    n: { pl: 'Szerszy obraz', en: 'The wider picture' },
    lead: { pl: 'Skala w Polsce i dokąd zmierzają badania.', en: 'The scale in Poland and where research is heading.' },
    blocks: ['epidemiologia', 'wyleczenie'] }
];

/* Bloku granic nie ma w żadnej ścieżce — to nie jest materiał do nauki,
   tylko reguła, którą Ida egzekwuje przy pytaniach o własny wynik. */

/* ---------- spłaszczenie wpisów ---------- */
let heldCount = 0;
const facts = entries.map(e => {
  const v = e.versions[e.versions.length - 1];
  const srcId = typeof v.source === 'string' ? v.source : (v.source && v.source.id) || '';
  const reg = sources[srcId] || {};
  const held = GATE.heldReason(policy, e, v);   // 'unverified' | 'rights' | 'locator' | null
  if (held) heldCount++;
  const summary = (v.content && v.content.summary) || '';
  return {
    id: e.id.replace('hiv-', ''),
    b: e.block,
    t: e.topic || '',
    // K-1: treść bez podpisu / praw / lokalizatora NIE wychodzi — chyba że build DEMO (KRAG_INCLUDE_UNSIGNED=1).
    w: (held && !DEMO) ? '' : summary,
    held: held || undefined,
    s: reg.authority || (v.source && v.source.reference) || srcId,
    /* DECYZJA właściciela 2026-08-06: każdy fakt niesie link do KONKRETNEJ strony, z której
     * pochodzi parafraza — nie do strony głównej instytucji. Dotąd aplikacja linkowała po
     * NAZWIE źródła na adres ogólny (mapa SRC_URL), więc „gov.pl" prowadziło na gov.pl,
     * a nie do dokumentu. Pierwszeństwo ma lokalizator wersji (dokładny materiał);
     * dopiero gdy go nie ma, sięgamy po adres katalogowy. */
    u: (v.source && v.source.locator) || reg.locator || undefined,
    c: v.confidence || 'COMMUNITY',
    ver: v.verifiedBy || null,
    gate: gatedBlocks.has(e.block)
  };
});

// Pusty summary jest błędem TYLKO gdy fakt nie został świadomie wstrzymany bramką.
const puste = facts.filter(f => !f.held && !f.w.trim());
if (puste.length) {
  console.error(`PRZERWANE: ${puste.length} wpisów bez treści (a nie wstrzymanych bramką) — ${puste.slice(0, 5).map(f => f.id).join(', ')}`);
  process.exit(1);
}

/* ---------- lekcje ----------
   Jedna lekcja = jeden blok. Dzielimy na strony po 4 fakty, żeby lekcja
   dała się przejść w trzy minuty, a nie żeby była ścianą tekstu. */
const byBlock = {};
for (const f of facts) (byBlock[f.b] ??= []).push(f);

const lessons = [];
for (const p of PATHS) {
  for (const b of p.blocks) {
    if (lessons.some(l => l.b === b)) continue;
    const fs2 = byBlock[b] || [];
    if (!fs2.length) { console.warn(`uwaga: blok ${b} jest pusty`); continue; }
    lessons.push({
      b,
      ids: fs2.map(f => f.id),
      pages: Math.ceil(fs2.length / 4),
      signed: fs2.filter(f => f.ver).length,
      total: fs2.length
    });
  }
}

const uzyte = new Set(lessons.map(l => l.b));
const poza = Object.keys(byBlock).filter(b => !uzyte.has(b) && b !== 'granice');
if (poza.length) console.warn(`uwaga: bloki poza ścieżkami: ${poza.join(', ')}`);

const bundle = {
  // Deterministyczne: data najnowszego materiału, nie data builda — inaczej każdy build brudzi index.html (C-6).
  generatedAt: Object.values(sources).map((s) => s && s.retrievedAt).filter(Boolean).sort().pop() || policy.version || '1',
  edition: policy.version || '1',
  counts: {
    facts: facts.length,
    signed: facts.filter(f => f.ver).length,
    held: heldCount,
    paths: PATHS.length,
    lessons: lessons.length
  },
  demo: DEMO,   // C-5: flaga na poziomie paczki — paczka demo zawiera treść niepodpisaną
  paths: PATHS,
  lessons,
  facts
};

const outDir = path.join(ROOT, 'dist');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, OUT), JSON.stringify(bundle));

console.log(`paczka wiedzy: ${facts.length} faktów · ${PATHS.length} ścieżek · ${lessons.length} lekcji`);
console.log(`  podpisanych przez człowieka: ${bundle.counts.signed} / ${facts.length}`);
console.log(`  wstrzymanych bramką (bez treści): ${heldCount}${DEMO ? ' — build DEMO pokazuje treść, głośno oznaczoną' : ''}`);
console.log(`  plik: dist/${OUT} · rozmiar: ${(JSON.stringify(bundle).length / 1024).toFixed(0)} KB`);
for (const p of PATHS) {
  const n = p.blocks.reduce((a, b) => a + (byBlock[b] || []).length, 0);
  console.log(`  ${p.id.padEnd(13)} ${String(n).padStart(3)} faktów  role: ${p.roles.join(',')}`);
}
