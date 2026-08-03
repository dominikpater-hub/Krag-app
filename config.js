/* Krąg — konfiguracja klienta.
 * API_BASE: adres backendu rozmów/synchronizacji.
 *  • window.KRAG_API_BASE — jawnie ustawiony URL wygrywa zawsze.
 *  • na localhost — dev-server (server/src/dev-memory.ts).
 *  • w produkcji bez wpiętego backendu — '' (ten sam origin). Gdy backendu nie ma,
 *    aplikacja działa LOKALNIE (Ida, dziennik, profil); rozmowy/sync dołączą, gdy będzie.
 */
function pickApiBase() {
  if (typeof globalThis !== 'undefined' && globalThis.KRAG_API_BASE) return globalThis.KRAG_API_BASE;
  // Produkcja: adres API ustawiany jednym <meta name="krag-api-base" content="https://api...">
  if (typeof document !== 'undefined') {
    const m = document.querySelector('meta[name="krag-api-base"]');
    if (m && m.content) return m.content;
  }
  if (typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return 'http://localhost:8080';
  return '';   // brak backendu → tryb lokalny (bez „Failed to fetch" w twarz)
}
export const API_BASE = pickApiBase();
