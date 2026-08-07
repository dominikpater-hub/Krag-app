/* A-1: podpis musi przeżyć build (rm -rf entries + migrate). Uruchom: node --test library/scripts/signatures.test.mjs */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const LIB = join(dirname(fileURLToPath(import.meta.url)), '..');   // .../library
const SIG = '/tmp/krag-sig-test.jsonl';
const SEED = 'seed/facts-hiv-2026-07.json';
const ENTRY = join(LIB, 'entries', 'hiv-0067.json');
const run = (cmd) => execSync(cmd, { cwd: LIB, env: { ...process.env, KRAG_SIG: SIG }, stdio: 'pipe' });
const status = () => JSON.parse(readFileSync(ENTRY, 'utf8'));

test('podpis odtwarza się po pełnym buildzie (rm -rf entries + migrate)', () => {
  if (existsSync(SIG)) rmSync(SIG);
  rmSync(join(LIB, 'entries'), { recursive: true, force: true });
  run(`node scripts/migrate.js ${SEED}`);
  run('node scripts/verify.js --id hiv-0067 --by "dr Test" --role zakaznik');
  assert.equal(status().status, 'PUBLISHED', 'po podpisie PUBLISHED');

  // symulacja build.sh: kasujemy entries, migrujemy od nowa (DRAFT), odtwarzamy podpisy
  rmSync(join(LIB, 'entries'), { recursive: true, force: true });
  run(`node scripts/migrate.js ${SEED}`);
  assert.equal(status().status, 'DRAFT', 'po samej migracji wraca DRAFT');
  run('node scripts/restore-signatures.js');
  const e = status();
  assert.equal(e.status, 'PUBLISHED', 'podpis odtworzony po rebuildzie');
  assert.equal(e.versions[0].verifiedBy, 'dr Test', 'verifiedBy zachowane');
});

test('zmiana treści po podpisie → wpis zostaje DRAFT (hash się nie zgadza)', () => {
  // podrób signatures.jsonl: ten sam id, ale błędny contentHash
  writeFileSync(SIG, JSON.stringify({ at: '2026-07-30T00:00:00Z', action: 'verify', id: 'hiv-0067', by: 'dr X', role: 'zakaznik', contentHash: 'zlyhaszxxxxxxxxx' }) + '\n');
  rmSync(join(LIB, 'entries'), { recursive: true, force: true });
  run(`node scripts/migrate.js ${SEED}`);
  run('node scripts/restore-signatures.js');
  assert.equal(status().status, 'DRAFT', 'niedopasowany hash → DRAFT, podpis nie odtworzony');
  rmSync(SIG, { force: true });
});
