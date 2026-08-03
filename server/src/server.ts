/* Krąg — produkcyjny start serwera (Scaleway WAW, O-09).
 * Za reverse proxy Caddy (HTTPS): trustProxy, nagłówki bezpieczeństwa, CORS z allowlisty.
 * Serwer nadal widzi tylko pseudonim, klucz publiczny i zaszyfrowane koperty.
 */
import { buildApp } from './app.ts';
import { makePool } from './db.ts';

const pool = makePool();
const trustProxy = /^(1|true|yes)$/i.test(process.env.TRUST_PROXY ?? '');
const app = buildApp(pool, { trustProxy });

// CORS: dozwolone originy PWA (np. https://projectkrag.vercel.app), rozdzielone przecinkami.
const ORIGINS = (process.env.CORS_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
app.addHook('onRequest', async (req, reply) => {
  const origin = req.headers.origin;
  if (origin && ORIGINS.includes(origin)) {
    reply.header('access-control-allow-origin', origin);
    reply.header('vary', 'Origin');
    reply.header('access-control-allow-headers', 'content-type,authorization');
    reply.header('access-control-allow-methods', 'GET,POST,PUT,OPTIONS');
    reply.header('access-control-max-age', '600');
  }
  if (req.method === 'OPTIONS') reply.code(204).send();
});
// Nagłówki bezpieczeństwa API (audyt P1-8).
app.addHook('onSend', async (_req, reply) => {
  reply.header('x-content-type-options', 'nosniff');
  reply.header('referrer-policy', 'no-referrer');
  reply.header('permissions-policy', 'geolocation=(), camera=(), microphone=()');
  reply.header('cache-control', 'no-store');
});

const port = Number(process.env.PORT ?? 8080);
const host = process.env.HOST ?? '0.0.0.0';
app.listen({ port, host })
  .then((addr) => console.log(`krag-server słucha na ${addr} (trustProxy=${trustProxy}, CORS=${ORIGINS.join(',') || '—'})`))
  .catch((err) => { console.error(err); process.exit(1); });
