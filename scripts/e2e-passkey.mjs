/* Krąg — E2E ścieżki passkey (Face ID / odcisk) przez wirtualny authenticator z PRF.
 * A: zakłada konto passkeyem → wchodzi. Potem czyścimy stan lokalny (jak nowe urządzenie
 * z tym samym, zsynchronizowanym passkeyem) i logujemy się passkeyem — konto się odtwarza.
 * Dowodzi: create+PRF → sekret → sejf; unlock+PRF → master → sejf → klucze. Serwer ślepy.
 * Uruchom: node scripts/e2e-passkey.mjs
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
const API_PORT = 8102, WEB_PORT = 8104;   // WEB na localhost → rpId 'localhost' dla WebAuthn
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
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.addInitScript((api) => { window.KRAG_API_BASE = api; }, API);
  page.on('pageerror', (e) => { console.log('  [pageerror]', e.message); fail++; });

  // wirtualny authenticator z PRF (symuluje telefon z Face ID / odciskiem) — na sesji TEJ strony
  const client = await ctx.newCDPSession(page);
  await client.send('WebAuthn.enable');
  await client.send('WebAuthn.addVirtualAuthenticator', {
    options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, hasPrf: true, automaticPresenceSimulation: true, isUserVerified: true },
  });

  await page.goto(WEB);
  ok(await page.isVisible('#go-passkey'), 'przycisk „Face ID / odcisk" widoczny (WebAuthn wykryty)');
  await page.click('#go-passkey');
  await page.waitForSelector('#s-keycode.on', { timeout: 20000 });
  ok(true, 'passkey utworzony (PRF) → konto założone → pokazano Klucz Kręgu');
  await page.check('#kc-ack');
  await page.click('#kc-enter');
  await page.waitForSelector('#s-ida.on', { timeout: 15000 });
  await page.click('.tab[data-tab="profile"]');
  await page.waitForSelector('#s-profile.on');
  const handle = (await page.textContent('#pf-handle')).trim();
  await page.fill('#pf-pseudo', 'Nocny Ton');
  await page.selectOption('#pf-gram', 'm');
  await page.click('#pf-save');
  await page.waitForFunction(() => document.querySelector('#sync-state')?.textContent?.includes('zsynchronizowano'), { timeout: 10000 });
  ok(true, 'profil zapisany i zsynchronizowany');

  // „Nowe urządzenie z tym samym passkeyem": czyścimy stan lokalny, ten sam authenticator zostaje.
  await page.evaluate(() => new Promise((res) => { const r = indexedDB.deleteDatabase('krag-local'); r.onsuccess = r.onerror = () => res(); }));
  await page.reload();
  await page.waitForSelector('#s-welcome.on');
  await page.click('#go-login');
  await page.waitForSelector('#s-login.on');
  ok(await page.isVisible('#login-passkey'), 'przycisk logowania passkeyem widoczny');
  await page.click('#login-passkey');
  await page.waitForSelector('#s-ida.on', { timeout: 15000 });
  ok(true, 'zalogowano passkeyem (konto odtworzone z sejfu przez PRF)');
  await page.click('.tab[data-tab="profile"]');
  await page.waitForSelector('#s-profile.on');
  ok((await page.inputValue('#pf-pseudo')) === 'Nocny Ton', 'profil zsynchronizowany przez passkey');
  ok((await page.textContent('#pf-handle')).trim() === handle, 'ten sam adres sieciowy (klucze z sejfu)');

  console.log(`\n=== ${pass} PASS · ${fail} FAIL ===`);
  await browser.close();
  if (fail) throw new Error('E2E passkey nie przeszło');
}
main().then(() => { killApi(); web?.close(); process.exit(0); })
  .catch((e) => { console.error('✖', e.message); killApi(); web?.close(); process.exit(1); });
