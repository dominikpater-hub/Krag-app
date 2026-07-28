import { randomUUID } from 'node:crypto';

/** Weryfikacja podpisu ECDSA P-256 (SHA-256) — dokładnie ten sam schemat, co klient PWA.
 *  Klucz publiczny: base64(raw). Podpis: base64(IEEE P1363 r||s). */
export async function verifySignature(
  publicKeyB64: string,
  data: BufferSource,
  signatureB64: string,
): Promise<boolean> {
  try {
    const pub = new Uint8Array(Buffer.from(publicKeyB64, 'base64')) as unknown as BufferSource;
    const sig = new Uint8Array(Buffer.from(signatureB64, 'base64')) as unknown as BufferSource;
    const key = await crypto.subtle.importKey(
      'raw',
      pub,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify'],
    );
    return await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      sig,
      data,
    );
  } catch {
    return false;
  }
}

export function newToken(): string {
  return randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
}

export function newNonce(): string {
  return randomUUID();
}

export function minutesFromNow(min: number): Date {
  return new Date(Date.now() + min * 60_000);
}
