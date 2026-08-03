# Krąg — wdrożenie backendu (Scaleway WAW, decyzja O-09)

Backend jest potrzebny tylko do **rozmów 1:1** i **synchronizacji** między urządzeniami.
Baza wiedzy (Ida), dziennik i profil działają w całości lokalnie i backendu nie potrzebują.

Zasada K-04 zostaje: serwer widzi wyłącznie pseudonim, klucz publiczny i zaszyfrowane koperty
oraz nieczytelny szyfrogram sejfu. Żadnych danych o zdrowiu jawnym tekstem.

## Co stawiamy
API (Fastify) + PostgreSQL + Caddy (automatyczny HTTPS) — jednym `docker compose`.
Dane fizycznie w Polsce (Scaleway strefa WAW), poza jurysdykcją CLOUD Act.

## 1. Serwer na Scaleway (WAW)
1. Utwórz **Instance** (np. DEV1-S) w regionie **Warszawa (pl-waw)**, obraz Ubuntu/Debian.
2. Zainstaluj Dockera: `curl -fsSL https://get.docker.com | sh`.
3. Otwórz porty 80 i 443 w Security Group.

## 2. DNS
Dodaj rekord **A**: `api.twojadomena.pl → <IP instancji>`. Caddy weźmie na tę domenę
certyfikat Let's Encrypt automatycznie (potrzebne działające 80/443).

## 3. Konfiguracja i start
```bash
git clone https://github.com/dominikpater-hub/Krag-app.git
cd Krag-app/server
cp .env.prod.example .env      # i uzupełnij: PGPASSWORD, API_DOMAIN, CORS_ORIGINS, POW_SECRET
docker compose -f docker-compose.prod.yml up -d --build
```
`CORS_ORIGINS` to dokładny adres apki (np. `https://projectkrag.vercel.app`).
Sprawdzenie: `curl https://api.twojadomena.pl/health` → `{"ok":true,...}`.

## 4. Wpięcie PWA do API
W `index.html` apki (repo Krag-app, katalog główny), w `<head>`, dodaj jedną linię:
```html
<meta name="krag-api-base" content="https://api.twojadomena.pl">
```
`config.js` sam ją odczyta. Bez tej linii apka działa lokalnie (rozmowy/sync offline).
Po zmianie zbumpuj wersję cache w `sw.js` (np. `krag-shell-v9`), żeby urządzenia pobrały nowość.

## 5. Aktualizacje / kopie
- Aktualizacja: `git pull && docker compose -f docker-compose.prod.yml up -d --build`.
- Backup bazy: `docker compose -f docker-compose.prod.yml exec db pg_dump -U krag krag > backup.sql`.
- Postgres nie ma wystawionego portu na świat — dostęp tylko z sieci compose.

## Checklista prawna przed publicznym pilotażem (z ARCHITEKTURA-K27 §9 / audyty)
Kod jest gotowy; przed rejestracją realnych osób potrzebne są jeszcze: administrator danych,
DPIA (art. 35), rejestr czynności (art. 30), wyraźna zgoda (art. 9 ust. 2 lit. a), DPA ze
Scaleway, kontakt IOD, notice-and-action (DSA art. 16) oraz decyzja O-08 (kto moderuje).
