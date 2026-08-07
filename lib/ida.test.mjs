/* Routing Idy — port testu z ProjektKrag, ale importuje czysty moduł (bez wyrywania z HTML).
 * Uruchom: node lib/ida.test.mjs */
import { findFacts, resetThread, setRole, FACTS } from './ida.js';
import { risky, stopMeds } from './crisis.js';

let pass = 0, fail = 0;
const ok = (cond, label) => { (cond ? pass++ : fail++); console.log((cond ? '  ✓ ' : '  ✗ FAIL ') + label); };
const route = (q) => { resetThread(); const h = findFacts(q); return h ? { block: h.block, ids: (h.facts || []).map((f) => f.id), bound: !!h.bound, boundKind: h.boundKind, bridge: h.bridge, unsure: !!h.unsure } : null; };

setRole('plhiv');

console.log('R-0 · baza wczytana:');
ok(FACTS.length === 223, 'FACTS = ' + FACTS.length + ' (oczekiwano 223)');

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

console.log('\nR-4 · niepewne dopasowanie nie udaje pewnego (informacyjnie):');
['Czy mogę pić alkohol?', 'Czy mogę uprawiać sport?', 'czy to znaczy że mam AIDS'].forEach((q) => {
  const r = route(q);
  console.log('   "' + q + '" → ' + (r ? (r.block + (r.unsure ? ' [niepewne]' : '')) : 'brak pokrycia'));
});

console.log('\n=== ' + pass + ' PASS · ' + fail + ' FAIL ===');
process.exit(fail ? 1 : 0);
