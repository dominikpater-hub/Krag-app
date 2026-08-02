import { randomUUID } from 'node:crypto';
import type { Queryable } from './db.ts';

const MAX_ACTIVE_INVITES = 5;

export async function findAccountByPseudonym(db: Queryable, pseudonym: string) {
  const { rows } = await db.query('select * from accounts where pseudonym = $1', [pseudonym]);
  return rows[0] ?? null;
}

/** Wykorzystanie kodu zaproszenia → utworzenie anonimowego konta. */
export async function redeemInvite(
  db: Queryable,
  code: string,
  pseudonym: string,
  publicKey: string,
) {
  const { rows } = await db.query('select * from invites where code = $1', [code]);
  const invite = rows[0];
  if (!invite) throw httpError(404, 'Nieznany kod zaproszenia');
  if (invite.used_by) throw httpError(409, 'Kod już wykorzystany');
  if (new Date(invite.expires_at).getTime() < Date.now()) throw httpError(410, 'Kod wygasł');

  const dup = await findAccountByPseudonym(db, pseudonym);
  if (dup) throw httpError(409, 'Pseudonim zajęty');

  const id = randomUUID();
  await db.query(
    'insert into accounts (id, pseudonym, public_key, invited_by) values ($1,$2,$3,$4)',
    [id, pseudonym, publicKey, invite.created_by ?? null],
  );
  await db.query('update invites set used_by = $1, used_at = now() where code = $2', [id, code]);
  return { id, pseudonym };
}

/** Bootstrap: pierwsze konto bez zaproszenia (założyciel). Kolejne — tylko z kodem. */
export async function bootstrapAccount(db: Queryable, pseudonym: string, publicKey: string) {
  const { rows } = await db.query('select count(*)::int as n from accounts');
  if ((rows[0]?.n ?? 0) > 0) throw httpError(403, 'Krąg już istnieje — wejście tylko z zaproszenia');
  const id = randomUUID();
  await db.query(
    'insert into accounts (id, pseudonym, public_key, invited_by) values ($1,$2,$3,null)',
    [id, pseudonym, publicKey],
  );
  return { id, pseudonym };
}

export async function createChallenge(db: Queryable, pseudonym: string, nonce: string, expires: Date) {
  await db.query('insert into auth_challenges (nonce, pseudonym, expires_at) values ($1,$2,$3)', [
    nonce, pseudonym, expires.toISOString(),
  ]);
}

export async function takeChallenge(db: Queryable, nonce: string, pseudonym: string) {
  const { rows } = await db.query(
    'select * from auth_challenges where nonce = $1 and pseudonym = $2',
    [nonce, pseudonym],
  );
  const ch = rows[0];
  await db.query('delete from auth_challenges where nonce = $1', [nonce]); // jednorazowy
  if (!ch) return null;
  if (new Date(ch.expires_at).getTime() < Date.now()) return null;
  return ch;
}

export async function createSession(db: Queryable, token: string, accountId: string, expires: Date) {
  await db.query('insert into sessions (token, account_id, expires_at) values ($1,$2,$3)', [
    token, accountId, expires.toISOString(),
  ]);
}

export async function accountForToken(db: Queryable, token: string) {
  const { rows } = await db.query(
    `select a.* from sessions s join accounts a on a.id = s.account_id
     where s.token = $1 and s.expires_at > now()`,
    [token],
  );
  return rows[0] ?? null;
}

export async function createInvite(db: Queryable, createdBy: string, code: string, expires: Date) {
  const { rows } = await db.query(
    `select count(*)::int as n from invites
     where created_by = $1 and used_by is null and expires_at > now()`,
    [createdBy],
  );
  if ((rows[0]?.n ?? 0) >= MAX_ACTIVE_INVITES) {
    throw httpError(429, `Limit aktywnych zaproszeń (${MAX_ACTIVE_INVITES})`);
  }
  await db.query('insert into invites (code, created_by, expires_at) values ($1,$2,$3)', [
    code, createdBy, expires.toISOString(),
  ]);
  return { code, expiresAt: expires.toISOString() };
}

