/* Krąg — silnik Idy (routing pytań → fakty). Przeniesiony z ProjektKrag/index.html
 * i rozdzielony na czysty moduł (bez DOM), żeby dał się testować (lib/ida.test.mjs).
 *
 * Reguły, które silnik egzekwuje (numeracja z audytów recenzji):
 *  R-1  kryzys wyprzedza bazę        → obsługiwane w warstwie UI (crisis.js) PRZED findFacts
 *  R-2  świeża ekspozycja → PEP ponad punktacją (fałszywe ominięcie kosztuje zakażenie)
 *  R-3  blok „prawo" nie dokleja kar więzienia (0088–0090) jako wypełniacza
 *  R-4  niepewne dopasowanie oznacza się jako niepewne, nie udaje pewnego
 *  R-6  pytanie o WŁASNY wynik/decyzję lekową → „granice" (nie diagnozujemy)
 */
'use strict';
import { FACTS } from './knowledge.js';
import { norm, stem, toks, STOP, near } from './text.js';
import { srcTier } from './sources.js';

export { FACTS };
export const MED_BLOCKS = [...new Set(FACTS.map((f) => f.b))].filter((b) => b !== 'miejsca' && b !== 'granice');

const ALIAS = {
  pep: ['pep', 'po stosunku', 'po seksie', 'ryzykowny kontakt', 'ryzykown', 'bez prezerwatyw', 'bez zabezpiecz', '72 godzin', 'narazil', '28 dni', 'profilaktyka po', 'moge sie zarazic', 'wpadka', 'pekl', 'pekla prezerwatywa', 'po niezabezpieczonym', 'po ryzyku', 'moglem sie zarazic', 'zdarzyl sie', 'profilaktyka poekspozycyjna'],
  ekspozycja: ['zaklu', 'igla', 'igle', 'krew', 'ekspozycja zawodowa', 'w pracy sie', 'skalecz', 'zaklulem', 'zaklulam', 'kontakt z krwia'],
  prawo: ['pracodawc', 'prace', 'zwolni', 'dyskrymin', 'kodeks', '161', 'prawo', 'sad', 'karn', 'ujawni', 'dentyst', 'musze powiedziec', 'czy musze mowic', 'w pracy musze', 'ubezpieczenie na zycie', 'kredyt'],
  'leczenie-pl': ['obywatelstw', 'cudzoziem', 'ukrain', 'nfz', 'bezplatn', 'refundac', 'ubezpiecz', 'koszt leczenia', 'placic', 'za darmo lecz'],
  'prep-pl': ['prep w polsce', 'refundacja prep', 'ile kosztuje prep'],
  prep: ['prep', 'przed ekspozycja', 'partner ujemny', 'zabezpieczyc partnera', 'tabletka zapobiegawcza', 'profilaktyka przedekspozycyjna', 'zeby sie nie zarazic', 'jak sie chronic przed zakazeniem', 'jak sie zabezpieczyc'],
  uu: ['niewykrywaln', 'u u', 'niezakazny', 'przekaze', 'partnera', 'partnerke', 'partnerowi', 'czy zaraze partner', 'zarazic partnera', 'moge uprawiac seks', 'czy zaraze', 'bezpieczny seks', 'seks bez prezerwatywy z niewykrywaln', 'czy moge kogos zarazic'],
  // „Czy mogę już być pewny" to najczęstsze pytanie po ekspozycji, a trafiało do bloku o objawach
  // ostrej infekcji — czyli w najgorsze możliwe miejsce dla kogoś, kto się boi. Aliasy poniżej
  // ciągną je tam, gdzie leżą progi czasowe (hiv-0113…0117, dopisane 2026-08-07).
  testowanie: ['test', 'okienko', 'wynik dodatni', 'pkd', 'anonimow', 'badanie na hiv', 'gdzie sie zbadac', 'gdzie sie przebadac', 'zrobic test', 'kiedy sie badac', 'okno serologiczne', 'wynik testu',
    'byc pewny', 'byc pewnym', 'byc pewna', 'miec pewnosc', 'pewny wynik', 'wykluczyc zakazenie', 'wykluczyc hiv',
    'ile czekac', 'po jakim czasie', 'kiedy wiadomo', 'rozstrzygajac', 'miarodajn',
    'powtorzyc test', 'kiedy powtorzyc', 'czy test jest pewny', 'zamknac diagnostyke',
    // „po pep"/„po prep" celowo TU, nie w bloku PEP: kto już wziął leki, pyta o termin badania,
    // a nie o to, gdzie się zgłosić. Świeża ekspozycja i tak trafia do PEP silniejszym dopasowaniem.
    'po pep', 'po prep', 'skonczylem pep', 'skonczylam pep', 'bralem pep', 'bralam pep'],
  transmisja: ['przenosi', 'zarazic', 'droga', 'slina', 'pot', 'basen', 'naczynia', 'pocalunek', 'dotyk', 'jak mozna sie zarazic', 'czy zaraze sie', 'calowanie', 'seks oralny', 'wspolne sztucce', 'komar', 'ukaszenie'],
  ciaza: ['ciaz', 'dziecko', 'karmien', 'piersi', 'poro', 'zajsc w ciaze', 'moge miec dzieci', 'planuje dziecko', 'in vitro', 'starac sie o dziecko'],
  // „odbudow" ZABRANE stąd (audyt T-2): istnieje osobny blok „odbudowa" z 11 faktami,
  // a alias przechwytywał te pytania do „przebiegu" i tamte fakty były nieosiągalne.
  // Gołe „cd4" ZABRANE stąd (2026-08-07, przy okazji dopisania „cd4" do akronimów w text.js).
  // To słowo pada w czterech blokach naraz — przebieg, odbudowa, bezpieczeństwo, długoterminowo —
  // więc jako samodzielny alias niczego nie rozróżnia, tylko przeciąga wszystko do „przebiegu".
  // Dokładnie ten mechanizm audyt T-2 wykrył wcześniej przy aliasie „odbudow". Zostają
  // sformułowania, które faktycznie wskazują na ten blok, a nie na inny.
  przebieg: ['wiremi', 'nadir', 'aids', 'oportunistyczn', 'co znaczy cd4', 'poziom cd4', 'moja odpornosc', 'limfocyt', 'wynik cd4', 'ile powinno byc cd4', 'norma cd4', 'wiremia rosnie', 'wiremia spada'],
  leczenie: ['hiv 2', 'drugi typ wirusa', 'lek', 'terapi', 'arv', 'tabletk', 'dawk', 'skutki uboczne', 'opornosc', 'cabenuva', 'brac leki', 'pigulk', 'do konca zycia', 'iniekcj', 'zastrzyk', 'jak dzialaja leki', 'kiedy brac'],
  /* Blok „wspolistniejace" zbierał dotąd WSZYSTKIE hasła o koinfekcjach — a miał tylko pięć
     ogólników w rodzaju „warto się badać". Od 2026-08-07 istnieją osobne bloki z realną treścią,
     więc szczegółowe hasła przenoszą się tam, a tu zostaje to, co faktycznie ogólne.
     Bez tego przeniesienia powtórzyłaby się historia z audytu T-2: nowe fakty w bazie,
     nieosiągalne dla routingu. */
  wspolistniejace: ['koinfekcj', 'choroby wspolistniej', 'choroby wspolwystep', 'szczepien', 'szczepionk', 'co jeszcze mi grozi', 'inne choroby'],
  'koinf-hcv': ['hcv', 'wzw c', 'zapalenie watroby typu c', 'wirusowe zapalenie watroby c', 'watrob', 'zoltaczka', 'marskosc', 'daa', 'wylecze watrobe', 'wyleczyc watrobe', 'leczenie watroby', 'leki na watrobe', 'z watroba'],
  'koinf-hbv': ['hbv', 'wzw b', 'zapalenie watroby typu b', 'wirusowe zapalenie watroby b', 'antygen hbs', 'szczepienie na watrobe', 'immunoglobulin'],
  'koinf-hpv': ['hpv', 'brodawki', 'klykciny', 'rak szyjki', 'cytologi', 'dysplazj', 'zmiany w odbycie', 'szczepionka na hpv', 'dziewieciowalentn'],
  'koinf-tb': ['gruzlic', 'pratk', 'tbc', 'kaszl', 'rifampic', 'ryfampic', 'ryfapentyn', 'zapalenie opon'],
  'koinf-sti': ['kila', 'syfilis', 'rzezaczk', 'chlamydi', 'doksycyklin', 'doxy', 'choroby weneryczn', 'zakazenia przenoszone droga plciowa', 'wymaz z gardla', 'penicylin', 'neurokil'],
  'koinf-inne': ['cmv', 'cytomegal', 'mpox', 'malpia ospa', 'wzw a', 'zapalenie watroby typu a', 'kaposi', 'miesak', 'kryptokok', 'rekonstytucj', 'zespol rekonstytucji', 'siatkowk', 'zakazenie oportunistyczn'],
  stygma: ['stygmat', 'nosiciel', 'ocenia', 'odrzuc', 'hejt', 'napietnow'],   // „wstyd"/„samotn" → warstwa emocji, nie fakt o stygmie
  wyleczenie: ['wyleczyc', 'wyleczenie', 'lekarstwo', 'szczepionka', 'przeszczep', 'remisja', 'czy to minie', 'pozbyc sie wirusa', 'czy hiv jest wyleczaln', 'lek na hiv'],
  epidemiologia: ['ile osob', 'statystyk', 'zapadalnos', 'w polsce zyje', 'ile zakazen', 'pozne rozpoznani', 'poznо', 'ile osob w polsce'],
  // Blok o świecie (2026-08-07). Osobno od epidemiologii, bo tamta jest o Polsce.
  // Pytanie „czy jestem w tym sam" jest pytaniem o skalę, nie o statystykę krajową.
  swiat: ['na swiecie', 'globaln', 'ile osob na swiecie', 'jestem sam', 'w tym sam', 'sam z tym', 'ktos jeszcze', 'czy duzo ludzi', 'kaskada', 'unaids', 'ile ludzi zyje z hiv', 'w innych krajach', 'na calym swiecie'],
  granice: ['moj wynik', 'moje cd4', 'czy powinienem zmienic', 'co mi jest', 'zdiagnozuj'],
  /* T-3: pięć bloków (30 faktów) nie miało ŻADNEGO aliasu — routing po słowach kluczowych
   * nigdy do nich nie trafiał. Człowiek świeżo po diagnozie pytający „co teraz" dostawał
   * fakty o lekach, a pytający „jak sobie poradzić z głową" — o koinfekcjach. */
  odbudowa: ['odbudow', 'czy cd4 wroci', 'cd4 wraca', 'wraca do normy', 'czy cd4 urosnie', 'czy odpornosc wroci', 'ile trwa odbudowa', 'cd4 nie rosnie', 'cd4 stoi', 'podniesc cd4', 'poprawa odpornosci', 'rekonstytucj'],
  bezpieczenstwo: ['niskie cd4', 'niskim cd4', 'przy niskim', 'nisko cd4', 'ponizej 200', 'ponizej 100', 'ponizej 50', 'profilaktyka pcp', 'pneumocyst', 'toksoplazmoz', 'oportunistyczne zakazen', 'czy to niebezpieczne przy niskim', 'na co uwazac', 'czego unikac', 'higien', 'surowe mieso', 'zwierze w domu', 'kot w domu', 'iris', 'pogorszenie po starcie', 'po wlaczeniu lek', 'po starcie lek', 'po rozpoczeciu lecz', 'objawy sie nasilily', 'gorzej po lekach'],
  psyche: ['psychicznie', 'depresj', 'lek i stres', 'terapeut', 'psycholog', 'psychiatr', 'jak sobie poradzic z glowa', 'nie radze sobie', 'zalamanie', 'samoocen', 'wstyd po diagnozie', 'samotnosc po diagnozie', 'grupa wsparcia', 'uwaznosc', 'mindfulness'],
  dlugoterminowo: ['dlugoterminow', 'za dziesiec lat', 'za ile lat', 'jak dlugo pozyj', 'dlugosc zycia', 'ile sie zyje', 'starzenie', 'serce nerki kosci', 'choroby wieku', 'badania przesiewowe', 'szczepienia doroslych', 'co mnie czeka'],
  'pierwsze-dni': ['swiezo po diagnozie', 'dopiero dostalem wynik', 'wlasnie sie dowiedzialem', 'wlasnie dostalem diagnoze', 'co teraz po diagnozie', 'pierwsze dni', 'pierwsze tygodnie', 'od czego zaczac', 'pierwsze badania', 'jak zaczac leczenie', 'diagnoza to nie wyrok'],
};

