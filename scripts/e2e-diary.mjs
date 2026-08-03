/* Krąg — E2E Dziennika (#7): wyniki+wykres, trener odporności (#8), leki, wizyty, zdjęcie,
 * dane demo, usuwanie. Wszystko lokalne (bez backendu). Uruchom: node scripts/e2e-diary.mjs
 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright-core');

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const WEB_PORT = 8140, WEB = `http://localhost:${WEB_PORT}`;
const DEAD_API = 'http://127.0.0.1:9';   // dziennik jest lokalny — backend niepotrzebny
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
// 1x1 PNG
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC', 'base64');

async function main() {
  await startWeb();
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.addInitScript((api) => { window.KRAG_API_BASE = api; }, DEAD_API);
  page.on('pageerror', (e) => { console.log('  [pageerror]', e.message); fail++; });
  await page.goto(WEB);
  await page.click('#go-anon');
  await page.waitForSelector('#s-ida.on', { timeout: 20000 });
  await page.click('.tab[data-tab="diary"]');
  await page.waitForSelector('#s-diary.on');

  // wynik CD4 #1
  await page.selectOption('#d-marker', 'cd4');
  await page.fill('#d-val', '210'); await page.click('#d-add-result');
  await page.waitForFunction(() => /210/.test(document.querySelector('#d-results')?.textContent || ''), { timeout: 5000 });
  // wynik CD4 #2 → wykres + trener (rośnie)
  await page.fill('#d-val', '268'); await page.click('#d-add-result');
  await page.waitForFunction(() => document.querySelector('#d-chart svg'), { timeout: 5000 });
  ok(true, 'wyniki CD4 + wykres trajektorii');
  await page.waitForFunction(() => /Trener|Immunity|Тренер/.test(document.querySelector('#coach-card')?.textContent || ''), { timeout: 5000 });
  ok(/268/.test(await page.textContent('#coach-card')), 'trener odporności pojawia się i czyta ostatnie CD4');

  // wiremia poniżej progu → U=U w trenerze
  await page.selectOption('#d-marker', 'vl');
  await page.fill('#d-val', '20'); await page.click('#d-add-result');
  await page.waitForFunction(() => /U=U|U＝U|U=U/.test(document.querySelector('#coach-card')?.textContent || '') || /U=U/.test(document.querySelector('#coach-card')?.textContent || ''), { timeout: 5000 }).catch(() => {});
  ok(/U=U/.test(await page.textContent('#coach-card')), 'wiremia < 50 → trener pokazuje U=U');

  // lek
  await page.fill('#d-med-name', 'Biktarvy'); await page.fill('#d-med-dose', '1 tabl.');
  await page.click('#d-add-med');
  await page.waitForFunction(() => /Biktarvy/.test(document.querySelector('#d-meds')?.textContent || ''), { timeout: 5000 });
  ok(true, 'lek dodany');

  // wizyta
  await page.fill('#d-visit-title', 'Kontrola'); await page.click('#d-add-visit');
  await page.waitForFunction(() => /Kontrola/.test(document.querySelector('#d-visits')?.textContent || ''), { timeout: 5000 });
  ok(true, 'wizyta dodana');

  // zdjęcie badania (upload)
  await page.setInputFiles('#d-photo-in', { name: 'wynik.png', mimeType: 'image/png', buffer: PNG });
  await page.waitForFunction(() => document.querySelector('#d-photos .ph img'), { timeout: 5000 });
  ok(true, 'zdjęcie badania wgrane (miniatura)');

  // usuwanie wyniku
  const before = await page.evaluate(() => document.querySelectorAll('#d-results .d-item').length);
  await page.click('#d-results .d-item .x');
  await page.waitForFunction((n) => document.querySelectorAll('#d-results .d-item').length < n, before, { timeout: 5000 });
  ok(true, 'usuwanie wpisu działa');

  console.log(`\n=== ${pass} PASS · ${fail} FAIL ===`);
  await browser.close();
  if (fail) throw new Error('E2E dziennika nie przeszło');
}
main().then(() => { web?.close(); process.exit(0); })
  .catch((e) => { console.error('✖', e.message); web?.close(); process.exit(1); });