export async function publishKeys(
  db: Queryable,
  accountId: string,
  identityKey: string,
  signedPrekey: string,
  oneTimePrekeys: string[],
) {
  await db.query(
    `insert into key_bundles (account_id, identity_key, signed_prekey, one_time_prekeys, updated_at)
     values ($1,$2,$3,$4, now())
     on conflict (account_id) do update set
       identity_key = excluded.identity_key,
       signed_prekey = excluded.signed_prekey,
       one_time_prekeys = excluded.one_time_prekeys,
       updated_at = now()`,
    [accountId, identityKey, signedPrekey, JSON.stringify(oneTimePrekeys)],
  );
}

/** Pobranie paczki kluczy odbiorcy (tylko publiczne); zdejmuje jeden one-time prekey. */
export async function fetchKeyBundle(db: Queryable, pseudonym: string) {
  const acc = await findAccountByPseudonym(db, pseudonym);
  if (!acc) throw httpError(404, 'Nieznany pseudonim');
  const { rows } = await db.query('select * from key_bundles where account_id = $1', [acc.id]);
  const b = rows[0];
  if (!b) throw httpError(404, 'Brak opublikowanych kluczy');
  const otks: string[] = Array.isArray(b.one_time_prekeys)
    ? b.one_time_prekeys
    : JSON.parse(b.one_time_prekeys || '[]');
  const oneTime = otks.shift() ?? null;
  await db.query('update key_bundles set one_time_prekeys = $1 where account_id = $2', [
    JSON.stringify(otks), acc.id,
  ]);
  return {
    pseudonym,
    identityKey: b.identity_key,
    signedPrekey: b.signed_prekey,
    oneTimePrekey: oneTime,
  };
}

export async function sendEnvelope(
  db: Queryable,
  toPseudonym: string,
  senderPseudonym: string,
  ciphertext: string,
) {
  const to = await findAccountByPseudonym(db, toPseudonym);
  if (!to) throw httpError(404, 'Nieznany odbiorca');
  const id = randomUUID();
  await db.query(
    'insert into envelopes (id, recipient_id, sender_pseudonym, ciphertext) values ($1,$2,$3,$4)',
    [id, to.id, senderPseudonym, ciphertext],
  );
  return { id };
}

/** Pobranie i USUNIĘCIE kopert (minimalizacja retencji — K-27). */
export async function pullEnvelopes(db: Queryable, accountId: string) {
  const { rows } = await db.query(
    'select id, sender_pseudonym, ciphertext, created_at from envelopes where recipient_id = $1 order by created_at asc',
    [accountId],
  );
  if (rows.length) {
    await db.query('delete from envelopes where recipient_id = $1', [accountId]);
  }
  return rows.map((r) => ({
    id: r.id,
    from: r.sender_pseudonym,
    ciphertext: r.ciphertext,
    at: r.created_at,
  }));
}

export async function fileReport(
  db: Queryable,
  reporter: string,
  reported: string,
  revealed: string,
) {
  const id = randomUUID();
  await db.query(
    'insert into reports (id, reporter_pseudonym, reported_pseudonym, revealed) values ($1,$2,$3,$4)',
    [id, reporter, reported, revealed],
  );
  return { id, status: 'open' };
}

/** Odczyt sejfu po lookup_id (bez auth — id z frazy jest wysokoentropijny, treść zaszyfrowana). */
export async function getVault(db: Queryable, lookupId: string) {
  const { rows } = await db.query('select ciphertext, updated_at from vault where lookup_id = $1', [lookupId]);
  return rows[0] ?? null;
}

/** Zapis sejfu (authed). lookup_id wiąże się z kontem przy pierwszym zapisie; cudzy zapis odrzucony. */
export async function putVault(db: Queryable, lookupId: string, accountId: string, ciphertext: string) {
  const { rows } = await db.query('select account_id from vault where lookup_id = $1', [lookupId]);
  const existing = rows[0];
  if (existing && existing.account_id !== accountId) throw httpError(403, 'Ten sejf należy do innego konta');
  await db.query(
    `insert into vault (lookup_id, account_id, ciphertext, updated_at)
     values ($1,$2,$3, now())
     on conflict (lookup_id) do update set ciphertext = excluded.ciphertext, updated_at = now()`,
    [lookupId, accountId, ciphertext],
  );
  return { ok: true, updatedAt: new Date().toISOString() };
}

export interface HttpError extends Error { statusCode: number }
export function httpError(statusCode: number, message: string): HttpError {
  const e = new Error(message) as HttpError;
  e.statusCode = statusCode;
  return e;
}
