/* Krąg — warstwa E2E po stronie klienta (Faza 3.4).
 *
 * STATUS: INTERIM. To jest poprawny transportowo szkielet szyfrowania end-to-end
 * (ECDH P-256 → HKDF → AES-256-GCM). Serwer przenosi tylko `iv`+`ct` i NIE ma klucza.
 *
 * DOCELOWO (przed produkcją): Signal Protocol (`libsignal-client`, model PreKeys) —
 * daje forward secrecy i post-compromise security (podwójny ratchet), których ten
 * interim NIE ma. Interfejs (`generateKeyPair`, `publicKeyB64`, `deriveSessionKey`,
 * `encrypt`, `decrypt`) jest celowo wąski, żeby podmiana na libsignal nie ruszała
 * reszty klienta. Klucze do WIADOMOŚCI (ECDH) są osobne od klucza do LOGOWANIA (ECDSA).
 *
 * Działa tak samo w przeglądarce i w Node 22 (globalne `crypto.subtle`).
 */

const B64 = {
  enc: (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))),
  dec: (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)),
};

/** Para kluczy do wymiany kluczy (ECDH P-256). Prywatny nigdy nie opuszcza urządzenia. */
export async function generateKeyPair() {
  return crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
}

export async function publicKeyB64(keyPair) {
  const raw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  return B64.enc(raw);
}

async function importPeerPublic(peerB64) {
  return crypto.subtle.importKey('raw', B64.dec(peerB64), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
}

/** Eksport pary kluczy wiadomości do JWK (do sejfu E2E). */
export async function exportMsgKeyPair(keyPair) {
  return {
    priv: await crypto.subtle.exportKey('jwk', keyPair.privateKey),
    pub: await crypto.subtle.exportKey('jwk', keyPair.publicKey),
  };
}
/** Odtworzenie pary kluczy wiadomości z JWK. */
export async function importMsgKeyPair(b) {
  const alg = { name: 'ECDH', namedCurve: 'P-256' };
  return {
    privateKey: await crypto.subtle.importKey('jwk', b.priv, alg, true, ['deriveBits']),
    publicKey: await crypto.subtle.importKey('jwk', b.pub, alg, true, []),
  };
}

/** ECDH + HKDF → klucz sesji AES-256-GCM. Obie strony wyliczą ten sam klucz. */
export async function deriveSessionKey(myKeyPair, peerPublicB64, info = 'krag/1:1') {
  const peer = await importPeerPublic(peerPublicB64);
  const bits = await crypto.subtle.deriveBits({ name: 'ECDH', public: peer }, myKeyPair.privateKey, 256);
  const hkdfKey = await crypto.subtle.importKey('raw', bits, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: new TextEncoder().encode(info) },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Zwraca kopertę { iv, ct } (base64) — dokładnie to, co idzie do `POST /envelopes`. */
export async function encrypt(sessionKey, plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    sessionKey,
    new TextEncoder().encode(plaintext),
  );
  return { iv: B64.enc(iv), ct: B64.enc(ct) };
}

export async function decrypt(sessionKey, envelope) {
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: B64.dec(envelope.iv) },
    sessionKey,
    B64.dec(envelope.ct),
  );
  return new TextDecoder().decode(pt);
}

/** Pomocnik: serializacja koperty do jednego pola `ciphertext` API i z powrotem. */
export const envelope = {
  pack: (e) => B64.enc(new TextEncoder().encode(JSON.stringify(e))),
  unpack: (s) => JSON.parse(new TextDecoder().decode(B64.dec(s))),
};
