/* Krąg — „Klucz Kręgu": jeden wysokoentropijny sekret, którym odblokowuje się sejf
 * na nowym urządzeniu (zamiast przepisywania 12 słów). Pokazywany jako tekst + kod QR.
 * Server-blind: z sekretu wyprowadza się lookupId+klucz (lib/vault.js fromSecretBytes).
 */
'use strict';
import qrcode from './qrcode-generator.js';

const PREFIX = 'krag1:';

function b64url(bytes) {
  let s = ''; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64url(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(s + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
}

/** Nowy Klucz Kręgu: 32 losowe bajty → {bytes, code:"krag1:..."}. */
export function newKeycode() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return { bytes, code: PREFIX + b64url(bytes) };
}

/** Zakoduj istniejące bajty jako Klucz Kręgu (np. do pokazania w profilu). */
export function encodeKeycode(bytes) {
  return PREFIX + b64url(bytes);
}

/** Wyłuskuje sekret z wpisanego/zeskanowanego tekstu (toleruje link i białe znaki) → bajty albo null. */
export function parseKeycode(str) {
  const m = String(str || '').trim().match(/krag1:([A-Za-z0-9\-_]+)/);
  if (!m) return null;
  try { const b = unb64url(m[1]); return b.length >= 16 ? b : null; } catch { return null; }
}

/** Render kodu QR jako samodzielny SVG (bez zależności sieciowych). */
export function qrSvg(text, { size = 220, margin = 2, dark = '#12161E', light = '#E4E8EE' } = {}) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const total = n + margin * 2;
  let rects = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c)) rects += `<rect x="${c + margin}" y="${r + margin}" width="1" height="1"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" role="img" aria-label="Kod QR Klucza Kręgu">`
    + `<rect width="${total}" height="${total}" fill="${light}"/><g fill="${dark}">${rects}</g></svg>`;
}
