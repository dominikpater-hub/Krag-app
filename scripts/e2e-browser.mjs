/* Krąg — test E2E w prawdziwej przeglądarce.
 * Startuje dev-server (pg-mem) + statyczny serwer PWA, otwiera DWIE sesje w Chromium
 * i sprawdza, że wiadomość zaszyfrowana u nadawcy jest odszyfrowana u odbiorcy.
 * Uruchom: node scripts/e2e-browser.mjs
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
const API_PORT = 8090;
const WEB_PORT = 8091;
const API = `http://localhost:${API_PORT}`;
const WEB = `http://localhost:${WEB_PORT}`;
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };

const log = (...a) => console.log('•', ...a);
let apiProc, web;

function startWeb() {
  web = http.createServer(async (req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    try {
      const buf = await readFile(join(ROOT, p));
      res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
      res.end(buf);
    } catch { res.writeHead(404); res.end('nope'); }
  });
  return new Promise((r) => web.listen(WEB_PORT, r));
}
function startApi() {
  apiProc = spawn(join(ROOT, 'server', 'node_modules', '.bin', 'tsx'), ['src/dev-memory.ts'], {
    cwd: join(ROOT, 'server'), env: { ...process.env, PORT: String(API_PORT), POW_BITS: '10' },
    stdio: 'ignore', detached: true,      // własna grupa procesów → czysty teardown
  });
  return waitHealth();
}
function killApi() { try { if (apiProc?.pid) process.kill(-apiProc.pid); } catch { /* already gone */ } }
async function waitHealth() {
  for (let i = 0; i < 40; i++) {
    try { const r = await fetch(`${API}/health`); if (r.ok) return; } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('dev-server nie wstał');
}

async function onboard(ctx) {
  const page = await ctx.newPage();
  await page.addInitScript((api) => { window.KRAG_API_BASE = api; }, API);
  page.on('pageerror', (e) => console.log('  [pageerror]', e.message));
  await page.goto(WEB);
  await page.click('#go-anon');                                   // konto anonimowe (PoW + otwarta rejestracja)
  await page.waitForSelector('#s-ida.on', { timeout: 20000 });    // #4: wchodzi prosto na Idę (bez ekranu klucza)
  await page.click('.tab[data-tab="app"]');                       // → zakładka Rozmowy
  await page.waitForSelector('#s-app.on');
  await page.waitForFunction(() => document.querySelector('#me-pseudo')?.textContent !== '…');
  const pseudo = await page.textContent('#me-pseudo');
  return { page, pseudo: pseudo.trim() };
}

async function main() {
  await startWeb(); log('static PWA na', WEB);
  await startApi(); log('dev-server (pg-mem) na', API);

  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();

  const A = await onboard(ctxA); log('A wszedł:', A.pseudo);
  const B = await onboard(ctxB); log('B wszedł:', B.pseudo);

  // A → B
  const outText = 'Cześć. Jak się dziś trzymasz?';
  await A.page.fill('#peer-input', B.pseudo);
  await A.page.click('#start-thread');
  await A.page.waitForSelector('#s-thread.on', { timeout: 10000 });
  await A.page.fill('#msg-input', outText);
  await A.page.click('#msg-send');
  await A.page.waitForFunction((t) => [...document.querySelectorAll('.msg.out')].some((m) => m.textContent.includes(t)), outText);
  log('A wysłał:', outText);

  // B odbiera (poll ~4s) → otwiera wątek → odszyfrowana treść
  await B.page.waitForSelector('#thread-list .thread', { timeout: 15000 });
  await B.page.click('#thread-list .thread');
  await B.page.waitForSelector('#s-thread.on');
  await B.page.waitForFunction((t) => [...document.querySelectorAll('.msg.in')].some((m) => m.textContent.includes(t)), outText, { timeout: 15000 });
  log('B odszyfrował A:', outText);

  // B → A (odpowiedź)
  const reply = 'Dzięki. Powoli, ale jest lepiej.';
  await B.page.fill('#msg-input', reply);
  await B.page.click('#msg-send');
  await A.page.waitForFunction((t) => [...document.querySelectorAll('.msg.in')].some((m) => m.textContent.includes(t)), reply, { timeout: 15000 });
  log('A odszyfrował B:', reply);

  // negatywnie: treść nie może przeciekać w metadanych sieci (sprawdzone w teście integracyjnym);
  // tu potwierdzamy, że różne konta = różne pseudonimy
  if (A.pseudo === B.pseudo) throw new Error('pseudonimy się powtórzyły');

  if (process.env.SHOT) {
    await B.page.setViewportSize({ width: 430, height: 860 });
    await B.page.screenshot({ path: join(ROOT, 'scripts', 'thread.png') });
    log('zrzut ekranu: scripts/thread.png');
  }
  await browser.close();
  log('OK — pełna rozmowa 1:1 działa w przeglądarce (E2E przez prawdziwy serwer)');
}

main()
  .then(() => { killApi(); web?.close(); process.exit(0); })
  .catch((e) => { console.error('✖ TEST FAILED:', e.message); killApi(); web?.close(); process.exit(1); });
