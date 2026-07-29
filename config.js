/* Krąg — konfiguracja klienta.
 * API_BASE: adres backendu. Domyślnie dev-server lokalny (server/src/dev-memory.ts).
 * W produkcji podmień na URL API (po deploy, O-09) albo ustaw window.KRAG_API_BASE.
 * Pusty string ('') = ten sam origin, co aplikacja. */
export const API_BASE =
  (typeof globalThis !== 'undefined' && globalThis.KRAG_API_BASE) ?? 'http://localhost:8080';
