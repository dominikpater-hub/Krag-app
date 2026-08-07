/* Routing Idy — port testu z ProjektKrag, ale importuje czysty moduł (bez wyrywania z HTML).
 * Uruchom: node lib/ida.test.mjs */
import { findFacts, resetThread, setRole, FACTS } from './ida.js';
import { risky, stopMeds } from './crisis.js';

let pass = 0, fail = 0;
const ok = (cond, label) => { (cond ? pass++ : fail++); console.log((cond ? '  ✓ ' : '  ✗ FAIL ') + label); };
const route = (q) => { resetThread(); const h = findFacts(q); return h ? { block: h.block, ids: (h.facts || []).map((f) => f.id), bound: !!h.bound, boundKind: h.boundKind, bridge: h.bridge, unsure: !!h.unsure } : null; };

setRole('plhiv');

/* Strażnik rozmiaru bazy. Liczba jest wpisana na sztywno CELOWO — raz już zdarzyło się,
 * że częściowy build po cichu wyciął 30 faktów i nikt tego nie zauważył. Przy każdej
 * świadomej rozbudowie bazy tę liczbę podbija się ręcznie, jednym ruchem, z premedytacją.
 * 2026-08-07: 223 → 228 (okienko serologiczne, hiv-0113…0117),
 * potem 228 → 272 (koinfekcje, hiv-0301…0344). */
const OCZEKIWANE_FAKTY = 272;

console.log('R-0 · baza wczytana:');
ok(FACTS.length === OCZEKIWANE_FAKTY, 'FACTS = ' + FACTS.length + ' (oczekiwano ' + OCZEKIWANE_FAKTY + ')');

console.log('\nR-1 · kryzys (z diakrytykami i bez):');
['nie chcę żyć', 'nie chce zyc', 'mam dość', 'chcę zniknąć', 'skończyć ze sobą', 'не хочу жити']
  .forEach((q) => ok(risky(q), 'wykrywa: "' + q + '"'));
ok(!risky('jak dbać o zdrowie'), 'NIE fałszuje na: "jak dbać o zdrowie"');

console.log('\nR-2 · świeża ekspozycja → PEP (nie U=U):');
[['Miałem seks bez prezerwatywy 3 dni temu'], ['co robić po ryzykownym seksie'],
 ['wczoraj uprawiałem seks z osobą zakażoną'], ['pękła mi prezerwatywa wczoraj']]
  .forEach(([q]) => { const r = route(q); ok(r && r.block === 'pep', '"' + q + '" → ' + (r && r.block)); });

console.log('\nR-3 · blok prawo nie dokleja kar więzienia:');
{ const r = route('boję się że mnie zwolnią');
  ok(r && r.block === 'prawo' && !r.ids.some((id) => ['0088', '0089', '0090'].includes(id)),
    '"boję się że mnie zwolnią" → prawo, ids=' + (r && r.ids)); }
{ const r = route('Czy muszę powiedzieć pracodawcy?');
  ok(r && r.block === 'prawo' && r.ids[0] !== '0088' && r.ids.includes('0095'),
    '"Czy muszę powiedzieć pracodawcy?" → prawo, ids=' + (r && r.ids)); }

console.log('\nR-6a · dzielenie się własnym wynikiem BEZ pytania o ocenę/decyzję → "trend", NIE blokujemy (audyt #2, 2026-08-06):');
[['moje cd4 to 180'], ['mój CD4 wzrósł do 450'], ['mam wynik 300']]
  .forEach(([q]) => { const r = route(q); ok(r && r.block === 'trend' && !r.bound, '"' + q + '" → ' + (r && r.block)); });

console.log('\nR-6b · ocena wyniku / decyzja leczenia zostają twardym stopem, PRZED AI (PL/EN):');
[['cd4 spadło mi do 150 co robić', 'decide'], ['my CD4 is 180 is that bad', 'judge'],
 ['should I change my medication', 'decide'], ['czy to dobry wynik', 'judge'], ['jaki lek dla mnie', 'decide']]
  .forEach(([q, kind]) => { const r = route(q); ok(r && r.bound && r.boundKind === kind, '"' + q + '" → ' + (r && (r.bound ? r.boundKind : r.block)) + ' (oczekiwano ' + kind + ')'); });

