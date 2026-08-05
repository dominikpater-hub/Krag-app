/* Krąg — E2E katalogu (#6): A ogłasza się, B znajduje po okolicy/temacie i pisze do A.
 * Uruchom: node scripts/e2e-catalog.mjs
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
const API_PORT = 8160, WEB_PORT = 8161;
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
async function onboard(browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.addInitScript((api) => { window.KRAG_API_BASE = api; }, API);
  page.on('pageerror', (e) => { console.log('  [pageerror]', e.message); fail++; });
  await page.goto(WEB);
  await page.click('#go-anon');
  await page.waitForSelector('#s-ida.on', { timeout: 20000 });
  await page.click('.tab[data-tab="app"]'); await page.waitForSelector('#s-app.on');
  await page.waitForFunction(() => document.querySelector('#me-pseudo')?.textContent !== '…');
  return { page, pseudo: (await page.textContent('#me-pseudo')).trim() };
}

async function main() {
  await startWeb(); log('static PWA na', WEB);
  await startApi(); log('dev-server (pg-mem) na', API);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });

  const A = await onboard(browser); log('A:', A.pseudo);
  const B = await onboard(browser); log('B:', B.pseudo);

  // A ogłasza się w katalogu
  await A.page.click('#app-cat'); await A.page.waitForSelector('#s-catalog.on');
  await A.page.click('#cat-mine-wrap > summary');
  await A.page.fill('#cat-region', 'Warszawa');
  await A.page.fill('#cat-tags', 'świeżo po diagnozie, PrEP');
  await A.page.fill('#cat-bio', 'Otwarty na rozmowę.');
  await A.page.check('#cat-mentor');                      // #2: oferuje się jako buddy/mentor
  await A.page.click('#cat-publish');
  await A.page.waitForFunction((ps) => (document.querySelector('#cat-list')?.textContent || '').includes(ps.split(' #')[0]), A.pseudo, { timeout: 8000 });
  ok(true, 'A: ogłoszenie opublikowane i widoczne u A');

  // B przegląda katalog, filtruje po okolicy, znajduje A
  await B.page.click('#app-cat'); await B.page.waitForSelector('#s-catalog.on');
  await B.page.fill('#cat-f-region', 'warsz'); await B.page.click('#cat-search');
  await B.page.waitForFunction((ps) => [...document.querySelectorAll('#cat-list .thread .nm')].some((n) => n.textContent.includes(ps)), A.pseudo.split(' #')[0], { timeout: 8000 });
  ok(true, 'B: znalazł A w katalogu po okolicy');
  // filtr po temacie
  await B.page.fill('#cat-f-region', ''); await B.page.fill('#cat-f-tag', 'prep'); await B.page.click('#cat-search');
  await B.page.waitForFunction(() => document.querySelector('#cat-list [data-write]'), { timeout: 8000 });
  ok(true, 'B: filtr po temacie „PrEP" działa');

  // #2 filtr „tylko buddy/mentorzy" → A (mentor) widoczny z odznaką
  await B.page.fill('#cat-f-tag', ''); await B.page.check('#cat-f-mentor');
  await B.page.waitForFunction((ps) => [...document.querySelectorAll('#cat-list .thread')].some((th) => th.textContent.includes(ps) && /buddy/i.test(th.textContent)), A.pseudo.split(' #')[0], { timeout: 8000 });
  ok(true, 'B: filtr buddy/mentor pokazuje A z odznaką „buddy"');
  await B.page.uncheck('#cat-f-mentor'); await B.page.click('#cat-search');
  await B.page.waitForFunction(() => document.querySelector('#cat-list [data-write]'), { timeout: 8000 });

  // B pisze do A z katalogu → otwiera się wątek
  await B.page.click('#cat-list [data-write]');
  await B.page.waitForSelector('#s-thread.on', { timeout: 10000 });
  // #2 lokalna gwiazdka buddy w wątku 1:1
  await B.page.click('#thread-buddy');
  await B.page.waitForFunction(() => document.querySelector('#thread-buddy')?.textContent === '★', { timeout: 5000 });
  ok(true, 'B: oznaczył rozmówcę gwiazdką buddy (lokalnie)');
  await B.page.fill('#msg-input', 'Cześć, widziałem Cię w katalogu.');
  await B.page.click('#msg-send');
  await B.page.waitForFunction((tx) => [...document.querySelectorAll('.msg.out')].some((m) => m.textContent.includes(tx)), 'katalogu', { timeout: 8000 });
  ok(true, 'B: „Napisz" z katalogu → rozmowa 1:1 z A');

  // A wraca do Rozmów i odbiera (polling ~4s)
  await A.page.click('#cat-back'); await A.page.waitForSelector('#s-app.on');
  await A.page.waitForSelector('#thread-list .thread', { timeout: 15000 });
  ok(true, 'A: dostał wiadomość zainicjowaną z katalogu');

  // NOWE: przełączniki w PROFILU (buddy/mentor + „pozwól innym znaleźć mnie") publikują ogłoszenie
  const C = await onboard(browser); log('C:', C.pseudo);
  await C.page.click('.tab[data-tab="profile"]'); await C.page.waitForSelector('#s-profile.on');
  ok(await C.page.$('#pf-mentor') && await C.page.$('#pf-discover'), 'Profil: są przełączniki buddy/mentor + widoczność');
  await C.page.check('#pf-mentor'); await C.page.check('#pf-discover');
  await C.page.click('#pf-save'); await C.page.waitForTimeout(500);
  await C.page.click('.tab[data-tab="app"]'); await C.page.waitForSelector('#s-app.on'); await C.page.click('#app-cat'); await C.page.waitForSelector('#s-catalog.on');
  await C.page.click('#cat-search');
  await C.page.waitForFunction((ps) => [...document.querySelectorAll('#cat-list .thread')].some((th) => th.textContent.includes(ps) && /buddy/i.test(th.textContent)), C.pseudo.split(' #')[0], { timeout: 8000 });
  ok(true, 'C: włączenie widoczności w Profilu → ogłoszenie z odznaką buddy w katalogu');
  // wyłączenie widoczności → ogłoszenie znika
  await C.page.click('#cat-back'); await C.page.waitForSelector('#s-app.on');
  await C.page.click('.tab[data-tab="profile"]'); await C.page.waitForSelector('#s-profile.on');
  await C.page.uncheck('#pf-discover'); await C.page.click('#pf-save'); await C.page.waitForTimeout(500);
  await C.page.click('.tab[data-tab="app"]'); await C.page.waitForSelector('#s-app.on'); await C.page.click('#app-cat'); await C.page.waitForSelector('#s-catalog.on'); await C.page.click('#cat-search');
  await C.page.waitForFunction((ps) => ![...document.querySelectorAll('#cat-list .thread .nm')].some((n) => n.textContent.includes(ps)), C.pseudo.split(' #')[0], { timeout: 8000 });
  ok(true, 'C: wyłączenie widoczności w Profilu → ogłoszenie znika z katalogu');

  console.log(`\n=== ${pass} PASS · ${fail} FAIL ===`);
  await browser.close();
  if (fail) throw new Error('E2E katalogu nie przeszło');
}
main().then(() => { killApi(); web?.close(); process.exit(0); })
  .catch((e) => { console.error('✖', e.message); killApi(); web?.close(); process.exit(1); });
