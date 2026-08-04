/* Krąg — klient PWA (Faza 3.6). Spięty z backendem.
 * Wejście z zaproszenia → logowanie kluczem → rozmowy 1:1 szyfrowane end-to-end.
 * Krypto klienta: lib/e2e.js (interim ECDH→AES-GCM; docelowo libsignal).
 * API: lib/api.js. Tożsamość/logowanie: lib/identity.js.
 * Klucz prywatny i dziennik zdrowia nie opuszczają tego urządzenia.
 */
import { API_BASE } from './config.js';
import { makeClient } from './lib/api.js';
import { generateAuthKeyPair, authPublicB64, signNonce, exportAuthKeyPair, importAuthKeyPair } from './lib/identity.js';
import { generateKeyPair, publicKeyB64, deriveSessionKey, encrypt, decrypt, envelope, exportMsgKeyPair, importMsgKeyPair } from './lib/e2e.js';
import { findFacts, idaCandidates, resetThread, setRole, BLOCKNAME, confBadge, MED_BLOCKS, isPos, FACTS } from './lib/ida.js';
import { risky, stopMeds, CRISIS_LINE, CRISIS_EU } from './lib/crisis.js';
import { emotional } from './lib/emotion.js';
import { PROV, PATHS_DB } from './lib/knowledge.js';
import { fromSecretBytes, seal, open } from './lib/vault.js';
import { newKeycode, parseKeycode, qrSvg, encodeKeycode } from './lib/keycode.js';
import { passkeyAvailable, createPasskey, unlockPasskey } from './lib/passkey.js';
import { solvePow } from './lib/pow.js';
import jsQR from './lib/jsqr.js';
import { t, setLang, detectLang, translateDOM, LANGS as LANG_LIST } from './lib/i18n.js';
import { knownFor, checkSubstance } from './lib/interactions.js';
import { parseInviteFromSearch } from './lib/invite.js';
import { parseLabValues, pickPrefill, ocrImage } from './lib/ocr.js';
import { BACKUP_STORES, pickNew, makePayload, readPayload } from './lib/backup.js';
import { buildDemoData } from './lib/demo-seed.js';
import { roomPeerKey, isRoomPeer, roomIdFromPeer, parseRoomPayload, fanout } from './lib/rooms.js';

'use strict';
const $ = (s) => document.querySelector(s);
const MAIN_TABS = { ida: 1, app: 1, diary: 1, profile: 1 };

/* ---------- nawigacja ---------- */
function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('on', s.id === 's-' + id));
  const tb = $('#tabbar');
  if (tb) {
    tb.hidden = !MAIN_TABS[id];
    tb.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.dataset.tab === id));
  }
  window.scrollTo(0, 0);
}
document.querySelectorAll('[data-back]').forEach((b) =>
  b.addEventListener('click', () => show(b.dataset.back)));
$('#tabbar').querySelectorAll('.tab').forEach((t) =>
  t.addEventListener('click', () => {
    show(t.dataset.tab);
    if (t.dataset.tab === 'ida') idaFirstOpen();
    if (t.dataset.tab === 'profile') renderProfile();
  }));

/* ---------- stan ---------- */
const api = makeClient(API_BASE);
const account = { authKeyPair: null, msgKeyPair: null, pubRaw: null, pseudo: null, master: null };
// master: 32 bajty „Klucza Kręgu" (bytes). Z niego wyprowadzamy sejf (lib/vault.js).
// Profil: pseudonim (nazwa wyświetlana), język, rola. Synchronizowany E2E przez sejf (lib/vault.js).
const profile = { pseudonym: null, lang: 'pl', role: 'plhiv', gram: 'n', ai: false };
// Forma gramatyczna zwracania się do użytkownika (płeć językowa): f/m/neutralna.
function toast(msg) {
  let el = document.querySelector('#toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('on');
  const dur = Math.min(7000, 2600 + msg.length * 28);   // dłuższe komunikaty — dłużej widoczne
  clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('on'), dur);
}
const sessionKeys = new Map();   // peer -> CryptoKey (AES-GCM)
const unread = new Map();        // peer -> liczba nieprzeczytanych
let currentPeer = null;
let poller = null;

/* ---------- IndexedDB (v2): konto, dziennik, wątki, wiadomości ---------- */
function db() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('krag-local', 3);
    r.onupgradeneeded = () => {
      const d = r.result;
      if (!d.objectStoreNames.contains('diary')) d.createObjectStore('diary', { keyPath: 'ts' });
      if (!d.objectStoreNames.contains('account')) d.createObjectStore('account', { keyPath: 'k' });
      if (!d.objectStoreNames.contains('messages')) {
        const ms = d.createObjectStore('messages', { keyPath: 'id' });
        ms.createIndex('peer', 'peer', { unique: false });
      }
      if (!d.objectStoreNames.contains('threads')) d.createObjectStore('threads', { keyPath: 'peer' });
      if (!d.objectStoreNames.contains('rooms')) d.createObjectStore('rooms', { keyPath: 'roomId' }); // #6/2 pokoje
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function put(store, val) {
  const d = await db();
  return new Promise((res, rej) => {
    const tx = d.transaction(store, 'readwrite'); tx.objectStore(store).put(val);
    tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
  });
}
async function get(store, key) {
  const d = await db();
  return new Promise((res, rej) => {
    const rq = d.transaction(store, 'readonly').objectStore(store).get(key);
    rq.onsuccess = () => res(rq.result || null); rq.onerror = () => rej(rq.error);
  });
}
async function all(store) {
  const d = await db();
  return new Promise((res, rej) => {
    const rq = d.transaction(store, 'readonly').objectStore(store).getAll();
    rq.onsuccess = () => res(rq.result || []); rq.onerror = () => rej(rq.error);
  });
}
async function wipe() { indexedDB.deleteDatabase('krag-local'); }

async function requestPersist() {
  try { if (navigator.storage?.persist) return await navigator.storage.persist(); } catch { /* noop */ }
  return false;
}

/* ---------- konto: klucz + pseudonim ---------- */
const ADJ = ['Cichy', 'Spokojny', 'Wschodni', 'Jasny', 'Ciepły', 'Nocny', 'Daleki', 'Miękki'];
const NOU = ['Świt', 'Rzeka', 'Wiatr', 'Brzeg', 'Kamień', 'Ogród', 'Ton', 'Światło'];
function hex(bytes, n) { return Array.from(bytes.slice(0, n)).map((b) => b.toString(16).padStart(2, '0')).join(''); }
function pseudoFrom(hash) {
  return `${ADJ[hash[0] % ADJ.length]} ${NOU[hash[1] % NOU.length]} #${hex(hash.slice(2), 2).toUpperCase()}`;
}
async function generateAccount() {
  account.authKeyPair = await generateAuthKeyPair();               // ECDSA — logowanie
  account.msgKeyPair = await generateKeyPair();                    // ECDH — wiadomości
  account.pubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', account.authKeyPair.publicKey));
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', account.pubRaw));
  account.pseudo = pseudoFrom(hash);
}

/* ---------- logowanie / sieć ---------- */
function setDot(state) {
  const d = $('#conn-dot');
  d.classList.remove('on', 'off');
  if (state === 'on') d.classList.add('on');
  else if (state === 'off') d.classList.add('off');
  d.setAttribute('aria-label', t(state === 'off' ? 'conn.off' : 'conn.on'));
}
// #2: kropka połączenia jest dotykalna — wyjaśnia, co znaczy „offline".
$('#conn-dot').addEventListener('click', () => toast(t($('#conn-dot').classList.contains('off') ? 'conn.off' : 'conn.on')));
async function login() {
  await api.login(account.pseudo, (nonce) => signNonce(account.authKeyPair, nonce));
}
/** wykonuje operację API; przy wygasłej sesji loguje się ponownie i próbuje raz jeszcze */
async function withAuth(op) {
  try { return await op(); }
  catch (e) {
    if (/Sesja|Brak tokenu|401/.test(String(e.message))) { await login(); return op(); }
    throw e;
  }
}
async function publishMyKeys() {
  const pk = await publicKeyB64(account.msgKeyPair);
  await withAuth(() => api.publishKeys(pk, pk, []));
}
async function sessionFor(peer) {
  if (sessionKeys.has(peer)) return sessionKeys.get(peer);
  const bundle = await withAuth(() => api.fetchKeys(peer));
  const key = await deriveSessionKey(account.msgKeyPair, bundle.identityKey);
  sessionKeys.set(peer, key);
  return key;
}

/* ---------- przepływ wejścia (bez zaproszeń: passkey · anonimowo · Klucz Kręgu) ---------- */
if (passkeyAvailable()) { $('#go-passkey').hidden = false; $('#login-passkey').hidden = false; }
$('#go-login').addEventListener('click', () => { $('#login-err').textContent = ''; show('login'); });

// Błąd „brak backendu" (sieć niedostępna albo serwer nie odpowiada) — wtedy działamy lokalnie.
function isNetErr(e) {
  return /Failed to fetch|NetworkError|Load failed|HTTP 0|HTTP 404|HTTP 405|HTTP 5\d\d/i.test(String(e && e.message));
}
// Rejestracja na serwerze (PoW zamiast zaproszenia). Zakłada, że klucze już są wygenerowane.
async function registerNow() {
  const pub = await authPublicB64(account.authKeyPair);
  const { challenge, bits } = await api.powChallenge();
  await api.register(account.pseudo, pub, { challenge, nonce: solvePow(challenge, bits) });
  await login();
  await publishMyKeys();
}
// Login; a jeśli konta nie ma na serwerze (założone offline) — zarejestruj je i utwórz sejf.
async function ensureServerAccount() {
  try { await login(); await publishMyKeys(); }
  catch (e) {
    if (/nieznany pseudonim|404/i.test(String(e.message))) { await registerNow(); await backupVault(); }
    else throw e;
  }
}
async function persistAccount() {
  await put('account', {
    k: 'me', pseudo: account.pseudo, pubRaw: Array.from(account.pubRaw),
    authKeyPair: account.authKeyPair, msgKeyPair: account.msgKeyPair,
  });
  await put('account', { k: 'master', v: Array.from(account.master) });
  await persistProfile();
  await requestPersist();
}

$('#go-anon').addEventListener('click', () => signup({ passkey: false }));
$('#go-passkey').addEventListener('click', () => signup({ passkey: true }));

async function signup({ passkey }) {
  const btn = passkey ? $('#go-passkey') : $('#go-anon');
  btn.disabled = true; $('#boot-err').textContent = '';
  let pkSecret = null;
  try {
    if (passkey) {
      $('#boot-err').textContent = 'Potwierdź passkeyem…';
      try { pkSecret = (await createPasskey('Krąg')).secret; }
      catch (e) { throw new Error('passkey się nie udał (' + e.message + '). Możesz wejść anonimowo.'); }
    }
    $('#boot-err').textContent = 'Zakładam konto…';
    const kc = newKeycode();                 // master = Klucz Kręgu (32 B)
    account.master = kc.bytes;
    await generateAccount();                    // klucze + pseudonim — ZAWSZE lokalnie
    profile.pseudonym = account.pseudo;
    // Rejestracja + sejf. Gdy backendu nie ma — wchodzimy lokalnie, reszta dołączy później.
    try {
      $('#boot-err').textContent = 'Zakładam konto… (chwila liczenia)';
      await registerNow();
      await backupVault();                     // sejf pod lookupId(master)
      if (pkSecret) {                          // passkey odblokowuje sejf: kopia mastera pod lookupId(PRF)
        const pk = await fromSecretBytes(pkSecret);
        const wrap = await seal({ master: Array.from(account.master) }, pk.key);
        await withAuth(() => api.putVault(pk.lookupId, wrap));
      }
    } catch (e) {
      if (!isNetErr(e)) throw e;              // prawdziwy błąd pokazujemy; brak sieci — nie
      console.warn('rejestracja offline — konto działa lokalnie:', e.message);
      setSync('off');
    }
    await persistAccount();
    $('#boot-err').textContent = '';
    // #4: nie wpychamy Klucza Kręgu przy wejściu — jest w Profilu, gdy user go zechce.
    await enterApp();
  } catch (e) {
    $('#boot-err').textContent = 'Nie udało się: ' + e.message;
    btn.disabled = false;
  }
}

// Ekran „Twój Klucz Kręgu" (QR + kopiuj) → wejście.
function presentKeycode(code) {
  $('#kc-qr').innerHTML = qrSvg(code);
  $('#kc-code').textContent = code;
  $('#kc-ack').checked = false; $('#kc-enter').disabled = true; $('#kc-err').textContent = '';
  show('keycode');
}
$('#kc-ack').addEventListener('change', (e) => { $('#kc-enter').disabled = !e.target.checked; });
$('#kc-copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('#kc-code').textContent); toast('Skopiowano Klucz Kręgu.'); }
  catch { $('#kc-err').textContent = 'Zaznacz klucz i skopiuj ręcznie.'; }
});
$('#kc-enter').addEventListener('click', () => enterApp());