console.log('\nT-1 · most U=U ↔ art. 161 (pytanie prawne przy niewykrywalnej wiremii):');
[['czy mogę odpowiadać karnie jeśli mam niewykrywalną wiremię'],
 ['mam niewykrywalną a partner chce zgłosić sprawę']]
  .forEach(([q]) => {
    const r = route(q);
    ok(r && r.bridge === 'uu-prawo' && r.ids.some((id) => ['0088', '0090', '0092'].includes(id)) && r.ids.some((id) => ['0027', '0029'].includes(id)),
      '"' + q + '" → oba porządki obok siebie, ids=' + (r && r.ids));
  });

console.log('\nT-2/T-3 · bloki, do których routing wcześniej nie docierał:');
[['ile trwa odbudowa odporności', 'odbudowa'],
 ['czy cd4 mi się odbuduje', 'odbudowa'],
 ['jak się chronić przy niskim cd4', 'bezpieczenstwo'],
 ['mam niskie cd4 czy to niebezpieczne', 'bezpieczenstwo'],
 ['jak sobie poradzić z głową po diagnozie', 'psyche'],
 ['czuję się fatalnie psychicznie po diagnozie', 'psyche'],
 ['co dalej za dziesięć lat', 'dlugoterminowo'],
 ['jak długo pożyję', 'dlugoterminowo'],
 ['właśnie dostałem diagnozę co teraz', 'pierwsze-dni']]
  .forEach(([q, want]) => { const r = route(q); ok(r && r.block === want, '"' + q + '" → ' + (r && r.block) + ' (oczekiwano ' + want + ')'); });

console.log('\nREGRESJA z audytu #2 · „trend" nie może połykać pytań ogólnych i prawnych:');
[['czy cd4 mi się odbuduje'], ['czy mogę odpowiadać karnie jeśli mam niewykrywalną wiremię'],
 ['jak się chronić przy niskim cd4']]
  .forEach(([q]) => { const r = route(q); ok(r && r.block !== 'trend', '"' + q + '" NIE jest dzieleniem się wynikiem → ' + (r && r.block)); });
{ // „cd4" zawiera cyfrę 4 — to nie może uchodzić za podanie wyniku
  const r = route('czy cd4 wraca do normy');
  ok(r && r.block !== 'trend', 'cyfra w nazwie badania to nie wynik → ' + (r && r.block)); }

console.log('\nDzielenie się wynikiem nadal działa (audyt #2 bez uszczerbku):');
[['mój CD4 wzrósł do 450'], ['moje cd4 to 180'], ['wiremia spadła mi do 40']]
  .forEach(([q]) => { const r = route(q); ok(r && r.block === 'trend', '"' + q + '" → ' + (r && r.block)); });

console.log('\nR-5 · chęć odstawienia leków (osobna reakcja):');
ok(stopMeds('chcę przestać brać leki'), 'wykrywa: "chcę przestać brać leki"');
ok(!stopMeds('zapomniałem wziąć tabletkę'), 'NIE myli z: "zapomniałem wziąć tabletkę"');

console.log('\nT-4 · okienko serologiczne (hiv-0113…0117, dopisane 2026-08-07):');
/* „Czy mogę już być pewny" to pytanie, które przez rok trafiało do bloku o objawach ostrej
 * infekcji — a więc osoba szukająca ulgi dostawała listę objawów. Progi czasowe muszą być
 * osiągalne, bo to najczęstsze pytanie po ekspozycji w całej dziedzinie. */
[['kiedy mogę być pewny że nie mam hiv'], ['ile czekać z testem po ekspozycji'],
 ['okienko serologiczne'], ['po jakim czasie test wykryje'], ['czy po 6 tygodniach test jest pewny']]
  .forEach(([q]) => { const r = route(q); ok(r && r.block === 'testowanie', '"' + q + '" → ' + (r && r.block) + ' (oczekiwano testowanie)'); });
{ const ids = new Set();
  ['okienko serologiczne', 'ile czekać z testem po ekspozycji', 'czy po 6 tygodniach test jest pewny',
   'po jakim czasie test wykryje', 'kiedy mogę być pewny że nie mam hiv']
    .forEach((q) => (route(q)?.ids || []).forEach((i) => ids.add(i)));
  const nowe = ['0113', '0114', '0115', '0116'].filter((i) => ids.has(i));
  ok(nowe.length >= 3, 'progi czasowe są osiągalne — trafione ' + nowe.length + '/4 (' + nowe.join(',') + ')'); }

