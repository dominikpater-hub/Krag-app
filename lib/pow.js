/* Krąg — solver proof-of-work (klient). Zakładając konto bez zaproszenia, urządzenie
 * musi znaleźć nonce dający sha256(challenge:nonce) z >= `bits` zerowymi bitami z przodu.
 * Kilka sekund liczenia — niewidoczne dla człowieka, drogie dla bota masowo zakładającego konta.
 * Żadnych danych: to czysta praca CPU, nie identyfikacja.
 */
'use strict';
import { sha256hex } from './sha256.js';

export function leadingZeroBits(hex) {
  let n = 0;
  for (let i = 0; i < hex.length; i++) {
    const v = parseInt(hex[i], 16);
    if (v === 0) { n += 4; continue; }
    n += Math.clz32(v) - 28;   // bity zerowe w tej cyfrze hex (0..3)
    break;
  }
  return n;
}

/** Znajduje nonce spełniający trudność. Zwraca string (nonce). */
export function solvePow(challenge, bits, budget = 50_000_000) {
  for (let nonce = 0; nonce < budget; nonce++) {
    if (leadingZeroBits(sha256hex(challenge + ':' + nonce)) >= bits) return String(nonce);
  }
  throw new Error('Nie udało się rozwiązać proof-of-work');
}