// —— Logowanie na nowym urządzeniu ——
$('#login-passkey').addEventListener('click', async () => {
  const btn = $('#login-passkey'); btn.disabled = true; $('#login-err').textContent = 'Potwierdź passkeyem…';
  try {
    const secret = await unlockPasskey();
    if (!secret) throw new Error('brak PRF — użyj Klucza Kręgu.');
    const pk = await fromSecretBytes(secret);
    let masterBytes;
    try { const { ciphertext } = await api.getVault(pk.lookupId); masterBytes = new Uint8Array((await open(ciphertext, pk.key)).master); }
    catch { throw new Error('nie znaleziono konta dla tego passkeya.'); }
    await loginWithMaster(masterBytes);
  } catch (e) { $('#login-err').textContent = 'Nie udało się: ' + e.message; btn.disabled = false; }
});
// —— skaner QR Klucza Kręgu (zawsze widoczny; brak kamery obsłużony w startScan) ——
let scanStream = null, scanRAF = null;
function stopScan() {
  const ov = $('#scan-ov'); if (ov) ov.hidden = true;
  if (scanRAF) { cancelAnimationFrame(scanRAF); scanRAF = null; }
  if (scanStream) { scanStream.getTracks().forEach((t) => t.stop()); scanStream = null; }
}
async function startScan() {
  const ov = $('#scan-ov'), vid = $('#scan-vid'); $('#scan-msg').textContent = t('scan.hint'); ov.hidden = false;
  try { scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); }
  catch { $('#scan-msg').textContent = t('scan.deny'); return; }
  vid.srcObject = scanStream; try { await vid.play(); } catch { /* noop */ }
  const cv = document.createElement('canvas'); const ctx = cv.getContext('2d', { willReadFrequently: true });
  const tick = () => {
    if (!scanStream) return;
    if (vid.readyState >= 2 && vid.videoWidth) {
      cv.width = vid.videoWidth; cv.height = vid.videoHeight;
      ctx.drawImage(vid, 0, 0, cv.width, cv.height);
      const img = ctx.getImageData(0, 0, cv.width, cv.height);
      const res = jsQR(img.data, img.width, img.height);
      if (res) { const bytes = parseKeycode(res.data); if (bytes) { $('#login-keycode').value = res.data; stopScan(); loginWithMaster(bytes).catch((e) => { $('#login-err').textContent = 'Nie udało się: ' + e.message; }); return; } }
    }
    scanRAF = requestAnimationFrame(tick);
  };
  scanRAF = requestAnimationFrame(tick);
}
$('#login-scan').addEventListener('click', startScan);
$('#scan-cancel').addEventListener('click', stopScan);

$('#login-do').addEventListener('click', async () => {
  const bytes = parseKeycode($('#login-keycode').value);
  if (!bytes) { $('#login-err').textContent = 'To nie wygląda na Klucz Kręgu (krag1:…).'; return; }
  const btn = $('#login-do'); btn.disabled = true; $('#login-err').textContent = 'Odszyfrowuję sejf…';
  try { await loginWithMaster(bytes); }
  catch (e) { $('#login-err').textContent = 'Nie udało się: ' + e.message; btn.disabled = false; }
});

// Wspólne: master → sejf → klucze/profil → login → wejście.
async function loginWithMaster(masterBytes) {
  const m = await fromSecretBytes(masterBytes);
  let bundle;
  try { const { ciphertext } = await api.getVault(m.lookupId); bundle = await open(ciphertext, m.key); }
  catch (e) { throw new Error(/404|nie istnieje/i.test(e.message) ? 'nie znaleziono konta dla tego klucza.' : 'klucz nie pasuje do sejfu.'); }
  account.master = masterBytes;
  account.pseudo = bundle.pseudo;
  account.pubRaw = new Uint8Array(bundle.pubRaw || []);
  account.authKeyPair = await importAuthKeyPair(bundle.auth);
  account.msgKeyPair = await importMsgKeyPair(bundle.msg);
  Object.assign(profile, bundle.profile || {});
  if (!profile.pseudonym) profile.pseudonym = account.pseudo;
  await persistAccount();
  await enterApp();
}

