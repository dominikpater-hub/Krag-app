/* Krąg — sejf E2E oparty na frazie odzyskiwania.
 *
 * Z 12-słowowej frazy wyprowadzamy DWIE niezależne rzeczy (PBKDF2-SHA256, różne sole):
 *   • lookupId — wysokoentropijny identyfikator, pod którym serwer trzyma szyfrogram.
 *     Nie jest powiązany z pseudonimem, więc nie zdradza, kto ma konto.
 *   • wrapKey  — klucz AES-GCM do zaszyfrowania paczki (klucze tożsamości + profil).
 *
 * Serwer widzi tylko (lookupId → base64(iv+ct)). Bez frazy nie odtworzy ani jednego,
 * ani drugiego. To realizuje K-04 (serwer nie zna Ciebie) i domyka SEC-06
 * (żadnych danych o zdrowiu jawnym tekstem po stronie serwera).
 */
'use strict';

const ITER = 210_000;
const enc = new TextEncoder();

function b64(bytes) {
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
  let s = ''; for (const b of bytes) s += String.fromCharCode(b); return btoa(s);
}
function unb64(str) {
  if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(str, 'base64'));
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}
function hex(bytes) { return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join(''); }

// Normalizacja frazy: małe litery, pojedyncze spacje — żeby drobne różnice w zapisie nie psuły odczytu.
function phraseKey(phrase) {
  const norm = String(Array.isArray(phrase) ? phrase.join(' ') : phrase).trim().toLowerCase().replace(/\s+/g, ' ');
  return crypto.subtle.importKey('raw', enc.encode(norm), 'PBKDF2', false, ['deriveBits', 'deriveKey']);
}

/** Identyfikator sejfu z frazy (256 bit → hex). */
export async function vaultLookupId(phrase) {
  const key = await phraseKey(phrase);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode('krag-vault-id/v1'), iterations: ITER, hash: 'SHA-256' }, key, 256);
  return hex(new Uint8Array(bits));
}

/** Klucz AES-GCM z frazy (do szyfrowania paczki sejfu). */
export async function vaultKey(phrase) {
  const key = await phraseKey(phrase);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('krag-vault-key/v1'), iterations: ITER, hash: 'SHA-256' },
    key, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

/** Szyfruje obiekt → base64(iv12 + ciphertext). */
export async function seal(obj, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj))));
  const out = new Uint8Array(iv.length + ct.length); out.set(iv); out.set(ct, iv.length);
  return b64(out);
}

/** Odszyfrowuje base64(iv12 + ciphertext) → obiekt. Rzuca, gdy klucz zły lub dane naruszone. */
export async function open(b64str, key) {
  const raw = unb64(b64str);
  const iv = raw.slice(0, 12), ct = raw.slice(12);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return JSON.parse(new TextDecoder().decode(pt));
}

/** Wygodne opakowanie: z frazy zrób {lookupId, key}. */
export async function fromPhrase(phrase) {
  const [lookupId, key] = await Promise.all([vaultLookupId(phrase), vaultKey(phrase)]);
  return { lookupId, key };
}
