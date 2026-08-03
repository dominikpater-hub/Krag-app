/* Krąg — E2E lokalizacji UI (PL/EN/UK/RU). Zmiana języka w profilu tłumaczy interfejs
 * i wypowiedzi Idy; fakty medyczne zostają PO POLSKU z etykietą „źródło: polski".
 * Uruchom: node scripts/e2e-i18n.mjs
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
const API_PORT = 8130, WEB_PORT = 8131;
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

async function main() {
  await startWeb(); log('static PWA na', WEB);
  await startApi(); log('dev-server (pg-mem) na', API);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext({ locale: 'pl-PL' });
  const page = await ctx.newPage();
  await page.addInitScript((api) => { window.KRAG_API_BASE = api; }, API);
  page.on('pageerror', (e) => { console.log('  [pageerror]', e.message); fail++; });
  await page.goto(WEB);

  ok((await page.textContent('#go-anon')) === 'Wejdź', 'start po polsku (autodetekcja pl-PL)');
  await page.click('#go-anon');
  await page.waitForSelector('#s-ida.on', { timeout: 20000 });

  // przełącz na angielski
  await page.click('.tab[data-tab="profile"]'); await page.waitForSelector('#s-profile.on');
  await page.selectOption('#pf-lang', 'en');
  await page.click('#pf-save');
  // UI tłumaczy się synchronicznie po zapisie; poczekaj wprost na przetłumaczony przycisk (bez wyścigu z sync).
  await page.waitForFunction(() => document.querySelector('#pf-save')?.textContent === 'Save and sync', { timeout: 10000 });
  ok((await page.textContent('#pf-save')) === 'Save and sync', 'profil przetłumaczony na EN');
  ok((await page.textContent('.tab[data-tab="ida"] span:last-child')) === 'Ida', 'zakładki po EN');

  // Ida wita po angielsku i odpowiada, fakt PL z etykietą źródła
  await page.click('.tab[data-tab="ida"]'); await page.waitForSelector('#s-ida.on');
  await page.waitForFunction(() => /I am Ida/.test(document.querySelector('#ida-log .ida-msg.ida')?.innerHTML || ''), { timeout: 8000 });
  ok(true, 'Ida wita po angielsku');
  await page.fill('#ida-input', 'co to znaczy niewykrywalny'); await page.click('#ida-send');
  await page.waitForFunction(() => document.querySelectorAll('#ida-log .ida-msg.ida').length >= 2, { timeout: 8000 });
  const html = await page.evaluate(() => [...document.querySelectorAll('#ida-log .ida-msg.ida')].pop().innerHTML);
  ok(/source: Polish/.test(html), 'poza PL: fakt oznaczony „source: Polish"');
  ok(/niewykrywaln/i.test(html), 'sam fakt pozostaje po polsku (treść medyczna)');

  // przełącz na ukraiński — sprawdź inny ekran
  await page.click('.tab[data-tab="profile"]'); await page.waitForSelector('#s-profile.on');
  await page.selectOption('#pf-lang', 'uk'); await page.click('#pf-save');
  await page.waitForTimeout(300);
  ok((await page.textContent('#pf-save')) === 'Зберегти та синхронізувати', 'profil przetłumaczony na UK');

  console.log(`\n=== ${pass} PASS · ${fail} FAIL ===`);
  await browser.close();
  if (fail) throw new Error('E2E i18n nie przeszło');
}
main().then(() => { killApi(); web?.close(); process.exit(0); })
  .catch((e) => { console.error('✖', e.message); killApi(); web?.close(); process.exit(1); });
