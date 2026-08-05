/* Krąg — nawigacja między ekranami (pokazywanie/chowanie .screen + tabbar).
 * Wydzielone z app.js. Sam przełącznik ekranów; wiring zdarzeń zostaje w app.js,
 * bo zależy od funkcji-widoków (idaFirstOpen, renderProfile).
 */
import { $ } from './dom.js';

export const MAIN_TABS = { ida: 1, app: 1, diary: 1, profile: 1 };

export function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('on', s.id === 's-' + id));
  const tb = $('#tabbar');
  if (tb) {
    tb.hidden = !MAIN_TABS[id];
    tb.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.dataset.tab === id));
  }
  window.scrollTo(0, 0);
}
