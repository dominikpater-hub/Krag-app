#!/usr/bin/env node
/**
 * migrate.js — ziarno (seed/) → wpisy (entries/).
 *
 * Inwarianty egzekwowane tutaj, nie w opisie:
 *  - wersja bez `source` nie istnieje (C.2)
 *  - confidence nigdy nie przekracza sufitu rodzaju dokumentu (C.9.4)
 *  - `rights` dziedziczone ze źródła, nigdy wpisywane ręcznie w fakcie (C.9.3)
 *  - verifiedBy = null i status = DRAFT dla całości: to ziarno z AI researchu,
 *    a nie wiedza. Podpis stawia człowiek, przez scripts/verify.js.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const policy = JSON.parse(fs.readFileSync(path.join(ROOT, 'policy.json'), 'utf8'));
const lib = JSON.parse(fs.readFileSync(path.join(ROOT, 'library/sources.json'), 'utf8'));
const seedPath = process.argv[2] || path.join(ROOT, 'seed/facts-hiv-2026-07.json');
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

const ENTRIES = path.join(ROOT, 'entries');
fs.mkdirSync(ENTRIES, { recursive: true });

const order = policy.confidenceOrder;
const cap = (claimed, ceiling) =>
  order.indexOf(claimed) > order.indexOf(ceiling) ? ceiling : claimed;

/* K-42 (decyzja właściciela 2026-08-07): poziom wiarygodności WYNIKA ZE ŹRÓDŁA,
 * nie z ręcznego wpisu w ziarnie.
 *
 * Powód. W lipcu każdy fakt dostał poziom wpisany ręcznie, na oko. W sierpniu zapadła
 * decyzja K-34: o wiarygodności rozstrzyga autorytet źródła, i to autorytet DZIEDZINOWY.
 * Warstwa aplikacji (lib/sources.js) tę decyzję wykonała. Pipeline — nie: migrator brał
 * ręczny wpis z lipca i tylko OBCINAŁ go do sufitu, nigdy nie podnosił. Skutek: PKD Poznań,
 * Jeden Świat i Fundacja Edukacji Społecznej figurowały jako „społeczność", choć katalog
 * uznaje je za notę ekspercką, a bramka wstrzymywała ich treść. Dwie warstwy tego samego
 * projektu mówiły o tych samych źródłach dwie różne rzeczy.
 *
 * Odtąd poziom jest WYPROWADZANY z rodzaju źródła, a wpis w ziarnie działa wyłącznie
 * w dół — jako świadome obniżenie („to źródło jest zwykle solidne, ale akurat w tym
 * zdaniu referuje z drugiej ręki"). Wpis w górę jest ignorowany, bo ziarno nie ma prawa
 * nadawać autorytetu, którego katalog nie potwierdza. */
const { levelFromSource } = require('./authority');
const poziomZeZrodla = (kind, block) => levelFromSource(policy, kind, block);

const addDays = (iso, days) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const today = seed.generatedAt || '2026-07-25';
const demotions = [];
let written = 0;

for (const f of seed.facts) {
  const src = lib.sources[f.source];
  if (!src) throw new Error(`${f.id}: nieznane źródło "${f.source}" — wpis bez źródła nie istnieje`);

  const ceiling = policy.ceiling[src.kind];
  if (!ceiling) throw new Error(`${f.id}: rodzaj źródła "${src.kind}" nie ma sufitu w policy.json`);

  // Poziom wyprowadzony ze źródła (K-42); ziarno może go tylko OBNIŻYĆ, i to jawnie.
  const zeZrodla = poziomZeZrodla(src.kind, f.block);
  const confidence = f.downgrade ? cap(f.downgrade, zeZrodla) : zeZrodla;
  if (f.confidence && f.confidence !== confidence) {
    demotions.push({
      id: f.id, from: f.confidence, to: confidence,
      why: f.downgrade ? `jawne obniżenie w ziarnie: ${f.downgradeWhy || 'bez uzasadnienia'}`
                       : `${src.kind}${confidence !== ceiling ? ' + autorytet dziedzinowy' : ''} → ${confidence}`,
    });
  }

  const interval = policy.review.intervalByBlock[f.block] ?? policy.review.defaultIntervalDays;
  const nextReviewDue = f.review ?? addDays(today, interval);

  const content = {
    summary: f.why,
    actions: f.actions ?? [],
    rights: f.userRights ?? [],
    warnings: f.warnings ?? [],
    details: f.details ?? null,
    legalRefs: [{ type: src.kind, reference: src.title, retrievedAt: src.retrievedAt }]
  };

  const version = {
    id: `${f.id}#v1`,
    entryId: f.id,
    language: seed.language,
    content,
    // Lokalizator per fakt ma pierwszeństwo nad ogólnym adresem źródła (decyzja właściciela 2026-08-07).
    // Powód: „PTN AIDS 2025" to 430-stronicowy PDF. Odesłanie czytelnika do całości nie jest odesłaniem
    // do niczego — recenzent i użytkownik mają trafić na stronę z parafrazowanym zdaniem, nie na okładkę.
    // Gdy fakt nie poda własnego, zostaje adres katalogowy — czyli zachowanie sprzed tej zmiany.
    source: { id: f.source, type: src.kind, reference: src.title, locator: f.locator ?? src.locator, retrievedAt: src.retrievedAt },
    edition: src.edition,
    confidence,
    ceiling,
    rights: src.rights,
    effectiveDate: today,
    validUntil: null,
    verifiedAt: null,
    verifiedBy: null,
    nextReviewDue,
    supersededBy: null,
    provenance: seed.provenance,
    checksum: null
  };
  version.checksum = crypto.createHash('sha256')
    .update(JSON.stringify({ ...version, checksum: null }))
    .digest('hex').slice(0, 16);

  const entry = {
    id: f.id,
    domain: 'HIV',
    country: 'PL',
    scope: f.scope ?? 'NATIONAL',
    block: f.block,
    topic: f.topic,
    kind: f.kind ?? 'FACT',
    citesAtc: f.citesAtc ?? [],
    status: 'DRAFT',
    requiredVerifier: policy.verifierByBlock[f.block]
      ?? (policy.publishGate.requireVerifierForBlocks.includes(f.block)
            ? policy.publishGate.verifierRole
            : 'właściciel projektu'),
    versions: [version],
    currentVersion: version.id
  };

  fs.writeFileSync(path.join(ENTRIES, `${f.id}.json`), JSON.stringify(entry, null, 2) + '\n');
  written++;
}

console.log(`migrate: zapisano ${written} wpisów do entries/`);
if (demotions.length) {
  console.log(`\nSufit zaufania zadziałał — ${demotions.length} obniżeń:`);
  for (const d of demotions) console.log(`  ${d.id}: ${d.from} → ${d.to}  (${d.why})`);
}
console.log(`\nWszystkie wpisy: status=DRAFT, verifiedBy=null. Nic nie jest wiedzą, dopóki człowiek nie podpisze.`);