// Granica wyrobu medycznego (R-6). Doprecyzowane 2026-08-06 z właścicielem po audycie #2 (K-3):
// samo PODZIELENIE SIĘ własnym wynikiem (bez pytania o ocenę/decyzję) NIE jest interpretacją
// medyczną — dostaje ciepłą odpowiedź trenerki, która nigdy nie ocenia liczby ('trend').
// Pytanie o OCENĘ wyniku ('judge') i o DECYZJĘ leczenia ('decide') zostają twardym stopem —
// Ida nigdy nie orzeka i pytanie nigdy nie trafia do AI (sprawdzane w idaAsk PRZED AI,
// tak samo jak kryzys i odstawienie leków).
const MINE = /\bmoj\b|\bmoja\b|\bmoje\b|\bmoich\b|\bmi\b|u mnie|\bmam\b|\bmy \b|\bмо/;
const RESULT = /\bcd4\b|wiremi|viral load|\bvl\b|\bkopii\b|\bwynik/;
const DECIDE = /zmieni|odstawi|przestac|change|stop|switch|adjust|jaki lek|dobrac lek|co robic|co teraz|jak zareagowac|what (should|do) i do/;
const MED = /\blek|lecz|medication|terapi|schemat|\barv\b|tablet|dawk/;
const JUDGE_ALWAYS = /\bco mi jest\b|\bzdiagnozuj/;
const JUDGE_RESULT = /czy to (zle|dobrze|dobry|zly|normalne|niepokoj|niebezpieczn|grozn)|czy powinienem sie martwic|czy to powod do|is (that|this) (bad|good|normal|ok|okay|concerning|dangerous)/;

