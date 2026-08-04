/* Krąg — kopia zapasowa danych lokalnych (#5: „wyczyszczenie cache kasuje wszystko").
 * Dziennik żyje TYLKO na urządzeniu (prywatność). Gdy przeglądarka wyczyści dane witryny,
 * znika. Dlatego dajemy szyfrowaną kopię do pliku: całość zapieczętowana Kluczem Kręgu
 * (AES-GCM, lib/vault.js), więc plik jest bezużyteczny bez klucza. Odczyt scala wpisy
 * (nie nadpisuje nowszych lokalnych — istniejące wygrywają). Serwer nie bierze w tym udziału.
 */

// Sklepy IndexedDB objęte kopią i ich klucze główne.
export const STORE_KEY = { diary: 'ts', threads: 'peer', messages: 'id', rooms: 'roomId' };
export const BACKUP_STORES = Object.keys(STORE_KEY);

/** Wpisy z kopii, których jeszcze NIE ma lokalnie (po kluczu głównym). Istniejące zostają. */
export function pickNew(store, existing, incoming) {
  const k = STORE_KEY[store] || 'ts';
  const have = new Set((existing || []).map((x) => x && x[k]));
  return (incoming || []).filter((x) => x && x[k] !== undefined && !have.has(x[k]));
}

/** Zbuduj ładunek kopii (przed zapieczętowaniem). */
export function makePayload(byStore) {
  const data = {};
  for (const s of BACKUP_STORES) data[s] = Array.isArray(byStore[s]) ? byStore[s] : [];
  return { v: 1, kind: 'krag-backup', data };
}

/** Odczytaj ładunek po odszyfrowaniu; null gdy to nie jest kopia Kręgu. */
export function readPayload(obj) {
  if (!obj || obj.kind !== 'krag-backup' || typeof obj.data !== 'object') return null;
  const out = {};
  for (const s of BACKUP_STORES) out[s] = Array.isArray(obj.data[s]) ? obj.data[s] : [];
  return out;
}

/** Ile wpisów łącznie w ładunku (do komunikatu). */
export function countPayload(byStore) {
  return BACKUP_STORES.reduce((n, s) => n + ((byStore && byStore[s]) ? byStore[s].length : 0), 0);
}
