#!/usr/bin/env node
/**
 * review-export.js — arkusz recenzencki dla lekarza.
 *
 * Lekarz czyta zdania, nie klika ekranów. Ten skrypt wypluwa dokument,
 * który da się przejść w tramwaju albo wydrukować: zdanie, źródło, miejsce
 * na „zgadzam się" i na poprawkę.
 *
 * Kolejność bierze się z kosztu zaniedbania (ten sam, którym liczy currency.js),
 * żeby recenzent zaczął od PEP i ekspozycji, a nie od epidemiologii.
 *
 * Nic tu nie zapisuje do bazy. Wynik wraca do verify.js ręcznie.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'review');
const entries = fs.readdirSync(path.join(ROOT, 'entries'))
  .filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(fs.readFileSync(path.join(ROOT, 'entries', f), 'utf8')));
const sources = JSON.parse(fs.readFileSync(path.join(ROOT, 'library/sources.json'), 'utf8')).sources;
const policy = JSON.parse(fs.readFileSync(path.join(ROOT, 'policy.json'), 'utf8'));

const COST = {
  pep: 100, ekspozycja: 95, granice: 90, 'prep-pl': 80, 'leczenie-pl': 75, uu: 70,
  bezpieczenstwo: 68, prawo: 60, testowanie: 55, odbudowa: 52, prep: 50,
  leczenie: 45, ciaza: 45, transmisja: 40, psyche: 35, przebieg: 30,
  wspolistniejace: 25, stygma: 20, wyleczenie: 15, epidemiologia: 10, 'pierwsze-dni': 50, dlugoterminowo: 30
};
const NAZWA = {
  pep: 'PEP — po ryzykownym kontakcie', ekspozycja: 'Zakłucia i ekspozycja zawodowa',
  granice: 'Granice — czego aplikacja nie robi', 'prep-pl': 'PrEP w Polsce',
  'leczenie-pl': 'Leczenie w Polsce', uu: 'Niewykrywalność',
  bezpieczenstwo: 'Bezpieczeństwo przy niskim CD4', prawo: 'Prawo i praca',
  testowanie: 'Testowanie', odbudowa: 'Odbudowa odporności', prep: 'PrEP',
  leczenie: 'Leki i terapia', ciaza: 'Ciąża i dzieci', transmisja: 'Jak się przenosi',
  psyche: 'Zdrowie psychiczne', przebieg: 'Wiremia i CD4',
  wspolistniejace: 'Choroby współistniejące', stygma: 'Stygmatyzacja',
  wyleczenie: 'Badania nad wyleczeniem', epidemiologia: 'Dane o Polsce', 'pierwsze-dni': 'Pierwsze dni po diagnozie', dlugoterminowo: 'Życie długoterminowe'
};

const gate = policy.publishGate.requireVerifierForBlocks;
/* Schemat wpisu po migracji: temat siedzi na wpisie, treść w content.summary,
   a source jest obiektem, nie identyfikatorem. Poprzednia wersja tego skryptu
   czytała pola z wersji i wypuściła arkusz pełen "undefined" — stąd kontrola
   na końcu, która nie pozwala zapisać dokumentu z pustym zdaniem. */
const rows = entries.map(e => {
  const v = e.versions[e.versions.length - 1];
  const srcId = typeof v.source === 'string' ? v.source : (v.source && v.source.id) || '';
  const reg = sources[srcId] || {};
  const ref = (v.source && v.source.reference) || '';
  return {
    id: e.id, block: e.block,
    topic: e.topic || v.topic || '(bez tematu)',
    why: (v.content && v.content.summary) || '',
    source: srcId,
    authority: reg.authority || ref || srcId || '(brak źródła)',
    edition: reg.edition || v.edition || '',
    confidence: v.confidence || '',
    gated: gate.includes(e.block),
    cost: COST[e.block] ?? 0
  };
}).sort((a, b) => b.cost - a.cost || a.id.localeCompare(b.id));

/* Bramka na własny błąd: dokument recenzencki bez treści jest gorszy niż jego brak,
   bo lekarz odsyła go jako zepsuty i drugi raz nie otworzy. */
const puste = rows.filter(r => !r.why.trim() || !r.topic.trim());
if (puste.length) {
  console.error(`PRZERWANE: ${puste.length} wpisów bez treści lub tematu — ${puste.slice(0,5).map(r => r.id).join(', ')}`);
  console.error('Sprawdź schemat wpisu; arkusz nie został zapisany.');
  process.exit(1);
}
const bezZrodla = rows.filter(r => r.authority === '(brak źródła)');
if (bezZrodla.length) console.warn(`uwaga: ${bezZrodla.length} wpisów bez rozpoznanego źródła`);

fs.mkdirSync(OUT, { recursive: true });
const dzis = new Date().toISOString().slice(0, 10);

/* ---------- CSV dla arkusza ---------- */
const q = v => `"${String(v).replace(/"/g, '""')}"`;
const csv = ['id,blok,temat,zdanie,zrodlo,wydanie,pewnosc,zgadzam_sie,poprawka']
  .concat(rows.map(r => [r.id, r.block, r.topic, r.why, r.authority, r.edition, r.confidence, '', ''].map(q).join(',')))
  .join('\n');
fs.writeFileSync(path.join(OUT, `recenzja-${dzis}.csv`), '\uFEFF' + csv, 'utf8');