/* POPRAWKA 2026-08-06 (audyt #5). Pierwsza wersja 'trend' łapała każde zdanie, w którym
 * obok słowa „cd4"/„wynik" stało „mi"/„mam" — a więc także PYTANIA OGÓLNE o mechanizm
 * („czy cd4 mi się odbuduje") i pytania PRAWNE („czy mogę odpowiadać karnie, jeśli mam
 * niewykrywalną"). Zamiast faktów o odbudowie odporności albo o art. 161 człowiek dostawał
 * ciepłe „fajnie, że wracasz z aktualizacją". To była regresja wprowadzona przy audycie #2.
 *
 * Teraz „dzielenie się wynikiem" wymaga śladu KONKRETNEGO wyniku: liczby albo czasownika
 * zmiany („wzrosło", „spadło", „wyszedł"). Samo „mam" nie wystarcza. Dodatkowo pytania
 * prawne są wyłączone wprost — tam człowiek pyta o odpowiedzialność, nie o swoje zdrowie. */
const CHANGE = /wzros|wzrós|spad|poprawi|pogorszy|wyszed|wyszla|przyszed|podnios|obnizy|podskoczy|urosl/;
/* UWAGA: samo /\d/ tu NIE działa — „cd4" zawiera cyfrę 4, więc każde pytanie o CD4
 * wyglądało jak podanie wyniku. Szukamy WARTOŚCI: liczby co najmniej dwucyfrowej
 * albo liczby stojącej wprost przy nazwie badania. */
