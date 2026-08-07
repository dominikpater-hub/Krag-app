#!/usr/bin/env node
/**
 * migrate-places.js — ziarno miejsc → entries/ (blok `miejsca`).
 *
 * Miejsca różnią się od faktów trzema rzeczami:
 *  1. gniją szybciej — cykl przeglądu 180 dni, nie 730
 *  2. weryfikuje je telefon, nie lekarz — verifier = "kontakt telefoniczny"
 *  3. mają stan ZAWIESZONY, którego fakt nie ma — punkt może przestać istnieć
 *     bez zmiany wiedzy o tym, czym jest PKD
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const policy = JSON.parse(fs.readFileSync(path.join(ROOT, 'policy.json'), 'utf8'));
const lib = JSON.parse(fs.readFileSync(path.join(ROOT, 'library/sources.json'), 'utf8'));
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, 'seed/places-2026-07.json'), 'utf8'));

const ENTRIES = path.join(ROOT, 'entries');
fs.mkdirSync(ENTRIES, { recursive: true });

const order = policy.confidenceOrder;
const today = '2026-07-27';
const addDays = (iso, d) => { const x = new Date(iso); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };

// Cykl przeglądu wg tego, ile kosztuje pomyłka.
// Dyżur PEP: ktoś dzwoni w nocy, mając 48 godzin. Kwartał, nie rok.
const INTERVAL = { DYZUR_PEP: 90, TELEFON: 90, PKD: 180, PORADNIA_ARV: 180, PORADNIA_ONLINE: 365, ORGANIZACJA: 365 };

let written = 0;
const flagged = [];

for (const p of seed.places) {
  const src = lib.sources[p.source];
  if (!src) throw new Error(`${p.id}: nieznane źródło "${p.source}"`);
  const ceiling = policy.ceiling[src.kind];
  const confidence = order.indexOf(p.confidence) > order.indexOf(ceiling) ? ceiling : p.confidence;

  const warnings = [];
  if (p.conflict) warnings.push('KONFLIKT ŹRÓDEŁ: ' + p.conflict);
  if (p.warning) warnings.push(p.warning);
  if (p.status === 'ZAWIESZONY') warnings.push('Punkt zawieszony — nie kierować.');
  if (p.note) warnings.push(p.note);
  if (warnings.length) flagged.push({ id: p.id, name: p.name, n: warnings.length });

  const summary = [
    p.name,
    p.address ? `— ${p.address}` : '',
    p.phone?.length ? ` tel. ${p.phone.join(', ')}` : '',
    p.hours ? ` (${p.hours})` : ''
  ].join('').trim();

  const version = {
    id: `${p.id}#v1`,
    entryId: p.id,
    language: 'pl',
    content: {
      summary,
      actions: [],
      rights: [],
      warnings,
      details: {
        placeKind: p.kind, city: p.city, voivodeship: p.voiv,
        address: p.address ?? null, phone: p.phone ?? [], hours: p.hours ?? null,
        tests: p.tests ?? [], languages: p.languages ?? [], accessible: p.accessible ?? null,
        audience: p.audience ?? 'DOROSLI', url: p.url ?? null, email: p.email ?? null,
        operational: p.status !== 'ZAWIESZONY'
      },
      legalRefs: [{ type: src.kind, reference: src.title, retrievedAt: src.retrievedAt }]
    },
    source: { id: p.source, type: src.kind, reference: src.title, locator: src.locator, retrievedAt: src.retrievedAt },
    edition: src.edition,
    confidence, ceiling, rights: src.rights,
    effectiveDate: today, validUntil: null,
    verifiedAt: null, verifiedBy: null,
    nextReviewDue: addDays(today, INTERVAL[p.kind] ?? 365),
    supersededBy: null, provenance: seed.provenance, checksum: null
  };
  version.checksum = crypto.createHash('sha256').update(JSON.stringify({ ...version, checksum: null })).digest('hex').slice(0, 16);

  const entry = {
    id: p.id, domain: 'HIV', country: 'PL',
    scope: p.voiv ? 'REGIONAL' : 'NATIONAL',
    block: 'miejsca', topic: p.kind, kind: 'PLACE',
    status: p.status === 'ZAWIESZONY' ? 'REJECTED' : 'DRAFT',
    requiredVerifier: 'kontakt telefoniczny — potwierdzenie adresu, godzin i numeru',
    versions: [version], currentVersion: version.id
  };
  fs.writeFileSync(path.join(ENTRIES, `${p.id}.json`), JSON.stringify(entry, null, 2) + '\n');
  written++;
}

// Luka wojewódzka: czy w każdym województwie jest dokąd pójść?
const VOIV = ['dolnośląskie','kujawsko-pomorskie','lubelskie','lubuskie','łódzkie','małopolskie','mazowieckie','opolskie','podkarpackie','podlaskie','pomorskie','śląskie','świętokrzyskie','warmińsko-mazurskie','wielkopolskie','zachodniopomorskie'];
const gaps = {};
for (const kind of ['PKD', 'PORADNIA_ARV', 'DYZUR_PEP']) {
  const have = new Set(seed.places.filter(p => p.kind === kind && p.status !== 'ZAWIESZONY').map(p => p.voiv));
  const missing = VOIV.filter(v => !have.has(v));
  if (missing.length) gaps[kind] = missing;
}

console.log(`migrate-places: zapisano ${written} miejsc`);
console.log(`\nOznaczone do sprawdzenia (${flagged.length}):`);
flagged.forEach(f => console.log(`  ! ${f.id}  ${f.name}`));
console.log(`\nPokrycie wojewódzkie:`);
for (const kind of ['PKD', 'PORADNIA_ARV', 'DYZUR_PEP']) {
  console.log(`  ${kind.padEnd(14)} ${gaps[kind] ? 'BRAK w: ' + gaps[kind].join(', ') : 'wszystkie 16 województw'}`);
}
