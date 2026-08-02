/* Krąg — sejf E2E. Odblokowywany DOWOLNYM sekretem, zawsze tak samo server-blind.
 *
 * Z sekretu (fraza 12 słów · Klucz Kręgu z QR · wynik PRF z passkeya) wyprowadzamy
 * PBKDF2-SHA256 dwie niezależne rzeczy (różne sole):
 *   • lookupId — wysokoentropijny identyfikator, pod którym serwer trzyma szyfrogram.
 *     Nie jest powiązany z pseudonimem ani z żadną tożsamością → nie zdradza, kto ma konto.
 *   • wrapKey  — klucz AES-GCM do zaszyfrowania paczki (klucze tożsamości + profil).
 *
 * Serwer widzi tylko (lookupId → base64(iv+ct)). Ani e-maila, ani Google, ani passkeya —
 * niczego, z czego dałoby się odtworzyć osobę. Realizuje K-04 i domyka SEC-06.
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

// Import surowego materiału jako klucz bazowy PBKDF2.
function baseKey(materialBytes) {
  return crypto.subtle.importKey('raw', materialBytes, 'PBKDF2', false, ['deriveBits', 'deriveKey']);
}
// Normalizacja frazy/hasła: małe litery, pojedyncze spacje — drobne różnice w zapisie nie psują odczytu.
function normPhrase(phrase) {
  return String(Array.isArray(phrase) ? phrase.join(' ') : phrase).trim().toLowerCase().replace(/\s+/g, ' ');
}

async function idFrom(key) {
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode('krag-vault-id/v1'), iterations: ITER, hash: 'SHA-256' }, key, 256);
  return hex(new Uint8Array(bits));
}
async function keyFrom(key) {
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('krag-vault-key/v1'), iterations: ITER, hash: 'SHA-256' },
    key, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

/** Rdzeń: z dowolnego materiału (bajty) → {lookupId, key}. */
export async function fromSecretBytes(materialBytes) {
  const bk = await baseKey(materialBytes);
  const [lookupId, key] = await Promise.all([idFrom(bk), keyFrom(bk)]);
  return { lookupId, key };
}
/** Z frazy/hasła (tekst) — normalizowane, potem jak wyżej. */
export async function fromPhrase(phrase) {
  return fromSecretBytes(enc.encode(normPhrase(phrase)));
}

// Zgodność wstecz (używane przez testy/istniejące wywołania).
export async function vaultLookupId(phrase) { return (await fromPhrase(phrase)).lookupId; }
export async function vaultKey(phrase) { return (await fromPhrase(phrase)).key; }

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