/* ---------- arkusz do czytania i druku ---------- */
const grupy = [...new Set(rows.map(r => r.block))];
const esc = t => String(t).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const html = `<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8">
<title>Krąg — arkusz recenzencki ${dzis}</title><style>
:root{--ink:#1a1d23;--mut:#6b7280;--line:#d8dae0;--acc:#5f7a58}
*{box-sizing:border-box}
body{max-width:920px;margin:0 auto;padding:40px 28px 80px;
 font:16px/1.6 Georgia,'Times New Roman',serif;color:var(--ink);background:#fff}
h1{font-size:30px;font-weight:400;margin:0 0 6px;letter-spacing:-.01em}
.lead{color:var(--mut);font-size:15px;margin:0 0 28px}
.box{border:1px solid var(--line);border-radius:8px;padding:18px 20px;margin:0 0 30px;background:#fafbfa}
.box p{margin:0 0 10px}.box p:last-child{margin:0}
.box b{font-weight:700}
h2{font-size:19px;font-weight:400;margin:34px 0 4px;padding-top:16px;border-top:2px solid var(--ink)}
.meta{font-size:12.5px;color:var(--mut);margin:0 0 14px;font-family:system-ui,sans-serif}
.f{border-bottom:1px solid var(--line);padding:15px 0;page-break-inside:avoid}
.f .id{font-family:ui-monospace,monospace;font-size:11.5px;color:var(--mut)}
.f .top{font-size:12.5px;color:var(--mut);font-family:system-ui,sans-serif;text-transform:uppercase;letter-spacing:.06em}
.f .why{margin:7px 0 9px;font-size:16.5px}
.f .src{font-size:12.5px;color:var(--mut);font-family:system-ui,sans-serif}
.tag{display:inline-block;font-size:10.5px;font-family:system-ui,sans-serif;letter-spacing:.06em;
 border:1px solid var(--line);border-radius:3px;padding:1px 6px;margin-left:6px;color:var(--mut)}
.tag.g{border-color:var(--acc);color:var(--acc)}
.ans{display:flex;gap:22px;align-items:center;margin-top:11px;font-family:system-ui,sans-serif;font-size:13px;color:var(--mut)}
.cb{display:inline-block;width:15px;height:15px;border:1.5px solid var(--ink);vertical-align:-3px;margin-right:6px}
.corr{border-bottom:1px dotted var(--line);flex:1;min-height:22px}
@media print{body{padding:0 0 20px;font-size:12pt}h2{page-break-after:avoid}.box{background:none}}
</style></head><body>

<h1>Krąg — arkusz recenzencki</h1>
<p class="lead">${rows.length} zdań · stan na ${dzis} · uporządkowane od najdroższych w skutkach</p>

<div class="box">
<p><b>O co prosimy.</b> To są wszystkie zdania, które aplikacja może pokazać osobie żyjącej z HIV albo jej bliskim. Każde powstało z podanego źródła, ale <b>żadnego nie sprawdził dotąd człowiek</b>. Do czasu Twojego podpisu aplikacja nie pokaże ich nikomu.</p>
<p><b>Jak czytać.</b> Interesuje nas jedno: czy zdanie jest prawdziwe i czy nie wprowadza w błąd przez to, czego nie mówi. Nie trzeba poprawiać stylu — od tego jesteśmy my. Kolejność jest od tematów, gdzie pomyłka kosztuje najwięcej (PEP, ekspozycja), do tych, gdzie kosztuje najmniej.</p>
<p><b>Nie trzeba naraz.</b> Blok to jeden temat i zamknięta całość. Można podpisać trzy bloki i wrócić za miesiąc.</p>
<p><b>Oznaczenia.</b> <span class="tag g">wymaga lekarza</span> to blok, którego regulamin projektu nie wypuści bez podpisu osoby z uprawnieniami. Pozostałe mogą być zatwierdzone przez redakcję.</p>
</div>

${grupy.map(b => {
  const g = rows.filter(r => r.block === b);
  return `<h2>${esc(NAZWA[b] || b)}</h2>
<p class="meta">${g.length} ${g.length === 1 ? 'zdanie' : 'zdań'} · koszt pomyłki ${COST[b] ?? '?'}/100${g[0].gated ? ' · <span class="tag g">wymaga lekarza</span>' : ''}</p>
${g.map(r => `<div class="f">
<div class="top">${esc(r.topic)} <span class="id">${r.id}</span></div>
<p class="why">${esc(r.why)}</p>
<div class="src">${esc(r.authority)}${r.edition ? ', ' + esc(r.edition) : ''} <span class="tag">${r.confidence}</span></div>
<div class="ans"><span><span class="cb"></span>zgadzam się</span><span><span class="cb"></span>poprawka:</span><span class="corr"></span></div>
</div>`).join('\n')}`;
}).join('\n')}

<div class="box" style="margin-top:40px">
<p><b>Co się dzieje z podpisem.</b> Zdania zatwierdzone dostają w bazie Twoje nazwisko i datę, a dopiero wtedy aplikacja może je pokazać. Zdania z poprawką wracają do przepisania i przychodzą ponownie. Wszystko, czego nie zaznaczysz, zostaje niewidoczne dla użytkowników.</p>
<p><b>To nie jest jednorazowe.</b> Wytyczne zmieniają się co roku, refundacja co miesiąc. Podpis ma datę ważności i wróci do Ciebie, zanim się zestarzeje.</p>
</div>
</body></html>`;

fs.writeFileSync(path.join(OUT, `recenzja-${dzis}.html`), html, 'utf8');

const gated = rows.filter(r => r.gated).length;
console.log(`arkusz recenzencki: ${rows.length} zdań w ${grupy.length} blokach`);
console.log(`  wymaga lekarza: ${gated} · reszta: ${rows.length - gated}`);
console.log(`  review/recenzja-${dzis}.html  (do czytania i druku)`);
console.log(`  review/recenzja-${dzis}.csv   (do arkusza)`);
console.log(`\nPierwsze trzy bloki w kolejce: ${grupy.slice(0, 3).map(b => NAZWA[b] || b).join(' · ')}`);