/* ---------- tryb DEMO (#3): produkcja = odbicie, z bogatymi danymi lokalnie ---------- */
function demoMode() {
  try {
    return new URLSearchParams(location.search).get('demo') === '1'
      || document.querySelector('meta[name="krag-demo"]')?.content === '1';
  } catch { return false; }
}
async function startDemo() {
  const kc = newKeycode(); account.master = kc.bytes;
  await generateAccount();
  profile.pseudonym = account.pseudo;
  const data = buildDemoData(account.pseudo, Date.now());
  for (const store of Object.keys(data)) for (const it of data[store]) await put(store, it);
  await persistAccount();
  document.body.classList.add('demo');
  let b = document.querySelector('#demo-banner');
  if (!b) { b = document.createElement('div'); b.id = 'demo-banner'; document.body.appendChild(b); }
  b.textContent = t('demo.banner');
  await enterApp({ background: true });   // offline; backend niepotrzebny
}

/* ---------- odtworzenie konta przy starcie ---------- */
async function tryRestore() {
  const me = await get('account', 'me');
  if (!me || !me.authKeyPair) return false;
  account.pseudo = me.pseudo;
  account.pubRaw = new Uint8Array(me.pubRaw || []);
  account.authKeyPair = me.authKeyPair;
  account.msgKeyPair = me.msgKeyPair;
  try { const m = (await get('account', 'master'))?.v; account.master = m ? new Uint8Array(m) : null; } catch { /* noop */ }
  await enterApp({ background: true, pull: true });
  return true;
}

/* ---------- wejście do aplikacji ---------- */
async function enterApp(opts = {}) {
  $('#me-pseudo').textContent = account.pseudo;
  // #6/#8: kropka połączenia i znacznik sync mają sens tylko z backendem. Bez niego — ukryj,
  // żeby nie straszyć wiecznym „offline". (API_BASE puste = produkcja/demo bez wpiętego serwera.)
  const be = !!API_BASE;
  const cd = $('#conn-dot'); if (cd) cd.style.display = be ? '' : 'none';
  const ss = $('#sync-state'); if (ss) ss.style.display = be ? '' : 'none';
  await initRole();
  show('ida');
  idaFirstOpen();
  await renderThreads();
  await renderDiaryStatus();
  // Sieć w tle. Brak backendu NIE blokuje wejścia — Ida/dziennik/profil działają lokalnie.
  const connect = (async () => {
    try {
      await ensureServerAccount();             // login albo rejestracja konta założonego offline
      setDot('on');
      if (opts.pull) { try { await pullVault(); setSync('on'); } catch { /* brak sejfu — trudno */ } }
      startPolling();
      await consumePendingInvite();              // link-zaproszenie: otwórz rozmowę, gdy klucze gotowe
    } catch (e) {
      setDot('off');                            // tryb lokalny (np. produkcja bez wpiętego backendu)
      console.warn('offline:', e && e.message);
    }
  })();
  if (!opts.background) await connect;
}

// Link-zaproszenie: ?k=<uchwyt> w URL → po wejściu otwórz rozmowę z tą osobą.
let pendingInvite = null;
async function consumePendingInvite() {
  const peer = pendingInvite;
  if (!peer) return;
  pendingInvite = null;
  try { history.replaceState(null, '', location.pathname); } catch { /* noop */ }
  if (peer === account.pseudo) return;           // własny link — ignoruj
  try { await sessionFor(peer); await openThread(peer); toast(t('inv.opened')); }
  catch { toast(t('inv.notFound')); }
}

function startPolling() {
  if (poller) return;
  const tick = async () => {
    try { await pullOnce(); setDot('on'); }
    catch { setDot('off'); }
  };
  tick();
  poller = setInterval(tick, 4000);
}

async function pullOnce() {
  const { envelopes } = await withAuth(() => api.pullEnvelopes());
  if (!envelopes.length) return;
  for (const env of envelopes) {
    if (await get('messages', env.id)) continue;           // dedupe
    let text;
    try {
      const key = await sessionFor(env.from);
      text = await decrypt(key, envelope.unpack(env.ciphertext));
    } catch { text = '⚠️ nie udało się odszyfrować'; }
    const ts = env.at ? new Date(env.at).getTime() : Date.now();
    // Wiadomość pokojowa? Ładunek niesie roomId — trafia do wątku pokoju, z podpisem nadawcy.
    const rp = parseRoomPayload(text);
    if (rp) {
      const peer = roomPeerKey(rp.roomId);
      await ensureRoom(rp.roomId);
      const label = env.from.split(' #')[0] + ': ' + rp.text;
      await put('messages', { id: env.id, peer, dir: 'in', text: label, ts });
      await put('threads', { peer, ts });
      if (currentPeer !== peer) unread.set(peer, (unread.get(peer) || 0) + 1);
      continue;
    }
    await put('messages', { id: env.id, peer: env.from, dir: 'in', text, ts });
    await put('threads', { peer: env.from, ts });
    if (currentPeer !== env.from) unread.set(env.from, (unread.get(env.from) || 0) + 1);
  }
  await renderThreads();
  if (currentPeer) await renderMessages(currentPeer);
}

/* ---------- lista wątków ---------- */
async function renderThreads() {
  const threads = await all('threads');
  const box = $('#thread-list');
  if (!threads.length) {
    box.innerHTML = `<div class="threads-empty">${t('app.empty')}</div>`;
    return;
  }
  threads.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const msgs = await all('messages');
  const rmap = {}; for (const r of await all('rooms')) rmap[r.roomId] = r;
  const lastByPeer = {};
  for (const m of msgs) {
    if (!lastByPeer[m.peer] || m.ts > lastByPeer[m.peer].ts) lastByPeer[m.peer] = m;
  }
  box.innerHTML = threads.map((th) => {
    const last = lastByPeer[th.peer];
    const preview = last ? (last.dir === 'out' ? 'Ty: ' : '') + last.text : t('app.newConvo');
    const n = unread.get(th.peer) || 0;
    const room = isRoomPeer(th.peer);
    const nm = room ? ((rmap[roomIdFromPeer(th.peer)]?.name) || t('room.one')) : th.peer.split(' #')[0];
    const tag = (room ? ` <span class="grouptag">${t('room.tag')}</span>` : '') + (th.buddy ? ` <span class="grouptag buddy">★ ${t('th.buddyTag')}</span>` : '');
    return `<div class="thread" data-peer="${encodeURIComponent(th.peer)}">
      <div><div class="nm">${escapeHtml(nm)}${tag}</div><div class="last">${escapeHtml(preview)}</div></div>
      ${n ? `<span class="badge-n">${n}</span>` : ''}
    </div>`;
  }).join('');
  box.querySelectorAll('.thread').forEach((el) =>
    el.addEventListener('click', () => openThread(decodeURIComponent(el.dataset.peer))));
}

/* ---------- otwarcie / render wątku ---------- */
async function openThread(peer) {
  currentPeer = peer;
  unread.set(peer, 0);
  const prev = await get('threads', peer);
  await put('threads', { ...(prev || {}), peer, ts: prev?.ts || Date.now() });   // zachowaj m.in. flagę buddy
  // #2: gwiazdka „buddy/mentor" tylko dla rozmów 1:1 (nie dla pokojów)
  const bb = $('#thread-buddy');
  if (bb) { bb.hidden = isRoomPeer(peer); bb.textContent = prev?.buddy ? '★' : '☆'; bb.classList.toggle('on', !!prev?.buddy); }
  if (isRoomPeer(peer)) {
    const r = await get('rooms', roomIdFromPeer(peer));
    $('#thread-peer').textContent = (r && r.name) || t('room.one');
  } else {
    $('#thread-peer').textContent = peer.split(' #')[0];
  }
  // Zgłoszenie 1:1 nie ma sensu w pokoju — ukryj.
  const rep = $('#thread-report'); if (rep) rep.hidden = isRoomPeer(peer);
  show('thread');
  await renderMessages(peer);
  $('#msg-input').focus();
}
async function renderMessages(peer) {
  const msgs = (await all('messages')).filter((m) => m.peer === peer).sort((a, b) => a.ts - b.ts);
  const box = $('#msg-list');
  box.innerHTML = msgs.map((m) =>
    `<div class="msg ${m.dir}">${escapeHtml(m.text)}<span class="t">${fmt(m.ts)}</span></div>`).join('');
  box.scrollTop = box.scrollHeight;
}

$('#start-thread').addEventListener('click', async () => {
  const peer = $('#peer-input').value.trim();
  $('#peer-err').textContent = '';
  if (!/^.+ #[0-9A-F]{4}$/.test(peer)) {
    $('#peer-err').textContent = 'Podaj pełny pseudonim, np. „Spokojna Rzeka #C3D4”.';
    return;
  }
  if (peer === account.pseudo) { $('#peer-err').textContent = 'To Twój pseudonim.'; return; }
  try {
    await sessionFor(peer);                    // sprawdza, że osoba istnieje i ma klucze
  } catch (e) {
    $('#peer-err').textContent = /Nieznany|Brak/.test(e.message)
      ? 'Nie znaleziono takiej osoby (albo nie opublikowała kluczy).' : e.message;
    return;
  }
  $('#peer-input').value = '';
  await openThread(peer);
});

