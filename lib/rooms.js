/* Krąg — pokoje tematyczne (#6, część 2): grupa = E2E z rozgłaszaniem per-odbiorca.
 * Zasada: NIE ma klucza grupowego na serwerze. Nadawca szyfruje wiadomość OSOBNO
 * do każdego członka (istniejącym kanałem parami sessionFor→encrypt) i wysyła N kopert.
 * Serwer widzi tylko: że pokój istnieje i kto jest członkiem (potrzebne do dołączania
 * i do listy odbiorców rozgłaszania). Treści ani przynależności „kto z kim pisze w środku"
 * nie zna — routing do wątku pokoju jest zaszyty w ZASZYFROWANYM ładunku (roomId).
 */

// Ładunek wiadomości pokojowej — po odszyfrowaniu odbiorca pozna, do którego pokoju trafia.
export function roomPayload(roomId, text) {
  return JSON.stringify({ k: 'room', r: String(roomId), t: String(text) });
}

/** Odczyt ładunku pokojowego z odszyfrowanego tekstu. Zwraca {roomId, text} albo null (zwykła wiadomość 1:1). */
export function parseRoomPayload(plaintext) {
  try {
    const o = JSON.parse(plaintext);
    if (o && o.k === 'room' && typeof o.r === 'string' && typeof o.t === 'string') {
      return { roomId: o.r, text: o.t };
    }
  } catch { /* nie-JSON → zwykła wiadomość */ }
  return null;
}

// Lokalny klucz wątku pokoju w IndexedDB / w liście rozmów (odróżnia grupę od 1:1).
export function roomPeerKey(roomId) { return 'room:' + roomId; }
export function isRoomPeer(peer) { return typeof peer === 'string' && peer.startsWith('room:'); }
export function roomIdFromPeer(peer) { return isRoomPeer(peer) ? peer.slice(5) : null; }

/**
 * Rozgłoszenie wiadomości do pokoju: dla każdego członka ≠ self szyfruje ładunek osobno.
 * sealFor: (member, plaintext) => Promise<ciphertext>  (np. koperta AES-GCM z sesji parami).
 * Zwraca [{ to, ciphertext }] — po jednej kopercie na członka (bez nadawcy).
 */
export async function fanout({ roomId, members, self, text }, sealFor) {
  const payload = roomPayload(roomId, text);
  const targets = (members || []).filter((m) => m && m !== self);
  const out = [];
  for (const m of targets) {
    out.push({ to: m, ciphertext: await sealFor(m, payload) });
  }
  return out;
}