const NUMVAL = /\b\d{2,}\b|\bcd4 \d+|wiremia \d+|\bwynik \d+/;
/* Określenie jakościowe („niskie CD4") to pytanie o KATEGORIĘ, nie o konkretny wynik —
 * należy do wiedzy ogólnej (blok „bezpieczenstwo"), nie do granicy wyrobu medycznego. */
const QUALITATIVE = /nisk|wysok|\bmale\b|\bduze\b|slabe/;
const LEGAL = /\bkarn|\b161\b|prokurat|\bsad\b|\bsadu\b|oskarz|zglosic sprawe|przestepstw|odpowiedzialnos|pozew|zawiadomieni/;

/** 'judge' (ocena wyniku) | 'decide' (decyzja leczenia) | 'trend' (dzielenie się) | null. */
export function boundVariant(q) {
  const n = norm(q);
  if (JUDGE_ALWAYS.test(n)) return 'judge';
  const hasResult = RESULT.test(n);
  const hasNumber = NUMVAL.test(n) && hasResult;
  if (DECIDE.test(n) && (hasResult || MED.test(n)) && !LEGAL.test(n)) return 'decide';
  // Bez konkretnej wartości, a z określeniem jakościowym → to pytanie ogólne, nie ocena wyniku.
  if (JUDGE_RESULT.test(n) && hasResult && !(QUALITATIVE.test(n) && !hasNumber)) return 'judge';
  // Pytanie prawne nigdy nie jest „dzieleniem się wynikiem" — należy do bloku „prawo".
  if (LEGAL.test(n)) return null;
  if (hasResult && MINE.test(n) && (hasNumber || CHANGE.test(n))) return 'trend';
  return null;
}

