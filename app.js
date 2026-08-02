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
import { findFacts, resetThread, setRole, BLOCKNAME, confBadge, MED_BLOCKS, isPos, FACTS } from './lib/ida.js';
import { risky, stopMeds, CRISIS_LINE, CRISIS_EU } from './lib/crisis.js';
import { PROV } from './lib/knowledge.js';
import { fromPhrase, seal, open } from './lib/vault.js';

const LANGS = { pl: 'polski', en: 'English', uk: 'українська', ru: 'русский' };

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
const account = { authKeyPair: null, msgKeyPair: null, pubRaw: null, pseudo: null, seed: null, inviteCode: null };
// Profil: pseudonim (nazwa wyświetlana), język, rola. Synchronizowany E2E przez sejf (lib/vault.js).
const profile = { pseudonym: null, lang: 'pl', role: 'plhiv', gram: 'n' };
// Forma gramatyczna zwracania się do użytkownika (płeć językowa): f/m/neutralna.
function gw({ m, f, n }) { return profile.gram === 'm' ? m : profile.gram === 'f' ? f : n; }
function toast(msg) {
  let el = document.querySelector('#toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('on');
  clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('on'), 2600);
}
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
$('#go-login').addEventListener('click', () => { $('#login-err').textContent = ''; show('login'); });

/* Logowanie na nowym urządzeniu: fraza → sejf → odszyfrowane klucze + profil → login. */
$('#go-login-do').addEventListener('click', async () => {
  const words = ($('#login-phrase').value || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length < 6) { $('#login-err').textContent = 'Wpisz pełną frazę (12 słów).'; return; }
  const btn = $('#go-login-do'); btn.disabled = true; $('#login-err').textContent = 'Odszyfrowuję sejf…';
  try {
    const { lookupId, key } = await fromPhrase(words);
    let ciphertext;
    try { ({ ciphertext } = await api.getVault(lookupId)); }
    catch (e) { throw new Error(/404|nie istnieje/i.test(e.message) ? 'Nie znaleziono konta dla tej frazy.' : e.message); }
    let bundle;
    try { bundle = await open(ciphertext, key); }
    catch { throw new Error('Fraza nie pasuje do tego sejfu.'); }
    account.seed = words;
    account.pseudo = bundle.pseudo;
    account.pubRaw = new Uint8Array(bundle.pubRaw || []);
    account.authKeyPair = await importAuthKeyPair(bundle.auth);
    account.msgKeyPair = await importMsgKeyPair(bundle.msg);
    Object.assign(profile, bundle.profile || {});
    if (!profile.pseudonym) profile.pseudonym = account.pseudo;
    await put('account', {
      k: 'me', pseudo: account.pseudo, pubRaw: Array.from(account.pubRaw),
      authKeyPair: account.authKeyPair, msgKeyPair: account.msgKeyPair,
    });
    await put('account', { k: 'seed', v: account.seed });
    await persistProfile();
    await requestPersist();
    $('#login-err').textContent = '';
    await enterApp();
  } catch (e) {
    $('#login-err').textContent = 'Nie udało się: ' + e.message;
    btn.disabled = false;
  }
});

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
    profile.pseudonym = account.pseudo;
    await put('account', { k: 'seed', v: account.seed });
    await persistProfile();
    await requestPersist();
    $('#enter-err').textContent = '';
    await enterApp({ backup: true });
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
  try { account.seed = (await get('account', 'seed'))?.v || null; } catch { /* noop */ }
  await enterApp({ background: true, pull: true });
  return true;
}

