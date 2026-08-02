/* Krąg — warstwa kryzysowa. To jest bramka wydania, nie funkcja z listy.
 *
 * SEC-01: poprzednia wersja (ProjektKrag) dopasowywała po stałym podciągu (indexOf),
 * więc jedno wtrącone słowo rozbrajało całą warstwę: „nie chcę ŻYĆ" łapało, ale
 * „nie chcę JUŻ żyć" przechodziło. Tu dopasowujemy WZORCAMI z luzem na wtrącenia
 * (\w+){0,N}, więc wtrącone słowo nie omija wykrycia.
 *
 * Zasada kosztu (z audytu): fałszywe trafienie kosztuje jeden pokazany numer telefonu,
 * fałszywe ominięcie kosztuje życie. Dlatego celowo raczej nad-wykrywamy niż pod-wykrywamy.
 * Regresję pilnuje crisis.test.mjs — leksykon bez testu zgnije w miesiąc.
 */
'use strict';
import { norm } from './text.js';

// Numer podawany w reakcji kryzysowej (PL, 24/7). Zmiana tu = zmiana w całej apce.
export const CRISIS_LINE = { no: '800 70 2222', label: 'Kryzys psychiczny — 24/7', langs: ['pl'] };
export const CRISIS_EU = '112';

// Dosłowne rdzenie (dopasowanie po podciągu na tekście znormalizowanym) — zgodność wstecz z demo.
const TRIG_LIT = [
  'nie chce zyc', 'nie chce mi sie zyc', 'nie chce dalej zyc', 'nie widze sensu', 'nie widze wyjscia',
  'nie ma sensu zyc', 'po co zyc', 'po co ja zyje', 'skonczyc z tym', 'skonczyc ze soba', 'skonczyc to wszystko',
  'nie dam rady dluzej', 'nie dam juz rady', 'mam dosc zycia', 'chce zniknac', 'chce sie zabic',
  'zabic sie', 'zabije sie', 'odebrac sobie zycie', 'targnac sie', 'zrobie sobie krzywde', 'zrobic sobie krzywde',
  'nie chce sie obudzic', 'lepiej bez mnie', 'lepiej byloby beze mnie', 'nie warto zyc', 'mysli samobojcze', 'samobojstwo',
  // EN
  'no point', 'end it all', 'kill myself', 'want to die', 'end my life', 'better off dead', 'hurt myself',
  'no reason to live', 'cant go on', 'can t go on',
  // CS/SK
  'nechci zit', 'nemam silu', 'uz nemuzu dal', 'chcem to skoncit', 'nechcem zit', 'nemam dovod zit',
  // DE
  'will nicht mehr leben', 'keinen sinn mehr', 'mich umbringen', 'nicht mehr weiterleben', 'will sterben',
];

// Cyrylica — na surowym tekście (norm() usuwa znaki spoza a-z0-9).
const TRIG_RAW = [
  'не бачу сенсу', 'не хочу жити', 'не хочу жить', 'не вижу смысла', 'нема сенсу жити', 'нет смысла жить',
  'покінчити', 'покончить с собой', 'вбити себе', 'убить себя', 'не хочу прокидатися', 'не хочу просыпаться',
];

