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

-- Sejf E2E (profil + kopia kluczy). Serwer widzi TYLKO losowy lookup_id (z frazy odzyskiwania)
-- i szyfrogram AES-GCM — nie potrafi go odczytać. lookup_id NIE jest powiązany z pseudonimem,
-- więc nie zdradza, kto ma konto. account_id wiąże sejf z kontem tylko po to, by cudzy zapis
-- nie mógł nadpisać nie swojego wpisu (zapis wymaga zalogowania kluczem).
create table if not exists vault (
  lookup_id   text primary key,               -- HKDF(fraza) — wysokoentropijny, nie enumerowany
  account_id  uuid not null references accounts(id) on delete cascade,
  ciphertext  text not null,                  -- base64(iv+ct); nieczytelne dla serwera
  updated_at  timestamptz not null default now()
);

-- Katalog (#6): OPT-IN ogłoszenia. Widoczne dla innych członków — użytkownik świadomie się
-- ogłasza. Region jest SAMODZIELNIE podany i zgrubny (miasto/województwo), BEZ GPS. To zastępuje
-- „osoby w pobliżu": grupowanie po okolicy bez lokalizacji urządzenia.
create table if not exists listings (
  pseudonym   text primary key,               -- klucz-pochodny uchwyt (nie tożsamość)
  region      text not null default '',        -- np. „Warszawa", „mazowieckie" — bez GPS
  tags        text not null default '',        -- np. „świeżo po diagnozie, PrEP"
  bio         text not null default '',
  updated_at  timestamptz not null default now()
);

-- Pokoje tematyczne (#6/2): grupa BEZ klucza grupowego. Serwer trzyma tylko nazwę tematu
-- i listę członków (potrzebną do dołączania i do listy odbiorców rozgłaszania). Treść i to,
-- „kto do kogo pisze w środku", są w ZASZYFROWANYCH kopertach 1:1 — nadawca szyfruje osobno
-- do każdego członka (E2E per-odbiorca). Nazwa tematu jest jawna (jak w katalogu — pokój ma
-- być odnajdywalny), NIE jest daną zdrowotną.
create table if not exists rooms (
  id          uuid primary key,
  name        text not null,
  created_by  text not null,                   -- pseudonim (uchwyt), nie tożsamość
  created_at  timestamptz not null default now()
);

create table if not exists room_members (
  room_id     uuid not null references rooms(id) on delete cascade,
  pseudonym   text not null,
  joined_at   timestamptz not null default now(),
  primary key (room_id, pseudonym)
);
