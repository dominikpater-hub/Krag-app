/* Routing Idy — port testu z ProjektKrag, ale importuje czysty moduł (bez wyrywania z HTML).
 * Uruchom: node lib/ida.test.mjs */
import { findFacts, resetThread, setRole, FACTS } from './ida.js';
import { risky, stopMeds } from './crisis.js';

let pass = 0, fail = 0;
const ok = (cond, label) => { (cond ? pass++ : fail++); console.log((cond ? '  ✓ ' : '  ✗ FAIL ') + label); };
const route = (q) => { resetThread(); const h = findFacts(q); return h ? { block: h.block, ids: (h.facts || []).map((f) => f.id), bound: !!h.bound, unsure: !!h.unsure } : null; };

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

console.log('\nR-6 · granica własnego wyniku / decyzji lekowej (PL/EN):');
[['moje cd4 to 180'], ['cd4 spadło mi do 150 co robić'], ['my CD4 is 180 is that bad'], ['should I change my medication']]
  .forEach(([q]) => { const r = route(q); ok(r && r.bound, '"' + q + '" → ' + (r && (r.bound ? 'granice' : r.block))); });

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