const ROLES = [
  { id: 'plhiv', boost: ['przebieg', 'leczenie', 'uu', 'wspolistniejace', 'leczenie-pl', 'stygma', 'wyleczenie', 'odbudowa', 'bezpieczenstwo', 'psyche', 'dlugoterminowo', 'pierwsze-dni'] },
  { id: 'partner', boost: ['pep', 'prep', 'prep-pl', 'testowanie', 'transmisja', 'uu', 'ciaza'] },
  { id: 'bliska', boost: ['transmisja', 'stygma', 'uu', 'prawo', 'testowanie'] },
];
let role = 'plhiv';
let lastBlock = null;
let lastQ = '';

export function setRole(r) { if (ROLES.some((x) => x.id === r)) role = r; }
export function getRole() { return role; }
export function isPos() { return role === 'plhiv'; }
export function resetThread() { lastBlock = null; lastQ = ''; }
export function getLastBlock() { return lastBlock; }
function roleObj() { return ROLES.filter((r) => r.id === role)[0]; }

const NEAR = {
  uu: ['przebieg', 'transmisja', 'ciaza'], przebieg: ['uu', 'leczenie', 'odbudowa'],
  leczenie: ['przebieg', 'wspolistniejace'], pep: ['ekspozycja', 'testowanie'],
  ekspozycja: ['pep'], prawo: ['stygma'], stygma: ['prawo'], ciaza: ['uu', 'leczenie'],
  prep: ['prep-pl', 'testowanie'], 'prep-pl': ['prep'], 'leczenie-pl': ['prawo', 'leczenie'],
  testowanie: ['transmisja', 'pep'], transmisja: ['uu', 'testowanie'], wyleczenie: ['leczenie'],
  wspolistniejace: ['leczenie', 'koinf-hcv', 'koinf-tb'], epidemiologia: ['swiat', 'testowanie'], granice: [],
  swiat: ['epidemiologia', 'leczenie'],
  // Koinfekcje (2026-08-07). Sąsiedztwa nie są symetryczne z rozmysłem: z wątroby wychodzi się
  // do drugiej wątroby i do leczenia, z chorób przenoszonych drogą płciową do PrEP i PEP,
  // a z zakażeń oportunistycznych do bezpieczeństwa przy niskim CD4 — tam leżą progi.
  'koinf-hcv': ['koinf-hbv', 'leczenie', 'wspolistniejace'],
  'koinf-hbv': ['koinf-hcv', 'leczenie', 'prep'],
  'koinf-hpv': ['koinf-sti', 'wspolistniejace'],
  'koinf-tb': ['koinf-inne', 'bezpieczenstwo', 'leczenie'],
  'koinf-sti': ['koinf-hpv', 'prep', 'pep'],
  'koinf-inne': ['bezpieczenstwo', 'koinf-tb', 'odbudowa'],
  // T-3: nowe bloki też muszą mieć sąsiadów, inaczej wątek rozmowy się o nie potyka.
  odbudowa: ['przebieg', 'leczenie', 'bezpieczenstwo'],
  bezpieczenstwo: ['przebieg', 'odbudowa', 'wspolistniejace'],
  psyche: ['stygma', 'pierwsze-dni'],
  dlugoterminowo: ['leczenie', 'przebieg'],
  'pierwsze-dni': ['psyche', 'leczenie', 'testowanie'],
};

