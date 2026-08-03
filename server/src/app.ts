import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify';
import type { Queryable } from './db.ts';
import * as repo from './repo.ts';
import { verifySignature, newToken, newNonce, minutesFromNow } from './auth.ts';
import { issue as powIssue, verify as powVerify } from './pow.ts';

const SESSION_MINUTES = 60;
const CHALLENGE_MINUTES = 5;
const INVITE_DAYS = 14;

declare module 'fastify' {
  interface FastifyRequest { account?: { id: string; pseudonym: string } }
}

export function buildApp(db: Queryable, opts: { trustProxy?: boolean } = {}): FastifyInstance {
  // trustProxy: włączane w produkcji za reverse proxy (Caddy), by rate-limit widział realne IP (SEC-04).
  const app = Fastify({ logger: false, trustProxy: opts.trustProxy ?? false });

  // Jednolita obsługa błędów z warstwy repo (statusCode).
  app.setErrorHandler((err, _req, reply) => {
    const code = (err as any).statusCode ?? 500;
    reply.code(code >= 400 && code < 600 ? code : 500).send({ error: (err as Error).message });
  });

  const requireAuth = async (req: FastifyRequest) => {
    const h = req.headers.authorization ?? '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : '';
    if (!token) throw repo.httpError(401, 'Brak tokenu');
    const acc = await repo.accountForToken(db, token);
    if (!acc) throw repo.httpError(401, 'Sesja nieważna');
    req.account = { id: acc.id, pseudonym: acc.pseudonym };
  };

  app.get('/health', async () => ({ ok: true, service: 'krag-server', ts: new Date().toISOString() }));

  // ——— Rejestracja / bootstrap ———
  app.post('/accounts/bootstrap', async (req) => {
    const { pseudonym, publicKey } = req.body as any;
    requireFields({ pseudonym, publicKey });
    return repo.bootstrapAccount(db, pseudonym, publicKey);
  });

  app.post('/invites/redeem', async (req) => {
    const { code, pseudonym, publicKey } = req.body as any;
    requireFields({ code, pseudonym, publicKey });
    return repo.redeemInvite(db, code, pseudonym, publicKey);
  });

  // ——— Otwarta rejestracja (bez zaproszeń), chroniona proof-of-work ———
  app.get('/pow', async () => powIssue());
  app.post('/accounts/register', async (req) => {
    const { pseudonym, publicKey, pow } = req.body as any;
    requireFields({ pseudonym, publicKey });
    if (!pow || !powVerify(pow.challenge, pow.nonce)) throw repo.httpError(403, 'Nieprawidłowy dowód pracy');
    return repo.registerAccount(db, pseudonym, publicKey);
  });

  // ——— „Logowanie" = dowód posiadania klucza prywatnego ———
  app.post('/auth/challenge', async (req) => {
    const { pseudonym } = req.body as any;
    requireFields({ pseudonym });
    const acc = await repo.findAccountByPseudonym(db, pseudonym);
    if (!acc) throw repo.httpError(404, 'Nieznany pseudonim');
    const nonce = newNonce();
    await repo.createChallenge(db, pseudonym, nonce, minutesFromNow(CHALLENGE_MINUTES));
    return { nonce };
  });

  app.post('/auth/verify', async (req) => {
    const { pseudonym, nonce, signature } = req.body as any;
    requireFields({ pseudonym, nonce, signature });
    const ch = await repo.takeChallenge(db, nonce, pseudonym);
    if (!ch) throw repo.httpError(401, 'Wyzwanie nieważne lub wygasłe');
    const acc = await repo.findAccountByPseudonym(db, pseudonym);
    if (!acc) throw repo.httpError(404, 'Nieznany pseudonim');
    const ok = await verifySignature(
      acc.public_key,
      new TextEncoder().encode(nonce) as unknown as BufferSource,
      signature,
    );
    if (!ok) throw repo.httpError(401, 'Podpis nie zgadza się z kluczem konta');
    const token = newToken();
    const expires = minutesFromNow(SESSION_MINUTES);
    await repo.createSession(db, token, acc.id, expires);
    return { token, expiresAt: expires.toISOString() };
  });

  // ——— Zaproszenia (authed, rate-limited) ———
  app.post('/invites', async (req) => {
    await requireAuth(req);
    const code = 'KRAG-' + rand4() + '-' + rand4();
    return repo.createInvite(db, req.account!.id, code, daysFromNow(INVITE_DAYS));
  });

  // ——— PreKeys (Signal): publikacja i pobranie kluczy publicznych ———
  app.post('/keys', async (req) => {
    await requireAuth(req);
    const { identityKey, signedPrekey, oneTimePrekeys } = req.body as any;
    requireFields({ identityKey, signedPrekey });
    await repo.publishKeys(db, req.account!.id, identityKey, signedPrekey,
      Array.isArray(oneTimePrekeys) ? oneTimePrekeys : []);
    return { ok: true };
  });

  app.get('/keys/:pseudonym', async (req) => {
    await requireAuth(req);
    const { pseudonym } = req.params as any;
    return repo.fetchKeyBundle(db, pseudonym);
  });

  // ——— Koperty E2E (serwer nie czyta treści) ———
  app.post('/envelopes', async (req) => {
    await requireAuth(req);
    const { toPseudonym, ciphertext } = req.body as any;
    requireFields({ toPseudonym, ciphertext });
    return repo.sendEnvelope(db, toPseudonym, req.account!.pseudonym, ciphertext);
  });

  app.get('/envelopes', async (req) => {
    await requireAuth(req);
    return { envelopes: await repo.pullEnvelopes(db, req.account!.id) };
  });

  // ——— Sejf E2E (profil + kopia kluczy). Serwer trzyma tylko szyfrogram. ———
  app.get('/vault/:lookupId', async (req) => {
    const { lookupId } = req.params as any;
    const v = await repo.getVault(db, lookupId);
    if (!v) throw repo.httpError(404, 'Sejf nie istnieje');
    return { ciphertext: v.ciphertext, updatedAt: v.updated_at };
  });

  app.put('/vault', async (req) => {
    await requireAuth(req);
    const { lookupId, ciphertext } = req.body as any;
    requireFields({ lookupId, ciphertext });
    return repo.putVault(db, lookupId, req.account!.id, ciphertext);
  });

  // ——— Moderacja (message franking) ———
  app.post('/reports', async (req) => {
    await requireAuth(req);
    const { reportedPseudonym, revealed } = req.body as any;
    requireFields({ reportedPseudonym, revealed });
    return repo.fileReport(db, req.account!.pseudonym, reportedPseudonym, revealed);
  });

  return app;
}

function requireFields(obj: Record<string, unknown>) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') throw repo.httpError(400, `Brak pola: ${k}`);
  }
}
function rand4() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}
function daysFromNow(d: number) { return new Date(Date.now() + d * 86_400_000); }