/* ---------- wysyłka ---------- */
async function sendMessage() {
  const input = $('#msg-input');
  const text = input.value.trim();
  if (!text || !currentPeer) return;
  input.value = '';
  const id = crypto.randomUUID();
  const ts = Date.now();
  await put('messages', { id, peer: currentPeer, dir: 'out', text, ts });
  await put('threads', { peer: currentPeer, ts });
  await renderMessages(currentPeer);
  try {
    if (isRoomPeer(currentPeer)) await sendRoomMessage(roomIdFromPeer(currentPeer), text);
    else {
      const key = await sessionFor(currentPeer);
      const wire = envelope.pack(await encrypt(key, text));
      await withAuth(() => api.sendEnvelope(currentPeer, wire));
    }
  } catch (e) {
    await put('messages', { id, peer: currentPeer, dir: 'out', text: text + '  ⚠️ niewysłane', ts });
    await renderMessages(currentPeer);
  }
}
// Pokój: rozgłoszenie E2E per-odbiorca — szyfrujemy OSOBNO do każdego członka (bez klucza grupowego).
async function sendRoomMessage(roomId, text) {
  const { members } = await withAuth(() => api.roomMembers(roomId));
  const sealFor = async (member, payload) => {
    const key = await sessionFor(member);
    return envelope.pack(await encrypt(key, payload));
  };
  const envs = await fanout({ roomId, members, self: account.pseudo, text }, sealFor);
  for (const e of envs) { try { await withAuth(() => api.sendEnvelope(e.to, e.ciphertext)); } catch { /* jednego się nie dało — reszta idzie */ } }
}
$('#msg-send').addEventListener('click', sendMessage);
$('#msg-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });
$('#thread-back').addEventListener('click', async () => { currentPeer = null; show('app'); await renderThreads(); });
// #2: oznacz rozmówcę jako swojego buddy/mentora (lokalnie, tylko u Ciebie)
$('#thread-buddy').addEventListener('click', async () => {
  if (!currentPeer || isRoomPeer(currentPeer)) return;
  const th = (await get('threads', currentPeer)) || { peer: currentPeer, ts: Date.now() };
  th.buddy = !th.buddy;
  await put('threads', th);
  const bb = $('#thread-buddy'); bb.textContent = th.buddy ? '★' : '☆'; bb.classList.toggle('on', th.buddy);
  toast(t(th.buddy ? 'th.buddyOn' : 'th.buddyOff'));
  await renderThreads();
});

/* ---------- zgłoszenie / moderacja (K-26, wstępnie) ---------- */
$('#thread-report').addEventListener('click', async () => {
  if (!currentPeer) return;
  if (!confirm(`Zgłosić „${currentPeer.split(' #')[0]}” do moderacji?`)) return;
  const last = (await all('messages')).filter((m) => m.peer === currentPeer && m.dir === 'in').sort((a, b) => b.ts - a.ts)[0];
  try {
    await withAuth(() => api.report(currentPeer, last ? last.text : '(zgłoszenie bez cytatu)'));
    alert('Zgłoszenie przyjęte. Zajmie się nim moderacja.');
  } catch (e) { alert('Nie udało się wysłać zgłoszenia: ' + e.message); }
});

/* ---------- Katalog (#6): opt-in ogłoszenia, okolica bez GPS, start rozmowy ---------- */
$('#app-cat').addEventListener('click', openCatalog);
// #10: discovery-first — wprost z ekranu Rozmów prowadzimy do katalogu i pokojów.
$('#disc-cat').addEventListener('click', openCatalog);
$('#disc-rooms').addEventListener('click', openRooms);
$('#cat-back').addEventListener('click', () => show('app'));
$('#cat-search').addEventListener('click', catSearch);
$('#cat-f-region').addEventListener('keydown', (e) => { if (e.key === 'Enter') catSearch(); });
$('#cat-f-tag').addEventListener('keydown', (e) => { if (e.key === 'Enter') catSearch(); });
async function openCatalog() { show('catalog'); await catSearch(); }
async function catSearch() {
  const box = $('#cat-list'); $('#cat-err').textContent = '';
  try {
    const { listings } = await withAuth(() => api.catalogList($('#cat-f-region').value.trim(), $('#cat-f-tag').value.trim(), $('#cat-f-mentor').checked));
    if (!listings.length) { box.innerHTML = `<div class="threads-empty">${t('cat.none')}</div>`; return; }
    box.innerHTML = listings.map((l) => {
      const me = l.pseudonym === account.pseudo;
      const nm = escapeHtml(l.pseudonym.split(' #')[0]);
      const badge = l.mentor ? ` <span class="grouptag">${t('cat.mentorBadge')}</span>` : '';
      const meta = [escapeHtml(l.region || ''), escapeHtml(l.tags || '')].filter(Boolean).join(' · ');
      return `<div class="thread"><div style="min-width:0"><div class="nm">${nm}${badge} ${me ? `<span style="color:var(--tx-3);font-size:11px">${t('cat.you')}</span>` : ''}</div>${meta ? `<div class="last">${meta}</div>` : ''}${l.bio ? `<div class="last">${escapeHtml(l.bio)}</div>` : ''}</div>${me ? '' : `<button class="btn ghost sm" data-write="${encodeURIComponent(l.pseudonym)}" style="width:auto;padding:8px 12px;margin:0">${t('cat.write')}</button>`}</div>`;
    }).join('');
    box.querySelectorAll('[data-write]').forEach((e) => e.addEventListener('click', () => startChatWith(decodeURIComponent(e.dataset.write))));
  } catch { box.innerHTML = ''; $('#cat-err').textContent = t('cat.offline'); }
}
$('#cat-publish').addEventListener('click', async () => {
  try { await withAuth(() => api.catalogPut($('#cat-region').value.trim(), $('#cat-tags').value.trim(), $('#cat-bio').value.trim(), $('#cat-mentor').checked)); toast(t('d.saved')); await catSearch(); }
  catch { $('#cat-err').textContent = t('cat.offline'); }
});
$('#cat-f-mentor').addEventListener('change', catSearch);
$('#cat-remove').addEventListener('click', async () => {
  try { await withAuth(() => api.catalogDelete()); $('#cat-region').value = ''; $('#cat-tags').value = ''; $('#cat-bio').value = ''; toast(t('d.saved')); await catSearch(); }
  catch { $('#cat-err').textContent = t('cat.offline'); }
});
async function startChatWith(peer) {
  try { await sessionFor(peer); await openThread(peer); }
  catch (e) { $('#cat-err').textContent = e.message; }
}

/* ---------- Pokoje tematyczne (#6/2): grupy z E2E per-odbiorca ---------- */
async function ensureRoom(roomId, name) {
  const cur = await get('rooms', roomId);
  if (!cur || (name && cur.name !== name)) await put('rooms', { roomId, name: (name || cur?.name || ''), ts: Date.now() });
}
$('#app-rooms').addEventListener('click', openRooms);
$('#rooms-back').addEventListener('click', () => show('app'));
$('#rooms-search').addEventListener('click', roomSearch);
$('#rooms-f').addEventListener('keydown', (e) => { if (e.key === 'Enter') roomSearch(); });
async function openRooms() { show('rooms'); await roomSearch(); }
async function roomSearch() {
  const box = $('#rooms-list'); $('#rooms-err').textContent = '';
  try {
    const mine = {}; for (const r of await all('rooms')) mine[r.roomId] = true;
    const { rooms } = await withAuth(() => api.roomList($('#rooms-f').value.trim()));
    if (!rooms.length) { box.innerHTML = `<div class="threads-empty">${t('room.none')}</div>`; return; }
    box.innerHTML = rooms.map((r) => {
      const joined = mine[r.id];
      const cnt = t('room.count', { n: r.members });
      const btn = joined
        ? `<button class="btn ghost sm" data-open="${r.id}" data-name="${escapeHtml(r.name)}" style="width:auto;padding:8px 12px;margin:0">${t('room.open')}</button>`
        : `<button class="btn ghost sm" data-join="${r.id}" data-name="${escapeHtml(r.name)}" style="width:auto;padding:8px 12px;margin:0">${t('room.join')}</button>`;
      return `<div class="thread"><div style="min-width:0"><div class="nm">${escapeHtml(r.name)}</div><div class="last">${cnt}</div></div>${btn}</div>`;
    }).join('');
    box.querySelectorAll('[data-join]').forEach((e) => e.addEventListener('click', () => joinRoom(e.dataset.join, e.dataset.name)));
    box.querySelectorAll('[data-open]').forEach((e) => e.addEventListener('click', () => openRoomThread(e.dataset.open, e.dataset.name)));
  } catch { box.innerHTML = ''; $('#rooms-err').textContent = t('cat.offline'); }
}
$('#rooms-create').addEventListener('click', async () => {
  const name = ($('#rooms-name').value || '').trim();
  if (!name) { $('#rooms-err').textContent = t('room.needName'); return; }
  try {
    const { id } = await withAuth(() => api.roomCreate(name));
    await ensureRoom(id, name);
    $('#rooms-name').value = '';
    await openRoomThread(id, name);
  } catch { $('#rooms-err').textContent = t('cat.offline'); }
});
async function joinRoom(id, name) {
  try { await withAuth(() => api.roomJoin(id)); await ensureRoom(id, name); await openRoomThread(id, name); }
  catch { $('#rooms-err').textContent = t('cat.offline'); }
}
async function openRoomThread(id, name) {
  await ensureRoom(id, name);
  await openThread(roomPeerKey(id));
}

/* ---------- Dziennik (#7): wyniki+wykres, leki, wizyty, zdjęcia, notatki, trener (#8) ---------- */
async function del(store, key) {
  const d = await db();
  return new Promise((res, rej) => { const tx = d.transaction(store, 'readwrite'); tx.objectStore(store).delete(key); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
}
async function renderDiaryStatus() {
  const persisted = navigator.storage?.persisted ? await navigator.storage.persisted() : false;
  const ds = $('#diary-state'); if (ds) ds.textContent = 'ok' + (persisted ? ' · trwałe' : '');
  const ss = $('#sw-state'); if (ss) ss.textContent = ('serviceWorker' in navigator) ? 'ok' : '—';
  const dt = $('#d-date'); if (dt && !dt.value) dt.value = new Date().toISOString().slice(0, 10);
  await renderDiary();
}
const dstr = (v) => { try { return new Date(v).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }); } catch { return v; } };
const kind = (i, k) => (i.kind || 'note') === k;

async function renderDiary() {
  const items = await all('diary');
  renderResults(items);
  renderCoach(items);
  fill('#d-meds', items.filter((i) => kind(i, 'med')),
    (m) => `<span><span class="v">${escapeHtml(m.name)}</span> <span class="sub">${escapeHtml(m.dose || '')}${m.time ? ' · ' + escapeHtml(m.time) : ''}</span></span>`);
  fill('#d-visits', items.filter((i) => kind(i, 'visit')).sort((a, b) => (a.date || '').localeCompare(b.date || '')),
    (v) => `<span><span class="v">${escapeHtml(v.title)}</span> <span class="sub">${escapeHtml(v.date || '')}</span></span>`);
  // #2 koinfekcje / inne badania: nazwa + wynik + data
  fill('#d-cotests', items.filter((i) => kind(i, 'cotest')).sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    (c) => `<span><span class="v">${escapeHtml(c.name)}</span> ${c.result ? '<span class="sub">' + escapeHtml(c.result) + '</span>' : ''}${c.date ? ' <span class="sub">· ' + escapeHtml(c.date) + '</span>' : ''}</span>`);
  renderInteractions(items);
  renderCoinfectionChips();
  fill('#d-notes', items.filter((i) => kind(i, 'note')).sort((a, b) => b.ts - a.ts),
    (n) => `<span><span class="sub">${dstr(n.ts)}</span> ${escapeHtml(n.note)}</span>`);
  renderPhotos(items.filter((i) => kind(i, 'photo')));
}
function fill(sel, list, row) {
  const box = $(sel); if (!box) return;
  box.innerHTML = list.length
    ? list.map((i) => `<div class="d-item">${row(i)}<span class="x" data-del="${i.ts}">${t('d.del')}</span></div>`).join('')
    : `<div class="d-empty">${t('d.none')}</div>`;
  box.querySelectorAll('[data-del]').forEach((e) => e.addEventListener('click', async () => { await del('diary', Number(e.dataset.del)); await renderDiary(); }));
}
function sparkline(series, color) {
  const vs = series.map((p) => p.v), mn = Math.min(...vs), mx = Math.max(...vs), span = (mx - mn) || 1, n = series.length;
  const xy = (p, i) => [n === 1 ? 50 : (i / (n - 1)) * 100, 28 - ((p.v - mn) / span) * 24];
  const pts = series.map((p, i) => xy(p, i).map((z) => z.toFixed(1)).join(',')).join(' ');
  const dots = series.map((p, i) => { const [x, y] = xy(p, i); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.7" fill="${color}"/>`; }).join('');
  return `<svg viewBox="0 0 100 30" preserveAspectRatio="none" style="height:44px"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" vector-effect="non-scaling-stroke"/>${dots}</svg>`;
}
function renderResults(items) {
  const res = items.filter((i) => kind(i, 'result'));
  const box = $('#d-chart'); const list = $('#d-results');
  const series = (mk) => res.filter((r) => r.marker === mk).sort((a, b) => (a.date || '').localeCompare(b.date || '')).map((r) => ({ v: r.v, date: r.date }));
  const cd4 = series('cd4'), vl = series('vl');
  let chart = '';
  if (cd4.length) chart += sparkline(cd4, '#7E9B77') + `<div class="lg"><i><span class="sw" style="background:#7E9B77"></span>CD4 · ${cd4[cd4.length - 1].v}</i></div>`;
  if (vl.length) { const last = vl[vl.length - 1].v; chart += sparkline(vl, '#C98A6B') + `<div class="lg"><i><span class="sw" style="background:#C98A6B"></span>VL · ${last < 50 ? t('d.undetectable') : last}</i></div>`; }
  if (box) box.innerHTML = chart;
  if (list) {
    const rows = res.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    list.innerHTML = rows.length
      ? rows.map((r) => `<div class="d-item"><span><span class="v">${r.marker === 'cd4' ? 'CD4' : 'VL'} ${r.marker === 'vl' && r.v < 50 ? t('d.undetectable') : r.v}</span> <span class="sub">${escapeHtml(r.date || '')}</span></span><span class="x" data-del="${r.ts}">${t('d.del')}</span></div>`).join('')
      : `<div class="d-empty">${t('d.none')}</div>`;
    list.querySelectorAll('[data-del]').forEach((e) => e.addEventListener('click', async () => { await del('diary', Number(e.dataset.del)); await renderDiary(); }));
  }
}
function renderPhotos(list) {
  const box = $('#d-photos'); if (!box) return;
  box.innerHTML = list.sort((a, b) => b.ts - a.ts).map((p) =>
    `<div class="ph"><img src="${p.img}" alt="badanie"><span class="x" data-del="${p.ts}">✕</span></div>`).join('');
  box.querySelectorAll('[data-del]').forEach((e) => e.addEventListener('click', async () => { await del('diary', Number(e.dataset.del)); await renderDiary(); }));
}
// Trener odporności (#8, wpleciony) — na danych z dziennika, wspierający i NIEdiagnostyczny.
// Zasady z researchu: pokazuje dane + ogólną wiedzę, NIE ocenia wyniku i NIE prognozuje
// (granica wyrobu medycznego, MDR reguła 11). Adherencja = jedyna udowodniona „dźwignia".
// „Samopoczucie ≠ CD4" mówimy wprost. Framing bez winy + wsparcie psychiczne z dostępem do Idy.
function renderCoach(items) {
  const box = $('#coach-card'); if (!box) return;
  const cd4 = items.filter((i) => kind(i, 'result') && i.marker === 'cd4').sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const vl = items.filter((i) => kind(i, 'result') && i.marker === 'vl').sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  if (!cd4.length && !vl.length) { box.innerHTML = ''; return; }
  const lines = [];
  if (cd4.length) {
    const last = cd4[cd4.length - 1].v;
    let line = t('coach.cd4now', { v: last });
    if (cd4.length >= 2) {
      const prev = cd4[cd4.length - 2].v;
      line += ' ' + (last > prev ? t('coach.trendUp') : last < prev ? t('coach.trendDown') : t('coach.trendFlat'));
    }
    lines.push(line);
    lines.push(t('coach.phases'));                              // fazy + „nie Twoja wina"
    if (last >= 500) lines.push(t('coach.m500')); else if (last >= 200) lines.push(t('coach.m200'));  // kontekst, nie ocena
  }
  if (vl.length && vl[vl.length - 1].v < 50) lines.push(t('coach.uu'));
  lines.push(t('coach.adh'));                                   // jedyna udowodniona dźwignia
  lines.push(t('coach.wellbeing'));                             // samopoczucie ≠ CD4 (uczciwie)
  box.innerHTML = `<div class="coach"><h3>◈ ${t('coach.title')}</h3>${lines.map((l) => `<div class="mile"><span class="b">·</span> ${l}</div>`).join('')}
    <div class="coach-mind"><span>${t('coach.mind')}</span> <button class="linklike" id="coach-talk" type="button">${t('coach.mindCta')}</button></div>
    <p style="margin:10px 0 0;font-size:12px;color:var(--tx-3)">${t('coach.note')}</p></div>`;
  const talk = $('#coach-talk');
  if (talk) talk.addEventListener('click', () => { show('ida'); idaFirstOpen(); });
}

// —— interakcje leków (#7) ——
function ixRow(h) {
  return `<div class="ix-item ${h.sev === 'high' ? 'hi' : 'med'}"><div>${escapeHtml(h.msg)}</div><div class="ix-adv">${escapeHtml(h.adv)}</div></div>`;
}
function renderInteractions(items) {
  const box = $('#ix-known'); if (!box) return;
  const meds = items.filter((i) => kind(i, 'med')).map((m) => m.name);
  if (!meds.length) { box.innerHTML = `<div class="d-empty">${t('ix.addMeds')}</div>`; return; }
  const known = knownFor(meds, getI18nLang());
  box.innerHTML = known.length ? `<div class="ctx">${t('ix.known')}</div>${known.map(ixRow).join('')}` : '';
}
async function runIxCheck() {
  const q = ($('#ix-in').value || '').trim(); const out = $('#ix-out'); if (!out) return;
  if (!q) { out.innerHTML = ''; return; }
  const meds = (await all('diary')).filter((i) => kind(i, 'med')).map((m) => m.name);
  const hits = checkSubstance(meds, q, getI18nLang());
  out.innerHTML = hits.length ? hits.map(ixRow).join('') : `<div class="ix-item ok">${t('ix.none')}</div>`;
}
$('#ix-check').addEventListener('click', runIxCheck);
$('#ix-in').addEventListener('keydown', (e) => { if (e.key === 'Enter') runIxCheck(); });

// —— dodawanie wpisów ——
function today() { return ($('#d-date') && $('#d-date').value) || new Date().toISOString().slice(0, 10); }
$('#d-add-result').addEventListener('click', async () => {
  const v = Number($('#d-val').value); if (!v && v !== 0) return;
  await put('diary', { ts: Date.now(), kind: 'result', marker: $('#d-marker').value, v, date: today() });
  $('#d-val').value = ''; await renderDiary(); toast(t('d.saved'));
});
$('#d-add-med').addEventListener('click', async () => {
  const name = ($('#d-med-name').value || '').trim(); if (!name) return;
  await put('diary', { ts: Date.now(), kind: 'med', name, dose: ($('#d-med-dose').value || '').trim(), time: $('#d-med-time').value || '' });
  $('#d-med-name').value = ''; $('#d-med-dose').value = ''; await renderDiary(); toast(t('d.saved'));
});
$('#d-add-visit').addEventListener('click', async () => {
  const title = ($('#d-visit-title').value || '').trim(); if (!title) return;
  await put('diary', { ts: Date.now(), kind: 'visit', title, date: $('#d-visit-date').value || '' });
  $('#d-visit-title').value = ''; await renderDiary(); toast(t('d.saved'));
});
// #2 koinfekcje/inne badania: szybkie podpowiedzi (chipy) + dodawanie
function renderCoinfectionChips() {
  const box = $('#ci-chips'); if (!box) return;
  const chips = t('d.cotestChips').split(',').map((s) => s.trim()).filter(Boolean);
  box.innerHTML = chips.map((c) => `<button class="chip sm" type="button" data-ci="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('');
  box.querySelectorAll('[data-ci]').forEach((e) => e.addEventListener('click', () => { $('#ci-name').value = e.dataset.ci; $('#ci-result').focus(); }));
}
$('#ci-add').addEventListener('click', async () => {
  const name = ($('#ci-name').value || '').trim(); if (!name) return;
  await put('diary', { ts: Date.now(), kind: 'cotest', name, result: ($('#ci-result').value || '').trim(), date: $('#ci-date').value || today() });
  $('#ci-name').value = ''; $('#ci-result').value = ''; await renderDiary(); toast(t('d.saved'));
});
async function fileToThumb(file) {
  return new Promise((res) => {
    const fr = new FileReader();
    fr.onload = () => { const img = new Image(); img.onload = () => { const max = 1000; let w = img.width, h = img.height; if (w > max || h > max) { const k = Math.min(max / w, max / h); w = Math.round(w * k); h = Math.round(h * k); } const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h); res(c.toDataURL('image/jpeg', 0.7)); }; img.src = fr.result; };
    fr.readAsDataURL(file);
  });
}
// #7: JEDEN przycisk — zapisuje zdjęcie badania I próbuje odczytać z niego WSZYSTKIE wyniki
// (CD4 + wiremia) prosto do dziennika. OCR działa online; offline zostaje samo zdjęcie.
$('#d-photo-in').addEventListener('change', async (e) => {
  const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return;
  const msg = $('#d-ocr-msg');
  const img = await fileToThumb(f);
  await put('diary', { ts: Date.now(), kind: 'photo', img, caption: '' });
  await renderDiary();
  if (msg) msg.textContent = t('d.ocrReading');
  try {
    const v = parseLabValues(await ocrImage(f));
    const added = [];
    const base = Date.now();
    if (v.cd4 != null) { await put('diary', { ts: base, kind: 'result', marker: 'cd4', v: v.cd4, date: today() }); added.push('CD4 ' + v.cd4); }
    if (v.vl != null) { await put('diary', { ts: base + 1, kind: 'result', marker: 'vl', v: v.vl, date: today() }); added.push(t('d.vl') + ' ' + (v.vl < 50 ? t('d.undetectable') : v.vl)); }
    await renderDiary();
    if (msg) msg.textContent = added.length ? t('d.ocrAdded', { list: added.join(', ') }) : t('d.ocrNone');
  } catch (err) {
    if (msg) msg.textContent = t('d.ocrOffline');
  }
});
async function saveDiaryNote() {
  const inp = $('#diary-note'); const note = (inp.value || '').trim();
  if (!note) return;
  inp.value = '';
  await put('diary', { ts: Date.now(), kind: 'note', note });
  await renderDiary();
  toast(gwt('diary'));
}
$('#diary-save').addEventListener('click', saveDiaryNote);
$('#diary-note').addEventListener('keydown', (e) => { if (e.key === 'Enter') saveDiaryNote(); });

// Dane demo (#3, zalążek) — bogaty, prezentowalny dziennik.
$('#wipe').addEventListener('click', async () => { await wipe(); location.reload(); });

/* ═══════════ IDA — baza wiedzy ═══════════
 * Kolejność reakcji (R-1): kryzys → chęć odstawienia leków → baza wiedzy.
 * Nic z tego nie idzie na serwer — silnik i baza działają w całości na urządzeniu.
 */
let idaStarted = false;

/* ——— profil: wczytanie, zastosowanie, zapis + synchronizacja E2E ——— */
async function initRole() {   // wołane z enterApp — wczytuje cały profil
  try { const p = await get('account', 'profile'); if (p && p.v) Object.assign(profile, p.v); } catch { /* noop */ }
  if (!profile.pseudonym) profile.pseudonym = account.pseudo;
  applyProfile();
}
function applyProfile() {
  setRole(profile.role || 'plhiv');
  // #5: dziennik choroby widzi tylko osoba żyjąca z HIV; partner/bliska — nie.
  const showDiary = (profile.role || 'plhiv') === 'plhiv';
  const dtab = document.querySelector('.tab[data-tab="diary"]'); if (dtab) dtab.hidden = !showDiary;
  if (!showDiary && document.querySelector('#s-diary.on')) show('ida');
  const prevLang = getI18nLang();
  setLang(profile.lang || 'pl');
  try { document.documentElement.lang = profile.lang || 'pl'; } catch { /* noop */ }
  translateDOM();                              // przetłumacz statyczny UI
  if (prevLang !== (profile.lang || 'pl')) {   // zmiana języka → Ida przywita się na nowo
    idaStarted = false; const log = $('#ida-log'); if (log) log.innerHTML = '';
  }
  const nm = $('#me-pseudo'); if (nm) nm.textContent = profile.pseudonym || account.pseudo;
}
function getI18nLang() { try { return document.documentElement.lang || 'pl'; } catch { return 'pl'; } }
async function persistProfile() {
  try { await put('account', { k: 'profile', v: { ...profile } }); } catch { /* noop */ }
}
function setSync(state) {
  const el = $('#sync-state'); if (!el) return;
  el.className = 'synctag ' + state;
  el.textContent = state === 'on' ? t('sync.on') : state === 'sync' ? t('sync.syncing') : state === 'off' ? t('sync.off') : '—';
}

/* Zapis sejfu: {klucze JWK + profil} zaszyfrowane Kluczem Kręgu; serwer dostaje sam szyfrogram. */
async function backupVault() {
  if (!account.master || !account.authKeyPair) return;
  setSync('sync');
  const { lookupId, key } = await fromSecretBytes(account.master);
  const bundle = {
    v: 1, pseudo: account.pseudo, pubRaw: Array.from(account.pubRaw || []),
    auth: await exportAuthKeyPair(account.authKeyPair),
    msg: await exportMsgKeyPair(account.msgKeyPair),
    profile: { ...profile },
  };
  const ct = await seal(bundle, key);
  await withAuth(() => api.putVault(lookupId, ct));
  setSync('on');
}
/* Pobranie profilu z sejfu (zmiany z innego urządzenia). Nie dotyka kluczy — te już mamy. */
async function pullVault() {
  if (!account.master) return;
  const { lookupId, key } = await fromSecretBytes(account.master);
  const { ciphertext } = await api.getVault(lookupId);
  const bundle = await open(ciphertext, key);
  if (bundle.profile) { Object.assign(profile, bundle.profile); await persistProfile(); applyProfile(); }
}

/* #5 Kopia zapasowa: dziennik żyje tylko na urządzeniu — czyszczenie cache go kasuje.
 * Eksport/import zaszyfrowanego pliku (pieczęć Kluczem Kręgu). Serwer nie uczestniczy. */
async function exportBackup() {
  const msg = $('#bk-msg'); if (msg) msg.textContent = '';
  if (!account.master) { if (msg) msg.textContent = t('bk.nokey'); return; }
  try {
    const by = {}; for (const s of BACKUP_STORES) by[s] = await all(s);
    const { key } = await fromSecretBytes(account.master);
    const ct = await seal(makePayload(by), key);
    const blob = new Blob([JSON.stringify({ v: 1, kind: 'krag-vault', ct })], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'krag-kopia-' + new Date().toISOString().slice(0, 10) + '.krag';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast(t('d.saved'));
  } catch { if (msg) msg.textContent = t('bk.err'); }
}
async function importBackup(file) {
  const msg = $('#bk-msg'); if (msg) msg.textContent = '';
  if (!file) return;
  if (!account.master) { if (msg) msg.textContent = t('bk.nokey'); return; }
  try {
    const obj = JSON.parse(await file.text());
    if (!obj || obj.kind !== 'krag-vault' || !obj.ct) { if (msg) msg.textContent = t('bk.badfile'); return; }
    const { key } = await fromSecretBytes(account.master);
    let payload;
    try { payload = readPayload(await open(obj.ct, key)); }
    catch { if (msg) msg.textContent = t('bk.badkey'); return; }
    if (!payload) { if (msg) msg.textContent = t('bk.badfile'); return; }
    let n = 0;
    for (const s of BACKUP_STORES) {
      const news = pickNew(s, await all(s), payload[s]);
      for (const it of news) { await put(s, it); n++; }
    }
    if (msg) msg.textContent = n ? t('bk.done', { n }) : t('bk.empty');
    await renderDiary(); await renderThreads();
  } catch { if (msg) msg.textContent = t('bk.badfile'); }
}
$('#bk-export').addEventListener('click', exportBackup);
$('#bk-import-in').addEventListener('change', (e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; importBackup(f); });

function renderProfile() {
  $('#pf-pseudo').value = profile.pseudonym || account.pseudo || '';
  $('#pf-handle').textContent = account.pseudo || '—';
  const langSel = $('#pf-lang');
  langSel.innerHTML = LANG_LIST.map((l) => `<option value="${l.code}">${l.name}${l.covered ? '' : ' ' + t('lang.partial')}</option>`).join('');
  langSel.value = profile.lang || 'pl';
  $('#pf-role').value = profile.role || 'plhiv';
  $('#pf-gram').value = profile.gram || 'n';
  const aiBox = $('#pf-ai'); if (aiBox) aiBox.checked = !!profile.ai;
  if (account.master) {
    const code = encodeKeycode(account.master);
    $('#pf-kc-qr').innerHTML = qrSvg(code);
    $('#pf-kc-code').textContent = code;
  } else {
    $('#pf-kc-qr').innerHTML = ''; $('#pf-kc-code').textContent = '(niedostępny na tym urządzeniu)';
  }
  $('#pf-err').textContent = '';
}
$('#pf-save').addEventListener('click', async () => {
  const ps = ($('#pf-pseudo').value || '').trim();
  profile.pseudonym = ps || account.pseudo;
  profile.lang = $('#pf-lang').value;
  profile.role = $('#pf-role').value;
  profile.gram = $('#pf-gram').value;
  profile.ai = !!($('#pf-ai') && $('#pf-ai').checked);
  await persistProfile();
  applyProfile();
  $('#pf-err').textContent = '';
  toast(gwt('prof'));
  try { await backupVault(); } catch (e) { setSync('off'); }
});
// #8: zgłoszenie zapotrzebowania na język (zapis lokalny; zsynchronizuje się, gdy będzie backend).
$('#pf-lang-req').addEventListener('click', async () => {
  const code = $('#pf-lang').value; const name = LANG_LIST.find((l) => l.code === code)?.name || code;
  try { const cur = (await get('account', 'langReq'))?.v || []; if (!cur.includes(code)) cur.push(code); await put('account', { k: 'langReq', v: cur }); } catch { /* noop */ }
  toast(t('lang.reqDone', { lang: name }));
});
$('#pf-kc-copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('#pf-kc-code').textContent); toast(t('kc.copied')); }
  catch { /* zaznacz ręcznie */ }
});

function idaBubble(who, html, src) {
  const log = $('#ida-log');
  const d = document.createElement('div');
  d.className = 'ida-msg ' + who;
  // Kanał Idy renderuje zaufany HTML z bazy; wpis użytkownika ZAWSZE escapowany (B-3/TECH-02).
  d.innerHTML = (who === 'me') ? escapeHtml(html) : html + (src ? `<div class="srcline">${src}</div>` : '');
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
  return d;
}
function trustHtml(c) { const x = confBadge(c); return `<span class="trust ${x[0]}">${t('trust.' + x[0])}</span>`; }
// toast zależny od płci językowej (M/Ż/neutralnie)
function gwt(base) { const suf = profile.gram === 'm' ? 'M' : profile.gram === 'f' ? 'F' : 'N'; return t('toast.' + base + suf); }

function crisisReply() {
  const covered = CRISIS_LINE.langs.indexOf('pl') > -1;   // linia po polsku
  idaBubble('ida', `<div class="crisisbox">
    <p>${t('ida.crisis')}</p>
    <span class="num">${CRISIS_LINE.no}</span>
    <div class="sub">${t('ida.crisisLine')}</div>
    ${covered && getI18nLang() === 'pl' ? '' : `<p class="sub" style="margin-top:8px">${t('ida.notYourLang', { eu: CRISIS_EU })}</p>`}
  </div>`);
}
function stopMedsReply() {
  idaBubble('ida', `<p>${t('ida.stopMeds')}</p>`);
}
// Wsparcie emocjonalne (nie-kryzysowe): ciepła odpowiedź + realne wyjścia (ludzie, Pomoc).
function emoReply(cat) {
  const d = idaBubble('ida', `<p>${t('emo.' + cat)}</p><div class="starters">
    <button class="chip sm help" type="button" data-emo="meet">${escapeHtml(t('emo.meet'))}</button>
    <button class="chip sm help" type="button" data-emo="help">${escapeHtml(t('emo.help'))}</button></div>`);
  d.querySelectorAll('[data-emo]').forEach((e) => e.addEventListener('click', () => show(e.dataset.emo === 'meet' ? 'app' : 'help')));
}
function noCoverage() {
  const chips = `<div class="bchips">${MED_BLOCKS.map((b) => `<button class="chip sm" data-blk="${b}">${BLOCKNAME[b] || b}</button>`).join('')}</div>`;
  const help = `<div class="starters"><button class="chip sm help" type="button" data-gap-help="1">${escapeHtml(t('help.open'))}</button></div>`;
  const d = idaBubble('ida', `${t('ida.noCover')}${chips}${help}`,
    `<span class="trust t4">${t('ida.gapTag')}</span>${t('ida.gapSaved')}`);
  d.querySelectorAll('[data-blk]').forEach((e) => e.addEventListener('click', () => openBlock(e.dataset.blk)));
  d.querySelectorAll('[data-gap-help]').forEach((e) => e.addEventListener('click', () => show('help')));
}
function openBlock(b) {
  resetThread();
  idaBubble('me', BLOCKNAME[b] || b);
  const fs = findFactsByBlock(b);
  setTimeout(() => renderHit({ block: b, facts: fs, follow: true }), 160);
}
function findFactsByBlock(b) {
  // Bezpośredni podgląd bloku (chip) — pierwsze trzy fakty z bloku.
  return FACTS.filter((f) => f.b === b).slice(0, 3);
}
function renderHit(hit) {
  // Fakty medyczne zostają PO POLSKU (treść tylko z podpisem); poza PL dokładamy etykietę „źródło: polski".
  let body = hit.facts.map((f) => `<p>${f.w}</p>`).join('');
  if (getI18nLang() !== 'pl') body = `<div class="ctx">${t('ida.srcPl')}</div>` + body;
  if (hit.unsure) body = `<div class="ctx">${t('ida.unsure')}</div>` + body;
  if (hit.bound) body = `<p><b>${t('ida.bound')}</b></p>` + body;
  if (!isPos() && (hit.block === 'uu' || hit.block === 'transmisja')) body = `<div class="ctx">${t('ida.negctx')}</div>` + body;
  if (hit.follow) body = `<div class="ctx">${t('ida.inThread')}${BLOCKNAME[hit.block] || hit.block}</div>` + body;
  if (hit.block === 'pep' || hit.block === 'ekspozycja') body = `<div class="urg">${t('ida.clock')}</div>` + body;
  const uniq = {}; hit.facts.forEach((f) => { uniq[f.s] = f.c; });
  let src = Object.keys(uniq).map((nm) => trustHtml(uniq[nm]) + escapeHtml(nm)).join('<br>');
  const gate = (hit.facts[0] && hit.facts[0].gate) ? `<div class="gatewarn">${t('ida.gate')}</div>` : '';
  src += `<br><span style="opacity:.75">${t('ida.baseUnverified', { ed: PROV.ed })}</span>`;
  idaBubble('ida', body + gate, src);
}
async function idaAsk(q) {
  idaBubble('me', q);
  if (risky(q)) { setTimeout(crisisReply, 200); return; }
  if (stopMeds(q)) { setTimeout(stopMedsReply, 200); return; }
  // „Ida Rozumie" (opt-in): LLM rozumie i formułuje z NASZYCH faktów. Kryzys/leki już
  // obsłużone lokalnie powyżej. Przy błędzie/offline/niepewności → cichy fallback lokalny.
  if (profile.ai) {
    const thinking = idaBubble('ida', `<span class="muted">${t('ai.thinking')}</span>`);
    try {
      const res = await withAuth(() => api.idaAsk(q, idaCandidates(q), getI18nLang()));
      thinking.remove();
      if (res && res.refer === 'crisis') { crisisReply(); return; }
      if (res && res.confident && res.answer) { renderAi(res); return; }
    } catch (e) { thinking.remove(); /* offline / ai-off → lokalnie */ }
  }
  // Lokalnie (regułowo): pewny fakt wygrywa; emocje fallback; inaczej „nie zmyślam".
  const hit = findFacts(q);
  if (hit && !hit.unsure) { setTimeout(() => renderHit(hit), 200); return; }
  const emo = emotional(q);
  if (emo) { setTimeout(() => emoReply(emo), 200); return; }
  if (hit) { setTimeout(() => renderHit(hit), 200); return; }
  setTimeout(noCoverage, 200);
}
// Render odpowiedzi „Ida Rozumie": tekst modelu (escapowany) + etykiety zaufania z użytych faktów.
function renderAi(res) {
  const used = (res.usedFactIds || []).map((id) => FACTS.find((f) => f.id === id)).filter(Boolean);
  const uniq = {}; used.forEach((f) => { uniq[f.s] = f.c; });
  let src = Object.keys(uniq).map((nm) => trustHtml(uniq[nm]) + escapeHtml(nm)).join('<br>');
  src += `<br><span class="aitag">${t('ai.badge')}</span>`;
  src += `<br><span style="opacity:.75">${t('ida.baseUnverified', { ed: PROV.ed })}</span>`;
  const gate = used.some((f) => f.gate) ? `<div class="gatewarn">${t('ida.gate')}</div>` : '';
  const body = escapeHtml(res.answer).replace(/\n/g, '<br>');
  idaBubble('ida', body + gate, src);
  if (res.refer === 'doctor' || res.refer === 'pomoc') {
    const d = idaBubble('ida', `<div class="starters"><button class="chip sm help" type="button" data-ai-help="1">${escapeHtml(t('help.open'))}</button></div>`);
    d.querySelectorAll('[data-ai-help]').forEach((e) => e.addEventListener('click', () => show('help')));
  }
}
function idaFirstOpen() {
  if (idaStarted) return;
  idaStarted = true;
  // #2: powitanie losowane z kilku wariantów, krótkie, bez powielania onboardingu.
  const hellos = t('ida.hellos').split('|').map((s) => s.trim()).filter(Boolean);
  const hi = hellos[Math.floor(Math.random() * hellos.length)] || t('ida.hello');
  // Propozycje = najczęstsze pytania + JEDEN dymek do Pomocy (numery zaufania i placówki). #1
  const starters = ['ida.s1', 'ida.s2', 'ida.s3', 'ida.s4', 'ida.s5'].map((k) => t(k));
  const helpChip = `<button class="chip sm help" type="button" data-help="1">${escapeHtml(t('ida.help1'))}</button>`;
  idaBubble('ida', `<p>${escapeHtml(hi)}</p><div class="starters">${starters.map((s) => `<button class="chip sm" data-q="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('')}${helpChip}</div>`);
  const log = $('#ida-log');
  log.querySelectorAll('[data-q]').forEach((e) => e.addEventListener('click', () => { const q = e.dataset.q; $('#ida-input').value = ''; idaAsk(q); }));
  log.querySelectorAll('[data-help]').forEach((e) => e.addEventListener('click', () => show('help')));
}
/* ——— Biblioteka wiedzy (#8): przeglądalne ścieżki → bloki → fakty ——— */
function renderLibraryList() {
  const P = getI18nLang(); const role = profile.role || 'plhiv';
  const paths = PATHS_DB.filter((p) => !p.roles || p.roles.includes(role));
  const body = $('#lib-body'); if (!body) return;
  body.innerHTML = paths.map((p) => {
    const nm = (p.n && (p.n[P] || p.n.pl)) || p.id;
    const lead = (p.lead && (p.lead[P] || p.lead.pl)) || '';
    const n = FACTS.filter((f) => p.blocks.indexOf(f.b) > -1).length;
    return `<div class="libcard" data-path="${p.id}"><div class="lc-t">${escapeHtml(nm)}${p.urgent ? ' ⏱' : ''}</div><div class="lc-s">${escapeHtml(lead)}</div><div class="lc-n">${n} ${t('lib.facts')}</div></div>`;
  }).join('');
  body.querySelectorAll('[data-path]').forEach((e) => e.addEventListener('click', () => openLibPath(e.dataset.path)));
}
function openLibPath(id) {
  const P = getI18nLang(); const p = PATHS_DB.find((x) => x.id === id); if (!p) return;
  const nm = (p.n && (p.n[P] || p.n.pl)) || p.id;
  let html = `<div class="libcard" data-lib-back="1"><div class="lc-t">‹ ${escapeHtml(nm)}</div></div>`;
  if (P !== 'pl') html += `<div class="ctx">${t('ida.srcPl')}</div>`;
  for (const b of p.blocks) {
    const fs = FACTS.filter((f) => f.b === b);
    if (!fs.length) continue;
    html += `<div class="lib-block"><div class="klbl">${escapeHtml(BLOCKNAME[b] || b)}</div>`;
    for (const f of fs) {
      const x = confBadge(f.c);
      const gate = f.gate ? `<div class="gatewarn">${t('ida.gate')}</div>` : '';
      html += `<div class="lib-fact"><p>${f.w}</p>${gate}<div class="srcline"><span class="trust ${x[0]}">${t('trust.' + x[0])}</span>${escapeHtml(f.s)}</div></div>`;
    }
    html += '</div>';
  }
  const body = $('#lib-body'); body.innerHTML = html;
  body.querySelector('[data-lib-back]').addEventListener('click', renderLibraryList);
  window.scrollTo(0, 0);
}
$('#ida-lib').addEventListener('click', () => { show('library'); renderLibraryList(); });
$('#lib-back').addEventListener('click', () => show('ida'));
// #1 Pomoc: prawdziwe numery i placówki
$('#ida-help').addEventListener('click', () => show('help'));
$('#help-back').addEventListener('click', () => show('ida'));

function sendIda() {
  const inp = $('#ida-input'); const q = (inp.value || '').trim();
  if (!q) return;
  inp.value = '';
  idaAsk(q);
}
$('#ida-send').addEventListener('click', sendIda);
$('#ida-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendIda(); });

/* ---------- helpers ---------- */
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function fmt(ts) { return new Date(ts).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }); }

/* ---------- start ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
// Język przed wejściem: autodetekcja z przeglądarki; po zalogowaniu nadpisze go profil.
setLang(detectLang());
try { document.documentElement.lang = detectLang(); } catch { /* noop */ }
translateDOM();
pendingInvite = parseInviteFromSearch(location.search);   // link-zaproszenie (#6/2)
tryRestore()
  .then((restored) => { if (!restored && demoMode()) return startDemo(); })
  .catch((e) => { $('#boot-err').textContent = ''; console.warn('restore/demo', e); });
