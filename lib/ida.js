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

export { FACTS };
export const MED_BLOCKS = [...new Set(FACTS.map((f) => f.b))].filter((b) => b !== 'miejsca' && b !== 'granice');

const ALIAS = {
  pep: ['pep', 'po stosunku', 'po seksie', 'ryzykowny kontakt', 'ryzykown', 'bez prezerwatyw', 'bez zabezpiecz', '72 godzin', 'narazil', '28 dni', 'profilaktyka po', 'moge sie zarazic', 'wpadka', 'pekl', 'pekla prezerwatywa', 'po niezabezpieczonym', 'po ryzyku', 'moglem sie zarazic', 'zdarzyl sie', 'profilaktyka poekspozycyjna'],
  ekspozycja: ['zaklu', 'igla', 'igle', 'krew', 'ekspozycja zawodowa', 'w pracy sie', 'skalecz', 'zaklulem', 'zaklulam', 'kontakt z krwia'],
  prawo: ['pracodawc', 'prace', 'zwolni', 'dyskrymin', 'kodeks', '161', 'prawo', 'sad', 'karn', 'ujawni', 'dentyst', 'musze powiedziec', 'czy musze mowic', 'w pracy musze', 'ubezpieczenie na zycie', 'kredyt'],
  'leczenie-pl': ['obywatelstw', 'cudzoziem', 'ukrain', 'nfz', 'bezplatn', 'refundac', 'ubezpiecz', 'koszt leczenia', 'placic', 'za darmo lecz'],
  'prep-pl': ['prep w polsce', 'refundacja prep', 'ile kosztuje prep'],
  prep: ['prep', 'przed ekspozycja', 'partner ujemny', 'zabezpieczyc partnera', 'tabletka zapobiegawcza', 'profilaktyka przedekspozycyjna', 'zeby sie nie zarazic', 'jak sie chronic'],
  uu: ['niewykrywaln', 'u u', 'niezakazny', 'przekaze', 'partnera', 'partnerke', 'partnerowi', 'czy zaraze partner', 'zarazic partnera', 'moge uprawiac seks', 'czy zaraze', 'bezpieczny seks', 'seks bez prezerwatywy z niewykrywaln', 'czy moge kogos zarazic'],
  testowanie: ['test', 'okienko', 'wynik dodatni', 'pkd', 'anonimow', 'badanie na hiv', 'gdzie sie zbadac', 'gdzie sie przebadac', 'zrobic test', 'kiedy sie badac', 'okno serologiczne', 'wynik testu'],
  transmisja: ['przenosi', 'zarazic', 'droga', 'slina', 'pot', 'basen', 'naczynia', 'pocalunek', 'dotyk', 'jak mozna sie zarazic', 'czy zaraze sie', 'calowanie', 'seks oralny', 'wspolne sztucce', 'komar', 'ukaszenie'],
  ciaza: ['ciaz', 'dziecko', 'karmien', 'piersi', 'poro', 'zajsc w ciaze', 'moge miec dzieci', 'planuje dziecko', 'in vitro', 'starac sie o dziecko'],
  przebieg: ['cd4', 'wiremi', 'nadir', 'odbudow', 'aids', 'oportunistyczn', 'co znaczy cd4', 'poziom cd4', 'moja odpornosc', 'limfocyt', 'wynik cd4', 'wiremia rosnie', 'wiremia spada'],
  leczenie: ['lek', 'terapi', 'arv', 'tabletk', 'dawk', 'skutki uboczne', 'opornosc', 'cabenuva', 'brac leki', 'pigulk', 'do konca zycia', 'iniekcj', 'zastrzyk', 'jak dzialaja leki', 'kiedy brac'],
  wspolistniejace: ['hcv', 'hbv', 'hpv', 'wzw', 'cmv', 'gruzlic', 'kila', 'syfilis', 'koinfekcj', 'choroby wspolistniej', 'szczepien', 'szczepionk', 'watrob', 'zoltaczka'],
  stygma: ['stygmat', 'nosiciel', 'ocenia', 'odrzuc', 'hejt', 'napietnow'],   // „wstyd"/„samotn" → warstwa emocji, nie fakt o stygmie
  wyleczenie: ['wyleczyc', 'wyleczenie', 'lekarstwo', 'szczepionka', 'przeszczep', 'remisja', 'czy to minie', 'pozbyc sie wirusa', 'czy hiv jest wyleczaln', 'lek na hiv'],
  epidemiologia: ['ile osob', 'statystyk', 'zapadalnos', 'w polsce zyje', 'ile zakazen'],
  granice: ['moj wynik', 'moje cd4', 'czy powinienem zmienic', 'co mi jest', 'zdiagnozuj'],
};

