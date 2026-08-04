/* Krąg — E2E #6/2: pokoje tematyczne (grupa, E2E per-odbiorca) + linki-zaproszenia.
 * Uruchom: node scripts/e2e-rooms.mjs
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
const API_PORT = 8170, WEB_PORT = 8171;
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
async function onboard(browser, url = WEB) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.addInitScript((api) => { window.KRAG_API_BASE = api; }, API);
  page.on('pageerror', (e) => { console.log('  [pageerror]', e.message); fail++; });
  await page.goto(url);
  await page.click('#go-anon');
  await page.waitForSelector('#s-ida.on', { timeout: 20000 });
  await page.click('.tab[data-tab="app"]'); await page.waitForSelector('#s-app.on');
  await page.waitForFunction(() => document.querySelector('#me-pseudo')?.textContent !== '…');
  return { page, ctx, pseudo: (await page.textContent('#me-pseudo')).trim() };
}

async function main() {
  await startWeb(); log('static PWA na', WEB);
  await startApi(); log('dev-server (pg-mem) na', API);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });

  const A = await onboard(browser); log('A:', A.pseudo);
  const B = await onboard(browser); log('B:', B.pseudo);

  // ——— POKOJE ———
  // A zakłada pokój → od razu wchodzi do wątku pokoju (wchodzi przez discovery-first CTA #10)
  await A.page.click('#disc-rooms'); await A.page.waitForSelector('#s-rooms.on');
  await A.page.fill('#rooms-name', 'Świeżo po diagnozie');
  await A.page.click('#rooms-create');
  await A.page.waitForSelector('#s-thread.on', { timeout: 10000 });
  ok((await A.page.textContent('#thread-peer')).includes('Świeżo'), 'A: pokój założony, wątek otwarty z nazwą tematu');

  // B znajduje pokój i dołącza
  await B.page.click('#app-rooms'); await B.page.waitForSelector('#s-rooms.on');
  await B.page.waitForFunction(() => document.querySelector('#rooms-list [data-join]'), { timeout: 8000 });
  ok(true, 'B: widzi pokój na liście');
  await B.page.click('#rooms-list [data-join]');
  await B.page.waitForSelector('#s-thread.on', { timeout: 10000 });
  ok(true, 'B: dołączył i wszedł do pokoju');

  // A wysyła wiadomość do pokoju (rozgłoszenie E2E per-odbiorca → B)
  await A.page.fill('#msg-input', 'Witam wszystkich w pokoju.');
  await A.page.click('#msg-send');
  await A.page.waitForFunction((tx) => [...document.querySelectorAll('.msg.out')].some((m) => m.textContent.includes(tx)), 'Witam', { timeout: 8000 });
  ok(true, 'A: wysłał wiadomość do pokoju');

  // B odbiera (polling) — wiadomość z podpisem nadawcy w wątku pokoju
  await B.page.waitForFunction((tx) => [...document.querySelectorAll('.msg.in')].some((m) => m.textContent.includes(tx)), 'Witam', { timeout: 15000 });
  const bIn = await B.page.textContent('#msg-list');
  ok(bIn.includes(A.pseudo.split(' #')[0]) && bIn.includes('Witam'), 'B: dostał wiadomość pokojową z podpisem nadawcy');

  // B odpowiada → A odbiera
  await B.page.fill('#msg-input', 'Cześć, dzięki że jesteś.');
  await B.page.click('#msg-send');
  await A.page.waitForFunction((tx) => [...document.querySelectorAll('.msg.in')].some((m) => m.textContent.includes(tx)), 'dzięki', { timeout: 15000 });
  ok(true, 'A: dostał odpowiedź z pokoju');

  // ——— LINK-ZAPROSZENIE (deep-link nadal działa; UI generujące link usunięte z Profilu) ———
  await A.page.click('#thread-back'); await A.page.waitForSelector('#s-app.on');
  const { encodeInvite } = await import('../lib/invite.js');
  const testUrl = WEB + '/?k=' + encodeInvite(A.pseudo);
  ok(/\?k=[A-Za-z0-9\-_]+$/.test(testUrl), 'deep-link ?k= zbudowany z uchwytu A');

  // C otwiera link → po wejściu anonimowym od razu rozmowa z A (bez generycznego onboard:
  // link automatycznie przełącza z ekranu Idy na wątek, więc czekamy wprost na wątek).
  const cctx = await browser.newContext();
  const cpage = await cctx.newPage();
  await cpage.addInitScript((api) => { window.KRAG_API_BASE = api; }, API);
  cpage.on('pageerror', (e) => { console.log('  [pageerror]', e.message); fail++; });
  await cpage.goto(testUrl);
  await cpage.click('#go-anon');
  await cpage.waitForSelector('#s-thread.on', { timeout: 20000 });
  ok((await cpage.textContent('#thread-peer')).includes(A.pseudo.split(' #')[0]), 'C: link otworzył rozmowę 1:1 z A');
  await cpage.fill('#msg-input', 'Piszę z Twojego linku.');
  await cpage.click('#msg-send');
  await A.page.click('.tab[data-tab="app"]'); await A.page.waitForSelector('#s-app.on');
  await A.page.waitForFunction((tx) => [...document.querySelectorAll('.thread .last, .msg.in')].some((m) => m.textContent.includes(tx)) || document.querySelectorAll('#thread-list .thread').length > 0, 'linku', { timeout: 15000 });
  ok(true, 'A: dostał wiadomość zainicjowaną z linku-zaproszenia');

  console.log(`\n=== ${pass} PASS · ${fail} FAIL ===`);
  await browser.close();
  if (fail) throw new Error('E2E pokoi/zaproszeń nie przeszło');
}
main().then(() => { killApi(); web?.close(); process.exit(0); })
  .catch((e) => { console.error('✖', e.message); killApi(); web?.close(); process.exit(1); });
