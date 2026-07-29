/* Krąg — klient PWA (Faza 3.6). Spięty z backendem.
 * Wejście z zaproszenia → logowanie kluczem → rozmowy 1:1 szyfrowane end-to-end.
 * Krypto klienta: lib/e2e.js (interim ECDH→AES-GCM; docelowo libsignal).
 * API: lib/api.js. Tożsamość/logowanie: lib/identity.js.
 * Klucz prywatny i dziennik zdrowia nie opuszczają tego urządzenia.
 */
import { API_BASE } from './config.js';
import { makeClient } from './lib/api.js';
import { generateAuthKeyPair, authPublicB64, signNonce } from './lib/identity.js';
import { generateKeyPair, publicKeyB64, deriveSessionKey, encrypt, decrypt, envelope } from './lib/e2e.js';

'use strict';
const $ = (s) => document.querySelector(s);

/* ---------- nawigacja ---------- */
function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('on', s.id === 's-' + id));
  window.scrollTo(0, 0);
}
document.querySelectorAll('[data-back]').forEach((b) =>
  b.addEventListener('click', () => show(b.dataset.back)));

/* ---------- stan ---------- */
const api = makeClient(API_BASE);
const account = { authKeyPair: null, msgKeyPair: null, pubRaw: null, pseudo: null, seed: null, inviteCode: null };
const sessionKeys = new Map();   // peer -> CryptoKey (AES-GCM)
const unread = new Map();        // peer -> liczba nieprzeczytanych
let currentPeer = null;
let poller = null;

