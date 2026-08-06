/* Krąg — tożsamość osobna dla pokoju (audyt S-2, faza 2).
 *
 * PO CO. Wiadomości w pokoju są szyfrowane OSOBNO do każdego członka (lib/rooms.js →
 * fanout), więc klient musi znać uchwyty pozostałych — listy członków nie da się przed
 * nimi ukryć bez przebudowy szyfrowania. Cała obrona stoi więc na tym, CO widać na tej
 * liście. Tutaj: nie Twój główny uchwyt, tylko nazwa lokalna dla pokoju.
 *
 * Skutek: wejście do pokoju „Świeżo po diagnozie" nie wiąże Cię z ogłoszeniem w katalogu,
 * z rozmowami 1:1 ani z innymi pokojami. Kto zdobędzie klucz i wejdzie „na żniwo",
 * wynosi listę nazw bezużytecznych poza tym pokojem.
 *
 * DLACZEGO OSOBNE KONTO, A NIE SAMA NAZWA. Serwer bierze nadawcę koperty z SESJI
 * (`sendEnvelope(..., req.account.pseudonym, ...)`). Żeby naprawdę wystąpić pod inną
 * nazwą, trzeba mieć własne konto, własne klucze i własną sesję. Sama etykieta
 * wyświetlana niczego by nie ukryła.
 *
 * DECYZJA właściciela 2026-08-06: ZAŁOŻYCIEL pokoju występuje pod swoim GŁÓWNYM uchwytem.
 * Jest gospodarzem — wystawia klucze, usuwa, odpowiada za pokój. Osobną tożsamość
 * dostają osoby DOŁĄCZAJĄCE.
 *
 * GRANICA UCZCIWOŚCI: to chroni przed innymi członkami, NIE przed serwerem. Serwer nadal
 * widzi, które konto jest w którym pokoju (ustalenie S-3), a konta zakładane z tego samego
 * urządzenia łączy czas i adres IP. UI nie może obiecywać więcej, niż to daje.
 */

import { generateAuthKeyPair, authPublicB64, exportAuthKeyPair, importAuthKeyPair, pseudoFrom } from './identity.js';
import { generateKeyPair, publicKeyB64, exportMsgKeyPair, importMsgKeyPair } from './e2e.js';

/** Nazwa lokalna dla pokoju — z klucza tej tożsamości, tak samo jak uchwyt główny. */
async function pseudoForKeys(authKeyPair) {
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', authKeyPair.publicKey));
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', raw));
  return pseudoFrom(hash);
}

/** Nowa tożsamość pokojowa (same klucze — bez dotykania sieci). */
export async function createRoomIdentity() {
  const authKeyPair = await generateAuthKeyPair();
  const msgKeyPair = await generateKeyPair();
  return { pseudo: await pseudoForKeys(authKeyPair), authKeyPair, msgKeyPair };
}

/** Postać do zapisu w IndexedDB (klucze prywatne zostają na urządzeniu). */
export async function packRoomIdentity(roomId, ident) {
  return {
    roomId,
    pseudo: ident.pseudo,
    auth: await exportAuthKeyPair(ident.authKeyPair),
    msg: await exportMsgKeyPair(ident.msgKeyPair),
  };
}

export async function unpackRoomIdentity(rec) {
  return {
    pseudo: rec.pseudo,
    authKeyPair: await importAuthKeyPair(rec.auth),
    msgKeyPair: await importMsgKeyPair(rec.msg),
  };
}

/**
 * Rejestracja tożsamości pokojowej na serwerze: konto (dowód pracy) → sesja → klucze publiczne.
 * client: świeży makeClient() — WŁASNY token, żeby nie mieszać sesji z kontem głównym.
 * solve:  (challenge, bits) => nonce   ·   sign: (keyPair, nonce) => podpis
 */
export async function registerRoomIdentity({ client, ident, solve, sign }) {
  const pub = await authPublicB64(ident.authKeyPair);
  const { challenge, bits } = await client.powChallenge();
  await client.register(ident.pseudo, pub, { challenge, nonce: solve(challenge, bits) });
  await client.login(ident.pseudo, (n) => sign(ident.authKeyPair, n));
  const mk = await publicKeyB64(ident.msgKeyPair);
  await client.publishKeys(mk, mk, []);
  return ident;
}
