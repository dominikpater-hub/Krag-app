# krag-server — cienkie API (Faza 2, K-27/K-30)

Backend „prawdziwego" Kręgu. **Zasada nadrzędna (K-04): serwer widzi tylko pseudonim, klucz publiczny i zaszyfrowane koperty — nic, co identyfikuje osobę.** Danych o zdrowiu tu nie ma; żyją wyłącznie na urządzeniu.

Stos: **Node/TypeScript + Fastify + PostgreSQL** (wybór z researchu A2). Docelowy hosting: **Scaleway WAW** (O-09).

## Model danych (minimalny — `schema.sql`)

`accounts` (pseudonim, klucz publiczny, kto zaprosił — graf na kluczach), `invites` (jednorazowe kody), `key_bundles` (PreKeys — tylko klucze publiczne), `envelopes` (koperty E2E, nieczytelne dla serwera, kasowane po odbiorze), `reports` (kolejka moderacji — message franking), `sessions` + `auth_challenges` (logowanie = dowód klucza).

## Endpointy

| Metoda | Ścieżka | Auth | Opis |
|---|---|---|---|
| GET  | `/health` | — | status |
| POST | `/accounts/bootstrap` | — | pierwsze konto (założyciel); kolejne tylko z zaproszenia |
| POST | `/invites/redeem` | — | wykorzystanie kodu → nowe anonimowe konto |
| POST | `/auth/challenge` | — | pobierz nonce dla pseudonimu |
| POST | `/auth/verify` | — | podpisz nonce kluczem prywatnym → token sesji |
| POST | `/invites` | ✓ | utwórz jednorazowy kod (limit 5 aktywnych) |
| POST | `/keys` | ✓ | opublikuj paczkę PreKey (klucze publiczne) |
| GET  | `/keys/:pseudonym` | ✓ | pobierz paczkę odbiorcy (zdejmuje one-time prekey) |
| POST | `/envelopes` | ✓ | wyślij zaszyfrowaną kopertę do pseudonimu |
| GET  | `/envelopes` | ✓ | odbierz swoje koperty (i usuń z serwera) |
| POST | `/reports` | ✓ | zgłoś wiadomość do moderacji (franking) |

„Logowanie" = **challenge-response**: serwer daje nonce, klient podpisuje go kluczem prywatnym (ECDSA P-256, ten sam co w PWA), serwer weryfikuje podpis kluczem publicznym konta i wydaje krótką sesję. Zero haseł, zero e-maili.

## Uruchomienie

```bash
cd server
npm install
npm test               # testy integracyjne na pg-mem (bez prawdziwej bazy)
npm run typecheck      # kontrola typów

# development z prawdziwym Postgresem:
docker compose up -d
cp .env.example .env
npm run migrate
npm run dev
```

## Świadome TODO (nie w tym szkielecie)

- **Signal Protocol** właściwe szyfrowanie po stronie klientów (tu API tylko przenosi PreKeys i koperty).
- **Hash kodów zaproszeń i tokenów** w bazie (teraz jawne — do utwardzenia przed produkcją).
- **Privacy Pass / proof-of-work** jako dodatkowy anty-abuse ponad jednorazowe kody.
- **Minimalizacja metadanych** kopert (kasowanie natychmiast po dostarczeniu jest, ale trzeba dopiąć retencję i logi).
- **Deploy na Scaleway WAW** + DPA + backupy — po akceptacji O-09 i checklistcie prawnej (`ProjektKrag/ARCHITEKTURA-K27.md §9`).
