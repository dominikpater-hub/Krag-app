/* Krąg — passkey (WebAuthn) UŻYWANY WYŁĄCZNIE LOKALNIE jako źródło sekretu (PRF).
 *
 * Nie logujemy się passkeyem na serwerze — serwer nigdy nie widzi WebAuthn i pozostaje ślepy.
 * Passkey służy tylko do wyprowadzenia stałego, tajnego ciągu (rozszerzenie PRF), którego
 * nie zna nikt poza urządzeniem. Z tego sekretu odblokowujemy sejf (lib/vault.js).
 * Passkeye synchronizują się między urządzeniami użytkownika przez iCloud/Google (E2E po ich
 * stronie) → ten sam PRF na drugim telefonie → ten sam sejf, bez podawania nam czegokolwiek.
 *
 * Gdy telefon/przeglądarka nie wspiera PRF — funkcje rzucają, a UI schodzi na Klucz Kręgu.
 */
'use strict';

const PRF_SALT = new TextEncoder().encode('krag/vault-prf/v1');
const rp = () => ({ id: location.hostname, name: 'Krąg' });

function bytes(n) { return crypto.getRandomValues(new Uint8Array(n)); }
function b64url(u8) {
  let s = ''; for (const b of u8) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Czy w ogóle jest WebAuthn z platformowym authenticatorem. */
export function passkeyAvailable() {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential && !!(navigator.credentials && navigator.credentials.create);
}

async function prfFromAssertion(allowCredentials) {
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: bytes(32),
      rpId: rp().id,
      allowCredentials,
      userVerification: 'preferred',
      timeout: 60000,
      extensions: { prf: { eval: { first: PRF_SALT } } },
    },
  });
  const ext = assertion && assertion.getClientExtensionResults ? assertion.getClientExtensionResults() : {};
  const first = ext && ext.prf && ext.prf.results && ext.prf.results.first;
  if (!first) return null;
  return { secret: new Uint8Array(first), credentialId: new Uint8Array(assertion.rawId) };
}

/** Tworzy passkey (resident/discoverable) i zwraca sekret PRF. Rzuca, gdy brak PRF. */
export async function createPasskey(label = 'Krąg') {
  const cred = await navigator.credentials.create({
    publicKey: {
      rp: rp(),
      user: { id: bytes(16), name: label, displayName: label },
      challenge: bytes(32),
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { residentKey: 'required', requireResidentKey: true, userVerification: 'preferred' },
      timeout: 60000,
      extensions: { prf: {} },
    },
  });
  if (!cred) throw new Error('Nie udało się utworzyć passkeya');
  // Wiele przeglądarek nie zwraca PRF przy create — pobieramy go osobnym get() na tym poświadczeniu.
  const got = await prfFromAssertion([{ type: 'public-key', id: new Uint8Array(cred.rawId) }]);
  if (!got) throw new Error('To urządzenie nie wspiera PRF — użyj Klucza Kręgu');
  return { secret: got.secret, credentialId: b64url(new Uint8Array(cred.rawId)) };
}

/** Odblokowanie: wybór z synchronizowanych passkeyów (discoverable) → sekret PRF. Null gdy brak PRF. */
export async function unlockPasskey() {
  const got = await prfFromAssertion([]);   // brak allowCredentials → discoverable
  return got ? got.secret : null;
}
