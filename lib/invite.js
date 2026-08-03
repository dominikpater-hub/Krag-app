/* Krąg — linki-zaproszenia (#6, część 2).
 * Udostępnij swój uchwyt jako link/QR: druga osoba otwiera aplikację i od razu
 * zaczyna z Tobą rozmowę. Uchwyt to pseudonim (nazwa #HASH) — pochodna klucza,
 * NIE tożsamość. Link nie zawiera żadnych danych osobowych ani kluczy prywatnych.
 * Czysto klienckie: żaden serwer nie jest potrzebny do wygenerowania linku.
 */
const enc = new TextEncoder();
const dec = new TextDecoder();

function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64url(str) {
  const s = String(str).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s + '==='.slice((s.length + 3) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Pseudonim ma postać „Nazwa Dwuczłonowa #ABCD". Waliduj przed użyciem.
const HANDLE_RE = /^.+ #[0-9A-F]{4}$/;
export function isHandle(s) { return HANDLE_RE.test(String(s || '').trim()); }

/** pseudonim → nieprzezroczysty token (base64url UTF-8). */
export function encodeInvite(pseudonym) { return b64url(enc.encode(String(pseudonym))); }

/** token → pseudonim (albo null, gdy niepoprawny / nie wygląda na uchwyt). */
export function decodeInvite(token) {
  try {
    const ps = dec.decode(unb64url(token)).trim();
    return isHandle(ps) ? ps : null;
  } catch { return null; }
}

/** Pełny link do zaproszenia. origin np. „https://krag.app". */
export function inviteUrl(origin, pseudonym) {
  const base = String(origin || '').replace(/\/+$/, '');
  return `${base}/?k=${encodeInvite(pseudonym)}`;
}

/** Wyłuskaj pseudonim z query-string (np. location.search). Zwraca pseudonim albo null. */
export function parseInviteFromSearch(search) {
  try {
    const q = new URLSearchParams(String(search || '').replace(/^\?/, ''));
    const k = q.get('k');
    return k ? decodeInvite(k) : null;
  } catch { return null; }
}