// Świeżość + ekspozycja → PEP ponad punktacją (R-2).
function pepUrgent(n) {
  const fresh = /(wczoraj|dzisiaj|\bdzis\b|przed chwil|w nocy|dzis rano|godzin temu|godzine temu|godziny temu|dni temu|kilka dni temu|niedawno|dopiero co|przed momentem|pare godzin|\d+ ?h temu)/;
  const expo = /(seks|stosunek|prezerwatyw|bez zabezpiecz|\bigl|zaklu|naraz|ekspozycj|gwalt|zgwalc|wspoln. igl|ryzykown|bez gumk)/;
  return fresh.test(n) && expo.test(n);
}

function scoreBlocks(q) {
  const n = norm(q), tk = toks(q);
  if (!tk.length) return { best: null, val: 0, per: [] };
  const bonus = {};
  Object.keys(ALIAS).forEach((bk) => {
    ALIAS[bk].forEach((al) => {
      const an = norm(al);
      if (an.indexOf(' ') > -1) { if (n.indexOf(an) > -1) bonus[bk] = (bonus[bk] || 0) + 8; }
      else {
        const as = stem(an);
        // dopasowanie po prefiksie LUB z tolerancją literówki (dla dłuższych słów) — „wiremja", „niewykrywlny"
        if (tk.some((t) => t.indexOf(as) === 0 || (as.indexOf(t) === 0 && t.length > 4) || (as.length >= 5 && t.length >= 5 && near(as, t)))) bonus[bk] = (bonus[bk] || 0) + 8;
      }
    });
  });
  const per = FACTS.map((f) => {
    const ts = norm(f.t).split(' '), ws = norm(f.w).split(' ');
    let sc = 0;
    tk.forEach((t) => {
      if (ts.some((x) => stem(x).indexOf(t) === 0)) sc += 4;
      else if (ws.some((x) => stem(x).indexOf(t) === 0)) sc += 1.5;
    });
    return { f, s: sc };
  });
  const byBlock = {};
  per.forEach((r) => { if (!byBlock[r.f.b] || r.s > byBlock[r.f.b]) byBlock[r.f.b] = r.s; });
  const rb = roleObj().boost;
  let best = null, val = 0;
  Object.keys(byBlock).concat(Object.keys(bonus)).forEach((bk) => {
    const v = (byBlock[bk] || 0) + (bonus[bk] || 0) + (rb.indexOf(bk) > -1 ? 3 : 0);
    if (v > val) { val = v; best = bk; }
  });
  return { best, val, per };
}

/* T-1: most U=U ↔ art. 161 KK. Osoba z trwale niewykrywalną wiremią pytająca o
 * odpowiedzialność karną dostawała dotąd ALBO fakty o U=U, ALBO o art. 161 — nigdy
 * jedno przy drugim, choć sens odpowiedzi leży dokładnie w ich zestawieniu: przepis
 * mówi o NARAŻENIU, a przy niewykrywalnej wiremii nie dochodzi do transmisji.
 * Nie rozstrzygamy sprawy karnej — pokazujemy oba porządki obok siebie i kierujemy
 * do prawnika. Wyjątek wobec R-3: tu fakty 0088–0090 SĄ na temat, nie są wypełniaczem. */