/* ---------- IndexedDB (v2): konto, dziennik, wątki, wiadomości ---------- */
function db() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('krag-local', 2);
    r.onupgradeneeded = () => {
      const d = r.result;
      if (!d.objectStoreNames.contains('diary')) d.createObjectStore('diary', { keyPath: 'ts' });
      if (!d.objectStoreNames.contains('account')) d.createObjectStore('account', { keyPath: 'k' });
      if (!d.objectStoreNames.contains('messages')) {
        const ms = d.createObjectStore('messages', { keyPath: 'id' });
        ms.createIndex('peer', 'peer', { unique: false });
      }
      if (!d.objectStoreNames.contains('threads')) d.createObjectStore('threads', { keyPath: 'peer' });
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

/* fraza odzyskiwania (demo; docelowo pełny BIP-39) */
const WORDS = ['akacja', 'brzoza', 'cień', 'dąb', 'echo', 'fala', 'gaj', 'horyzont', 'iskra', 'jodła',
  'klucz', 'liść', 'most', 'nurt', 'obłok', 'pole', 'rosa', 'sopel', 'tarcza', 'ul', 'wrzos', 'zorza',
  'agat', 'bór', 'cis', 'dzban', 'gil', 'kra', 'łąka', 'mech', 'nić', 'osika', 'próg', 'sarna', 'topola', 'wydma'];
function makeSeed(n = 12) {
  return Array.from(crypto.getRandomValues(new Uint32Array(n)), (r) => WORDS[r % WORDS.length]);
}

/* ---------- logowanie / sieć ---------- */
function setDot(state) {
  const d = $('#conn-dot');
  d.classList.remove('on', 'off');
  if (state === 'on') d.classList.add('on');
  else if (state === 'off') d.classList.add('off');
}
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

/* ---------- przepływ wejścia ---------- */
$('#go-invite').addEventListener('click', () => show('invite'));

$('#go-keys').addEventListener('click', async () => {
  const v = $('#invite-code').value.trim().toUpperCase();
  if (!/^KRAG-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(v)) {
    $('#invite-err').textContent = 'Format kodu: KRAG-XXXX-XXXX.';
    return;
  }
  account.inviteCode = v;
  $('#invite-err').textContent = '';
  show('keys');
  await generateAccount();
  $('#pseudo').textContent = account.pseudo;
  $('#pubfp').textContent = hex(account.pubRaw, 10) + '…';
});

$('#go-recovery').addEventListener('click', () => {
  account.seed = makeSeed(12);
  $('#seed').textContent = account.seed.map((w, i) => `${i + 1}. ${w}`).join('   ');
  show('recovery');
});
$('#seed-ack').addEventListener('change', (e) => { $('#go-enter').disabled = !e.target.checked; });

$('#go-enter').addEventListener('click', async () => {
  const btn = $('#go-enter'); btn.disabled = true;
  $('#enter-err').textContent = 'Łączę z Kręgiem…';
  try {
    const pub = await authPublicB64(account.authKeyPair);
    await api.redeem(account.inviteCode, account.pseudo, pub);   // rejestracja na serwerze
    await login();                                               // dowód klucza → token
    await publishMyKeys();                                       // klucz wiadomości dla innych
    await put('account', {
      k: 'me', pseudo: account.pseudo, pubRaw: Array.from(account.pubRaw),
      authKeyPair: account.authKeyPair, msgKeyPair: account.msgKeyPair,
    });
    await requestPersist();
    $('#enter-err').textContent = '';
    await enterApp();
  } catch (e) {
    $('#enter-err').textContent = 'Nie udało się: ' + e.message;
    btn.disabled = false;
  }
});

/* ---------- odtworzenie konta przy starcie ---------- */
async function tryRestore() {
  const me = await get('account', 'me');
  if (!me || !me.authKeyPair) return false;
  account.pseudo = me.pseudo;
  account.pubRaw = new Uint8Array(me.pubRaw || []);
  account.authKeyPair = me.authKeyPair;
  account.msgKeyPair = me.msgKeyPair;
  await enterApp({ background: true });
  return true;
}

/* ---------- wejście do aplikacji ---------- */
async function enterApp(opts = {}) {
  $('#me-pseudo').textContent = account.pseudo;
  show('app');
  await renderThreads();
  await renderDiaryStatus();
  // logowanie + klucze w tle; przy odtworzeniu konta nie blokuj UI
  const connect = (async () => {
    try {
      await login();
      await publishMyKeys();
      setDot('on');
      startPolling();
    } catch (e) {
      setDot('off');
      if (!opts.background) throw e;
    }
  })();
  if (!opts.background) await connect;
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
    box.innerHTML = '<div class="threads-empty">Brak rozmów. Zacznij od pseudonimu poniżej.</div>';
    return;
  }
  threads.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const msgs = await all('messages');
  const lastByPeer = {};
  for (const m of msgs) {
    if (!lastByPeer[m.peer] || m.ts > lastByPeer[m.peer].ts) lastByPeer[m.peer] = m;
  }
  box.innerHTML = threads.map((t) => {
    const last = lastByPeer[t.peer];
    const preview = last ? (last.dir === 'out' ? 'Ty: ' : '') + last.text : 'Nowa rozmowa';
    const n = unread.get(t.peer) || 0;
    const nm = t.peer.split(' #')[0];
    return `<div class="thread" data-peer="${encodeURIComponent(t.peer)}">
      <div><div class="nm">${escapeHtml(nm)}</div><div class="last">${escapeHtml(preview)}</div></div>
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
  await put('threads', { peer, ts: (await get('threads', peer))?.ts || Date.now() });
  $('#thread-peer').textContent = peer.split(' #')[0];
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
    const key = await sessionFor(currentPeer);
    const wire = envelope.pack(await encrypt(key, text));
    await withAuth(() => api.sendEnvelope(currentPeer, wire));
  } catch (e) {
    await put('messages', { id, peer: currentPeer, dir: 'out', text: text + '  ⚠️ niewysłane', ts });
    await renderMessages(currentPeer);
  }
}
$('#msg-send').addEventListener('click', sendMessage);
$('#msg-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });
$('#thread-back').addEventListener('click', async () => { currentPeer = null; show('app'); await renderThreads(); });

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

/* ---------- panel „to urządzenie” ---------- */
async function renderDiaryStatus() {
  const persisted = navigator.storage?.persisted ? await navigator.storage.persisted() : false;
  $('#diary-state').textContent = 'gotowe' + (persisted ? ' · trwałe' : '');
  $('#sw-state').textContent = ('serviceWorker' in navigator) ? 'aktywny' : 'niedostępny';
  await renderDiary();
}
async function renderDiary() {
  const items = (await all('diary')).sort((a, b) => b.ts - a.ts);
  $('#diary-list').innerHTML = items.length
    ? items.map((i) => `• ${new Date(i.ts).toLocaleString('pl-PL')} — ${escapeHtml(i.note)}`).join('<br>')
    : '<span style="color:var(--tx-3)">Dziennik jest pusty. Nic z niego nie opuszcza tego urządzenia.</span>';
}
$('#diary-add').addEventListener('click', async () => {
  const s = ['CD4 268, wiremia poniżej progu', 'wieczorna dawka wzięta', 'nastrój: ok', 'wizyta umówiona'];
  await put('diary', { ts: Date.now(), note: s[Math.floor(Math.random() * s.length)] });
  await renderDiary();
});
$('#wipe').addEventListener('click', async () => { await wipe(); location.reload(); });

/* ---------- helpers ---------- */
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function fmt(ts) { return new Date(ts).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }); }

/* ---------- start ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
tryRestore().catch((e) => { $('#boot-err').textContent = ''; console.warn('restore', e); });
