# Audyt wiedzy Biblioteki — pogłębiony (v2) — 2026-08-05

**Przedmiot:** żywy build `krag-app.vercel.app`; bundle `KB_BUNDLE` z `lib/knowledge.js`
(`generatedAt: 2026-07-27`, `edition 1.0.0`, `demo:true`), silnik `lib/ida.js`,
render `app.js`, konstytucja `policy.json` (`v1.0.0`, `2026-07-25`).
**Metoda:** ekstrakcja bundle'a i `PATHS_DB` do harnessu Node (przeliczone, nie przepisane),
odczyt `ALIAS`/renderu z kodu, weryfikacja miejsc u źródła `gov.pl/web/aids` + `aids.gov.pl/pkd`
(pobrane 2026-08-05).
**Zakres v2:** potwierdza i koryguje audyt v1, dokłada 4 nowe ustalenia klasy P0/P1
(trustLadder, brak dat przeglądu, rozjazd dwóch baz miejsc, render bramki) oraz pełną
macierz osiągalności.

---

## Metryki wejściowe (przeliczone z bundle'a)

| Metryka | v1 podał | Zmierzone | Uwaga |
|---|---|---|---|
| fakty w bundle | 223 | **223** | zgadza się |
| medyczne `gate:true` | 142 | **142** | wszystkie `held:"unverified"` |
| `gate:false` (miejsca) | 81 | **81** | =arv 22 + pep 21 + pkd 28 + wsp 10 |
| podpisane (`ver != null`) | 0 | **0** | zero — cały bundle |
| `held` rozkład | 142 | **142 unverified + 8 locator + 73 ∅** | `counts.held=150`, nie 142 |
| bloki | 22 | **23** | v1 pominął jeden (jest 21 z faktami + `miejsca` + `granice`) |
| ścieżki / lekcje | 10 / 21 | **10 / 21** | zgadza się |
| confidence (`f.c`) | — | **OFFICIAL 157 · VERIFIED 44 · COMMUNITY 22** | nowe |
| pole daty przeglądu w fakcie | — | **BRAK** | patrz P0-6 |
| flaga `demo` | true | **true** | patrz P0-1 |

Pola faktu: `id, b, t, w, s, c, ver, gate`. **Nie ma pola `nextReviewDue`** — to nie
szczegół, tylko fundament ustalenia P0-6.

---

## P0-1 — brama nie bramkuje (POTWIERDZONE, pogłębione konstytucyjnie)

**Stan.** 142 fakty: `gate:true`, `held:"unverified"`, `ver:null`. Render pokazuje pełną treść:
`app.js:820` (`renderHit`: `hit.facts.map(f => \`<p>${f.w}</p>\`)`) oraz `app.js:992`
(Biblioteka). Bramka to doklejana etykieta `gatewarn` (`app.js:829`, `890`, `992`).

**Dowód konstytucyjny (nowy).** `policy.json → publishGate`:
`requireHumanVerification:true`, `onMissingVerifier:"DRAFT"`, a `requireVerifierForBlocks`
obejmuje 11 bloków (transmisja, przebieg, leczenie, uu, ciaza, wspolistniejace, wyleczenie,
prep, pep, testowanie, ekspozycja). Skoro `ver:null` dla **wszystkich** faktów, to zgodnie
z własną polityką **100% warstwy medycznej ma status DRAFT** i nie powinno dotrzeć do
użytkownika. Produkcja renderuje ją w całości. To nie jest „prawie zgodne" — to odwrotność
reguły, którą `policy.json` nazywa „NAJWAŻNIEJSZĄ RÓŻNICĄ WOBEC MasterADR".

**Rama demo nie działa jako alibi.** `demo:true` w bundlu nie włącza żadnej ramy — baner
demo (`app.js` `demoMode()`) reaguje tylko na `?demo=1` lub `<meta name="krag-demo">`,
których produkcja `krag-app` nie ustawia (ustawia je tylko `ProjektKrag`). Użytkownik
wchodzący na produkcję dostaje niepodpisaną treść medyczną bez jakiejkolwiek ramy „to makieta".