// Wzorce z luzem na wtrącenia — sedno poprawki SEC-01. Działają na tekście po norm().
const TRIG_RX = [
  // nie chcę (mi się / już / dłużej / więcej) żyć
  /nie\s+chc\w*(?:\s+\w+){0,4}\s+zy\w*/,
  // wolałbym / chciałbym nie żyć, umrzeć, zniknąć, nie istnieć
  /(wolal\w+|wolel\w+|chcial\w+|chce|chcialbym)\s+(?:\w+\s+){0,3}(nie\s+zy\w+|umrzec|umierac|zniknac|nie\s+istniec|przestac\s+istniec|nie\s+zyc)/,
  // po co żyć / po co mi to życie
  /po\s+co\s+(?:\w+\s+){0,3}(zy\w+|zycie|zyje)/,
  // stracił / nie ma / brak sensu (życia)
  /(nie\s+ma|straci\w+|stracil\w*|brak|nie\s+widze)\s+(?:\w+\s+){0,3}sens\w*/,
  /nie\s+widze\s+(?:\w+\s+){0,2}(wyjscia|sensu|przyszlosci)/,
  // skończyć ze sobą / z tym / to wszystko — obie kolejności
  /skonczyc\s+(?:\w+\s+){0,3}(ze\s+soba|z\s+soba|z\s+tym|to\s+wszystko|z\s+zyciem)/,
  /(ze\s+soba|z\s+soba)\s+(?:\w+\s+){0,2}skonczyc/,
  // zabić się / odebrać sobie życie / targnąć się
  /(zabic|zabije|zabij\w*)\s+(?:\w+\s+){0,2}(sie|siebie)/,
  /odebrac\s+(?:\w+\s+){0,2}(sobie\s+)?zycie/,
  /targna\w+\s+(sie|na\s+swoje)/,
  // zrobić / skrzywdzić sobie
  /(zrobic|zrobie|robie)\s+(?:\w+\s+){0,2}(sobie\s+)?krzywd\w+/,
  /skrzywdzic\s+sie/,
  // myśli samobójcze / samobójstwo
  /samobojcz\w*/, /samobojstw\w*/,
  // nie chcę się obudzić
  /nie\s+(chce\s+)?(sie\s+)?obudzic/,
  // lepiej beze mnie / gdyby mnie nie było / mnie nie było
  /lepiej\s+(?:\w+\s+){0,3}(bez\s+mnie|beze\s+mnie)/,
  /(gdyby\s+)?mnie\s+(?:juz\s+)?nie\s+bylo/,
  // nikomu nie będzie mnie brakowało / nikt nie będzie tęsknił
  /(nikomu|nikt)\s+(?:\w+\s+){0,4}(brakow\w+|tesknil\w+)/,
  // nie dam rady (dłużej/dalej) / nie dam już rady
  /nie\s+dam\s+(?:\w+\s+){0,3}(rady\s+)?(dluzej|dalej)/,
  /nie\s+(dam|daje)\s+juz\s+rady/,
  // nie mam (już) siły — nad-wykrycie akceptowalne wg zasady kosztu
  /nie\s+mam\s+(juz\s+)?sil\w*/,
  // mam dość (życia/wszystkiego)
  /\bmam\s+(juz\s+)?dosc\b/,
  // planuję / chcę / zamierzam odejść  (wyłączenie kontekstu pracy/szkoły w risky())
  /(planuje|chce|chcial\w+|zamierzam)\s+(?:\w+\s+){0,2}odejsc/,
  // chcę zniknąć / przestać istnieć
  /chce\s+(?:\w+\s+){0,2}(zniknac|przestac\s+istniec)/,
  // EN — z luzem
  /want\s+(?:\w+\s+){0,3}to\s+die/,
  /(dont|do\s+not|no\s+longer)\s+want\s+(?:\w+\s+){0,3}to\s+(live|be\s+here|wake)/,
  /end\s+(?:my\s+|it\s+|this\s+)?(life|all|everything)/,
  /kill\s+(myself|me)/,
  /better\s+off\s+(dead|without\s+me)/,
  /(cant|can\s+t|cannot)\s+(?:\w+\s+){0,2}go\s+on/,
  /no\s+(point|reason)\s+(?:\w+\s+){0,3}(live|living|go\s+on)/,
  /(hurt|harm)\s+myself/,
];

// Kontekst ewidentnie nie-kryzysowy dla „odejść" (odejść z pracy/szkoły ≠ kryzys).
const WORK_CTX = /odejsc\s+(?:\w+\s+){0,2}(z\s+)?(prac\w*|firm\w*|robot\w*|szkol\w*|uczelni|zespol\w*|klas\w*|zwiazk\w*|imprez\w*)/;

/** Czy w tekście jest sygnał kryzysu psychicznego / myśli samobójczych. */
export function risky(s) {
  const low = String(s || '').toLowerCase();
  const n = norm(s);
  if (TRIG_RAW.some((x) => low.indexOf(x) > -1)) return true;
  if (TRIG_LIT.some((x) => n.indexOf(x) > -1)) return true;
  for (const rx of TRIG_RX) {
    const m = rx.exec(n);
    if (!m) continue;
    if (/odejsc/.test(m[0]) && WORK_CTX.test(n)) continue;   // „odejść z pracy" — nie kryzys
    return true;
  }
  return false;
}

/* Chęć odstawienia leczenia to zdarzenie kliniczne, nie pytanie o klasy leków (R-5).
 * Osobna reakcja: kieruje do lekarza prowadzącego, nie do bazy wiedzy. */
export function stopMeds(q) {
  const n = norm(q);
  return /(chce przestac brac|przestaje brac lek|odstawiam lek|rzucam lek|nie chce brac lek|nie bede bral lek|chce odstawic lek|chce przerwac lecz)/.test(n)
    || /(przestac|odstawic|rzucic|przerwac).{0,14}(lek|lecz|tabletk|terapi|arv)/.test(n);
}
