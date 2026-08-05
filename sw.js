/* Krąg — service worker (offline shell). Cache tylko statycznej powłoki;
   dane użytkownika NIE są tu cache'owane (żyją w IndexedDB). */
const CACHE = 'krag-shell-v33';
const SHELL = ['./','./index.html','./style.css','./app.js','./config.js',
  './lib/api.js','./lib/identity.js','./lib/e2e.js','./manifest.webmanifest','./enso.svg','./enso-mark.svg',
  './lib/text.js','./lib/crisis.js','./lib/ida.js','./lib/knowledge.js','./lib/vault.js',
  './lib/keycode.js','./lib/passkey.js','./lib/pow.js','./lib/sha256.js','./lib/qrcode-generator.js','./lib/i18n.js','./lib/interactions.js','./lib/jsqr.js',
  './lib/invite.js','./lib/rooms.js','./lib/ocr.js','./lib/emotion.js','./lib/backup.js','./lib/demo-seed.js','./lib/db.js','./lib/dom.js','./lib/nav.js','./lib/diary.js','./lib/clinics.js'];

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', (e)=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(
    keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', (e)=>{
  const url = new URL(e.request.url);
  if(url.origin !== location.origin) return;          // nic zewnętrznego
  // Nawigacje (np. link-zaproszenie /?k=…) serwuj z powłoki, ignorując query-string.
  if(e.request.mode === 'navigate'){
    e.respondWith(caches.match('./index.html').then(r => r || caches.match(e.request,{ignoreSearch:true}) || fetch(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
