#!/usr/bin/env node
/**
 * validate.js — twarde bramki. Konflikt = błąd, nie ostrzeżenie.
 * (Architecture Review, TASK 8: „konflikt reguł tylko warn łamie Domain Model §4".)
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const STRICT = process.argv.includes('--strict');

const ROOT = path.resolve(__dirname, '..');
const policy = JSON.parse(fs.readFileSync(path.join(ROOT, 'policy.json'), 'utf8'));
const lib = JSON.parse(fs.readFileSync(path.join(ROOT, 'library/sources.json'), 'utf8'));
const files = fs.readdirSync(path.join(ROOT, 'entries')).filter(f => f.endsWith('.json'));

const errors = [];
const warnings = [];
const seen = new Set();
const order = policy.confidenceOrder;

for (const file of files) {
  const e = JSON.parse(fs.readFileSync(path.join(ROOT, 'entries', file), 'utf8'));
  const at = `${e.id}`;

  if (seen.has(e.id)) errors.push(`${at}: duplikat id`);
  seen.add(e.id);

  if (!e.versions || e.versions.length === 0) errors.push(`${at}: zero wersji`);
  const v = e.versions.find(x => x.id === e.currentVersion);
  if (!v) { errors.push(`${at}: currentVersion nie wskazuje na istniejącą wersję`); continue; }

  // Inwariant C.2: wersja bez source nie istnieje
  if (!v.source || !v.source.id) errors.push(`${at}: wersja bez źródła`);
  const src = lib.sources[v.source?.id];
  if (!src) errors.push(`${at}: źródło "${v.source?.id}" spoza katalogu biblioteki`);

  // Inwariant C.9.4: sufit
  if (src) {
    const ceiling = policy.ceiling[src.kind];
    if (order.indexOf(v.confidence) > order.indexOf(ceiling))
      errors.push(`${at}: confidence ${v.confidence} ponad sufitem ${ceiling} dla ${src.kind}`);
  }

  // Inwariant C.9.3: rights dziedziczone, nie wymyślone
  if (src && v.rights !== src.rights)
    errors.push(`${at}: rights "${v.rights}" rozjeżdża się ze źródłem "${src.rights}"`);

  // Bramka publikacji
  if (e.status === 'PUBLISHED' && policy.publishGate.requireHumanVerification && !v.verifiedBy)
    errors.push(`${at}: PUBLISHED bez verifiedBy — bramka publikacji`);

  if (!v.nextReviewDue) warnings.push(`${at}: brak nextReviewDue`);
  if (!v.content?.summary?.trim()) errors.push(`${at}: pusty summary`);
  if (v.content?.summary && v.content.summary.length > 320)
    warnings.push(`${at}: summary dłuższy niż 320 znaków — to już nie jest jedna myśl`);
  if (!v.checksum) {
    errors.push(`${at}: brak checksum`);
  } else {
    // W-1: checksum nie jest ozdobą — przeliczamy i porównujemy. Rozbieżność = ręczna edycja po migracji.
    const recomputed = crypto.createHash('sha256')
      .update(JSON.stringify({ ...v, checksum: null })).digest('hex').slice(0, 16);
    if (recomputed !== v.checksum)
      errors.push(`${at}: checksum nie zgadza się z treścią — wpis zmieniony ręcznie po migracji (W-1)`);
  }

  // W-5: źródło bez lokalizatora jest dla recenzenta tym samym co brak źródła.
  // Domyślnie ostrzeżenie; twardy błąd pod --strict (włączyć, gdy uzupełni się 16 lokalizatorów).
  if (src && !src.locator)
    (STRICT ? errors : warnings).push(`${at}: źródło "${v.source.id}" bez lokalizatora — niesprawdzalne dla recenzenta (W-5)`);
}

console.log(`validate: ${files.length} wpisów`);
if (warnings.length) {
  console.log(`\nOstrzeżenia (${warnings.length}):`);
  warnings.forEach(w => console.log('  ! ' + w));
}
if (errors.length) {
  console.log(`\nBŁĘDY (${errors.length}):`);
  errors.forEach(e => console.log('  ✗ ' + e));
  process.exit(1);
}
console.log('\n✓ wszystkie inwarianty spełnione');
