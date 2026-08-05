/* Krąg — E2E bazy wiedzy w prawdziwej przeglądarce.
 * Startuje dev-server (pg-mem) + statyczny serwer, wchodzi z zaproszenia, ląduje na Idzie
 * i sprawdza: powitanie, odpowiedź z faktem + etykietą źródła + ostrzeżeniem bramki,
 * reakcję kryzysową (SEC-01, z wtrąconym słowem) i „brak pokrycia" z podpowiedziami.
 * Uruchom: node scripts/e2e-ida.mjs
 */
import { spawn } from 'node:child_process';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright-core');

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const API_PORT = 8094, WEB_PORT = 8095;
const API = `http://localhost:${API_PORT}`, WEB = `http://localhost:${WEB_PORT}`;
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };

let apiProc, web, pass = 0, fail = 0;
const ok = (c, l) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ FAIL ') + l); };
const log = (...a) => console.log('•', ...a);

function startWeb() {
  web = http.createServer(async (req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    try { const buf = await readFile(join(ROOT, p)); res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' }); res.end(buf); }
    catch { res.writeHead(404); res.end('nope'); }
  });
  return new Promise((r) => web.listen(WEB_PORT, r));
}
function startApi() {
  apiProc = spawn(join(ROOT, 'server', 'node_modules', '.bin', 'tsx'), ['src/dev-memory.ts'],
    { cwd: join(ROOT, 'server'), env: { ...process.env, PORT: String(API_PORT), POW_BITS: '10' }, stdio: 'ignore', detached: true });
  return waitHealth();
}
function killApi() { try { if (apiProc?.pid) process.kill(-apiProc.pid); } catch { /* gone */ } }
async function waitHealth() {
  for (let i = 0; i < 40; i++) { try { const r = await fetch(`${API}/health`); if (r.ok) return; } catch { /* retry */ } await new Promise((r) => setTimeout(r, 250)); }
  throw new Error('dev-server nie wstał');
}
const lastIda = (page) => page.evaluate(() => { const n = [...document.querySelectorAll('#ida-log .ida-msg.ida')].pop(); return n ? n.innerHTML : ''; });

async function main() {
  await startWeb(); log('static PWA na', WEB);
  await startApi(); log('dev-server (pg-mem) na', API);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.addInitScript((api) => { window.KRAG_API_BASE = api; }, API);
  page.on('pageerror', (e) => { console.log('  [pageerror]', e.message); fail++; });

  await page.goto(WEB);
  await page.click('#go-anon');
  await page.waitForSelector('#s-ida.on', { timeout: 20000 });
  ok(true, 'wejście ląduje na ekranie Idy');
  await page.waitForSelector('#ida-log .ida-msg.ida');
  { const g = await lastIda(page);
    ok(/data-q/.test(g) && /(zapyta|zaczynamy|porozmawiać|pytanie|widzie|jestem tu)/i.test(g), 'Ida wita krótko (wariant) + propozycje pytań, bez powielania onboardingu'); }

  // 1) odpowiedź z bazy: U=U → fakt + odznaka ŹRÓDŁA (P0-5), bez „podpisu lekarza"
  await page.fill('#ida-input', 'co to znaczy niewykrywalny');
  await page.click('#ida-send');
  await page.waitForFunction(() => document.querySelectorAll('#ida-log .ida-msg.ida').length >= 2, { timeout: 8000 });
  let html = await lastIda(page);
  ok(/niewykrywaln|u\s*=\s*u|nie przenosi|niezaka/i.test(html), 'U=U → merytoryczny fakt w odpowiedzi');
  ok(/srcline/.test(html) && /trust (official|verified|community)/.test(html), 'odpowiedź ma odznakę źródła (urzędowe/zweryfikowane/społeczność)');
  ok(/trust official/.test(html) && /urzędowe/i.test(html), 'fakt z gov.pl → „urzędowe" (bez wymogu podpisu lekarza)');
  ok(!/gatewarn|podpisu lekarza/.test(html), 'brak fałszywego ostrzeżenia „potrzebny podpis lekarza"');

  // 2) reakcja kryzysowa z WTRĄCONYM słowem (SEC-01) — musi pokazać numer
  await page.fill('#ida-input', 'nie chce mi się już żyć po tej diagnozie');
  await page.click('#ida-send');
  await page.waitForFunction(() => /crisisbox/.test([...document.querySelectorAll('#ida-log .ida-msg.ida')].pop()?.innerHTML || ''), { timeout: 8000 });
  html = await lastIda(page);
  ok(/crisisbox/.test(html) && html.includes('800 70 2222'), 'kryzys z wtrąceniem „już" → reakcja z numerem 800 70 2222');

  // 3) brak pokrycia → uczciwie „nie zmyślam" + chipy tematów + wejście do Pomocy
  await page.fill('#ida-input', 'jaka jest stolica Australii');
  await page.click('#ida-send');
  await page.waitForFunction(() => /zmysla|nie mam tego w bazie|poza pokryciem/i.test([...document.querySelectorAll('#ida-log .ida-msg.ida')].pop()?.innerHTML || ''), { timeout: 8000 });
  html = await lastIda(page);
  ok(/zmysla|nie mam tego w bazie/i.test(html) && /data-blk/.test(html) && /data-gap-help/.test(html), 'pytanie spoza bazy → uczciwie, z tematami i wejściem do Pomocy');

  // 4) wsparcie emocjonalne: „Jestem samotny" NIE trafia na fakt o „nosicielu"
  await page.fill('#ida-input', 'Jestem samotny');
  await page.click('#ida-send');
  await page.waitForFunction(() => /data-emo/.test([...document.querySelectorAll('#ida-log .ida-msg.ida')].pop()?.innerHTML || ''), { timeout: 8000 });
  html = await lastIda(page);
  ok(!/nosiciel/i.test(html) && /data-emo="meet"/.test(html) && /data-emo="help"/.test(html), 'samotność → ciepłe wsparcie z wyjściami (ludzie/Pomoc), bez losowego faktu');

  // 5) koinfekcja „HPV" → merytoryczny fakt (nie „nie mam tego w bazie")
  await page.fill('#ida-input', 'HPV');
  await page.click('#ida-send');
  await page.waitForFunction(() => document.querySelectorAll('#ida-log .ida-msg.ida').length >= 6, { timeout: 8000 });
  html = await lastIda(page);
  ok(/szczepie|koinfekc|wzw|gruzlic|kila/i.test(html) && !/nie mam tego w bazie/i.test(html), 'HPV → fakt o koinfekcjach/szczepieniach, nie odmowa');

  // 5b) #3 „Gdzie do lekarza?" → Ida pyta o miasto → po podaniu miasta konkretny adres poradni
  await page.fill('#ida-input', 'gdzie do lekarza?');
  await page.click('#ida-send');
  await page.waitForFunction(() => /mieście|data-city/i.test([...document.querySelectorAll('#ida-log .ida-msg.ida')].pop()?.innerHTML || ''), { timeout: 8000 });
  html = await lastIda(page);
  ok(/data-city/.test(html), '„gdzie do lekarza" → Ida pyta o miasto (chipy miast)');
  const nBefore = await page.evaluate(() => document.querySelectorAll('#ida-log .ida-msg.ida').length);
  await page.fill('#ida-input', 'Kraków');
  await page.click('#ida-send');
  await page.waitForFunction((n) => document.querySelectorAll('#ida-log .ida-msg.ida').length > n, nBefore, { timeout: 8000 });
  html = await lastIda(page);
  ok(/Śniadeckich 10/.test(html) && /tel:/.test(html), 'miasto „Kraków" → adres poradni + telefon (dane KC ds. AIDS)');
  ok(/gov\.pl/.test(html), 'adresy placówek mają źródło (KC ds. AIDS)');

  // 5c) #3 „najbliższe placówki": miasto bez własnej poradni (Bytom) → wskazuje najbliższą (Chorzów)
  const nB2 = await page.evaluate(() => document.querySelectorAll('#ida-log .ida-msg.ida').length);
  await page.fill('#ida-input', 'gdzie do lekarza w Bytomiu');
  await page.click('#ida-send');
  await page.waitForFunction((n) => document.querySelectorAll('#ida-log .ida-msg.ida').length > n, nB2, { timeout: 8000 });
  html = await lastIda(page);
  ok(/Zjednoczenia 10/.test(html), 'miasto bez poradni (Bytom) → wskazuje najbliższą placówkę (Chorzów)');

  // 3b) biblioteka wiedzy: otwórz, wejdź w ścieżkę, zobacz fakty
  await page.click('#ida-lib');
  await page.waitForSelector('#s-library.on');
  await page.waitForFunction(() => document.querySelectorAll('#lib-body [data-path]').length > 3, { timeout: 5000 });
  ok(true, 'biblioteka: lista ścieżek tematycznych');
  await page.click('#lib-body [data-path]');
  await page.waitForFunction(() => document.querySelector('#lib-body .lib-fact'), { timeout: 5000 });
  ok(true, 'biblioteka: ścieżka → fakty z etykietą źródła');
  // #3: nazwa źródła klikalna (link do strony źródłowej)
  ok(await page.$('#lib-body a.srclink[href^="http"]') !== null, 'biblioteka: nazwa źródła jest klikalnym linkiem');
  // #5: narzędzie interakcji leków przeniesione do Biblioteki
  ok(await page.$('#lib-ix #ix-check') !== null, 'biblioteka: jest narzędzie „Interakcje leków"');
  await page.click('#lib-back');
  await page.waitForSelector('#s-ida.on');

  // 4) rozmowy i dziennik nadal dostępne przez zakładki
  await page.click('.tab[data-tab="app"]'); await page.waitForSelector('#s-app.on');
  ok(await page.isVisible('#disc-cat'), 'zakładka Rozmowy działa (discovery-first)');
  await page.click('.tab[data-tab="diary"]'); await page.waitForSelector('#s-diary.on');
  await page.fill('#diary-note', 'pierwszy tydzień za mną');
  await page.click('#diary-save');
  await page.waitForFunction(() => /pierwszy tydzień/.test(document.querySelector('#d-notes')?.textContent || ''), { timeout: 5000 });
  ok(true, 'zakładka Dziennik zapisuje notatkę lokalnie');
  // strukturalny wynik + wykres trajektorii
  await page.selectOption('#d-marker', 'cd4');
  await page.fill('#d-val', '268');
  await page.click('#d-add-result');
  await page.waitForFunction(() => document.querySelector('#d-chart svg') && /CD4 · 268/.test(document.querySelector('#d-chart')?.textContent || ''), { timeout: 5000 });
  ok(true, 'wynik CD4 + wykres trajektorii działają');

  // #1 Pomoc: przycisk w nagłówku Idy otwiera ekran z prawdziwymi numerami
  await page.click('.tab[data-tab="ida"]'); await page.waitForSelector('#s-ida.on');
  await page.click('#ida-help');
  await page.waitForSelector('#s-help.on', { timeout: 5000 });
  const helpHtml = await page.innerHTML('#s-help');
  ok(/tel:112/.test(helpHtml) && /800\s?70\s?2222|tel:800702222/.test(helpHtml) && /tel:800888448/.test(helpHtml), 'Pomoc: numery alarmowy/kryzys/HIV obecne i klikalne');
  ok(/aids\.gov\.pl\/pkd/.test(helpHtml), 'Pomoc: link do PKD (gdzie zrobić test)');
  ok(true, 'Pomoc: dostępna z nagłówka Idy');

  console.log(`\n=== ${pass} PASS · ${fail} FAIL ===`);
  await browser.close();
  if (fail) throw new Error('E2E Idy nie przeszło');
}
main().then(() => { killApi(); web?.close(); process.exit(0); })
  .catch((e) => { console.error('✖', e.message); killApi(); web?.close(); process.exit(1); });
