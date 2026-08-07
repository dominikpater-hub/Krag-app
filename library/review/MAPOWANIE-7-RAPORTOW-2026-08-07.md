# Mapowanie siedmiu raportów na bazę wiedzy Kręgu — co się pokrywa, co dochodzi

Data: 2026-08-07 · Stan bazy: **223 fakty** (142 merytoryczne `0001–0112` + `0201–0230`, oraz 81 miejsc)
Zasada: **flagujemy, nie poprawiamy automatycznie.** Ten dokument jest listą decyzji do podjęcia, nie zmianą w bazie.

---

## 1. Skrót

| Raport | Status wobec bazy | Nowych faktów |
|---|---|---|
| Kompendium wiedzy o HIV (lipiec) | **to jest ziarno bazy** — 112 faktów = `0001–0112` | 0 |
| Odbudowa odporności | **to jest ziarno bloku C** — `0201–0230` | ~3 (+1 korekta) |
| Mapowanie 223 faktów na źródła | raport źródłowy, **już przerobiony** (0107, art. 161) | 0 (13 lokalizatorów) |
| **Koinfekcje i choroby współistniejące** | **prawie w całości nowy** — baza ma 5 ogólników | **~46** |
| **Baza faktów o HIV 2026** | częściowo pokrywa, ale niesie brakujące warstwy | **~28** |
| Trener odporności (analiza) | głównie wdrożenie i regulacje, ale kilka mocnych faktów | ~8 (+2 korekty) |
| CMV — doniesienia konferencyjne | nowy, ale w większości dane wstępne | ~5 (z 13) |

**Razem do dodania: około 90 faktów.** Baza merytoryczna urosłaby ze 142 do ~230, całość do ~310.

---

## 2. Co się pokrywa w całości — nic nie robimy

**Kompendium (lipiec)** to dokument, z którego powstała obecna baza. 112 faktów odpowiada `0001–0112` jeden do jednego: transmisja, ryzyko per akt wg Patela, przebieg, markery, ART, U=U, ciąża, wyleczenie, PrEP, PrEP w Polsce, PEP, testowanie, ekspozycja zawodowa, prawo, leczenie w Polsce, stygmatyzacja, epidemiologia, granice aplikacji. Zero nowych treści — ale to dobry sygnał: baza nie zgubiła niczego z ziarna.

**Odbudowa odporności** odpowiada blokom `odbudowa` (0201–0211), `bezpieczeństwo` (0212–0218), `psyche` (0219–0222) oraz `pierwsze-dni`/`długoterminowo` (0223–0230). Pokrycie tematyczne jest pełne; różnice dotyczą szczegółowości liczb (patrz §5).

**Raport sourcingowy** przerobiliśmy wczoraj: fakt 0107 poprawiony, art. 161 zweryfikowany (0088 ma już brzmienie ponowelizacyjne, 0091 opisuje wciąż nieuchwaloną propozycję MZ — bez zmian), 4 lokalizatory dopięte, 13 źródeł nadal bez adresu.

---

## 3. Największa dziura: koinfekcje

Blok `wspolistniejace` ma **pięć faktów** i wszystkie są ogólnikami w rodzaju „częste koinfekcje to WZW C, WZW B, gruźlica i kiła, warto się badać". Osoba, która faktycznie ma koinfekcję, nie znajdzie w Kręgu nic.

Sprawdzenie w bazie: **doksycyklina/doxy-PEP — brak. HIV-2 — brak. mpox — brak. CMV — brak. Kryptokokoza — brak.** Gruźlica, HCV, HBV, kiła i HPV pojawiają się wyłącznie jako słowa na listach wyliczających.

Raport o koinfekcjach daje ~50 faktów z osobnym głębokim linkiem na patogen (DHHS/Clinicalinfo ma stabilny URL per patogen — to najwygodniejsze źródło, jakie mamy). Propozycja podziału na bloki:

