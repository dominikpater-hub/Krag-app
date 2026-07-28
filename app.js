/* Krąg — szkielet klienta PWA (K-27 / K-30).
   Co jest PRAWDZIWE w tym szkielecie:
   - konto = para kluczy generowana lokalnie (Web Crypto), klucz prywatny nie opuszcza urządzenia
   - pseudonim wywodzony z klucza publicznego (SHA-256)
   - dziennik zdrowia trzymany lokalnie w IndexedDB (nic nie leci na serwer)
   - tryb offline przez service worker
   Co jest STUB / TODO (wymaga backendu + decyzji, patrz README):
   - walidacja kodu zaproszenia po stronie serwera (tu: format-only)
   - Signal Protocol E2E dla rozmów 1:1 (libsignal-client)
   - kolejka moderacji (message franking) — O-08
   - pełna lista BIP-39 (2048 słów) — tu skrócona lista demonstracyjna
*/
'use strict';
const $ = (s) => document.querySelector(s);
const enc = new TextEncoder();

/* ---------- nawigacja ---------- */
function show(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === 's-' + id));
  window.scrollTo(0,0);
}
document.querySelectorAll('[data-back]').forEach(b =>
  b.addEventListener('click', () => show(b.dataset.back)));

/* ---------- stan konta (w pamięci; klucz eksportowany do IndexedDB) ---------- */
const account = { keyPair:null, pubRaw:null, pseudo:null, seed:null };

/* ---------- klucz + pseudonim ---------- */
async function generateAccount(){
  account.keyPair = await crypto.subtle.generateKey(
    { name:'ECDSA', namedCurve:'P-256' }, true, ['sign','verify']);
  account.pubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', account.keyPair.publicKey));
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', account.pubRaw));
  account.pseudo = pseudoFrom(hash);
  return account;
}
function hex(bytes, n){ return Array.from(bytes.slice(0,n)).map(b=>b.toString(16).padStart(2,'0')).join(''); }

// pseudonim: dwa słowa + 4 znaki z hasza (czytelny, stały, nic nie znaczy)
const ADJ = ['Cichy','Spokojny','Wschodni','Jasny','Ciepły','Nocny','Daleki','Miękki'];
const NOU = ['Świt','Rzeka','Wiatr','Brzeg','Kamień','Ogród','Ton','Światło'];
function pseudoFrom(hash){
  const a = ADJ[hash[0] % ADJ.length];
  const n = NOU[hash[1] % NOU.length];
  return `${a} ${n} #${hex(hash.slice(2),2).toUpperCase()}`;
}

/* ---------- fraza odzyskiwania (demo; docelowo pełny BIP-39) ---------- */
const WORDS = ['akacja','brzoza','cień','dąb','echo','fala','gaj','horyzont','iskra','jodła',
  'klucz','liść','most','nurt','obłok','pole','rosa','sopel','tarcza','ul','wrzos','zorza',
  'agat','bór','cis','dzban','gil','kra','łąka','mech','nić','osika','próg','sarna','topola','wydma'];
function makeSeed(words=12){
  const rnd = crypto.getRandomValues(new Uint32Array(words));
  return Array.from(rnd, r => WORDS[r % WORDS.length]);
}

/* ---------- IndexedDB: dziennik zdrowia (tylko lokalnie) ---------- */
function db(){
  return new Promise((res,rej)=>{
    const r = indexedDB.open('krag-local', 1);
    r.onupgradeneeded = () => {
      const d = r.result;
      if(!d.objectStoreNames.contains('diary')) d.createObjectStore('diary',{keyPath:'ts'});
      if(!d.objectStoreNames.contains('account')) d.createObjectStore('account',{keyPath:'k'});
    };
    r.onsuccess = ()=>res(r.result); r.onerror = ()=>rej(r.error);
  });
}
async function put(store, val){ const d=await db(); return new Promise((res,rej)=>{
  const tx=d.transaction(store,'readwrite'); tx.objectStore(store).put(val);
  tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error); }); }
async function all(store){ const d=await db(); return new Promise((res,rej)=>{
  const tx=d.transaction(store,'readonly'); const rq=tx.objectStore(store).getAll();
  rq.onsuccess=()=>res(rq.result||[]); rq.onerror=()=>rej(rq.error); }); }
async function wipe(){ indexedDB.deleteDatabase('krag-local'); }

/* ---------- persist storage (chroni klucz/dziennik przed eviction) ---------- */
async function requestPersist(){
  try{ if(navigator.storage && navigator.storage.persist) return await navigator.storage.persist(); }
  catch(e){}
  return false;
}

/* ---------- przepływ wejścia ---------- */
$('#go-invite').addEventListener('click', ()=>show('invite'));

$('#go-keys').addEventListener('click', async ()=>{
  const v = $('#invite-code').value.trim().toUpperCase();
  if(!/^KRAG-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(v)){
    $('#invite-err').textContent = 'Format kodu: KRAG-XXXX-XXXX. (Walidacja serwerowa dojdzie z backendem.)';
    return;
  }
  $('#invite-err').textContent='';
  show('keys');
  await generateAccount();
  $('#pseudo').textContent = account.pseudo;
  $('#pubfp').textContent = hex(account.pubRaw,10) + '…';
});

$('#go-recovery').addEventListener('click', ()=>{
  account.seed = makeSeed(12);
  $('#seed').textContent = account.seed.map((w,i)=>`${i+1}. ${w}`).join('   ');
  show('recovery');
});

$('#seed-ack').addEventListener('change', (e)=> $('#go-enter').disabled = !e.target.checked);

$('#go-enter').addEventListener('click', async ()=>{
  // eksport klucza publicznego + pseudonimu do IndexedDB (klucz prywatny zostaje w CryptoKey)
  await put('account', { k:'me', pseudo:account.pseudo, pub:Array.from(account.pubRaw) });
  await requestPersist();
  show('home');
  renderHome();
});

/* ---------- home / stan lokalny ---------- */
async function renderHome(){
  const h = new Date().getHours();
  const hi = h<11?'Dzień dobry':h<18?'Cześć':'Dobry wieczór';
  $('#home-hi').textContent = `${hi}, ${account.pseudo?account.pseudo.split(' #')[0]:''}.`;
  const persisted = (navigator.storage && navigator.storage.persisted) ? await navigator.storage.persisted() : false;
  $('#diary-state').textContent = 'gotowe' + (persisted?' · trwałe':'');
  $('#sw-state').textContent = ('serviceWorker' in navigator) ? 'aktywny' : 'niedostępny';
  await renderDiary();
}
async function renderDiary(){
  const items = (await all('diary')).sort((a,b)=>b.ts-a.ts);
  $('#diary-list').innerHTML = items.length
    ? items.map(i=>`• ${new Date(i.ts).toLocaleString('pl-PL')} — ${i.note}`).join('<br>')
    : '<span style="color:var(--tx-3)">Dziennik jest pusty. Nic z niego nie opuszcza tego urządzenia.</span>';
}
$('#diary-add').addEventListener('click', async ()=>{
  const samples = ['CD4 268, wiremia poniżej progu','wieczorna dawka wzięta','nastrój: ok','wizyta umówiona'];
  await put('diary', { ts:Date.now(), note: samples[Math.floor(Math.random()*samples.length)] });
  await renderDiary();
});
$('#wipe').addEventListener('click', async ()=>{
  await wipe(); location.reload();
});

/* ---------- service worker ---------- */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=> navigator.serviceWorker.register('sw.js').catch(()=>{}));
}