**Do decyzji (konstytucyjna, jak w v1):** (a) `krag-demo` na stałe w produkcji; (b) `gate:true`
zwija fakt do tytułu (`f.t`) do czasu podpisu; (c) status quo — wykluczone przez GENESIS.
**Rekomendacja v2:** (b) jako stan docelowy + (a) jako stan przejściowy do pierwszego podpisu,
bo (b) bez żadnego podpisanego faktu zostawia Bibliotekę pustą — patrz P0-5, który to zaostrza.

---

## P0-5 — trustLadder mylony z confidence: KAŻDA odpowiedź jest realnie T3 (NOWE)

**Stan.** UI pokazuje odznakę zaufania z `f.c` (OFFICIAL/VERIFIED/COMMUNITY) — `confBadge`
w `renderHit`/`openLibPath`. Ale `policy.json → trustLadder` mówi wprost:
„confidence to właściwość wersji wiedzy, trustLevel to właściwość ODPOWIEDZI. To nie synonimy."
- T1 = `confidence OFFICIAL + verifiedBy != null + przed nextReviewDue`
- T3 = `verifiedBy == null … lub confidence COMMUNITY`

**Dowód.** `ver:null` dla wszystkich 223 faktów ⇒ **każda odpowiedź spełnia definicję T3**.
Mimo to użytkownik widzi „OFFICIAL" przy 157 faktach i „VERIFIED" przy 44 (np. `0211`, `0223`,
`0227` mają `c:VERIFIED`, `ver:null`). Odznaka komunikuje poziom wiedzy źródła, a nie poziom
zaufania odpowiedzi — czyli dokładnie to, przed czym `policy.json` ostrzega.

**Skutek.** To głębsza wersja P0-1: nawet gdyby zapaść decyzję „pokazujemy z ostrzeżeniem",
UI i tak **zawyża zaufanie** — pokazuje „urzędowe/zweryfikowane" tam, gdzie polityka każe
mówić „do weryfikacji". Bezpośrednio przeciw poprzeczce uczciwości z GENESIS.

**Naprawa.** Wyznaczaj `trustLevel` w renderze wg `policy.trustLadder` (funkcja z `f.c`,
`f.ver`, daty przeglądu), a odznakę wiąż z `trustLevel`, nie z `f.c`. Dopóki `ver:null`
wszędzie → wszystkie odznaki = T3. `f.c` może zostać jako drobny podpis „źródło: urzędowe".

---

## P0-6 — polityka przeglądu jest niewykonalna na poziomie danych (NOWE)

**Stan.** `policy.json → review` definiuje interwały: `prep-pl 90 dni`, `leczenie-pl 180`,
`epidemiologia/prawo/pep/testowanie 365`, `default 730`, `warnBeforeDays 30`. `trustLadder`
degraduje fakt do T2 „po nextReviewDue". **Ale fakt nie ma pola daty** (`id,b,t,w,s,c,ver,gate`).

**Skutek.** Nie ma z czego policzyć „po terminie". Cała mechanika świeżości (P1 świeżość w v1)
jest martwa — nie da się jej wyegzekwować, bo dane nie niosą `generatedAt`/`nextReviewDue`
per fakt. Fakty datowane w treści (P1 niżej) starzeją się bez żadnego sygnału systemowego.