- **`koinf-hcv`** (7) — samoistna eliminacja rzadsza przy HIV (~5% vs 15–30%), DAA wyleczają >95%, NRTI bezpieczne z DAA, efawirenz problematyczny, przerwy ≥2 tyg. przy zmianie ART, leczenie osadzonych z programu rządowego, wczesne leczenie przy transmisjach wśród MSM.
- **`koinf-hbv`** (7) — 5–15% osób z HIV, supresja HBV DNA ≥1 rok to 58% mniej raka wątroby, reaktywacja HBV przy leczeniu HCV, zakaz terapii dwulekowej przy HBV, polska profilaktyka poekspozycyjna (Gamma anty-HBs 1000 j.m. do 48 h), szczepienie przy anty-HBs <10.
- **`koinf-hpv`** (5) — sześciokrotnie wyższe ryzyko raka szyjki, szczepionka 9-walentna 9–45 lat niezależnie od CD4, HPV odbytu u MSM z HIV ~74%, badanie ANCHOR.
- **`koinf-tb`** (5) — gruźlica główną przyczyną zgonów, TPT redukuje śmiertelność ~80% z ART, ryfapentyna a dolutegrawir, ART w ciągu 8 tyg. (≤2 tyg. przy CD4 ≤50), opóźnienie ≥4 tyg. w gruźliczym zapaleniu opon.
- **`koinf-sti`** (5) — penicylina we wszystkich stadiach kiły, kiła oczna jak neurokiła, diagnostyka z trzech lokalizacji przed PrEP, **DOXY-PEP** (2 tabletki doksycykliny do 72 h — PTN AIDS 2025 to dopuszcza, a my o tym milczymy).
- **`koinf-inne`** (~10) — HAV i ogniska wśród MSM, mpox przy CD4 <200, mięsak Kaposiego, CMV przy CD4 <50, kryptokokoza i próg CrAg, MAC.
- do bloku `bezpieczenstwo`: **kryptokokoza** — jedyny próg z listy DHHS, którego nie mamy (0212 PCP, 0213 toksoplazmoza, 0214 MAC są, CrAg brakuje).
- do `leczenie-pl`: **HLA-B\*5701 u 4,7% osób z HIV w Polsce**, oznaczenie obowiązkowe przed abakawirem. To fakt czysto polski, którego nie ma nigdzie indziej.

**Uwaga o dublach:** trzy fakty z raportu o koinfekcjach pokrywają się z tym, co już mamy — progi PCP/toksoplazmozy/MAC (0212–0214) i IRIS (0215, 0002 z raportu). Przy imporcie należy je scalić, nie dopisać obok. Nasze obecne cytują EACS, raport cytuje DHHS — treść zgodna, więc wystarczy dopiąć drugie źródło.

---

## 4. Druga dziura: warstwy, o których baza w ogóle nie mówi

Z raportu „Baza faktów o HIV 2026". To nie są uzupełnienia — to tematy, których w Kręgu nie ma wcale.

### 4.1 Okienko serologiczne — kiedy można przestać się bać

