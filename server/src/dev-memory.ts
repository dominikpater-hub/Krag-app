/* Krąg — dev-server na pamięci (bez Postgresa).
 * Buduje backend na pg-mem i słucha na :8080 z otwartym CORS, żeby PWA z innego
 * portu mogła z nim gadać. TYLKO do developmentu/demo — dane znikają po restarcie.
 * Uruchom: `npx tsx src/dev-memory.ts`
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { newDb } from 'pg-mem';
import { buildApp } from './app.ts';

const here = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(join(here, '..', 'schema.sql'), 'utf8');

const mem = newDb();
mem.public.none(schema);
const { Pool } = mem.adapters.createPg();
const app = buildApp(new Pool());

// CORS dla dev (PWA na innym porcie). W produkcji to obsłuży reverse-proxy/host.
app.addHook('onRequest', async (req, reply) => {
  reply.header('access-control-allow-origin', '*');
  reply.header('access-control-allow-headers', 'content-type,authorization');
  reply.header('access-control-allow-methods', 'GET,POST,PUT,OPTIONS');
  if (req.method === 'OPTIONS') { reply.code(204).send(); }
});

const PORT = Number(process.env.PORT ?? 8080);

// Wygodne dla demo: załóż kilka zaproszeń startowych i wypisz kody.
async function seedInvites() {
  const repo = await import('./repo.ts');
  const db = new Pool();
  // konto „founder" tylko po to, by wygenerować pierwsze kody zaproszeń
  const acc = await repo.bootstrapAccount(db, 'Founder Seed #0000', 'seed');
  const codes = ['KRAG-DEMO-0001', 'KRAG-DEMO-0002', 'KRAG-DEMO-0003'];
  const exp = new Date(Date.now() + 14 * 86_400_000);
  for (const c of codes) await repo.createInvite(db, acc.id, c, exp);
  return codes;
}

const codes = await seedInvites();
await app.listen({ port: PORT, host: '0.0.0.0' });
// eslint-disable-next-line no-console
console.log(`krag dev-server: http://localhost:${PORT}  (kody zaproszeń: ${codes.join(', ')})`);
