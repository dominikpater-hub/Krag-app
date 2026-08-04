/* Krąg — wspólne narzędzia tekstowe dla silnika wiedzy i warstwy kryzysowej.
 * norm() sprowadza tekst do porównywalnej postaci (małe litery, bez diakrytyków),
 * żeby dopasowania działały tak samo dla „nie chcę żyć" i „nie chce zyc".
 */
'use strict';

export function norm(x) {
  return String(x || '').toLowerCase()
    .replace(/[ąàá]/g, 'a').replace(/[ćç]/g, 'c').replace(/[ęèé]/g, 'e').replace(/ł/g, 'l')
    .replace(/ń/g, 'n').replace(/[óòô]/g, 'o').replace(/[śş]/g, 's').replace(/[żź]/g, 'z')
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

export const STOP = {
  jest: 1, jako: 1, moze: 1, mozna: 1, zeby: 1, tego: 1, temu: 1, jaka: 1, jaki: 1,
  jakie: 1, czym: 1, ktore: 1, ktora: 1, ktory: 1, przez: 1, bardzo: 1, takze: 1, wiec: 1,
  tylko: 1, jesli: 1, kiedy: 1, gdzie: 1, zawsze: 1, nigdy: 1, siebie: 1, sobie: 1, mnie: 1,
  ciebie: 1, osoba: 1, osoby: 1, osob: 1, byla: 1, byly: 1, beda: 1, mial: 1, miala: 1,
  // pospolite czasowniki/zaimki — bez tego „jestem" gubi się na „jest" w treści faktu
  jestem: 1, jestes: 1, jestesmy: 1, jestescie: 1, mam: 1, masz: 1, mamy: 1, macie: 1,
  bylem: 1, bylam: 1, czuje: 1, czuja: 1, moja: 1, moje: 1, moim: 1, swoje: 1,
};

// Krótkie akronimy (≤3 znaki), które MUSZĄ przejść filtr długości — inaczej „HPV/HCV/CMV" nie trafiają.
export const ACR = { hpv: 1, hcv: 1, hbv: 1, wzw: 1, cmv: 1, sti: 1, std: 1, tbc: 1 };

export function stem(w) {
  return w.replace(/(ami|ach|owi|iem|em|ie|ow|om|y|i|a|e|u|ą|ę)$/, '');
}

export function toks(x) {
  return norm(x).split(' ').filter((w) => (w.length > 3 || ACR[w]) && !STOP[w]).map(stem);
}

/** Tolerancja literówek: true, gdy odległość edycyjna a↔b ≤ 1 (wstawienie/usunięcie/zamiana). */
export function near(a, b) {
  a = String(a); b = String(b);
  if (a === b) return true;
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < la && j < lb) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (la > lb) i++; else if (lb > la) j++; else { i++; j++; }
  }
  if (i < la || j < lb) edits++;
  return edits <= 1;
}