Nasz fakt 0075 mówi tylko, co test wykrywa i po jakim czasie („p24 po dwóch tygodniach, przeciwciała po czterech do dwunastu"). **Nie mówi, kiedy diagnostykę można zamknąć.** To był pierwszy punkt na liście luk „do konsultanta" w lipcowym kompendium — i właśnie się domknął, bo PTN AIDS 2025 (rozdz. 1, s. 11) daje konkretne liczby:

- ujemny test IV generacji **6 tygodni** po ekspozycji zamyka diagnostykę;
- po PEP lub PrEP — **6–8 tygodni od zakończenia leków**;
- szybki test POC III generacji — **12 tygodni**, POC IV generacji — **6 tygodni**;
- test molekularny może być fałszywie ujemny, gdy zakażenie jest młodsze niż ~10 dni.

To prawdopodobnie najczęściej zadawane pytanie w całej dziedzinie i najbardziej dotkliwy brak w bazie. **Priorytet numer jeden.**

### 4.2 Diagnostyka — algorytm

Reaktywny wynik anty-HIV/p24 → NAAT; >200 kopii potwierdza zakażenie; u osoby leczonej z niewykrywalną wiremią albo u elite controllera potrzebny jest immunoblot. Nasz 0078 mówi tylko „wymaga potwierdzenia testem weryfikującym". Cztery fakty do dodania.

### 4.3 HIV-2

Zero faktów w bazie. NNRTI i enfuwirtyd są wobec HIV-2 nieskuteczne z natury; schematy pierwszego rzutu to dwa NRTI z inhibitorem integrazy drugiej generacji lub z PI. Rzadkie, ale kto trafi na taką diagnozę, nie znajdzie u nas nic.

### 4.4 Badanie lekooporności

Genotypowanie przy wejściu do opieki; powtórzenie, gdy od badania do startu terapii minęło ponad pół roku lub jest ryzyko nadkażenia. Baza mówi o lekooporności tylko przez pryzmat pominiętych dawek (0025).

### 4.5 Rapid start — **konflikt do rozstrzygnięcia**

PTN AIDS 2025 zaleca szybkie rozpoczęcie leczenia: schemat z dolutegrawirem, biktegrawirem, wzmacnianym PI albo doraviryną można włączyć **bez czekania** na wiremię, CD4, genotyp i serologię HBV.

Nasz fakt **0224** mówi coś innego: „leczenie zaczyna się szybko, ale nie w trybie nagłym jak PEP. Jest czas na badania wyjściowe i rozmowę z lekarzem". Pisaliśmy go po to, żeby zdjąć panikę z pierwszych dni — i w tej roli działa. Ale w zestawieniu z PTN AIDS brzmi jak zaniżenie tempa. **Do przeformułowania: „ART można zacząć od razu, nawet tego samego dnia — ale to Twój lekarz zdecyduje, a Ty nie musisz podjąć wszystkich decyzji naraz".** Utrzymuje spokój i nie kłóci się z wytycznymi.

### 4.6 Kaskada opieki i późne rozpoznania

Baza mówi „utrzymuje się problem późnych rozpoznań" (0108) bez jednej liczby. Do dodania: definicja późnego rozpoznania (CD4 <350 lub choroba wskaźnikowa), 54% późnych rozpoznań w regionie europejskim WHO w 2024, 52,4% wśród migrantów wobec 42,6% wśród niemigrantów, średni czas od zakażenia do rozpoznania w Polsce 2–4 lata (PTN AIDS).

### 4.7 Świat — bloku nie ma wcale

Baza jest w stu procentach polska. To był świadomy wybór, ale kilka liczb globalnych daje użytkownikowi skalę i wyciąga go z poczucia osobliwości: 41,0 mln osób żyjących z HIV na koniec 2025, 1,2 mln nowych zakażeń i 570 tys. zgonów w 2025, kaskada 87–89–94, spadek nowych zakażeń o 42% od 2010. **Decyzja właściciela: czy otwieramy blok `swiat`?** Argument za: skala i nadzieja. Argument przeciw: to fakty szybko się starzejące, a my mamy już 39 wstrzymanych przez bramkę.

Osobno: prognozy skutków cięć PEPFAR (6 mln dodatkowych zakażeń) to **model, nie obserwacja** — jeśli wchodzi, to wyłącznie z tym zastrzeżeniem w treści.

### 4.8 Ciąża — konkretne liczby zamiast „mniej niż 1 procent"

Nasz 0034 mówi „mniej niż 1 procent, ale nie zero". Badanie PROMISE daje twarde: **0,3% po sześciu miesiącach karmienia, 0,7% po dwunastu.** Do tego jawne postawienie rozbieżności: WHO zaleca karmienie piersią przy skutecznym ART, DHHS/BHIVA/EACS są ostrożniejsze. Nasze 0038 mówi o „wspólnym podejmowaniu decyzji", ale nie mówi, że wytyczne się różnią — a to jest różnica, którą kobieta usłyszy w gabinecie.

### 4.9 PrEP i PEP — brakujące szczegóły

PrEP: pełna ochrona po ~7 dniach ciągłego stosowania; wizyty kontrolne co 3 miesiące; test końcowy 6–8 tygodni po odstawieniu; PrEP iniekcyjny kabotegrawirem co 2 miesiące i zjawisko „ogona lekowego" (monitorowanie HIV-RNA ≥1 rok po ostatniej iniekcji).

PEP: CDC 2025 rozszerzyło wskazania — obejmują teraz sytuacje, gdy źródłem jest osoba z supresją wiremii, gdy narażona osoba stosowała PrEP, oraz napaść seksualną. **Skład schematu PEP** (BIC/FTC/TAF albo DTG + …) to była druga luka „do konsultanta" i też się domknęła — ale wymienianie leków z nazwy jest blisko granicy, którą trzymamy w bloku `granice`. **Flaga: podać czy nie?** Sugestia: podać jako informację, czego lekarz zwykle użyje, bez dawek.

### 4.10 Prawo — jeden brakujący fakt o dużym ciężarze

Odpowiedzialność z art. 161 dotyczy **wyłącznie osoby świadomej swojego zakażenia**, a przestępstwem jest samo narażenie — do zarażenia nie musi dojść. Mamy 0088–0090 o karach, ale nie mamy tego, co ludzie realnie chcą wiedzieć: kogo to dotyczy i od kiedy.

---

## 5. Korekty i konflikty w tym, co już mamy

To jest lista rzeczy **do rozstrzygnięcia przez właściciela**, nie do automatycznej poprawki.

**K-1. Fakt 0107 — liczba zakażeń.** Wczoraj poprawiliśmy na **35 175** (do 31.12.2024), za komunikatem NIZP PZH-PIB/NFZ z okazji Światowego Dnia AIDS. Nowy raport podaje, że meldunek NIZP-PZH mówi **34 668 na 30.09.2024**, i nazywa 35 175 „wartością niezweryfikowaną". Obie liczby dają się pogodzić (507 przypadków w IV kwartale to realna dynamika), ale nie mamy pod ręką meldunku rocznego. **Do decyzji: zostawiamy 35 175 z datą, czy cofamy do 34 668 z datą 30.09.2024?** Rekomendacja: zostawić 35 175 — data w treści jest, a liczba pochodzi od tej samej instytucji.

**K-2. Fakt 0106 — nowe zakażenia w 2024.** Mamy **2257**. Raport podaje **2055** za Pulsem Medycyny. Prawdopodobnie dane cząstkowe vs pełny rok, ale to sprzeczność w bazie do domknięcia jednym meldunkiem.

**K-3. Fakt 0201 — „około 100 komórek".** Analiza implementacyjna wprost mówi, że wartość „~102 kom./µl/rok uśrednione przez dwa lata" **nie jest parametrem pracy z Nankinu** i została do niej doklejona. Prawdziwe fazy to 265 → 46 → 22 → 8,6. Nasz 0201 niesie to „około 100". **Do usunięcia albo zastąpienia fazami.** To nasz błąd, nie cudzy.

**K-4. Fakt 0221 — wsparcie rówieśnicze.** Mamy „49 procent wobec 30 procent" z badania LINK LA. Analiza implementacyjna podaje **49,6% vs 36,0%** i — ważniejsze — pokazuje, że dowody na wpływ wsparcia rówieśniczego na supresję wirusa są **mieszane**: duże badania Project HOPE i MAPPS wyszły na zero. Nasz fakt cytuje wyłącznie najkorzystniejszy wynik. **To jest zawyżenie i trzeba je zdjąć** — zwłaszcza że wsparcie rówieśnicze to serce Kręgu i akurat tu nie wolno nam naciągać. Dowód na retencję w opiece jest solidny (RR 1,07, wysoka pewność); dowód na supresję — nie.

**K-5. Progi wiremii — trzy różne liczby.** 0018 mówi „<50 to próg testu", 0031 „<200 to próg U=U", a nowy raport dokłada „utrzymana przez co najmniej 6 miesięcy". Trzy liczby, zero zdania łączącego. Audyt wskazywał to już wcześniej. **Do napisania jeden fakt-most.**

**K-6. Fakt 0067 — PEP w czasie.** Mamy „najlepiej w dwie godziny, maksymalnie 48, w uzasadnionych do 72". CDC 2025 mówi „optymalnie w ciągu pierwszych 24 godzin". Nie ma sprzeczności, ale nasza wersja może brzmieć jak dwa różne progi. Do ujednolicenia przy okazji.

**K-7. Blok `bezpieczenstwo` a IRIS.** Nasz 0215 opisuje IRIS jakościowo. Raporty dają liczby: częstość 10–32% (TB-IRIS ~15,7%), szczyt 4–8 tygodni po starcie ART, głównie przy CD4 <100. Do wzbogacenia, nie do zmiany sensu.

---

## 6. Trener odporności — fakty, które wzmacniają moduł

Analiza implementacyjna jest w większości o regulacjach i wdrożeniu (te wnioski idą do `claude/DESIGN-IDA-AI`, nie do bazy). Ale niesie kilka faktów, które są dokładnie tym, czego moduł potrzebuje:

- **IL-2 jako dowód negatywny.** ESPRIT i SILCAAT (n=5806): interleukina podniosła CD4 o 159 i 53 komórki, a ryzyko zachorowania i zgonu nie drgnęło. Mamy to w 0205 jednym zdaniem — warto rozwinąć, bo to najlepsza ilustracja tezy modułu: *sam wzrost CD4 nie jest celem*.
- **REPRIEVE.** Pitawastatyna zmniejszyła ryzyko poważnych zdarzeń sercowo-naczyniowych o 35% (n=7769, mediana 5,1 roku). Twardy punkt końcowy, nie CD4 — czyli druga strona tej samej tezy: rzeczy, które realnie pomagają, nie zawsze widać w wyniku CD4.
- **Wyleczenie HCV podnosi CD4** średnio o 84 komórki w pierwszym roku po SVR. Łączy blok koinfekcji z blokiem odbudowy.
- **Start z bardzo niskiego CD4.** Grupa ≤49 komórek rośnie **dalej po sześciu latach** (11,6/rok), bez plateau; CD4 ≥500 osiąga 36%, a ≥350 — 68%. To jest fakt pocieszający i konkretny.
- **CD4/CD8 — tempo normalizacji:** 4,4% po roku, 11,5% po dwóch, 29,4% po pięciu. Nasz 0206 mówi tylko, że „normalizuje się rzadko i wolno".
- **Praktyka polskiego laboratorium:** CD4 raportowane jako wartość bezwzględna **i** procent; wiremia w kopiach/ml z progiem wykrywalności zwykle <20–50 zależnie od aparatu. Fakt o zerowej wartości medycznej i ogromnej praktycznej — bo to najczęstsze źródło pomyłki przy wpisywaniu własnego wyniku.
- **Częstotliwość badań:** wiremia przed ART, po 4–8 tygodniach od włączenia, potem co 3–6 miesięcy; CD4 co 3–6, po ustabilizowaniu co 6–12 miesięcy.

---

## 7. CMV — co brać, a czego nie

Raport konferencyjny daje 13 gotowych faktów, ale większość to **abstrakty z CROI, dane wstępne, nierecenzowane**. Dla bazy przeznaczonej dla ludzi szukających pomocy to nie jest wiedza medyczna i nie może tak wyglądać.

**Do wzięcia (wiedza ustalona, z wytycznych):**
- CMV jako choroba oportunistyczna przy CD4 <50; zapadalność na zapalenie siatkówki ~0,36/100 osobolat, w podgrupie CD4 <50 — 3,89.
- Spadek zachorowań o ≥95% po wprowadzeniu ART.
- Wznowienie profilaktyki wtórnej przy CD4 <100.
- Seroprewalencja CMV u kobiet w wieku rozrodczym w Polsce 81,9%.
- W Polsce marybawir (program B.168, od 04.2025) i letermowir (B.132, od 07.2022) są refundowane **wyłącznie w transplantologii, nie w HIV** — to praktyczna odpowiedź na pytanie „czy mogę to dostać".

**Do odłożenia (dane wstępne):** ACTG A5383 / letermowir a starzenie immunologiczne (n=39, badanie przerwane), abstrakty CROI 2026 o CMV IgG i wielochorobowości, porażka szczepionki Moderny. Jeśli kiedyś wchodzą, to do osobnej warstwy „badania w toku" z etykietą, nie do warstwy faktów.

---

## 8. Proponowana kolejność

1. **Okienko serologiczne** (§4.1) — 5 faktów, największy pożytek na jednostkę pracy, domyka lukę z lipca.
2. **Koinfekcje** (§3) — ~46 faktów, sześć nowych bloków. Największa robota, ale to obietnica, którą baza dziś łamie.
3. **Korekty K-3 i K-4** — bo to nasze zawyżenia, a nie cudze braki.
4. **Brakujące warstwy** (§4.2–4.5, 4.8–4.10) — ~20 faktów.
5. **Trener odporności** (§6) — 7 faktów, moduł już ich potrzebuje.
6. **CMV wybrane** (§7) — 5 faktów.
7. **Decyzje właściciela:** blok `swiat` (§4.7), skład schematu PEP (§4.9), liczba w 0107 (K-1).

Po każdym kroku: `build.sh`, strażnik liczb w tłumaczeniach, routing Idy (nowe bloki potrzebują aliasów, inaczej powtórzy się historia z pięcioma nieosiągalnymi blokami).

**Uwaga o tłumaczeniach:** każdy nowy fakt to dziewięć języków. Przy 90 faktach to 810 tekstów. Warto rozważyć, czy nowe bloki wchodzą od razu wielojęzycznie, czy najpierw po polsku z jawnym oznaczeniem braku tłumaczenia (aplikacja już umie pokazać polski, gdy tłumaczenia nie ma).
