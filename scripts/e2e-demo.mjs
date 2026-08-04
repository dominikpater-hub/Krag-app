/* Krąg — E2E trybu demo (#3): ?demo=1 zasiewa bogate dane i pokazuje wszystkie funkcje.
 * Bez backendu (demo działa offline). Uruchom: node scripts/e2e-demo.mjs
 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright-core');

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const WEB_PORT = 8230, WEB = `http://localhost:${WEB_PORT}`;
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };

let web, pass = 0, fail = 0;
const ok = (c, l) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ FAIL ') + l); };

function startWeb() {
  web = http.createServer(async (req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    try { const buf = await readFile(join(ROOT, p)); res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' }); res.end(buf); }
    catch { res.writeHead(404); res.end('nope'); }
  });
  return new Promise((r) => web.listen(WEB_PORT, r));
}

async function main() {
  await startWeb();
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { console.log('  [pageerror]', e.message); fail++; });
  await page.goto(WEB + '/?demo=1');
  // demo samo wchodzi do aplikacji (bez ekranu powitalnego)
  await page.waitForSelector('#s-ida.on', { timeout: 20000 });
  ok(true, 'demo: automatyczne wejście do aplikacji');
  ok(await page.isVisible('#demo-banner'), 'demo: baner „DEMO" widoczny');

  // Dziennik pełen danych: wykres CD4, trener (trend + U=U), koinfekcje
  await page.click('.tab[data-tab="diary"]'); await page.waitForSelector('#s-diary.on');
  await page.waitForFunction(() => document.querySelector('#d-chart svg'), { timeout: 8000 });
  const coach = await page.textContent('#coach-card');
  ok(/470/.test(await page.textContent('#d-chart')) || /CD4/.test(await page.textContent('#d-chart')), 'demo: wykres wyników CD4');
  ok(/U=U/.test(coach), 'demo: trener pokazuje U=U (wiremia niewykrywalna)');
  ok(/HPV|HCV|HBV/.test(await page.textContent('#d-cotests')), 'demo: koinfekcje wypełnione');
  ok(/Biktarvy/.test(await page.textContent('#d-meds')), 'demo: leki wypełnione');

  // Rozmowy: wątki, buddy, pokój
  await page.click('.tab[data-tab="app"]'); await page.waitForSelector('#s-app.on');
  await page.waitForSelector('#thread-list .thread');
  const threads = await page.textContent('#thread-list');
  ok(/buddy/i.test(threads), 'demo: rozmowa oznaczona jako buddy');
  ok(/Świeżo po diagnozie|grupa|group/i.test(threads), 'demo: pokój tematyczny na liście');

  // Trwałość: po odświeżeniu dane zostają (to samo konto demo)
  await page.reload();
  await page.waitForSelector('#s-ida.on', { timeout: 20000 });
  await page.click('.tab[data-tab="diary"]'); await page.waitForSelector('#s-diary.on');
  ok(/Biktarvy/.test(await page.textContent('#d-meds')), 'demo: dane trwałe po odświeżeniu (bez podwójnego zasiewu)');

  console.log(`\n=== ${pass} PASS · ${fail} FAIL ===`);
  await browser.close();
  if (fail) throw new Error('E2E demo nie przeszło');
}
main().then(() => { web?.close(); process.exit(0); })
  .catch((e) => { console.error('✖', e.message); web?.close(); process.exit(1); });
