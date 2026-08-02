/* Krąg — proof-of-work po stronie serwera (bezstanowy). Zastępuje bramkę zaproszeń jako
 * lekki bezpiecznik anty-spam przy otwartej rejestracji. Wyzwanie jest podpisane HMAC-em
 * (serwer nie musi go pamiętać) i ważne krótko. Zero danych osobowych.
 */
import crypto from 'node:crypto';

const SECRET = process.env.POW_SECRET || crypto.randomBytes(32).toString('hex');
export const POW_BITS = Number(process.env.POW_BITS || 18);
const TTL_MS = 120_000;

/** Wystawia wyzwanie: "ts.rand.mac". Bezstanowe — weryfikacja tylko po HMAC i świeżości. */
export function issue(): { challenge: string; bits: number } {
  const ts = Date.now();
  const rand = crypto.randomBytes(9).toString('hex');
  const mac = crypto.createHmac('sha256', SECRET).update(`${ts}.${rand}`).digest('hex').slice(0, 16);
  return { challenge: `${ts}.${rand}.${mac}`, bits: POW_BITS };
}

function leadingZeroBits(hex: string): number {
  let n = 0;
  for (const ch of hex) {
    const v = parseInt(ch, 16);
    if (v === 0) { n += 4; continue; }
    n += Math.clz32(v) - 28;
    break;
  }
  return n;
}

/** Sprawdza: HMAC poprawny, wyzwanie świeże, sha256(challenge:nonce) ma dość zer. */
export function verify(challenge: unknown, nonce: unknown): boolean {
  if (typeof challenge !== 'string') return false;
  const nonceStr = String(nonce ?? '');
  if (!nonceStr) return false;
  const parts = challenge.split('.');
  if (parts.length !== 3) return false;
  const [tsS, rand, mac] = parts;
  const ts = Number(tsS);
  if (!ts || !rand || !mac) return false;
  if (Date.now() - ts > TTL_MS) return false;
  const expect = crypto.createHmac('sha256', SECRET).update(`${ts}.${rand}`).digest('hex').slice(0, 16);
  if (mac.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expect))) return false;
  const h = crypto.createHash('sha256').update(`${challenge}:${nonceStr}`).digest('hex');
  return leadingZeroBits(h) >= POW_BITS;
}
