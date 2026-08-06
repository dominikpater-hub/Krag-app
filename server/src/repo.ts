import { randomUUID, createHash } from 'node:crypto';
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

/** Otwarta rejestracja (bez zaproszenia). Anty-spam załatwia proof-of-work w warstwie app. */
export async function registerAccount(db: Queryable, pseudonym: string, publicKey: string) {
  const dup = await findAccountByPseudonym(db, pseudonym);
  if (dup) throw httpError(409, 'Pseudonim zajęty');
  const id = randomUUID();
  await db.query(
    'insert into accounts (id, pseudonym, public_key, invited_by) values ($1,$2,$3,null)',
    [id, pseudonym, publicKey],
  );
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

/* Katalog (#6) — opt-in ogłoszenia. Filtrowanie w JS (zgodność z pg-mem). */
export async function putListing(db: Queryable, pseudonym: string, region: string, tags: string, bio: string, mentor?: boolean) {
  await db.query(
    `insert into listings (pseudonym, region, tags, bio, mentor, updated_at) values ($1,$2,$3,$4,$5, now())
     on conflict (pseudonym) do update set region = excluded.region, tags = excluded.tags, bio = excluded.bio, mentor = excluded.mentor, updated_at = now()`,
    [pseudonym, (region || '').slice(0, 60), (tags || '').slice(0, 120), (bio || '').slice(0, 300), !!mentor],
  );
  return { ok: true };
}
export async function deleteListing(db: Queryable, pseudonym: string) {
  await db.query('delete from listings where pseudonym = $1', [pseudonym]);
  return { ok: true };
}
export async function listListings(db: Queryable, region?: string, tag?: string, mentorOnly?: boolean) {
  const { rows } = await db.query('select pseudonym, region, tags, bio, mentor, updated_at from listings order by updated_at desc limit 200');
  const rl = (region || '').trim().toLowerCase(), tg = (tag || '').trim().toLowerCase();
  return rows.filter((r) => (!rl || String(r.region || '').toLowerCase().includes(rl))
    && (!tg || String(r.tags || '').toLowerCase().includes(tg))
    && (!mentorOnly || !!r.mentor));
}

/* Pokoje tematyczne (#6/2) — grupa bez klucza grupowego (E2E per-odbiorca po stronie klienta).
 * Serwer trzyma tylko nazwę tematu i listę członków. */
export type RoomVisibility = 'listed' | 'hidden';
export type RoomEntry = 'open' | 'key';

export async function createRoom(
  db: Queryable, creator: string, name: string,
  opts: { visibility?: RoomVisibility; entry?: RoomEntry } = {},
) {
  const nm = (name || '').trim().slice(0, 80);
  if (!nm) throw httpError(400, 'Pusta nazwa pokoju');
  // Domyślnie otwarty i widoczny (decyzja 2026-08-06) — prywatności broni tożsamość pokojowa.
  const visibility: RoomVisibility = opts.visibility === 'hidden' ? 'hidden' : 'listed';
  const entry: RoomEntry = opts.entry === 'key' ? 'key' : 'open';
  const id = randomUUID();
  await db.query('insert into rooms (id, name, created_by, visibility, entry) values ($1,$2,$3,$4,$5)',
    [id, nm, creator, visibility, entry]);
  await db.query('insert into room_members (room_id, pseudonym) values ($1,$2)', [id, creator]);
  return { id, name: nm, visibility, entry };
}

export async function getRoom(db: Queryable, roomId: string) {
  const { rows } = await db.query('select id, name, created_by, visibility, entry from rooms where id = $1', [roomId]);
  return rows[0] ?? null;
}

async function addMember(db: Queryable, roomId: string, pseudonym: string) {
  await db.query(
    `insert into room_members (room_id, pseudonym) values ($1,$2)
     on conflict (room_id, pseudonym) do nothing`,
    [roomId, pseudonym],
  );
}

/** Wejście bez klucza — dozwolone WYŁĄCZNIE dla pokojów otwartych (S-2). */
export async function joinRoom(db: Queryable, roomId: string, pseudonym: string) {
  const room = await getRoom(db, roomId);
  if (!room) throw httpError(404, 'Nieznany pokój');
  if (room.entry === 'key') throw httpError(403, 'Ten pokój wymaga klucza wejściowego');
  await addMember(db, roomId, pseudonym);
  return { ok: true, roomId, name: room.name };
}

/* ——— Klucze wejściowe (S-2) ——— */
const KEY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // bez I/O/0/1 — czytelne przy przepisywaniu
function keyChunk(n: number) {
  let s = '';
  for (let i = 0; i < n; i++) s += KEY_ALPHABET[Math.floor(Math.random() * KEY_ALPHABET.length)];
  return s;
}
/** Kod jest jawny TYLKO w odpowiedzi na wystawienie; w bazie leży wyłącznie skrót. */
export function hashRoomCode(code: string) {
  return createHash('sha256').update(String(code).trim().toUpperCase()).digest('hex');
}

export async function createRoomKey(
  db: Queryable, roomId: string, founder: string,
  opts: { maxUses?: number; days?: number } = {},
) {
  const room = await getRoom(db, roomId);
  if (!room) throw httpError(404, 'Nieznany pokój');
  // Decyzja właściciela: klucze wystawia WYŁĄCZNIE założyciel.
  if (room.created_by !== founder) throw httpError(403, 'Klucze wystawia tylko założyciel pokoju');
  const maxUses = Math.min(Math.max(Math.floor(opts.maxUses ?? 1), 1), 100);
  const days = Math.min(Math.max(Math.floor(opts.days ?? 7), 1), 90);
  // Kod nie zawiera nazwy pokoju — przechwycony klucz nie zdradza tematu.
  const code = `KRAG-POK-${keyChunk(4)}-${keyChunk(4)}`;
  const id = randomUUID();
  const expires = new Date(Date.now() + days * 86_400_000);
  await db.query(
    'insert into room_keys (id, room_id, code_hash, created_by, max_uses, expires_at) values ($1,$2,$3,$4,$5,$6)',
    [id, roomId, hashRoomCode(code), founder, maxUses, expires],
  );
  return { id, code, maxUses, expiresAt: expires.toISOString() };
}

export async function listRoomKeys(db: Queryable, roomId: string, founder: string) {
  const room = await getRoom(db, roomId);
  if (!room) throw httpError(404, 'Nieznany pokój');
  if (room.created_by !== founder) throw httpError(403, 'Tylko założyciel pokoju');
  const { rows } = await db.query(
    'select id, max_uses, used, expires_at, revoked_at, created_at from room_keys where room_id = $1 order by created_at desc',
    [roomId],
  );
  // Bez code_hash — nie ma powodu, żeby wychodził poza bazę.
  return rows.map((r) => ({
    id: r.id, maxUses: r.max_uses, used: r.used,
    expiresAt: r.expires_at, revokedAt: r.revoked_at, createdAt: r.created_at,
  }));
}

export async function revokeRoomKey(db: Queryable, roomId: string, keyId: string, founder: string) {
  const room = await getRoom(db, roomId);
  if (!room) throw httpError(404, 'Nieznany pokój');
  if (room.created_by !== founder) throw httpError(403, 'Tylko założyciel pokoju');
  await db.query('update room_keys set revoked_at = now() where id = $1 and room_id = $2 and revoked_at is null',
    [keyId, roomId]);
  return { ok: true };
}

/** Unieważnia WSZYSTKIE klucze pokoju (np. po usunięciu członka). */
export async function rotateRoomKeys(db: Queryable, roomId: string) {
  await db.query('update room_keys set revoked_at = now() where room_id = $1 and revoked_at is null', [roomId]);
  return { ok: true };
}

/** Wejście kluczem — BEZ znajomości id pokoju (pokoju ukrytego nie da się odgadnąć). */
export async function joinRoomWithKey(db: Queryable, code: string, pseudonym: string) {
  const { rows } = await db.query('select id, room_id from room_keys where code_hash = $1', [hashRoomCode(code)]);
  const key = rows[0];
  // Jeden komunikat dla „nie ma / wygasł / odwołany / zużyty" — bez wyroczni o istnieniu pokoju.
  const FAIL = 'Klucz nieważny';
  if (!key) throw httpError(404, FAIL);
  // Zużycie i walidacja w JEDNYM update — dwa równoległe wejścia nie przekroczą max_uses.
  const upd = await db.query(
    `update room_keys set used = used + 1
     where id = $1 and revoked_at is null and expires_at > now() and used < max_uses`,
    [key.id],
  );
  if (!upd.rowCount) throw httpError(404, FAIL);
  const room = await getRoom(db, key.room_id);
  if (!room) throw httpError(404, FAIL);
  await addMember(db, room.id, pseudonym);
  return { ok: true, roomId: room.id, name: room.name };
}

/** Usunięcie członka przez założyciela. Rotuje klucze, żeby usunięty nie wrócił starym. */
export async function removeRoomMember(db: Queryable, roomId: string, founder: string, pseudonym: string) {
  const room = await getRoom(db, roomId);
  if (!room) throw httpError(404, 'Nieznany pokój');
  if (room.created_by !== founder) throw httpError(403, 'Tylko założyciel pokoju');
  if (pseudonym === founder) throw httpError(400, 'Założyciel nie usuwa sam siebie');
  await db.query('delete from room_members where room_id = $1 and pseudonym = $2', [roomId, pseudonym]);
  await rotateRoomKeys(db, roomId);
  return { ok: true, rotated: true };
}
export async function leaveRoom(db: Queryable, roomId: string, pseudonym: string) {
  await db.query('delete from room_members where room_id = $1 and pseudonym = $2', [roomId, pseudonym]);
  return { ok: true };
}
export async function isRoomMember(db: Queryable, roomId: string, pseudonym: string) {
  const { rows } = await db.query('select 1 from room_members where room_id = $1 and pseudonym = $2', [roomId, pseudonym]);
  return !!rows[0];
}
export async function roomMembers(db: Queryable, roomId: string) {
  const { rows } = await db.query('select pseudonym from room_members where room_id = $1', [roomId]);
  return rows.map((r) => r.pseudonym);
}
/* S-2: dokładny licznik członków pozwalał obserwować przyrost pokoju i wnioskować
 * o dołączeniu konkretnej osoby („było 12, jest 13, właśnie po tym jak jej powiedziałem").
 * Katalog podaje więc PRZEDZIAŁ. Dokładną listę widzi tylko członek (roomMembers). */
export type RoomSize = 'empty' | 'few' | 'some' | 'many';
export function sizeBucket(n: number): RoomSize {
  if (n <= 0) return 'empty';
  if (n <= 5) return 'few';
  if (n <= 20) return 'some';
  return 'many';
}

/** Katalog pokojów. Pokoje ukryte NIE są zwracane — dla nieposiadających klucza nie istnieją. */
export async function listRooms(db: Queryable, q?: string) {
  const { rows } = await db.query('select id, name, created_by, visibility, entry, created_at from rooms order by created_at desc limit 200');
  const { rows: mem } = await db.query('select room_id from room_members');
  const counts: Record<string, number> = {};
  for (const m of mem) counts[m.room_id] = (counts[m.room_id] || 0) + 1;
  const needle = (q || '').trim().toLowerCase();
  return rows
    .filter((r) => r.visibility !== 'hidden')
    .filter((r) => !needle || String(r.name || '').toLowerCase().includes(needle))
    .map((r) => ({
      id: r.id, name: r.name, entry: r.entry,
      size: sizeBucket(counts[r.id] || 0), createdAt: r.created_at,
    }));
}

export interface HttpError extends Error { statusCode: number }
export function httpError(statusCode: number, message: string): HttpError {
  const e = new Error(message) as HttpError;
  e.statusCode = statusCode;
  return e;
}
