#!/usr/bin/env node
/**
 * restore-signatures.js — odtwarza podpisy po migracji (audyt A-1).
 *
 * `build.sh` robi `rm -rf entries` i `migrate.js` odtwarza wszystko jako DRAFT.
 * signatures.jsonl (append-only, w gicie) jest JEDYNYM źródłem prawdy o podpisach.
 * Ten skrypt, po migracji, przywraca status PUBLISHED wpisom, których TREŚĆ się nie
 * zmieniła od podpisu — porównując hash treści z migracji z hashem zapisanym przy podpisie.
 * Jeśli treść się zmieniła (hash != ), wpis zostaje DRAFT z ostrzeżeniem.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SIG = process.env.KRAG_SIG || path.join(ROOT, 'signatures.jsonl');
const ENTRIES = path.join(ROOT, 'entries');

if (!fs.existsSync(SIG)) { console.log('restore-signatures: brak signatures.jsonl — pomijam'); process.exit(0); }

const lines = fs.readFileSync(SIG, 'utf8').split('\n').filter(Boolean)
  .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

// Najnowszy wpis per ID (verify albo reject) decyduje.
const latest = {};
for (const r of lines) { if (!r.id) continue; if (!latest[r.id] || r.at > latest[r.id].at) latest[r.id] = r; }

let restored = 0, skipped = 0, rejected = 0;
for (const id of Object.keys(latest)) {
  const rec = latest[id];
  const fp = path.join(ENTRIES, id + '.json');
  if (!fs.existsSync(fp)) continue;
  const e = JSON.parse(fs.readFileSync(fp, 'utf8'));
  const v = e.versions.find((x) => x.id === e.currentVersion) || e.versions[e.versions.length - 1];

  if (rec.action === 'reject') {
    e.status = 'REJECTED'; v.rejectedAt = rec.at; v.rejectedBy = rec.by; v.rejectionReason = rec.reason || null;
    fs.writeFileSync(fp, JSON.stringify(e, null, 2) + '\n'); rejected++; continue;
  }
  // v.checksum to hash treści z migracji (verifiedBy=null); zapisany przy podpisie contentHash to ten sam hash.
  if (v.checksum !== rec.contentHash) {
    skipped++;
    console.warn(`  ⚠ ${id}: treść zmieniona po podpisie — zostaje DRAFT (podpis nie odtworzony)`);
    continue;
  }
  e.status = 'PUBLISHED'; v.verifiedAt = rec.at; v.verifiedBy = rec.by; v.verifiedRole = rec.role || null;
  if (rec.note) v.verificationNote = rec.note;
  v.checksum = crypto.createHash('sha256').update(JSON.stringify({ ...v, checksum: null })).digest('hex').slice(0, 16);
  fs.writeFileSync(fp, JSON.stringify(e, null, 2) + '\n'); restored++;
}

console.log(`restore-signatures: odtworzono ${restored} podpisów`
  + (rejected ? `, ${rejected} odrzuconych` : '')
  + (skipped ? `, POMINIĘTO ${skipped} (treść zmieniona po podpisie)` : ''));
