/* Krąg — informacyjny checker interakcji leków. Dane: rejestr ARV (RPL) + baza reguł
 * na modelu tagów substancji (lib/interactions-data.js). ŚWIADOMIE INFORMACYJNY:
 * reguły są NIEZWERYFIKOWANE klinicznie (AI_DRAFT) — kanonicznie odsyłamy do bazy
 * Liverpool HIV Drug Interactions i do lekarza/farmaceuty. Rozpoznaje lek po nazwie
 * handlowej (marka → substancje → tagi), więc interakcje pokazują się AUTOMATYCZNIE
 * dla leku dodanego w Dzienniku, bez ręcznego wpisywania.
 */
'use strict';
import { IX_RULES, DRUG_TAGS, INSTI, LEAFLET } from './interactions-data.js';

function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Synonimy/klasy dla wpisywanego tekstu (gdy nie trafi w nazwę z DRUG_TAGS).
// Zawiera też nazwy międzynarodowe (INN) — żeby rozpoznać lek wpisany substancją, nie marką.
const KW = [
  // substancje/klasy zewnętrzne
  [['wapn', 'calcium', 'magnez', 'magnesium', 'zelazo', 'iron', 'cynk', 'zinc', 'antacyd', 'antacid', 'zgaga', 'zobojetniaj', 'nabial', 'mleko', 'jogurt', 'multiwitamin', 'multivitamin'], 'kation'],
  [['omeprazol', 'omeprazole', 'pantoprazol', 'esomeprazol', 'lansoprazol', 'inhibitor pompy', 'ppi'], 'ppi'],
  [['famotydyn', 'famotidine', 'ranitydyn', 'ranitidine', 'bloker h2'], 'h2'],
  [['dziurawiec', 'st john', 'hypericum'], 'sjw'],
  [['ryfampic', 'rifampic', 'ryfabut', 'rifabut', 'ryfamycyn'], 'rif'],
  [['grejpfrut', 'grapefruit'], 'grejpfrut'],
  [['symwastatyn', 'simvastatin', 'simwastatyn'], 'simwa'],
  [['karbamazepin', 'carbamazepin', 'fenytoin', 'phenytoin', 'lamotrygin'], 'antykonw'],
  [['sildenafil', 'wardenafil', 'vardenafil', 'tadalafil', 'viagra'], 'pde5'],
  [['metformin'], 'metformina'],
  [['warfaryn', 'warfarin', 'acenokumarol'], 'warfaryna'],
  [['metadon', 'methadone'], 'metadon'],
  [['alkohol', 'alcohol'], 'alkohol'],
  [['antykoncepcj', 'hormonaln', 'tabletka antykonc'], 'hormon'],
  [['kwetiapin', 'quetiapin'], 'kwetiapina'],
  // ARV po nazwie międzynarodowej (INN)
  [['dolutegraw', 'dolutegravir'], 'dtg'],
  [['bictegraw', 'bictegravir'], 'bic'],
  [['raltegraw', 'raltegravir'], 'ral'],
  [['kabotegraw', 'cabotegraw', 'cabotegravir'], 'cab'],
  [['elwitegraw', 'elvitegravir'], 'evg'],
  [['rilpiwir', 'rilpivir'], 'rpv'],
  [['darunaw', 'darunavir'], 'drv'],
  [['atazanaw', 'atazanavir'], 'atv'],
  [['efawirenz', 'efavirenz'], 'efv'],
  [['dorawir', 'doravir'], 'dor'],
  [['kobicystat', 'cobicistat', 'rytonaw', 'ritonavir'], 'cobi'],
  [['abakawir', 'abacavir'], 'abc'],
  [['lamiwudyn', 'lamivudin'], '3tc'],
  [['emtrycytabin', 'emtricitabin'], 'ftc'],
  [['tenofovir'], 'tdf'],
  [['lenakapaw', 'lenacapav'], 'len'],
  [['maraviroc', 'marawirok'], 'mvc'],
];
const ARVSET = new Set(['bic', 'dtg', 'ral', 'cab', 'evg', 'cobi', 'rpv', 'dor', 'efv', 'etr', 'nvp', 'ftc', '3tc', 'taf', 'tdf', 'abc', 'azt', 'drv', 'atv', 'lpv', 'sqv', 'tpv', 'fpv', 'mvc', 'fts', 'len', 'enf']);

/** Tekst (nazwa leku/suplementu/substancji) → zbiór tagów substancji. */
function tagsOf(text) {
  const n = norm(text); const out = new Set();
  if (!n) return out;
  for (const key in DRUG_TAGS) { if (key && (n === key || n.includes(key))) DRUG_TAGS[key].forEach((t) => out.add(t)); }
  for (const [words, tag] of KW) if (words.some((w) => n.includes(w))) out.add(tag);
  if ([...out].some((t) => INSTI.includes(t))) out.add('insti');
  if ([...out].some((t) => ARVSET.has(t))) out.add('arv');
  return out;
}

/** Zbiór tagów wynikający z leków użytkownika. */
export function medTags(medNames) {
  const out = new Set();
  for (const m of (medNames || [])) tagsOf(m).forEach((t) => out.add(t));
  return out;
}

const SEV = { stop: 'high', gap: 'high', care: 'medium' };
const ADV = {
  pl: { stop: 'Nie łącz bez decyzji lekarza. Pełne sprawdzenie: baza Liverpool.', gap: 'Zwykle wymaga odstępu w czasie — ustal z farmaceutą.', care: 'Wymaga uwagi/kontroli — omów z lekarzem.' },
  en: { stop: 'Do not combine without your doctor. Full check: Liverpool database.', gap: 'Usually needs a time gap — check with your pharmacist.', care: 'Needs attention/monitoring — discuss with your doctor.' },
};
const ORDER = { stop: 0, gap: 1, care: 2 };
function toItem(r, lang) {
  return { key: r.a + '-' + r.b, sev: SEV[r.sev] || 'medium', msg: lang === 'en' ? r.en : r.pl, adv: (ADV[lang === 'en' ? 'en' : 'pl'])[r.sev] || '' };
}

/** Proaktywne interakcje dla schematu — pokazują się AUTOMATYCZNIE dla dodanych leków. */
export function knownFor(medNames, lang = 'pl') {
  const T = medTags(medNames);
  if (!T.size) return [];
  const rules = IX_RULES.filter((r) => T.has(r.a) || T.has(r.b));
  rules.sort((a, b) => (ORDER[a.sev] ?? 9) - (ORDER[b.sev] ?? 9));
  const seen = new Set();
  return rules.map((r) => toItem(r, lang)).filter((i) => !seen.has(i.key) && seen.add(i.key));
}

/** Sprawdza wpisaną substancję/lek/żywność wobec leków użytkownika. */
export function checkSubstance(medNames, substanceText, lang = 'pl') {
  const T = medTags(medNames); const Q = tagsOf(substanceText);
  if (!Q.size) return [];
  const hits = IX_RULES.filter((r) => (T.has(r.a) && Q.has(r.b)) || (T.has(r.b) && Q.has(r.a)) || (Q.has(r.a) && Q.has(r.b)));
  hits.sort((a, b) => (ORDER[a.sev] ?? 9) - (ORDER[b.sev] ?? 9));
  const seen = new Set();
  return hits.map((r) => toItem(r, lang)).filter((i) => !seen.has(i.key) && seen.add(i.key));
}

/** Link do ulotki (ChPL/RPL) rozpoznanego leku — albo null. */
export function leafletFor(medName) {
  const n = norm(medName);
  for (const key in LEAFLET) if (n === key || n.includes(key)) return LEAFLET[key];
  return null;
}
