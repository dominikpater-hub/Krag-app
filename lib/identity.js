/* Krąg — tożsamość konta (klucz do LOGOWANIA, osobny od klucza do wiadomości).
 * Auth = ECDSA P-256: klient podpisuje nonce z serwera, dowodząc posiadania klucza
 * prywatnego. Ten sam schemat weryfikuje serwer (`server/src/auth.ts`). */

function b64(buf) {
  const u = new Uint8Array(buf);
  if (typeof Buffer !== 'undefined') return Buffer.from(u).toString('base64');
  let s = '';
  for (const x of u) s += String.fromCharCode(x);
  return btoa(s);
}

export async function generateAuthKeyPair() {
  return crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
}

export async function authPublicB64(keyPair) {
  return b64(await crypto.subtle.exportKey('raw', keyPair.publicKey));
}

/** Eksport pary kluczy logowania do JWK (do sejfu E2E). Prywatny wychodzi TYLKO zaszyfrowany. */
export async function exportAuthKeyPair(keyPair) {
  return {
    priv: await crypto.subtle.exportKey('jwk', keyPair.privateKey),
    pub: await crypto.subtle.exportKey('jwk', keyPair.publicKey),
  };
}
/** Odtworzenie pary kluczy logowania z JWK (po odszyfrowaniu sejfu). */
export async function importAuthKeyPair(b) {
  const alg = { name: 'ECDSA', namedCurve: 'P-256' };
  return {
    privateKey: await crypto.subtle.importKey('jwk', b.priv, alg, true, ['sign']),
    publicKey: await crypto.subtle.importKey('jwk', b.pub, alg, true, ['verify']),
  };
}

/** Podpisuje nonce (string) kluczem prywatnym → base64. Do `POST /auth/verify`. */
export async function signNonce(keyPair, nonce) {
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    keyPair.privateKey,
    new TextEncoder().encode(nonce),
  );
  return b64(sig);
}