const UU_SIGNAL = /niewykrywaln|\bu u\b|niezakazn|ponizej progu|nie przenosze|nie zarazam/;
function uuLawBridge(n, per) {
  if (!UU_SIGNAL.test(n) || !LEGAL.test(n)) return null;
  const top = (b, k) => per.filter((r) => r.f.b === b).sort((a, c) => c.s - a.s).slice(0, k).map((r) => r.f);
  const law = per.filter((r) => r.f.b === 'prawo' && ['0088', '0090', '0092'].indexOf(r.f.id) > -1).map((r) => r.f);
  const uu = per.filter((r) => r.f.b === 'uu' && ['0027', '0029'].indexOf(r.f.id) > -1).map((r) => r.f);
  const facts = [...(law.length ? law : top('prawo', 2)), ...(uu.length ? uu : top('uu', 2))];
  if (!facts.length) return null;
  return { block: 'prawo', facts, bridge: 'uu-prawo' };
}

function pack(block, per, extra) {
  const ranked = per.filter((r) => r.f.b === block).sort((a, b) => b.s - a.s);
  let top = ranked.filter((r) => r.s > 0).slice(0, 4);
  if (!top.length) {
    // Brak trafień: jeden ogólny fakt, NIGDY wypełniacz z kar więzienia (R-3).
    const safe = ranked.filter((r) => ['0088', '0089', '0090'].indexOf(r.f.id) < 0);
    top = (safe[0] ? [safe[0]] : ranked.slice(0, 1));
  }
  const o = { block, facts: top.map((r) => r.f) };
  if (extra) for (const k in extra) o[k] = extra[k];
  return o;
}

function threadSearch(q) {
  if (!lastBlock) return null;
  const n = norm(q), words = n.split(' ').filter((w) => w.length > 3 && !STOP[w]);
  const scope = [lastBlock].concat(NEAR[lastBlock] || []);
  const ranked = FACTS.filter((f) => scope.indexOf(f.b) > -1).map((f) => {
    const hay = norm(f.t + ' ' + f.w);
    let sc = (f.b === lastBlock ? 2 : 0);
    words.forEach((w) => { if (hay.indexOf(w) > -1) sc += 1; });
    if (/(^| )(0|zero)( |$)/.test(n) && /prog|bez wirusa|kopii/.test(hay)) sc += 6;
    if (/nie mam|jeszcze nie|dopiero|nie osiagn/.test(n) && /prog|trwale|celem|zwykle/.test(hay)) sc += 4;
    if (/ile czasu|jak szybko|kiedy|do kiedy/.test(n) && /godzin|dni|najszybciej|okno/.test(hay)) sc += 6;
    if (/na pewno|pewne|dowod|badani/.test(n) && /badani|dowod|potwierdzi/.test(hay)) sc += 5;
    return { f, s: sc };
  }).sort((x, y) => y.s - x.s);
  const top = ranked.filter((r) => r.s > 3).slice(0, 3);
  if (!top.length) return null;
  return { block: top[0].f.b, facts: top.map((r) => r.f), follow: true };
}

/** Kandydaci do groundingu LLM (#Ida Rozumie): najlepiej pasujące fakty w bazie.
 * Wybór robimy LOKALNIE — do modelu trafia tylko pytanie + te fakty (prywatność).
 * Dajemy hojnie (domyślnie 24) + gwarantujemy różnorodność bloków, by model miał z czego wybrać. */
export function idaCandidates(q, n = 24) {
  const sc = scoreBlocks(q);
  const ranked = sc.per.slice().sort((a, b) => b.s - a.s);
  const picked = [];
  const seen = new Set();
  for (const r of ranked) { if (r.s > 0) { picked.push(r.f); seen.add(r.f.id); } if (picked.length >= n) break; }
  // dołóż po jednym „reprezentancie" z bloków, których jeszcze nie ma (recall dla nietypowych pytań)
  if (picked.length < n) {
    const byBlock = {};
    for (const f of FACTS) if (!byBlock[f.b] && !seen.has(f.id)) byBlock[f.b] = f;
    for (const b of Object.keys(byBlock)) { if (picked.length >= n) break; picked.push(byBlock[b]); seen.add(byBlock[b].id); }
  }
  return picked.slice(0, n).map((f) => ({ id: f.id, text: f.w, src: f.s }));
}

