/* Weryfikacja routingu Idy — metoda audytu RECENZJA: wyciągamy żywy silnik z index.html
 * i przepuszczamy pytania testowe. Uruchom: node library/scripts/ida-routing.test.mjs */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');

function slice(from, to) {
  const a = html.indexOf(from), b = html.indexOf(to, a);
  if (a < 0 || b < 0) throw new Error('marker not found: ' + from);
  return html.slice(a, b);
}
// KB_BUNDLE + FACTS/PATHS/LESSONS; silnik wyszukiwania; TRIG/risky; stopMeds
const engine = [
  slice('var KB_BUNDLE=', 'var SRC='),
  slice('function norm(', 'function confBadge('),
  slice('var TRIG_N=', 'var box='),
  slice('function stopMeds(q){', 'function stopMedsReply('),
  'var role="plhiv";',
].join('\n');

const ctx = {};
new Function('with(this){' + engine + '; this.findFacts=findFacts; this.risky=risky; this.stopMeds=stopMeds; this.setRole=function(r){role=r}; this.resetThread=function(){lastBlock=null};}').call(ctx);

let pass = 0, fail = 0;
const ok = (cond, label) => { (cond ? pass++ : fail++); console.log((cond ? '  ✓ ' : '  ✗ FAIL ') + label); };
const route = (q) => { ctx.resetThread(); const h = ctx.findFacts(q); return h ? { block: h.block, ids: (h.facts || []).map(f => f.id), bound: !!h.bound, unsure: !!h.unsure } : null; };

console.log('R-1 · kryzys (przed bazą, z diakrytykami i bez):');
['nie chcę żyć', 'nie chce zyc', 'mam dość', 'chcę zniknąć', 'skończyć ze sobą', 'не хочу жити']
  .forEach(q => ok(ctx.risky(q), 'wykrywa: "' + q + '"'));
ok(!ctx.risky('jak dbać o zdrowie'), 'NIE fałszuje na: "jak dbać o zdrowie"');

console.log('\nR-2 · po ryzyku → PEP (nie U=U):');
[['Miałem seks bez prezerwatywy 3 dni temu'], ['co robić po ryzykownym seksie'],
 ['wczoraj uprawiałem seks z osobą zakażoną'], ['pękła mi prezerwatywa wczoraj']]
  .forEach(([q]) => { const r = route(q); ok(r && r.block === 'pep', '"' + q + '" → ' + (r && r.block)); });

console.log('\nR-3 · blok prawo nie dokleja kar więzienia:');
{ const r = route('boję się że mnie zwolnią');
  ok(r && r.block === 'prawo' && !r.ids.some(id => ['0088','0089','0090'].includes(id)),
     '"boję się że mnie zwolnią" → prawo, ids=' + (r && r.ids)); }
{ const r = route('Czy muszę powiedzieć pracodawcy?');
  ok(r && r.block === 'prawo' && r.ids[0] !== '0088' && r.ids.includes('0095'),
     '"Czy muszę powiedzieć pracodawcy?" → prawo, ids=' + (r && r.ids)); }

console.log('\nR-6 · granica własnego wyniku / decyzji lekowej (PL/EN):');
[['moje cd4 to 180'], ['cd4 spadło mi do 150 co robić'], ['my CD4 is 180 is that bad'], ['should I change my medication']]
  .forEach(([q]) => { const r = route(q); ok(r && r.bound, '"' + q + '" → ' + (r && (r.bound ? 'granice' : r.block))); });

console.log('\nR-5 · chęć odstawienia leków (osobna reakcja):');
ok(ctx.stopMeds('chcę przestać brać leki'), 'wykrywa: "chcę przestać brać leki"');
ok(!ctx.stopMeds('zapomniałem wziąć tabletkę'), 'NIE myli z: "zapomniałem wziąć tabletkę"');

console.log('\nR-4 · niepewne dopasowanie nie udaje pewnego (informacyjnie):');
['Czy mogę pić alkohol?', 'Czy mogę uprawiać sport?', 'czy to znaczy że mam AIDS'].forEach(q => {
  const r = route(q);
  console.log('   "' + q + '" → ' + (r ? (r.block + (r.unsure ? ' [niepewne]' : '')) : 'brak pokrycia'));
});

console.log('\n=== ' + pass + ' PASS · ' + fail + ' FAIL ===');
process.exit(fail ? 1 : 0);