const BOUND = [/\bmam cd4\b/, /\bmoje cd4\b/, /\bmoj wynik\b/, /\bmoje wynik/, /\bco mi jest\b/,
  /\bczy to zle\b/, /\bczy to dobrze\b/, /\bcd4 \d+/, /\bwiremia \d+/, /\bczy powinienem zmieni/,
  /\bczy mam zmieni/, /\bjaki lek dla mnie/, /\bzdiagnozuj/];

const ROLES = [
  { id: 'plhiv', boost: ['przebieg', 'leczenie', 'uu', 'wspolistniejace', 'leczenie-pl', 'stygma', 'wyleczenie'] },
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
  uu: ['przebieg', 'transmisja', 'ciaza'], przebieg: ['uu', 'leczenie'],
  leczenie: ['przebieg', 'wspolistniejace'], pep: ['ekspozycja', 'testowanie'],
  ekspozycja: ['pep'], prawo: ['stygma'], stygma: ['prawo'], ciaza: ['uu', 'leczenie'],
  prep: ['prep-pl', 'testowanie'], 'prep-pl': ['prep'], 'leczenie-pl': ['prawo', 'leczenie'],
  testowanie: ['transmisja', 'pep'], transmisja: ['uu', 'testowanie'], wyleczenie: ['leczenie'],
  wspolistniejace: ['leczenie'], epidemiologia: [], granice: [],
};

// Świeżość + ekspozycja → PEP ponad punktacją (R-2).
function pepUrgent(n) {
  const fresh = /(wczoraj|dzisiaj|\bdzis\b|przed chwil|w nocy|dzis rano|godzin temu|godzine temu|godziny temu|dni temu|kilka dni temu|niedawno|dopiero co|przed momentem|pare godzin|\d+ ?h temu)/;
  const expo = /(seks|stosunek|prezerwatyw|bez zabezpiecz|\bigl|zaklu|naraz|ekspozycj|gwalt|zgwalc|wspoln. igl|ryzykown|bez gumk)/;
  return fresh.test(n) && expo.test(n);
}

// Granica wyrobu medycznego jako reguła semantyczna, nie lista fraz (R-6).
function boundSemantic(n) {
  const mine = /\bmoj\b|\bmoja\b|\bmoje\b|\bmoich\b|\bmi\b|u mnie|\bmam\b|\bmy \b|\bмо/;
  const result = /\bcd4\b|wiremi|viral load|\bvl\b|\bkopii\b|\bwynik/;
  const decide = /zmieni|odstawi|przestac|change|stop|switch|adjust|jaki lek|dobrac lek/;
  const med = /\blek|lecz|medication|terapi|schemat|\barv\b|tablet|dawk/;
  if (result.test(n) && (mine.test(n) || /\bcd4 \d+|wiremia \d+/.test(n))) return true;
  if (decide.test(n) && (result.test(n) || med.test(n))) return true;
  return false;
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
  for (let bi = 0; bi < BOUND.length; bi++) {
    if (BOUND[bi].test(n)) return { block: 'granice', facts: FACTS.filter((f) => f.b === 'granice'), bound: true };
  }
  if (boundSemantic(n)) return { block: 'granice', facts: FACTS.filter((f) => f.b === 'granice'), bound: true };
  if (pepUrgent(n)) { const sp = scoreBlocks(q); return pack('pep', sp.per, { urgentForced: true }); }
  const sc = scoreBlocks(q);
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
};

// Etykieta zaufania: wszystkie fakty ver:null → najwyżej „do weryfikacji" (T3). Nic nie udaje „oficjalnego" (K-3).
// Odznaka = ŹRÓDŁO wiedzy (nie „podpis lekarza"). Źródła urzędowe/zweryfikowane
// (np. gov.pl, wytyczne) są wiarygodne z mocy źródła; społecznościowe oznaczamy niżej.
export function confBadge(c) {
  const m = { OFFICIAL: ['official'], VERIFIED: ['verified'], COMMUNITY: ['community'] };
  return m[c] || m.COMMUNITY;
}