/** Główne wejście: pytanie → { block, facts, ...flagi } albo null gdy brak pokrycia. */
export function findFacts(q) {
  const n = norm(q);
  const bv = boundVariant(q);
  if (bv === 'judge' || bv === 'decide') return { block: 'granice', facts: FACTS.filter((f) => f.b === 'granice'), bound: true, boundKind: bv };
  if (bv === 'trend') return { block: 'trend', facts: [], bound: false };
  if (pepUrgent(n)) { const sp = scoreBlocks(q); return pack('pep', sp.per, { urgentForced: true }); }
  const sc = scoreBlocks(q);
  const bridge = uuLawBridge(n, sc.per);   // T-1: U=U i art. 161 obok siebie, nie zamiast siebie
  if (bridge) { lastBlock = 'prawo'; lastQ = q; return bridge; }
  if (sc.best && sc.val >= 6) { const p = pack(sc.best, sc.per); if (p.block !== 'granice') lastBlock = p.block; lastQ = q; return p; }
  const th = threadSearch(q);
  if (th) { lastBlock = th.block; lastQ = q; return th; }
  if (sc.best && sc.val >= 4) { const p = pack(sc.best, sc.per); p.unsure = true; if (p.block !== 'granice') lastBlock = p.block; lastQ = q; return p; }  // niepewne (R-4)
  return null;
}

export const BLOCKNAME = {
  transmisja: 'jak się przenosi', prep: 'PrEP', prawo: 'prawo i praca', uu: 'niewykrywalność',
  pep: 'PEP po ryzyku', testowanie: 'testy', przebieg: 'wiremia i CD4', leczenie: 'leki i terapia',
  wyleczenie: 'badania nad wyleczeniem', wspolistniejace: 'koinfekcje', 'prep-pl': 'PrEP w Polsce',
  ekspozycja: 'zakłucia i ekspozycja', stygma: 'stygmatyzacja', ciaza: 'ciąża i dzieci',
  epidemiologia: 'dane o Polsce', 'leczenie-pl': 'leczenie w Polsce', granice: 'granice Kręgu',
  odbudowa: 'odbudowa odporności', bezpieczenstwo: 'bezpieczeństwo przy niskim CD4',
  psyche: 'głowa i emocje', 'pierwsze-dni': 'pierwsze dni', dlugoterminowo: 'długoterminowo',
  'koinf-hcv': 'WZW C', 'koinf-hbv': 'WZW B', 'koinf-hpv': 'HPV',
  'koinf-tb': 'gruźlica', 'koinf-sti': 'kiła i inne STI', 'koinf-inne': 'inne zakażenia',
  swiat: 'HIV na świecie',
};

// Etykieta zaufania: wszystkie fakty ver:null → najwyżej „do weryfikacji" (T3). Nic nie udaje „oficjalnego" (K-3).
// Odznaka = ŹRÓDŁO wiedzy (nie „podpis lekarza"). Źródła urzędowe/zweryfikowane
// (np. gov.pl, wytyczne) są wiarygodne z mocy źródła; społecznościowe oznaczamy niżej.
/* R-1a: poziom bierzemy ze ŹRÓDŁA, gdy je znamy — bo autorytet jest cechą źródła, nie
 * pojedynczego wpisu. Poziomy w bazie rozjechały się z katalogiem (ta sama organizacja
 * miała dwa różne poziomy). Dla źródeł niesprawdzonych zostaje wartość z bazy. */
export function confBadge(c, src, block) {
  const fromSrc = src ? srcTier(src, block) : null;
  if (fromSrc) return [fromSrc];
  const m = { OFFICIAL: ['official'], VERIFIED: ['verified'], COMMUNITY: ['community'] };
  return m[c] || m.COMMUNITY;
}
