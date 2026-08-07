# Produkcyjny watch.js (KROK 7)

`watch.js` sprawdza 10 punktów obserwacyjnych i dopisuje zmienione wpisy do
`state/watch-queue.json` ze statusem `NEEDS_REVIEW`. **Nigdy** nie dotyka `verifiedBy`.

## Dwie drogi uruchomienia

- **GitHub Actions** — `.github/workflows/watch.yml`, codziennie 05:17 UTC + ręcznie.
  Zmiany kolejki wracają commitem do repo (widać historię, kto co podniósł).
- **crontab** — `cron/watch.crontab` na własnym serwerze; log do `state/watch.log`.

## Zawężenie zasięgu (już w kodzie)
Zmiana w rejestrze leków trafia teraz w wpisy cytujące dany lek (`citesAtc`
+ `scripts/atc-narrow.js`), a nie w cały blok. Uzupełnianie `citesAtc` dla
reszty faktów to przegląd medyczny, nie zadanie crona.

## Czego cron NIE robi
Nie publikuje. Bramka weryfikacji stoi dalej: `dist/` napełnia się dopiero po
podpisie człowieka przez `verify.js`.
