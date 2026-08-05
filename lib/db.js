/* Krąg — warstwa składu lokalnego (IndexedDB 'krag-local' v3).
 * Wszystkie dane użytkownika (konto, dziennik, wątki, wiadomości, pokoje)
 * żyją tu, na urządzeniu — nie w chmurze. Wydzielone z app.js dla czytelności.
 */
export function db() {
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
export async function put(store, val) {
  const d = await db();
  return new Promise((res, rej) => {
    const tx = d.transaction(store, 'readwrite'); tx.objectStore(store).put(val);
    tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
  });
}
export async function get(store, key) {
  const d = await db();
  return new Promise((res, rej) => {
    const rq = d.transaction(store, 'readonly').objectStore(store).get(key);
    rq.onsuccess = () => res(rq.result || null); rq.onerror = () => rej(rq.error);
  });
}
export async function all(store) {
  const d = await db();
  return new Promise((res, rej) => {
    const rq = d.transaction(store, 'readonly').objectStore(store).getAll();
    rq.onsuccess = () => res(rq.result || []); rq.onerror = () => rej(rq.error);
  });
}
export async function del(store, key) {
  const d = await db();
  return new Promise((res, rej) => { const tx = d.transaction(store, 'readwrite'); tx.objectStore(store).delete(key); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
}
export async function wipe() { indexedDB.deleteDatabase('krag-local'); }

export async function requestPersist() {
  try { if (navigator.storage?.persist) return await navigator.storage.persist(); } catch { /* noop */ }
  return false;
}
