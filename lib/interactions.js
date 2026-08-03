/* Krąg — informacyjny checker interakcji leków ARV. ŚWIADOMIE KONSERWATYWNY.
 *
 * To NIE jest kompletna baza interakcji i NIE zastępuje konsultacji. Zawiera tylko
 * dobrze ustalone, wysokokonsekwencyjne KLASY interakcji ARV, o które najczęściej chodzi
 * w praktyce (kationy wielowartościowe, leki na zgagę/PPI, dziurawiec, metformina, statyny
 * z boosterem). Każdy wynik odsyła do bazy Liverpool HIV Drug Interactions i do lekarza/
 * farmaceuty. Zgodnie z zasadą Kręgu (treść medyczna tylko z podpisem) — flagi są oznaczone
 * jako „do potwierdzenia", nigdy jako ostateczna porada dawkowania.
 */
'use strict';

function norm(s) {
  return String(s || '').toLowerCase()
    .replace(/[ąàá]/g, 'a').replace(/[ćç]/g, 'c').replace(/[ęèé]/g, 'e').replace(/ł/g, 'l')
    .replace(/ń/g, 'n').replace(/[óòô]/g, 'o').replace(/[śş]/g, 's').replace(/[żź]/g, 'z')
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Klasy ARV rozpoznawane po INN/nazwie handlowej (norm()).
const ARV = {
  insti: ['dolutegravir', 'dtg', 'tivicay', 'dovato', 'triumeq', 'bictegravir', 'biktarvy', 'raltegravir', 'isentress', 'cabotegravir', 'vocabria', 'cabenuva'],
  rilpivirine: ['rilpivirine', 'rilpiwiryna', 'edurant', 'odefsey', 'juluca'],
  boosted: ['atazanavir', 'reyataz', 'darunavir', 'prezista', 'symtuza', 'ritonavir', 'norvir', 'cobicistat', 'genvoya', 'stribild', 'evotaz', 'rezolsta'],
};

// Substancje/klasy, o które pytamy albo które wykrywamy w tekście.
const CATIONS = ['wapn', 'wapno', 'calcium', 'ca', 'magnez', 'magnesium', 'mg', 'zelazo', 'iron', 'fe', 'cynk', 'zinc', 'glin', 'aluminium', 'multiwitamin', 'multivitamin', 'suplement mineral', 'maalox', 'rennie', 'antacid', 'zobojetniajac'];
const PPI = ['omeprazol', 'omeprazole', 'pantoprazol', 'esomeprazol', 'lansoprazol', 'ppi', 'ranitydyn', 'ranitidine', 'famotydyn', 'famotidine', 'h2', 'na zgage', 'refluks', 'antacid', 'zobojetniajac'];
const SJW = ['dziurawiec', 'st john', 'hypericum', 'ziolowy antydepresant'];
const METFORMIN = ['metformin', 'metformina', 'glucophage', 'siofor'];
const STATIN = ['simwastatyn', 'simvastatin', 'symwastatyn', 'lowastatyn', 'lovastatin', 'atorwastatyn', 'atorvastatin', 'statyn'];

function has(list, n) { return list.some((k) => n.indexOf(k) > -1); }

/** Które klasy ARV są w lekach użytkownika. medNames: string[] */
export function classifyMeds(medNames) {
  const n = norm((medNames || []).join(' '));
  const out = new Set();
  for (const k of Object.keys(ARV)) if (has(ARV[k], n)) out.add(k);
  return out;
}

const RULES = [
  { key: 'insti-cations', arv: 'insti', hit: CATIONS, sev: 'high',
    pl: 'Wapń, magnez, żelazo, cynk i leki zobojętniające (na zgagę) mogą wiązać inhibitor integrazy i osłabić jego wchłanianie.',
    en: 'Calcium, magnesium, iron, zinc and antacids can bind the integrase inhibitor and reduce its absorption.',
    adv_pl: 'Zwykle rozdziela się je w czasie (lek ARV z jedzeniem, kationy 2 h przed lub 6 h po) — ale ustal dokładnie z lekarzem/farmaceutą.',
    adv_en: 'They are usually separated in time — confirm the exact timing with your doctor/pharmacist.' },
  { key: 'rpv-acid', arv: 'rilpivirine', hit: PPI, sev: 'high',
    pl: 'Rylpiwiryna potrzebuje kwaśnego żołądka. Inhibitory pompy protonowej (np. omeprazol) są z nią przeciwwskazane; inne leki na zgagę wymagają rozdzielenia w czasie.',
    en: 'Rilpivirine needs an acidic stomach. Proton-pump inhibitors (e.g. omeprazole) are contraindicated with it; other heartburn drugs need timing separation.',
    adv_pl: 'Nie łącz z PPI bez decyzji lekarza; rylpiwirynę bierz z posiłkiem.',
    adv_en: 'Do not combine with a PPI without your doctor; take rilpivirine with a meal.' },
  { key: 'atv-acid', arv: 'boosted', hit: PPI, sev: 'medium',
    pl: 'Atazanawir także potrzebuje kwasu — leki na zgagę mogą obniżać jego stężenie.',
    en: 'Atazanavir also needs stomach acid — heartburn drugs can lower its level.',
    adv_pl: 'Rozdziel w czasie i omów z lekarzem.',
    adv_en: 'Separate in time and discuss with your doctor.' },
  { key: 'sjw-inducer', arv: null, hit: SJW, sev: 'high',
    pl: 'Dziurawiec (ziele) silnie przyspiesza rozkład wielu leków na HIV i może obniżyć ich skuteczność.',
    en: "St John's Wort strongly speeds up the breakdown of many HIV drugs and can reduce their effect.",
    adv_pl: 'Zwykle przeciwwskazany przy ARV — nie zaczynaj bez lekarza.',
    adv_en: 'Usually contraindicated with ARVs — do not start it without your doctor.' },
  { key: 'insti-metformin', arv: 'insti', hit: METFORMIN, sev: 'medium',
    pl: 'Dolutegrawir może podnosić stężenie metforminy.',
    en: 'Dolutegravir can raise metformin levels.',
    adv_pl: 'Lekarz może dostosować dawkę metforminy — nie zmieniaj sam.',
    adv_en: 'Your doctor may adjust the metformin dose — do not change it yourself.' },
  { key: 'boosted-statin', arv: 'boosted', hit: STATIN, sev: 'high',
    pl: 'Booster (rytonawir/kobicystat) z niektórymi statynami (np. symwastatyna) grozi poważnym uszkodzeniem mięśni.',
    en: 'A booster (ritonavir/cobicistat) with some statins (e.g. simvastatin) risks serious muscle damage.',
    adv_pl: 'Część statyn jest przeciwwskazana — dobór tylko przez lekarza.',
    adv_en: 'Some statins are contraindicated — choice only by a doctor.' },
];

/** Sprawdza wpisaną substancję/żywność wobec leków użytkownika. Zwraca listę trafień. */
export function checkSubstance(medNames, substanceText, lang = 'pl') {
  const n = norm(substanceText);
  if (!n) return [];
  const classes = classifyMeds(medNames);
  const out = [];
  for (const r of RULES) {
    if (r.arv && !classes.has(r.arv)) continue;
    if (!has(r.hit, n)) continue;
    out.push({ key: r.key, sev: r.sev, msg: lang === 'en' ? r.en : r.pl, adv: lang === 'en' ? r.adv_en : r.adv_pl });
  }
  return out;
}

/** Proaktywna lista klas interakcji, o których warto wiedzieć przy danym schemacie. */
export function knownFor(medNames, lang = 'pl') {
  const classes = classifyMeds(medNames);
  return RULES.filter((r) => !r.arv || classes.has(r.arv))
    .filter((r) => r.arv)   // tylko powiązane z konkretnym ARV (dziurawiec pokaże się w check)
    .map((r) => ({ key: r.key, sev: r.sev, msg: lang === 'en' ? r.en : r.pl, adv: lang === 'en' ? r.adv_en : r.adv_pl }));
}
