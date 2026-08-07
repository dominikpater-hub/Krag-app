/* Krąg — spójność LICZB między polskim oryginałem a tłumaczeniami.
 *
 * Powód powstania (2026-08-07): poprawiliśmy fakt 0107 (liczba zakażeń 32 900 → 35 175)
 * w polskim ziarnie, a w ośmiu językach została STARA liczba. Użytkownik niemieckojęzyczny
 * widziałby zaniżoną statystykę, i nic by tego nie zgłosiło — tłumaczenia są osobną
 * warstwą wyświetlania, więc poprawka treści ich nie dotyka.
 *
 * Liczby są tą częścią faktu, która nie powinna się zmieniać przy tłumaczeniu. Jeśli się
 * różnią, to albo tłumaczenie jest nieaktualne, albo ktoś przeliczył jednostki — jedno
 * i drugie chcemy zobaczyć, zanim zobaczy to człowiek szukający pomocy.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FACT_TX } from './facts-i18n.js';
import { FACTS } from './ida.js';

/* Liczby z tekstu, znormalizowane tak, żeby porównywać WARTOŚCI, a nie zapis:
 *  · „35 175", „35,175", „35.175" → 35175 — separatory tysięcy różnią się między językami;
 *  · „126 tysiącach" = „126,000" = „126 Tausend" → 126000 — skala wyrażona słowem.
 * Bez drugiej reguły test zgłaszał fałszywy alarm na fakcie 0029: polski pisze
 * „126 tysiącach", angielski „126,000" — a to ta sama liczba aktów. */
const TYSIAC = /^(tys|tysi[a-ząćę]*|thousand|tausend|tis[íi]c[a-z]*|тисяч[а-я]*|тысяч[а-я]*|t[uū]kstan[cč][a-ząėių]*)/i;
function liczby(s) {
  const txt = String(s || '').replace(/(\d)[ \s.,](?=\d{3}\b)/g, '$1');
  const out = [];
  const re = /(\d+)\s*-?\s*([\p{L}.]*)/gu;   // slowacki zapis 126-tisic ma lacznik
  let m;
  while ((m = re.exec(txt))) out.push(Number(m[1]) * (TYSIAC.test(m[2] || '') ? 1000 : 1));
  return out.sort((a, b) => a - b);
}

test('tłumaczenia niosą te same liczby co polski oryginał', () => {
  const rozjazd = [];
  for (const f of FACTS) {
    const pl = liczby(f.w);
    if (!pl.length) continue;
    for (const lang of Object.keys(FACT_TX)) {
      const t = FACT_TX[lang][f.id];
      if (!t) continue;                       // brak tłumaczenia → pokazujemy polski, to w porządku
      const obce = liczby(t);
      if (JSON.stringify(pl) !== JSON.stringify(obce)) {
        rozjazd.push(`${f.id}/${lang}: pl=[${pl}] vs ${lang}=[${obce}]`);
      }
    }
  }
  assert.deepEqual(rozjazd, [], 'rozjazd liczb w tłumaczeniach:\n  ' + rozjazd.slice(0, 12).join('\n  '));
});

/* Kompletność tłumaczeń. Aplikacja przy braku tłumaczenia pokazuje polski oryginał — więc
 * dziura nie wywraca niczego, tylko po cichu serwuje ukraińskojęzycznej osobie ścianę
 * polskiego tekstu. Przy dopisywaniu faktów partiami (2026-08: +5, potem +44) łatwo
 * przeoczyć jeden język. Ten test zamienia ciche milczenie w głośny błąd. */
test('każdy fakt ma tłumaczenie w każdym języku', () => {
  const doTlumaczenia = FACTS.filter((f) => f.b !== 'miejsca');   // adresy placówek zostają po polsku
  const braki = [];
  for (const lang of Object.keys(FACT_TX)) {
    const puste = doTlumaczenia.filter((f) => !String(FACT_TX[lang][f.id] || '').trim());
    if (puste.length) braki.push(`${lang}: brak ${puste.length} (${puste.slice(0, 6).map((f) => f.id).join(',')})`);
  }
  assert.deepEqual(braki, [], 'niekompletne tłumaczenia:\n  ' + braki.join('\n  '));
});

test('poprawiona statystyka zakażeń jest spójna we wszystkich językach', () => {
  const f = FACTS.find((x) => x.id === '0107');
  assert.ok(/35\s?175/.test(f.w), 'polski oryginał ma aktualną liczbę');
  assert.ok(!/32\s?900/.test(f.w), 'stara liczba zniknęła z oryginału');
  for (const lang of Object.keys(FACT_TX)) {
    const t = FACT_TX[lang]['0107'];
    if (!t) continue;
    assert.ok(!/32[\s,.]?900/.test(t), `${lang}: została stara liczba`);
    assert.ok(/35[\s,.]?175/.test(t), `${lang}: brak aktualnej liczby`);
  }
});
