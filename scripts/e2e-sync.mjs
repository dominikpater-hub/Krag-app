/* Krąg — E2E logowania frazą + synchronizacji profilu (sejf E2E).
 * Urządzenie A: wchodzi z zaproszenia, ustawia pseudonim+język, odczytuje frazę.
 * Urządzenie B (osobny kontekst = inny „telefon"): loguje się TĄ frazą i widzi ten sam profil.
 * Sprawdza też, że serwer trzyma tylko szyfrogram (nie widać pseudonimu w sejfie).
 * Uruchom: node scripts/e2e-sync.mjs
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
const API_PORT = 8098, WEB_PORT = 8099;
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
    { cwd: join(ROOT, 'server'), env: { ...process.env, PORT: String(API_PORT) }, stdio: 'ignore', detached: true });
  return waitHealth();
}
function killApi() { try { if (apiProc?.pid) process.kill(-apiProc.pid); } catch { /* gone */ } }
async function waitHealth() {
  for (let i = 0; i < 40; i++) { try { const r = await fetch(`${API}/health`); if (r.ok) return; } catch { /* retry */ } await new Promise((r) => setTimeout(r, 250)); }
  throw new Error('dev-server nie wstał');
}
async function newDevice(browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.addInitScript((api) => { window.KRAG_API_BASE = api; }, API);
  page.on('pageerror', (e) => { console.log('  [pageerror]', e.message); fail++; });
  await page.goto(WEB);
  return page;
}

async function main() {
  await startWeb(); log('static PWA na', WEB);
  await startApi(); log('dev-server (pg-mem) na', API);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });

  // ——— Urządzenie A: onboarding + profil ———
  const A = await newDevice(browser);
  await A.click('#go-invite');
  await A.fill('#invite-code', 'KRAG-DEMO-0001');
  await A.click('#go-keys');
  await A.waitForSelector('#s-keys.on');
  const handle = (await A.textContent('#pseudo')).trim();
  await A.click('#go-recovery');
  const seed = (await A.textContent('#seed')).replace(/\d+\.\s*/g, '').trim().split(/\s+/).join(' ');
  await A.check('#seed-ack');
  await A.click('#go-enter');
  await A.waitForSelector('#s-ida.on', { timeout: 15000 });
  ok(!!seed && seed.split(' ').length === 12, 'A: fraza odzyskiwania ma 12 słów');

  // A ustawia profil: pseudonim + język uk
  await A.click('.tab[data-tab="profile"]');
  await A.waitForSelector('#s-profile.on');
  await A.fill('#pf-pseudo', 'Wschodni Wiatr');
  await A.selectOption('#pf-lang', 'uk');
  await A.selectOption('#pf-role', 'partner');
  await A.click('#pf-save');
  await A.waitForFunction(() => document.querySelector('#sync-state')?.textContent?.includes('zsynchronizowano'), { timeout: 10000 });
  ok(true, 'A: profil zapisany i zsynchronizowany (sejf wypchnięty)');

  // ——— Urządzenie B: logowanie frazą A ———
  const B = await newDevice(browser);
  await B.click('#go-login');
  await B.waitForSelector('#s-login.on');
  await B.fill('#login-phrase', seed);
  await B.click('#go-login-do');
  await B.waitForSelector('#s-ida.on', { timeout: 15000 });
  ok(true, 'B: zalogowano frazą A (konto odtworzone z sejfu)');

  await B.click('.tab[data-tab="profile"]');
  await B.waitForSelector('#s-profile.on');
  const bPseudo = await B.inputValue('#pf-pseudo');
  const bLang = await B.inputValue('#pf-lang');
  const bRole = await B.inputValue('#pf-role');
  const bHandle = (await B.textContent('#pf-handle')).trim();
  ok(bPseudo === 'Wschodni Wiatr', `B: pseudonim zsynchronizowany ("${bPseudo}")`);
  ok(bLang === 'uk', `B: język zsynchronizowany (${bLang})`);
  ok(bRole === 'partner', `B: rola zsynchronizowana (${bRole})`);
  ok(bHandle === handle, 'B: ten sam adres sieciowy (klucz odtworzony z sejfu)');

  // serwer: surowy sejf to szyfrogram bez pseudonimu w jawnym tekście
  const bLookup = await B.evaluate(async (words) => {
    const { vaultLookupId } = await import('./lib/vault.js');
    return vaultLookupId(words.split(' '));
  }, seed);
  const vaultRes = await fetch(`${API}/vault/${bLookup}`).then((r) => r.json());
  ok(typeof vaultRes.ciphertext === 'string' && !vaultRes.ciphertext.includes('Wschodni'),
    'serwer: sejf to szyfrogram — pseudonim NIE w jawnym tekście');

  console.log(`\n=== ${pass} PASS · ${fail} FAIL ===`);
  await browser.close();
  if (fail) throw new Error('E2E synchronizacji nie przeszło');
}
main().then(() => { killApi(); web?.close(); process.exit(0); })
  .catch((e) => { console.error('✖', e.message); killApi(); web?.close(); process.exit(1); });
