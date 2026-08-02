# krag-app — „prawdziwy" Krąg (klient PWA)

Osobne repo od prototypu-demo (`ProjektKrag`, dawniej `Krag`, który pokazuje możliwości i bibliotekę wiedzy). Tu powstaje aplikacja produkcyjna wg decyzji **K-27** (hybryda) i **K-30** (stos).

**Aktualizacja (2026-08): baza wiedzy + Ida + warstwa kryzysowa przeniesione z demo.** Produkcyjny klient ma teraz to, co pokazywało demo — 223 fakty, silnik routingu pytań Idy i warstwę kryzysową — na wierzchu swojej bezpiecznej architektury (klucz lokalny, E2E rozmowy, dziennik na urządzeniu). Kod wiedzy jest czysto lokalny: `lib/knowledge.js` (bundle z `ProjektKrag/library`), `lib/ida.js` (routing), `lib/crisis.js` (wykrywanie kryzysu). Warstwa kryzysowa dopasowuje **wzorcami z luzem na wtrącenia**, a nie stałym podciągiem — poprawka **SEC-01** (audyt AUDYT4x): „nie chcę **już** żyć" już nie omija wykrycia. Regresję pilnują `lib/crisis.test.mjs` i `lib/ida.test.mjs`.

## Architektura (K-27 / K-30)

Zasada nadrzędna (**K-04**): *serwer nigdy nie może poznać, kim jesteś.* Dane o zdrowiu zostają na telefonie; backend widzi tylko pseudonim i zaszyfrowane koperty.

| Warstwa | Wybór | Status w szkielecie |
|---|---|---|
| Klient | **PWA** (Web Crypto, IndexedDB, service worker) | ✅ działa |
| Baza wiedzy | 223 fakty + routing Idy + warstwa kryzysowa (`lib/knowledge.js`, `lib/ida.js`, `lib/crisis.js`) | ✅ działa lokalnie |
| Konto | lokalny klucz (ECDSA P-256) + kod zaproszenia; pseudonim z klucza publicznego | ✅ działa lokalnie |
| Backup konta | fraza odzyskiwania (docelowo pełny **BIP-39**) | ✅ demo (skrócona lista słów) |
| Dziennik zdrowia | tylko urządzenie: **IndexedDB** + `navigator.storage.persist()` | ✅ działa lokalnie |
| Backend | własny minimalny **PostgreSQL + cienkie API** na VPS w UE | ⛔ TODO |
| Rozmowy 1:1 | **Signal Protocol** (`libsignal-client`, model PreKeys) | ⛔ TODO |
| Moderacja (O-08) | **message franking** + kolejka z człowiekiem | ⛔ TODO |
| Anty-abuse | jednorazowe kody zaproszeń + Privacy Pass / proof-of-work | ⛔ TODO (kod: format-only) |

Pełne uzasadnienie: `ProjektKrag/research/A2-backend-hosting-rekomendacja.md` i `ProjektKrag/ARCHITEKTURA-K27.md`.

## O-09 — hosting: **Scaleway Warszawa (WAW)** [decyzja robocza C, do akceptacji W]

Wszystkie rozważane opcje (Hetzner DE/FI, OVH WAW, Scaleway WAW) są w UE, ISO 27001, mają DPA i są poza jurysdykcją USA (Schrems II OK). Przy praktycznie równym koszcie (~4,50–4,99 €/mies.) wybrałem **Scaleway WAW**, bo dla aplikacji dla osób z HIV w Polsce **dane fizycznie w Polsce** to najmocniejszy argument zaufania wobec środowiska i organizacji pacjenckich, które mają firmować projekt (mandat GIPA) — a Scaleway to firma UE (grupa Iliad) z 3 strefami dostępności w Warszawie i dodatkowym dystansem od CLOUD Act. **Hetzner zostaje jako plan B**, gdyby o wszystkim zdecydował koszt/prostota operacyjna. Ostateczne słowo należy do właściciela — zmiana to jedna linijka w konfiguracji infry.

## Czego szkielet NIE robi (i dlaczego)

Start produkcyjny jest **zablokowany** niezależnie od kodu:
- **Podpis lekarza** — bez `dist/` z zatwierdzoną treścią apka nie ma co pokazywać.
- **Checklista prawna** przed publiczną rejestracją — DPIA (art. 35), rejestr czynności (art. 30), **wyraźna zgoda (art. 9 ust. 2 lit. a, NIE lit. d)**, DPA, IOD, notice-and-action DSA (art. 16). Patrz `ARCHITEKTURA-K27.md §9`.
- **O-08** — kto moderuje (etat, nie funkcja).

Dlatego backend/E2E/moderacja są tu świadomie jako TODO, a nie zmyślone.

## Uruchomienie (lokalnie)

PWA wymaga serwowania przez HTTP (service worker nie działa z `file://`):

```bash
cd krag-app
python3 -m http.server 8080
# otwórz http://localhost:8080
```

Przepływ: „Mam kod zaproszenia" → dowolny kod `KRAG-XXXX-XXXX` → generacja klucza i pseudonimu → fraza odzyskiwania → wejście. Dziennik i klucz zostają w IndexedDB tej przeglądarki; „Usuń wszystko" czyści urządzenie.

## Następne kroki (kolejność)

1. Ikony PWA (`icon-192.png`, `icon-512.png`) — po wyborze ikony (C-1).
2. Backend: schemat Postgres (pseudonim, klucz publiczny, koperty, znacznik czasu — **nic więcej**) + cienkie API; hosting Scaleway WAW (po akceptacji O-09).
3. Signal E2E dla rozmów 1:1 (`libsignal-client`, PreKeys) — po backendzie.
4. Kolejka moderacji (message franking) — po decyzji O-08.
5. Checklista prawna z prawnikiem — przed jakąkolwiek publiczną rejestracją.
