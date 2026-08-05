/* Krąg — drobne narzędzia DOM współdzielone przez moduły UI.
 * Czyste, bez stanu aplikacji. Wydzielone z app.js dla czytelności.
 */
export const $ = (s) => document.querySelector(s);

export function toast(msg) {
  let el = document.querySelector('#toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('on');
  const dur = Math.min(7000, 2600 + msg.length * 28);   // dłuższe komunikaty — dłużej widoczne
  clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('on'), dur);
}

export function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
export function fmt(ts) { return new Date(ts).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }); }
export function getI18nLang() { try { return document.documentElement.lang || 'pl'; } catch { return 'pl'; } }
