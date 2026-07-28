-- Krąg — schemat minimalny (K-04: zero danych osobowych).
-- Serwer przechowuje wyłącznie: pseudonim, klucz publiczny, zaszyfrowane koperty,
-- publiczne materiały PreKey oraz znaczniki czasu. Nic, co identyfikuje osobę.

create table if not exists accounts (
  id          uuid primary key,
  pseudonym   text unique not null,
  public_key  text not null,                 -- base64(raw P-256) — do weryfikacji podpisu
  invited_by  uuid references accounts(id),  -- graf zaproszeń NA KLUCZACH, nie na ludziach
  created_at  timestamptz not null default now()
);

create table if not exists invites (
  code        text primary key,              -- jednorazowy kod (w prod: hash); tu: jawny w demo
  created_by  uuid references accounts(id),
  used_by     uuid references accounts(id),
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- Model PreKeys (Signal): serwer trzyma TYLKO klucze publiczne.
create table if not exists key_bundles (
  account_id        uuid primary key references accounts(id) on delete cascade,
  identity_key      text not null,
  signed_prekey     text not null,
  one_time_prekeys  jsonb not null default '[]',
  updated_at        timestamptz not null default now()
);

-- Skrzynka kopert E2E. Serwer NIE potrafi odczytać ciphertext.
create table if not exists envelopes (
  id                uuid primary key,
  recipient_id      uuid not null references accounts(id) on delete cascade,
  sender_pseudonym  text not null,
  ciphertext        text not null,            -- base64; nieczytelne dla serwera
  created_at        timestamptz not null default now()
);

-- Kolejka moderacji (message franking). Zapis powstaje TYLKO gdy ktoś zgłosi.
create table if not exists reports (
  id                 uuid primary key,
  reporter_pseudonym text not null,
  reported_pseudonym text not null,
  revealed           text not null,           -- ujawniony fragment + tag frankingu
  status             text not null default 'open',
  created_at         timestamptz not null default now()
);

-- Sesje: „logowanie" = dowód posiadania klucza prywatnego (challenge-response).
create table if not exists sessions (
  token       text primary key,               -- opaque; w prod: hash
  account_id  uuid not null references accounts(id) on delete cascade,
  expires_at  timestamptz not null
);

create table if not exists auth_challenges (
  nonce       text primary key,
  pseudonym   text not null,
  expires_at  timestamptz not null
);