console.log('\nT-5 · akronimy krótsze niż 4 znaki nie mogą ginąć w tokenizacji:');
/* „potrzebuję pep" gubiło jedyne znaczące słowo (filtr długości w toks) i lądowało w bloku
 * o drogach zakażenia — czyli człowiek w oknie 72 godzin dostawał wykład zamiast instrukcji.
 * Ta sama dziura dotyczyła CD4, ARV i PKD. Patrz ACR w lib/text.js. */
ok(route('potrzebuję pep')?.block === 'pep', '"potrzebuję pep" → pep, nie transmisja');
ok(route('gdzie jest pkd')?.block === 'testowanie', '"gdzie jest pkd" → testowanie');
{ /* Ale samo dopisanie „cd4" do akronimów nie może przeciągnąć wszystkiego do „przebiegu" —
   * to słowo pada w czterech blokach naraz i jako gołe hasło niczego nie rozróżnia. */
  const c = [['czy cd4 mi się odbuduje', 'odbudowa'], ['mam niskie cd4 czy to niebezpieczne', 'bezpieczenstwo'],
             ['co znaczy cd4', 'przebieg']];
  c.forEach(([q, b]) => ok(route(q)?.block === b, '"' + q + '" → ' + route(q)?.block + ' (oczekiwano ' + b + ')')); }

console.log('\nT-6 · koinfekcje (hiv-0301…0344, dopisane 2026-08-07):');
/* Blok „wspolistniejace" miał pięć ogólników i zbierał WSZYSTKIE hasła o koinfekcjach.
 * Sześć nowych bloków z realną treścią byłoby nieosiągalnych, gdyby hasła zostały na starym
 * miejscu — dokładnie mechanizm, który audyt T-2 wykrył przy aliasie „odbudow". */
[['mam też hcv', 'koinf-hcv'], ['wzw c i hiv', 'koinf-hcv'], ['czy wyleczę wątrobę', 'koinf-hcv'],
 ['antygen hbs dodatni', 'koinf-hbv'], ['czy szczepić się na hpv', 'koinf-hpv'],
 ['rak szyjki macicy', 'koinf-hpv'], ['boję się gruźlicy', 'koinf-tb'],
 ['wyszła mi kiła', 'koinf-sti'], ['doksycyklina po seksie', 'koinf-sti'],
 ['co to cmv', 'koinf-inne'], ['mam mpox', 'koinf-inne']]
  .forEach(([q, b]) => { const r = route(q); ok(r && r.block === b, '"' + q + '" → ' + (r && r.block) + ' (oczekiwano ' + b + ')'); });
{ /* Każdy z sześciu nowych bloków musi być osiągalny — inaczej fakty leżą w bazie martwe. */
  const trafione = new Set();
  ['hcv', 'wzw b', 'hpv', 'gruźlica', 'kiła', 'cmv', 'mpox', 'marskość wątroby', 'brodawki', 'prątki']
    .forEach((q) => { const r = route(q); if (r) trafione.add(r.block); });
  const nowe = ['koinf-hcv', 'koinf-hbv', 'koinf-hpv', 'koinf-tb', 'koinf-sti', 'koinf-inne'].filter((b) => trafione.has(b));
  ok(nowe.length === 6, 'wszystkie sześć bloków koinfekcji osiągalne — ' + nowe.length + '/6 (' + nowe.join(',') + ')'); }
{ /* „iris" zostaje w bezpieczeństwie: tam leży fakt 0215, który mówi „nie odstawiaj leków".
   * To jest odpowiedź, której potrzebuje przestraszony człowiek — nie wykład o patogenach. */
  const r = route('iris po włączeniu leków');
  ok(r && r.block === 'bezpieczenstwo', '"iris po włączeniu leków" → ' + (r && r.block) + ' (oczekiwano bezpieczenstwo)');
  ok(r && r.ids.indexOf('0215') > -1, 'trafia w fakt 0215 („to nie znaczy, że lek zawodzi")'); }

console.log('\nR-4 · niepewne dopasowanie nie udaje pewnego (informacyjnie):');
['Czy mogę pić alkohol?', 'Czy mogę uprawiać sport?', 'czy to znaczy że mam AIDS'].forEach((q) => {
  const r = route(q);
  console.log('   "' + q + '" → ' + (r ? (r.block + (r.unsure ? ' [niepewne]' : '')) : 'brak pokrycia'));
});

console.log('\n=== ' + pass + ' PASS · ' + fail + ' FAIL ===');
process.exit(fail ? 1 : 0);
