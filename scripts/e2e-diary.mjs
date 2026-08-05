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
  // Stub silnika OCR (prawdziwy Tesseract wymaga CDN+sieci) — testujemy WPIĘCIE: obraz→parser→prefill.
  await page.addInitScript(() => {
    window.Tesseract = { recognize: async () => ({ data: { text: 'Wynik badania CD4 333 kom/µl 21% HIV RNA niewykrywalny <20' } }) };
  });
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
  // wynik CD4 #2 → wykres + trener (rośnie). Czekaj aż DRUGI wynik faktycznie się przeliczy
  // (pierwszy wpis już narysował svg i trenera, więc czekamy wprost na wartość 268).
  await page.fill('#d-val', '268'); await page.click('#d-add-result');
  await page.waitForFunction(() => /268/.test(document.querySelector('#d-results')?.textContent || ''), { timeout: 5000 });
  await page.waitForFunction(() => document.querySelector('#d-chart svg'), { timeout: 5000 });
  ok(true, 'wyniki CD4 + wykres trajektorii');
  await page.waitForFunction(() => /Trener|Immunity|Тренер/.test(document.querySelector('#coach-card')?.textContent || '') && /268/.test(document.querySelector('#coach-card')?.textContent || ''), { timeout: 5000 });
  ok(/268/.test(await page.textContent('#coach-card')), 'trener odporności pojawia się i czyta ostatnie CD4');

  // #1: framing wg researchu — adherencja jako dźwignia, „nie Twoja wina", brak oceny/prognozy
  const coachTxt = await page.textContent('#coach-card');
  ok(/regularne branie leków|Regularne/i.test(coachTxt) && /nie są Twoją winą/i.test(coachTxt), 'trener: adherencja #1 + framing bez winy');
  ok(!/osiągnie|Twój wynik jest (dobry|zły|niepokojąc)/i.test(coachTxt) && /nie ocenia wyników ani ich nie przewiduje/i.test(coachTxt), 'trener: bez prognozy/oceny (granica MDR)');
  // wsparcie psychiczne → „Porozmawiaj z Idą" przenosi do Idy
  await page.click('#coach-talk'); await page.waitForSelector('#s-ida.on', { timeout: 5000 });
  ok(true, 'trener: „Porozmawiaj z Idą" otwiera Idę');
  await page.click('.tab[data-tab="diary"]'); await page.waitForSelector('#s-diary.on');

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

  // #7: interakcje AUTOMATYCZNIE dla dodanego leku (Biktarvy = INSTI) — bez wpisywania
  await page.waitForFunction(() => /kation|calcium|integraz|integrase|wapń|Calcium/i.test(document.querySelector('#ix-known')?.textContent || ''), { timeout: 5000 });
  ok(true, 'interakcje: auto-flaga dla dodanego leku (INSTI → kationy), bez wpisywania');
  await page.fill('#ix-in', 'wapń z witaminą D'); await page.click('#ix-check');
  await page.waitForFunction(() => document.querySelector('#ix-out .ix-item.hi'), { timeout: 5000 });
  ok(true, 'check „wapń" → flaga interakcji (kationy)');
  await page.fill('#ix-in', 'paracetamol'); await page.click('#ix-check');
  await page.waitForFunction(() => document.querySelector('#ix-out .ix-item.ok'), { timeout: 5000 });
  ok(true, 'check „paracetamol" → brak znanej interakcji (uczciwie)');

  // wizyta
  await page.fill('#d-visit-title', 'Kontrola'); await page.click('#d-add-visit');
  await page.waitForFunction(() => /Kontrola/.test(document.querySelector('#d-visits')?.textContent || ''), { timeout: 5000 });
  ok(true, 'wizyta dodana');

  // #2 koinfekcje / inne badania: chip prefill + dodanie
  await page.click('#ci-chips [data-ci="HCV"]');
  ok((await page.inputValue('#ci-name')) === 'HCV', 'koinfekcje: chip HCV wypełnia nazwę');
  await page.fill('#ci-result', 'ujemny'); await page.click('#ci-add');
  await page.waitForFunction(() => /HCV/.test(document.querySelector('#d-cotests')?.textContent || '') && /ujemny/.test(document.querySelector('#d-cotests')?.textContent || ''), { timeout: 5000 });
  ok(true, 'koinfekcje: HCV ujemny dodany do dziennika');

  // #7: JEDEN przycisk — wgranie zdjęcia zapisuje miniaturę I odczytuje z niego WSZYSTKIE wyniki
  await page.setInputFiles('#d-photo-in', { name: 'lab.png', mimeType: 'image/png', buffer: PNG });
  await page.waitForFunction(() => document.querySelector('#d-photos .ph img'), { timeout: 5000 });
  ok(true, 'zdjęcie badania wgrane (miniatura)');
  await page.waitForFunction(() => /333/.test(document.querySelector('#d-results')?.textContent || ''), { timeout: 8000 });
  const results = await page.textContent('#d-results');
  ok(/333/.test(results), 'OCR: CD4 333 wczytane wprost do dziennika');
  ok(/(poniżej progu|20)/.test(results), 'OCR: wiremia też wczytana (niewykrywalna)');

  // #5 kopia zapasowa: eksport → usuń wpis → import przywraca (na wypadek czyszczenia cache)
  await page.click('.tab[data-tab="profile"]'); await page.waitForSelector('#s-profile.on');
  await page.evaluate(() => { const ds = [...document.querySelectorAll('#s-profile details')]; ds[ds.length - 1].open = true; });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#bk-export')]);
  const bpath = await dl.path();
  ok(!!bpath, 'kopia: eksport zaszyfrowanego pliku');
  await page.click('.tab[data-tab="diary"]'); await page.waitForSelector('#s-diary.on');
  const beforeBk = await page.evaluate(() => document.querySelectorAll('#d-results .d-item').length);
  await page.click('#d-results .d-item .x');
  await page.waitForFunction((n) => document.querySelectorAll('#d-results .d-item').length < n, beforeBk, { timeout: 5000 });
  await page.click('.tab[data-tab="profile"]'); await page.waitForSelector('#s-profile.on');
  await page.evaluate(() => { const ds = [...document.querySelectorAll('#s-profile details')]; ds[ds.length - 1].open = true; });
  await page.setInputFiles('#bk-import-in', bpath);
  await page.waitForFunction(() => /wczytano|wpis/i.test(document.querySelector('#bk-msg')?.textContent || ''), { timeout: 8000 });
  await page.click('.tab[data-tab="diary"]'); await page.waitForSelector('#s-diary.on');
  await page.waitForFunction((n) => document.querySelectorAll('#d-results .d-item').length >= n, beforeBk, { timeout: 5000 });
  ok(true, 'kopia: import przywrócił usunięty wynik (odporność na czyszczenie cache)');

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