/* ---------- wejście do aplikacji ---------- */
async function enterApp(opts = {}) {
  $('#me-pseudo').textContent = account.pseudo;
  await initRole();
  show('ida');
  idaFirstOpen();
  await renderThreads();
  await renderDiaryStatus();
  // logowanie + klucze w tle; przy odtworzeniu konta nie blokuj UI
  const connect = (async () => {
    try {
      await login();
      await publishMyKeys();
      setDot('on');
      // synchronizacja sejfu: przy wejściu z nowego konta wypchnij; przy powrocie pobierz zmiany
      if (opts.backup) { try { await backupVault(); } catch { setSync('off'); } }
      if (opts.pull) { try { await pullVault(); setSync('on'); } catch { /* brak sejfu/offline — trudno */ } }
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
async function saveDiaryNote() {
  const inp = $('#diary-note'); const note = (inp.value || '').trim();
  if (!note) return;
  inp.value = '';
  await put('diary', { ts: Date.now(), note });
  await renderDiary();
  toast(gw({ m: 'Zapisałeś wpis.', f: 'Zapisałaś wpis.', n: 'Wpis zapisany.' }));
}
$('#diary-save').addEventListener('click', saveDiaryNote);
$('#diary-note').addEventListener('keydown', (e) => { if (e.key === 'Enter') saveDiaryNote(); });
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
  const rs = $('#ida-role'); if (rs) rs.value = profile.role || 'plhiv';
  try { document.documentElement.lang = profile.lang || 'pl'; } catch { /* noop */ }
  const nm = $('#me-pseudo'); if (nm) nm.textContent = profile.pseudonym || account.pseudo;
}
async function persistProfile() {
  try { await put('account', { k: 'profile', v: { ...profile } }); } catch { /* noop */ }
}
function setSync(state) {
  const el = $('#sync-state'); if (!el) return;
  el.className = 'synctag ' + state;
  el.textContent = state === 'on' ? '✓ zsynchronizowano' : state === 'sync' ? 'synchronizuję…' : state === 'off' ? 'offline' : '—';
}

/* Zapis sejfu: {klucze JWK + profil} zaszyfrowane frazą; serwer dostaje sam szyfrogram. */
async function backupVault() {
  if (!account.seed || !account.authKeyPair) return;
  setSync('sync');
  const { lookupId, key } = await fromPhrase(account.seed);
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
  if (!account.seed) return;
  const { lookupId, key } = await fromPhrase(account.seed);
  const { ciphertext } = await api.getVault(lookupId);
  const bundle = await open(ciphertext, key);
  if (bundle.profile) { Object.assign(profile, bundle.profile); await persistProfile(); applyProfile(); }
}

function renderProfile() {
  $('#pf-pseudo').value = profile.pseudonym || account.pseudo || '';
  $('#pf-handle').textContent = account.pseudo || '—';
  const langSel = $('#pf-lang');
  langSel.innerHTML = Object.entries(LANGS).map(([c, n]) => `<option value="${c}">${n}</option>`).join('');
  langSel.value = profile.lang || 'pl';
  $('#pf-role').value = profile.role || 'plhiv';
  $('#pf-gram').value = profile.gram || 'n';
  $('#pf-seed').textContent = account.seed ? account.seed.map((w, i) => `${i + 1}. ${w}`).join('   ') : '(niedostępna na tym urządzeniu)';
  $('#pf-err').textContent = '';
}
$('#pf-save').addEventListener('click', async () => {
  const ps = ($('#pf-pseudo').value || '').trim();
  profile.pseudonym = ps || account.pseudo;
  profile.lang = $('#pf-lang').value;
  profile.role = $('#pf-role').value;
  profile.gram = $('#pf-gram').value;
  await persistProfile();
  applyProfile();
  $('#pf-err').textContent = '';
  toast(gw({ m: 'Zapisałeś profil.', f: 'Zapisałaś profil.', n: 'Profil zapisany.' }));
  try { await backupVault(); } catch (e) { setSync('off'); $('#pf-err').textContent = 'Zapisano lokalnie, sync offline: ' + e.message; }
});
$('#ida-role').addEventListener('change', async (e) => {
  profile.role = e.target.value; setRole(profile.role);
  await persistProfile();
  backupVault().catch(() => setSync('off'));
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
function trustHtml(c) { const x = confBadge(c); return `<span class="trust ${x[0]}">${x[1]}</span>`; }

function crisisReply() {
  const covered = CRISIS_LINE.langs.indexOf('pl') > -1;
  idaBubble('ida', `<div class="crisisbox">
    <p>Zatrzymuję się tutaj, bo przeczytałam w tym coś ciężkiego. Nie jestem od tego, żeby to unieść — ale wiem, kto jest. Zostaję. Możesz pisać dalej.</p>
    <span class="num">${CRISIS_LINE.no}</span>
    <div class="sub">${CRISIS_LINE.label}</div>
    ${covered ? '' : `<p class="sub" style="margin-top:8px">Ta linia odpowiada po polsku. Pod numerem ${CRISIS_EU} poprosisz o tłumacza.</p>`}
  </div>`);
}
function stopMedsReply() {
  idaBubble('ida', `<p>To ważne, że o tym mówisz — i to jest rozmowa do przeprowadzenia z lekarzem prowadzącym, nie samodzielnie. Powody bywają różne: objawy uboczne, zmęczenie codziennością, koszty, wstyd. Każdy z nich da się z kimś omówić i każdy ma zwykle jakieś wyjście.</p>`);
}
function noCoverage() {
  const chips = `<div class="bchips">${MED_BLOCKS.map((b) => `<button class="chip sm" data-blk="${b}">${BLOCKNAME[b] || b}</button>`).join('')}</div>`;
  const d = idaBubble('ida', `<b>Tego nie ma w bazie Kręgu, więc nie odpowiem.</b><br><br>Zapisuję pytanie jako lukę. Jeśli czegoś w bazie brakuje, to jest informacja dla osób, które ją prowadzą.<br><br><span style="color:var(--tx-3)">Mogę mówić o tym:</span>${chips}`,
    `<span class="trust t4">poza pokryciem</span>zapisano jako luka`);
  d.querySelectorAll('[data-blk]').forEach((e) => e.addEventListener('click', () => openBlock(e.dataset.blk)));
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
  let body = hit.facts.map((f) => `<p>${f.w}</p>`).join('');
  if (hit.unsure) body = `<div class="ctx">Nie jestem pewna, czy dobrze rozumiem — najbliżej mam to. Jeśli chodziło o coś innego, wybierz temat niżej.</div>` + body;
  if (hit.bound) body = `<p><b>Nie odpowiem na pytanie o Twój własny wynik — i to jest celowe. To rozmowa z lekarzem, nie z bazą.</b></p>` + body;
  if (!isPos() && (hit.block === 'uu' || hit.block === 'transmisja')) body = `<div class="ctx">odpowiedź dla osoby niezakażonej</div>` + body;
  if (hit.follow) body = `<div class="ctx">w wątku: ${BLOCKNAME[hit.block] || hit.block}</div>` + body;
  if (hit.block === 'pep' || hit.block === 'ekspozycja') body = `<div class="urg">To jest sytuacja z zegarem. Czytaj od razu:</div>` + body;
  const uniq = {}; hit.facts.forEach((f) => { uniq[f.s] = f.c; });
  let src = Object.keys(uniq).map((nm) => trustHtml(uniq[nm]) + escapeHtml(nm)).join('<br>');
  const gate = (hit.facts[0] && hit.facts[0].gate)
    ? `<div class="gatewarn">Blok medyczny — przed wydaniem wymaga podpisu lekarza. W tej wersji nikt tego jeszcze nie zatwierdził.</div>` : '';
  src += `<br><span style="opacity:.75">Baza ${PROV.ed} · nikt z ludzi jeszcze tego nie sprawdził</span>`;
  idaBubble('ida', body + gate, src);
}
function idaAsk(q) {
  idaBubble('me', q);
  if (risky(q)) { setTimeout(crisisReply, 200); return; }
  if (stopMeds(q)) { setTimeout(stopMedsReply, 200); return; }
  const hit = findFacts(q);
  if (!hit) { setTimeout(noCoverage, 200); return; }
  setTimeout(() => renderHit(hit), 200);
}
const IDA_STARTERS = ['Co to znaczy niewykrywalny?', 'Jak działa PrEP?', 'Co robić po ryzyku?', 'Co znaczy CD4?', 'Czy muszę powiedzieć pracodawcy?'];
function idaFirstOpen() {
  if (idaStarted) return;
  idaStarted = true;
  idaBubble('ida', `<p>Cześć. Jestem Ida — towarzyszę Ci w Kręgu i odpowiadam z materiałów, które mam. Kiedy czegoś nie mam, mówię to wprost, zamiast zgadywać.</p><div class="starters">${IDA_STARTERS.map((s) => `<button class="chip sm" data-q="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('')}</div>`);
  $('#ida-log').querySelectorAll('[data-q]').forEach((e) => e.addEventListener('click', () => { const q = e.dataset.q; $('#ida-input').value = ''; idaAsk(q); }));
}
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
tryRestore().catch((e) => { $('#boot-err').textContent = ''; console.warn('restore', e); });
