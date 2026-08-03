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
  ok(/towarzysz/i.test(await lastIda(page)), 'Ida wita się słowem „towarzyszę" (nie „prowadzę")');

  // 1) odpowiedź z bazy: U=U → fakt + etykieta źródła + ostrzeżenie bramki
  await page.fill('#ida-input', 'co to znaczy niewykrywalny');
  await page.click('#ida-send');
  await page.waitForFunction(() => document.querySelectorAll('#ida-log .ida-msg.ida').length >= 2, { timeout: 8000 });
  let html = await lastIda(page);
  ok(/niewykrywaln|u\s*=\s*u|nie przenosi|niezaka/i.test(html), 'U=U → merytoryczny fakt w odpowiedzi');
  ok(/srcline/.test(html) && /trust/.test(html), 'odpowiedź ma etykietę zaufania + źródło');
  ok(/gatewarn/.test(html), 'blok medyczny niesie ostrzeżenie o braku podpisu lekarza');

  // 2) reakcja kryzysowa z WTRĄCONYM słowem (SEC-01) — musi pokazać numer
  await page.fill('#ida-input', 'nie chce mi się już żyć po tej diagnozie');
  await page.click('#ida-send');
  await page.waitForFunction(() => /crisisbox/.test([...document.querySelectorAll('#ida-log .ida-msg.ida')].pop()?.innerHTML || ''), { timeout: 8000 });
  html = await lastIda(page);
  ok(/crisisbox/.test(html) && html.includes('800 70 2222'), 'kryzys z wtrąceniem „już" → reakcja z numerem 800 70 2222');

  // 3) brak pokrycia → uczciwe „nie odpowiem" + chipy tematów
  await page.fill('#ida-input', 'jaka jest stolica Australii');
  await page.click('#ida-send');
  await page.waitForFunction(() => /nie odpowiem|luka|poza pokryciem/i.test([...document.querySelectorAll('#ida-log .ida-msg.ida')].pop()?.innerHTML || ''), { timeout: 8000 });
  html = await lastIda(page);
  ok(/nie odpowiem/i.test(html) && /data-blk/.test(html), 'pytanie spoza bazy → „nie odpowiem" + podpowiedzi tematów');

  // 3b) biblioteka wiedzy: otwórz, wejdź w ścieżkę, zobacz fakty
  await page.click('#ida-lib');
  await page.waitForSelector('#s-library.on');
  await page.waitForFunction(() => document.querySelectorAll('#lib-body [data-path]').length > 3, { timeout: 5000 });
  ok(true, 'biblioteka: lista ścieżek tematycznych');
  await page.click('#lib-body [data-path]');
  await page.waitForFunction(() => document.querySelector('#lib-body .lib-fact'), { timeout: 5000 });
  ok(true, 'biblioteka: ścieżka → fakty z etykietą źródła');
  await page.click('#lib-back');
  await page.waitForSelector('#s-ida.on');

  // 4) rozmowy i dziennik nadal dostępne przez zakładki
  await page.click('.tab[data-tab="app"]'); await page.waitForSelector('#s-app.on');
  ok(await page.isVisible('#start-thread'), 'zakładka Rozmowy działa');
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

  console.log(`\n=== ${pass} PASS · ${fail} FAIL ===`);
  await browser.close();
  if (fail) throw new Error('E2E Idy nie przeszło');
}
main().then(() => { killApi(); web?.close(); process.exit(0); })
  .catch((e) => { console.error('✖', e.message); killApi(); web?.close(); process.exit(1); });