**Naprawa.** Dodać `asOf` (data pozyskania) i wyliczać `nextReviewDue = asOf + interval(block)`
w `build.sh`/`validate.js`; render spuszcza do T2 po terminie. Bez tego pkt 5 planu napraw v1
(„daty przeglądu dla 0099…") nie ma gdzie usiąść.

---

## P0-2 — ścieżka z zegarem bez adresów (POTWIERDZONE) + rozjazd dwóch baz (NOWE)

**Stan (potwierdzony).** Bloki `miejsca` (81) i `granice` (3) nie należą do żadnej ścieżki
(`PATHS_DB` to jedyne źródło Biblioteki). 81 faktów-miejsc (~⅓ objętości) jest w payloadzie,
ale nieosiągalne z ekranu Biblioteki. Ścieżka `ryzyko` (`urgent:true`, 14 faktów) mówi
„zgłoś się na SOR/oddział zakaźny" — bez wskazania którego.

**NOWE — dwie równoległe bazy miejsc.** W tej sesji dołożono finder placówek
`lib/clinics.js` (16 miast, 22 poradnie ARV + współrzędne) używany przez Idę („Gdzie do
lekarza?"). **Nie korzysta on z 81 faktów `miejsca` w KB** — to druga, niezależna baza.
Efekt: KB `miejsca` (arv 22 / pep 21 / pkd 28 / wsp 10) jest martwym payloadem **i**
dubluje dane, które teraz żyją w `clinics.js`. Dwa źródła prawdy = pewny rozjazd przy
najbliższej aktualizacji gov.pl. Do decyzji: (a) `clinics.js` staje się jedynym źródłem
miejsc, a blok `miejsca` znika z KB; (b) finder czyta z KB `miejsca` (wtedy trzeba dołożyć
PEP/PKD/współrzędne do KB). Rekomendacja: (a) — finder jest nowszy, ma geolokalizację i „najbliżej".

**Porządkowo (potwierdzone).** Fakt `0081` („w każdym województwie ≥1 PKD") jest prawdziwy,
ale dotyczy **PKD** (testowanie), nie poradni ARV ani dyżuru PEP. Trzy różne sieci, trzy
pokrycia, jedno potoczne „poradnia". Brakuje faktu, który nazywa tę różnicę.

---

## P0-3 — świętokrzyskie: zweryfikowane u źródła 2026-08-05 (POTWIERDZONE, uściślone)

- ARV (`gov.pl/.../placowki-medyczne-prowadzace-leczenie-arv`): **0 w świętokrzyskim**.
- PEP (`gov.pl/.../co-robic-sytuacjach-pozazawodowego-...`): **0 w świętokrzyskim**.
- **NOWE uściślenie:** PKD (`aids.gov.pl/pkd`) **jest** w Kielcach (NZOZ „Nadzieja Rodzinie",
  ul. Karczówkowska 36). Czyli świętokrzyskie ma gdzie się **przetestować**, ale nie ma gdzie
  się **leczyć** ani odebrać **PEP**. To dokładnie ta różnica sieci z P0-2, w jednym województwie.

**Skutek.** Osoba w Kielcach: PKD lokalnie → wynik dodatni → najbliższy ARV to Kraków/Lublin/Łódź;
PEP (zegar 48–72 h) — też poza województwem. Baza jest wierna źródłu; luka jest w systemie —
ale aplikacja jej nie nazywa.

**Naprawa.** `nearestAlternative` dla województw bez ośrodka (finder `clinics.js` już to robi
dla ARV via „najbliżej" — rozszerzyć na PEP) + wprowadzić do treści zdanie z gov.pl:
przy długim oczekiwaniu / braku kontaktu telefonicznego można zgłosić się do **dowolnej
kliniki chorób zakaźnych** (potwierdzone u źródła 2026-08-05).

---

## P0-4 — placówki wyłącznie dziecięce podane jako ogólne (POTWIERDZONE u źródła)

Zweryfikowane w katalogu gov.pl 2026-08-05:

| ID | Placówka | gov.pl | w bazie KB |
|---|---|---|---|
| `pep-0010` | Woj. Szpital Specj. im. Wyszyńskiego, Lublin, Biernackiego 9 | **Tylko dzieci** ✓ | brak znacznika |
| `pep-0016` | USK im. Mikulicza-Radeckiego, Wrocław, Chałubińskiego 2-2a | **Tylko dzieci** ✓ | brak znacznika |
| `arv-0017` | Szpital im. Jonschera, Poznań, Szpitalna 27/33 | **Tylko dzieci** ✓ | brak znacznika |

Potwierdzono też dodatkowe dziecięce (gov.pl): Gdańsk i Poznań na liście PEP, oraz 5 pozycji
„tylko dzieci" na liście ARV. „Również dzieci" (dorośli+dzieci): Bydgoszcz (`arv-0004`),
Łódź (`arv-0013`).

**Skutek.** Dwie pierwsze są na ścieżce z zegarem — dorosły po ekspozycji w Lublinie/Wrocławiu
może trafić pod numer oddziału **dziecięcego**. **Efektywna liczba poradni ARV dla dorosłych
to ~17, nie 22.** (`clinics.js` już poprawnie oznacza pediatryczne `kids:true` — ale KB nie.)

**Naprawa.** Pole `audience: adults | children | both` w bazie miejsc (KB i/lub `clinics.js`),
walidowane w `validate.js`; finder i Biblioteka odsiewają dziecięce dla dorosłego użytkownika.

---

## P1 — routing Idy gubi 30 faktów (POTWIERDZONE co do liczby)

`ALIAS` w `lib/ida.js` ma **17 kluczy**. Bloki z faktami bez wpisu w ALIAS:

| blok | fakty | osiągalny z Biblioteki? |
|---|---|---|
| `odbudowa` | 11 | tak (ścieżka „Odbudowa odporności") |
| `bezpieczenstwo` | 7 | tak (ścieżka „Odbudowa") |
| `psyche` | 4 | tak (ścieżka „Głowa…") |
| `pierwsze-dni` | 4 | tak (ścieżka „Pierwsze dni") |
| `dlugoterminowo` | 4 | tak (ścieżka „Leczenie…") |

**30 faktów nieosiągalnych przez pytanie do Idy** (choć osiągalne przez Bibliotekę).
Gorzej: alias `'odbudow'` siedzi pod `przebieg` (potwierdzone w kodzie), więc „jak odbudować
odporność" trafia w 7 faktów CD4/wiremia zamiast w 11 faktów bloku `odbudowa`. To trafienie
w złe miejsce, nie brak trafienia.

**Naprawa.** Dodać 5 kluczy ALIAS; wyjąć `'odbudow'` z `przebieg` i dać własny alias `odbudowa`.

---

## P1 — pozostałe (zweryfikowane wobec bundle'a)

| # | Ustalenie | Dowód |
|---|---|---|
| 1 | `zapobieganie` ma role `partner`/`bliska` — osoba z HIV nie widzi 15 faktów o PrEP, choć „jak zabezpieczyć partnera" to jej pytanie | `PATHS_DB.zapobieganie.roles=[partner,bliska]` |
| 2 | `granice` (3 fakty, `0110–0112`) nie należy do żadnej lekcji — Krąg nie pokazuje własnych granic w Bibliotece (ale Ida je łapie: alias `granice`) | orphan w `PATHS_DB` |
| 3 | Brak mostu U=U ↔ art. 161 — `uu` (`0027`,`0031`) nie wspomina odpowiedzialności karnej, `prawo` (`0088–0091`) nie wspomina niewykrywalności | dwa bloki, zero linku |
| 4 | Dwie definicje „niewykrywalny": `0018` <50 (próg testu, blok `przebieg`) vs `0031` <200 (próg U=U, blok `uu`) — bez zdania łączącego | potwierdzone treścią |
| 5 | `f.w` renderowane bez `escapeHtml`, `f.s` z — niekonsekwencja w jednym wierszu (`app.js:992`, `820`). Ryzyko akceptowalne (treść z KB, nie od użytkownika), ale reguła „escapuj wszystko poza zaufanym HTML" łamana milcząco | `app.js:820/992` |
| 6 | 8 organizacji (`wsp-0003…0010`, `held:"locator"`) — same nazwy, zero danych kontaktowych | `held` rozkład: 8× locator |
| 7 | Redundancja długości życia: `0026`, `0211`, `0223`, `0227` (4×) + pierwszy rok `0219`, `0226` (2×). Recenzent podpisze to samo 4×, ryzyko rozjazdu wersji | potwierdzone treścią |
| 8 | Proporcja: „Pierwsze dni" = 4 fakty wobec 29 w „Podstawach". Najtrudniejszy moment ma najcieńszą ścieżkę | przeliczone |
| 9 (NOWE) | `renderHit` sprawdza bramkę tylko na `hit.facts[0].gate` (`app.js:829`) — hit mieszający fakt bramkowany z niebramkowanym pod-ostrzega, jeśli pierwszy jest `gate:false` | `app.js:829` |
| 10 (NOWE) | Fakty mają `c:VERIFIED` przy `ver:null` (np. `0211`) — confidence ustawione, weryfikacja nie. Wzmacnia P0-5 | bundle |

---

## P1 — świeżość, rozszerzona lista (wg kosztu zaniedbania)

v1 wskazał 0099, 0061, 0063, 0065, 0091, 0100. Harness znalazł **15 faktów z rokiem w treści**;
poniżej pełna lista, z nowymi pozycjami oznaczonymi:

| ID | Fakt | Ryzyko |
|---|---|---|
| `0099` | Program finansujący ARV **2022–2026** | Wygasa w tym roku; podpiera `0098` („leczenie bezpłatne"). Najdroższy do przegapienia |
| `0100` | Wygaszenie specustawy, marzec 2026 | Dostęp do świadczeń dla osób z Ukrainy |
| `0061/0063/0065` | PrEP: brak refundacji / recepta z POZ / prace Zespołu Parlamentarnego | Źródła `COMMUNITY`, wszystkie datowane; `prep-pl` ma interwał 90 dni (najkrótszy) |
| `0091` | Nowelizacja art. 161 „nie została uchwalona" | Stan legislacyjny, zmienia się bez sygnału |
| `0071` | Kto płaci za PEP pozazawodowy | Główna bariera praktyczna, na ścieżce z zegarem |
| `0055` (NOWE) | Lenakapawir zatwierdzony przez FDA 18.06.2025 | Data jednorazowa OK, ale status „najnowszy" się zestarzeje |
| `0058` (NOWE) | WHO zaleciło lenakapawir jako PrEP 14.07.2025 | j.w. |
| `0106` (NOWE) | 2024: 2257 nowych zakażeń HIV w Polsce | Statystyka roczna — za rok nieaktualna, blok `epidemiologia` interwał 365 |
| `0107` (NOWE) | Do końca 2024: >32 900 zakażeń łącznie | Kumulatyw — rośnie co rok |
| `0019` (NOWE) | Grudzień 2024: średnie CD4 przy rozpoznaniu AIDS = 71 | Statystyka datowana |

Bez P0-6 (pole daty) żadna z tych pozycji nie ma jak spaść do T2 automatycznie.

---

## Macierz osiągalności (223 fakty) — nowa

| Warstwa wejścia | Osiąga | Nie osiąga |
|---|---|---|
| **Biblioteka** (`PATHS_DB`) | 139 faktów (bloki w ścieżkach) | `miejsca` 81 + `granice` 3 = **84** |
| **Ida — pytanie** (`ALIAS`) | bloki z aliasem | `odbudowa`+`bezpieczenstwo`+`psyche`+`pierwsze-dni`+`dlugoterminowo` = **30** |
| **Ida — finder placówek** (`clinics.js`) | 16 miast ARV (own dataset) | **nie czyta** KB `miejsca` (81) — osobna baza |
| **Ida — kryzys/emocje** | deterministyczne warstwy | — |

Wniosek: 84 fakty tylko z Biblioteki, 30 tylko z pytania nie do dostania, a 81 faktów-miejsc
z KB nie do dostania **z żadnej** warstwy front-endu (finder ma własne dane). To ~⅓ payloadu.

---

## Kolejność napraw (zaktualizowana)

1. **Decyzja o bramie i zaufaniu (P0-1 + P0-5)** — łącznie, bo P0-5 pokazuje, że sama brama
   nie wystarczy: dopóki `ver:null`, odznaki muszą mówić T3, nie „OFFICIAL". Przesądza, czy i jak
   reszta jest publiczna.
2. **`audience` przy miejscach (P0-4)** — najtańsza naprawa o najwyższym koszcie zaniedbania
   (dorosły pod numerem dziecięcym na ścieżce z zegarem). `clinics.js` już to ma — dokończyć w KB/PEP.
3. **Jedno źródło miejsc (P0-2 nowe)** — `clinics.js` jako źródło, blok `miejsca` z KB wygaszony
   albo podłączony; +`nearestAlternative` dla PEP; +zdanie „dowolna klinika zakaźna" (P0-3).
4. **Pole daty przeglądu (P0-6)** — `asOf`+`nextReviewDue` w danych, inaczej pkt 5 wisi w próżni.
5. **`ALIAS`: 5 bloków + wyjęcie `'odbudow'` z `przebieg` (P1)**.
6. **Mosty i dublety treści (P1 #3, #4, #7)** — po decyzji o bramie, przed pierwszym podpisem
   (żeby recenzent podpisywał spójną, nieredundantną wersję).

---

## Jedno zdanie

Dane są uczciwe (wszystko rzetelnie oznaczone jako niepodpisane, `ver:null`), a **render nie jest**:
pokazuje niepodpisaną treść medyczną jako pełną i opatruje ją odznakami „OFFICIAL/VERIFIED",
choć własna `policy.json` klasyfikuje każdą taką odpowiedź jako T3 „do weryfikacji". Poprzeczka
uczciwości jest spełniona na poziomie bazy, a złamana na poziomie ekranu — i to jest sedno,
które łączy P0-1, P0-5 i P0-6.
