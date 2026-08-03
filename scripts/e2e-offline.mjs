/* Krąg — E2E trybu lokalnego (bez backendu). Odtwarza błąd z produkcji: „Wejdź anonimowo"
 * rzucało „Failed to fetch", bo backendu nie ma. Po naprawie wejście działa lokalnie:
 * konto na urządzeniu, Klucz Kręgu, Ida i dziennik — wszystko bez serwera.
 * Uruchom: node scripts/e2e-offline.mjs   (świadomie NIE startujemy dev-servera)
 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright-core');

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const WEB_PORT = 8106, WEB = `http://localhost:${WEB_PORT}`;
const DEAD_API = 'http://127.0.0.1:9';   // nikt nie słucha → „Failed to fetch"
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
  await page.addInitScript((api) => { window.KRAG_API_BASE = api; }, DEAD_API);   // backend nieosiągalny
  page.on('pageerror', (e) => { console.log('  [pageerror]', e.message); fail++; });
  await page.goto(WEB);

  await page.click('#go-anon');
  await page.waitForSelector('#s-ida.on', { timeout: 20000 });
  ok(true, 'bez backendu: „Wejdź anonimowo" wchodzi lokalnie (nie „Failed to fetch")');
  const err = (await page.textContent('#boot-err')).trim();
  ok(err === '', 'brak komunikatu błędu na ekranie wejścia (był: "' + err + '")');

  // Ida odpowiada lokalnie (baza wiedzy nie potrzebuje serwera)
  await page.fill('#ida-input', 'co to znaczy niewykrywalny');
  await page.click('#ida-send');
  await page.waitForFunction(() => document.querySelectorAll('#ida-log .ida-msg.ida').length >= 2, { timeout: 8000 });
  ok(true, 'Ida odpowiada lokalnie (baza wiedzy offline)');

  // Dziennik zapisuje lokalnie
  await page.click('.tab[data-tab="diary"]'); await page.waitForSelector('#s-diary.on');
  await page.fill('#diary-note', 'wpis offline'); await page.click('#diary-save');
  await page.waitForFunction(() => /wpis offline/.test(document.querySelector('#diary-list')?.textContent || ''), { timeout: 5000 });
  ok(true, 'dziennik zapisuje lokalnie bez serwera');

  // Po restarcie konto się odtwarza (bez serwera)
  await page.reload();
  await page.waitForSelector('#s-ida.on', { timeout: 15000 });
  ok(true, 'po restarcie konto odtwarza się lokalnie (nie wraca na ekran wejścia)');

  console.log(`\n=== ${pass} PASS · ${fail} FAIL ===`);
  await browser.close();
  if (fail) throw new Error('E2E offline nie przeszło');
}
main().then(() => { web?.close(); process.exit(0); })
  .catch((e) => { console.error('✖', e.message); web?.close(); process.exit(1); });
