/* Krąg — klient API (Faza 3.5, spięcie PWA ↔ backend).
 * Cienka warstwa nad endpointami `server/`. Trzyma token sesji w pamięci.
 * Logowanie: challenge-response — `login()` dostaje callback podpisujący nonce
 * (zwykle `(n) => signNonce(authKeyPair, n)` z `identity.js`), więc ten moduł
 * nie dotyka kluczy prywatnych. Działa w przeglądarce i w Node 22 (globalny fetch). */

export function makeClient(baseUrl) {
  let token = null;

  async function req(method, path, opts = {}) {
    const headers = {};
    if (opts.body) headers['content-type'] = 'application/json';
    if (opts.auth && token) headers.authorization = 'Bearer ' + token;
    const res = await fetch(baseUrl + path, {
      method,
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  return {
    setToken: (t) => { token = t; },
    getToken: () => token,

    health: () => req('GET', '/health'),
    bootstrap: (pseudonym, publicKey) =>
      req('POST', '/accounts/bootstrap', { body: { pseudonym, publicKey } }),
    redeem: (code, pseudonym, publicKey) =>
      req('POST', '/invites/redeem', { body: { code, pseudonym, publicKey } }),
    powChallenge: () => req('GET', '/pow'),
    register: (pseudonym, publicKey, pow) =>
      req('POST', '/accounts/register', { body: { pseudonym, publicKey, pow } }),

    /** signNonce: (nonce:string) => Promise<base64 signature> */
    async login(pseudonym, signNonce) {
      const { nonce } = await req('POST', '/auth/challenge', { body: { pseudonym } });
      const signature = await signNonce(nonce);
      const out = await req('POST', '/auth/verify', { body: { pseudonym, nonce, signature } });
      token = out.token;
      return out;
    },

    createInvite: () => req('POST', '/invites', { auth: true }),
    publishKeys: (identityKey, signedPrekey, oneTimePrekeys = []) =>
      req('POST', '/keys', { auth: true, body: { identityKey, signedPrekey, oneTimePrekeys } }),
    fetchKeys: (pseudonym) =>
      req('GET', '/keys/' + encodeURIComponent(pseudonym), { auth: true }),
    sendEnvelope: (toPseudonym, ciphertext) =>
      req('POST', '/envelopes', { auth: true, body: { toPseudonym, ciphertext } }),
    pullEnvelopes: () => req('GET', '/envelopes', { auth: true }),
    report: (reportedPseudonym, revealed) =>
      req('POST', '/reports', { auth: true, body: { reportedPseudonym, revealed } }),

    // Sejf E2E: odczyt po lookupId (bez auth), zapis szyfrogramu (auth).
    getVault: (lookupId) => req('GET', '/vault/' + encodeURIComponent(lookupId)),
    putVault: (lookupId, ciphertext) =>
      req('PUT', '/vault', { auth: true, body: { lookupId, ciphertext } }),
  };
}
