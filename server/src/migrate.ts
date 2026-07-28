import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { makePool } from './db.ts';

const here = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(here, '..', 'schema.sql'), 'utf8');

const pool = makePool();
try {
  await pool.query(sql);
  console.log('migracja OK');
} catch (e) {
  console.error('migracja NIEUDANA', e);
  process.exitCode = 1;
} finally {
  await pool.end();
}
