/* Krąg — warstwa wsparcia emocjonalnego (nie-kryzysowa).
 * Kolejność w Idzie: kryzys (crisis.js) → odstawienie leków → EMOCJE → wiedza.
 * Powód: „Jestem samotny" nie jest kryzysem, ale NIE jest też pytaniem o fakt —
 * wcześniej trafiało na losowy fakt (o słowie „nosiciel"). Tu przejmujemy takie
 * zdania i odpowiadamy po ludzku: łączymy z ludźmi (Rozmowy/katalog) i z Pomocą.
 * Zasada: nie wzmacniamy negatywnego myślenia, oferujemy realne wsparcie i kontakt.
 * Kryzys sprawdzany JEST wcześniej, więc tu nie połykamy sygnałów samobójczych.
 */
'use strict';
import { norm } from './text.js';

// Wzorce na tekście po norm() (PL + EN). Nastawione na 1. osobę, by nie łapać pytań „co to…".
const LONELY = [
  /samotn/, /\bjestem sam\b/, /\bjestem sama\b/, /czuje sie (bardzo )?sam/, /\bsam jak palec\b/,
  /nikogo nie mam/, /nie mam nikogo/, /nie mam z kim/, /nie mam z kim (po)?gadac/, /opuszczon/, /wyobcowan/, /wyalienowan/,
  /wszyscy sie odwrocili/, /odrzucili mnie/, /zostalem sam/, /zostalam sama/, /odsuneli sie/,
  /(feel|so|am|really)\s+(?:\w+\s+){0,2}lonely/, /\ball\s+alone\b/, /\bisolated\b/,
];
const LOW = [
  /smutn/, /smutno/, /przygnebi/, /zalamany/, /zalamana/, /zdolowan/, /zdruzgotan/,
  /beznadziej/, /nie ma nadziei/, /straci\w*\s+nadzieje/, /pusto (mi )?w srodku/, /\bplacze\b/,
  /mam depresj/, /w depresji/, /nienawidze siebie/, /nienawidze sie/, /czuje sie do niczego/,
  /nie radze sobie/, /nie daje sobie rady/, /wszystko mnie przerasta/, /przytloczon/, /zmeczony tym wszystkim/, /zmeczona tym wszystkim/,
  /(feel|so|really|am)\s+(?:\w+\s+){0,2}(sad|hopeless|depressed|worthless|overwhelmed)/, /hate myself/,
];
const FEAR = [
  /boje sie/, /\bsie boje\b/, /\bboje\b/, /przerazon/, /panikuj/, /mam lek\b/, /\bstrach mnie\b/,
  /wstyd mi/, /\bwstydze sie\b/, /czuje sie brudn/, /czuje sie gorsz/, /czuje sie obrzydliw/,
  /boje sie powiedziec/, /boje sie reakcji/, /wstyd przed/, /nie moge nikomu powiedziec/,
  /(scared|afraid|terrified|ashamed|anxious)/,
];
// Cyrylica — na surowym, małymi (norm() usuwa znaki spoza a-z0-9).
const RAW = {
  lonely: ['самотн', 'самотній', 'одинок', 'нема з ким', 'нікого не маю', 'никого нет'],
  low: ['сумно', 'грустно', 'безнадій', 'безнадёж', 'депрес', 'ненавиджу себе', 'ненавижу себя', 'нема надії'],
  fear: ['боюся', 'боюсь', 'страшно', 'сором', 'стыдно', 'тривог', 'паніку', 'панику'],
};

/** Zwraca kategorię wsparcia ('lonely'|'low'|'fear') albo null. */
export function emotional(s) {
  const low = String(s || '').toLowerCase();
  for (const cat of ['low', 'fear', 'lonely']) {          // 'low' ma priorytet (bliżej wsparcia)
    if (RAW[cat].some((x) => low.indexOf(x) > -1)) return cat;
  }
  const n = norm(s);
  if (LOW.some((rx) => rx.test(n))) return 'low';
  if (FEAR.some((rx) => rx.test(n))) return 'fear';
  if (LONELY.some((rx) => rx.test(n))) return 'lonely';
  return null;
}
