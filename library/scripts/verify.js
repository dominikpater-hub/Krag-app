#!/usr/bin/env node
/**
 * verify.js — jedyna droga z DRAFT do PUBLISHED. Podpis jest imienny, DOPASOWANY do
 * wymaganego weryfikatora bloku, ŚWIADOMY skali i zapisany w rejestrze append-only (audyt K-5).
 *
 *   node scripts/verify.js --id hiv-0067 --by "dr n. med. X" --role zakaznik --note "wg PTN AIDS 2025"
 *   node scripts/verify.js --block pep  --by "dr X"  --role zakaznik --confirm 9
 *   node scripts/verify.js --block prawo --by "mec. Y" --role prawnik --reject "przepis zmieniony" --confirm 10
 *
 * Podpis idzie do wersji, nie do wpisu. Wersja raz opublikowana nie jest edytowana (ADR-002).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const arg = k => { const i = args.indexOf('--' + k); return i === -1 ? null : args[i + 1]; };
const has = k => args.includes('--' + k);

const block = arg('block'), id = arg('id'), by = arg('by'), note = arg('note');
const reject = arg('reject'), role = arg('role'), confirm = arg('confirm');
const dry = has('dry'), force = has('force');

// Rola → słowa, które muszą wystąpić w requiredVerifier wpisu. Chroni przed
// podpisaniem bloku „cokolwiek" cudzą ręką (K-5).
const ROLE_KEYWORDS = {
  zakaznik: ['zakaźnik', 'arv', 'lekarz', 'uprawnieniami do firmowania'],
  lekarz: ['lekarz', 'zakaźnik', 'epidemiolog', 'ginekolog', 'uprawnieniami do firmowania'],
  epidemiolog: ['epidemiolog'],
  prawnik: ['prawnik'],
  koordynator: ['koordynator'],
  farmaceuta: ['farmaceuta'],
  plhiv: ['osoba żyjąca z hiv', 'organizacja mandatowa'],
  wlasciciel: ['właściciel']
};

if (!by) { console.error('verify: brakuje --by "imię i rola osoby podpisującej".'); process.exit(1); }
if (!block && !id) { console.error('verify: podaj --block <nazwa> albo --id <hiv-NNNN>'); process.exit(1); }
if (!reject && !role) {
  console.error('verify: brakuje --role <' + Object.keys(ROLE_KEYWORDS).join('|') + '>. Podpis musi pasować do wymaganego weryfikatora bloku.');
  process.exit(1);
}
if (role && !ROLE_KEYWORDS[role]) {
  console.error('verify: nieznana rola "' + role + '". Dozwolone: ' + Object.keys(ROLE_KEYWORDS).join(', '));
  process.exit(1);
}

const now = new Date().toISOString();
const files = fs.readdirSync(path.join(ROOT, 'entries')).filter(f => f.endsWith('.json'));
const matches = [];
for (const file of files) {
  const e = JSON.parse(fs.readFileSync(path.join(ROOT, 'entries', file), 'utf8'));
  if (id && e.id !== id) continue;
  if (block && e.block !== block) continue;
  matches.push({ file, e });
}
if (!matches.length) { console.error('verify: nic nie pasuje do podanego --block/--id.'); process.exit(1); }

// Świadome potwierdzenie skali przy operacji hurtowej (--block) — K-5.
if (block && !id) {
  if (confirm === null) {
    console.error(`verify: --block dotyka ${matches.length} wpisów. Dodaj --confirm ${matches.length}, żeby potwierdzić skalę.`);
    process.exit(1);
  }
  if (Number(confirm) !== matches.length) {
    console.error(`verify: --confirm ${confirm} ≠ liczba dopasowanych wpisów (${matches.length}). Sprawdź, co podpisujesz.`);
    process.exit(1);
  }
}

// Dopasowanie roli do wymaganego weryfikatora (pomijane przy --reject).
if (!reject) {
  const kws = ROLE_KEYWORDS[role];
  const bad = matches.filter(({ e }) => {
    const req = (e.requiredVerifier || '').toLowerCase();
    return req && !kws.some(k => req.includes(k));
  });
  if (bad.length && !force) {
    console.error(`verify: rola "${role}" nie pasuje do wymaganego weryfikatora ${bad.length} wpisów:`);
    bad.slice(0, 5).forEach(({ e }) => console.error(`  ${e.id} wymaga: ${e.requiredVerifier}`));
    console.error('Użyj właściwej --role albo --force, jeśli świadomie podpisujesz mimo to.');
    process.exit(1);
  }
}

const sigLog = [];
let touched = 0;
for (const { file, e } of matches) {
  const p = path.join(ROOT, 'entries', file);
  const v = e.versions.find(x => x.id === e.currentVersion);
  if (reject) {
    if (e.status === 'REJECTED') continue;
    e.status = 'REJECTED'; v.rejectedAt = now; v.rejectedBy = by; v.rejectionReason = reject; v.rejectedRole = role || null;
    sigLog.push({ at: now, action: 'reject', id: e.id, version: v.id, block: e.block, by, role: role || null, reason: reject });
  } else {
    if (v.verifiedBy) continue;                // już podpisane — nie nadpisujemy
    const contentHash = v.checksum;            // hash treści z migracji (verifiedBy=null) — stabilny, przeżywa build (A-1)
    e.status = 'PUBLISHED'; v.verifiedAt = now; v.verifiedBy = by; v.verifiedRole = role;
    if (note) v.verificationNote = note;
    v.checksum = crypto.createHash('sha256').update(JSON.stringify({ ...v, checksum: null })).digest('hex').slice(0, 16);
    sigLog.push({ at: now, action: 'verify', id: e.id, version: v.id, block: e.block, by, role, note: note || null, contentHash });
  }
  touched++;
  if (!dry) fs.writeFileSync(p, JSON.stringify(e, null, 2) + '\n');
}

// Rejestr podpisów — append-only, COMMITOWANY (w przeciwieństwie do entries/), świadek historii (K-5).
const SIG = process.env.KRAG_SIG || path.join(ROOT, 'signatures.jsonl');
if (!dry && sigLog.length) {
  fs.appendFileSync(SIG, sigLog.map(r => JSON.stringify(r)).join('\n') + '\n');
}

const verb = reject ? 'odrzucono' : 'podpisano';
console.log(`verify: ${verb} ${touched} wpisów${dry ? ' (próba, nic nie zapisano)' : ''}`);
if (touched && !reject) {
  console.log(`podpis: ${by} (${role})`);
  console.log('Zapisano w signatures.jsonl. Uruchom ./build.sh — te wpisy wejdą do paczki.');
}
