/* Krąg — E2E „Ida Rozumie" (opt-in). Backend z atrapą modelu (IDA_MOCK=1) — bez Anthropic.
 * Dowodzi pełnej pętli: klient → auth → /ida/ask → ugruntowana odpowiedź z etykietą AI.
 * Uruchom: node scripts/e2e-ai.mjs
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
const API_PORT = 8250, WEB_PORT = 8251;
const API = `http://localhost:${API_PORT}`, WEB = `http://localhost:${WEB_PORT}`;
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };

let apiProc, web, pass = 0, fail = 0;
const ok = (c, l) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ FAIL ') + l); };

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
    { cwd: join(ROOT, 'server'), env: { ...process.env, PORT: String(API_PORT), POW_BITS: '10', IDA_MOCK: '1' }, stdio: 'ignore', detached: true });
  return waitHealth();
}
function killApi() { try { if (apiProc?.pid) process.kill(-apiProc.pid); } catch { /* gone */ } }
async function waitHealth() {
  for (let i = 0; i < 40; i++) { try { const r = await fetch(`${API}/health`); if (r.ok) return; } catch { /* retry */ } await new Promise((r) => setTimeout(r, 250)); }
  throw new Error('dev-server nie wstał');
}

async function main() {
  await startWeb(); await startApi();
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.addInitScript((api) => { window.KRAG_API_BASE = api; }, API);
  page.on('pageerror', (e) => { console.log('  [pageerror]', e.message); fail++; });
  await page.goto(WEB);
  await page.click('#go-anon'); await page.waitForSelector('#s-ida.on', { timeout: 20000 });

  // Ida rozumie OD RAZU: jest backend (atrapa modelu), więc pytanie wiedzowe idzie przez
  // /ida/ask bez żadnego przełącznika. Uwaga: „gdzie do lekarza" przechwytuje lokalny
  // finder placówek (#3), więc testujemy pytaniem wiedzowym (U=U).
  await page.fill('#ida-input', 'co to znaczy niewykrywalny'); await page.click('#ida-send');
  await page.waitForFunction(() => /aitag/.test(document.querySelector('#ida-log')?.innerHTML || ''), { timeout: 10000 });
  const html = await page.innerHTML('#ida-log');
  ok(/aitag/.test(html), 'Ida rozumie od razu → odpowiedź z etykietą „AI" (bez przełącznika)');
  ok(/faktów Kręgu|Circle facts/.test(html), 'odpowiedź AI ugruntowana (nota o faktach)');
  ok(/trust/.test(html), 'AI: etykiety zaufania z użytych faktów');

  // W profilu NIE ma już przełącznika „Ida Rozumie" (Ida rozumie od początku)
  await page.click('.tab[data-tab="profile"]'); await page.waitForSelector('#s-profile.on');
  ok(!(await page.$('#pf-ai')), 'brak przełącznika „Ida Rozumie" w profilu');

  console.log(`\n=== ${pass} PASS · ${fail} FAIL ===`);
  await browser.close();
  if (fail) throw new Error('E2E AI nie przeszło');
}
main().then(() => { killApi(); web?.close(); process.exit(0); })
  .catch((e) => { console.error('✖', e.message); killApi(); web?.close(); process.exit(1); });
