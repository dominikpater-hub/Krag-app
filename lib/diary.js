/* Krąg — Dziennik zdrowia (#7) + Trener odporności (#8).
 * Wyniki (CD4/wiremia) + wykres, leki i interakcje, wizyty, koinfekcje/inne badania,
 * zdjęcia badań z OCR, notatki. Wszystko lokalne (IndexedDB) — nic nie idzie na serwer.
 * Wydzielone z app.js. Dwa haki widoku (Ida) wstrzykiwane przez initDiary(deps).
 */
import { $, escapeHtml, toast, getI18nLang } from './dom.js';
import { all, put, del, wipe } from './db.js';
import { t } from './i18n.js';
import { show } from './nav.js';
import { knownFor, checkSubstance } from './interactions.js';
import { parseLabValues, ocrImage } from './ocr.js';

// Haki z app.js (widok Idy + odmiana gramatyczna toastów) — wstrzykiwane w initDiary.
let idaFirstOpen = () => {};
let gwt = (base) => t('toast.' + base + 'N');

export async function renderDiaryStatus() {
  const persisted = navigator.storage?.persisted ? await navigator.storage.persisted() : false;
  const ds = $('#diary-state'); if (ds) ds.textContent = 'ok' + (persisted ? ' · trwałe' : '');
  const ss = $('#sw-state'); if (ss) ss.textContent = ('serviceWorker' in navigator) ? 'ok' : '—';
  const dt = $('#d-date'); if (dt && !dt.value) dt.value = new Date().toISOString().slice(0, 10);
  await renderDiary();
}
const dstr = (v) => { try { return new Date(v).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }); } catch { return v; } };
const kind = (i, k) => (i.kind || 'note') === k;

export async function renderDiary() {
  const items = await all('diary');
  renderResults(items);
  renderCoach(items);
  fill('#d-meds', items.filter((i) => kind(i, 'med')),
    (m) => `<span><span class="v">${escapeHtml(m.name)}</span> <span class="sub">${escapeHtml(m.dose || '')}${m.time ? ' · ' + escapeHtml(m.time) : ''}</span></span>`);
  fill('#d-visits', items.filter((i) => kind(i, 'visit')).sort((a, b) => (a.date || '').localeCompare(b.date || '')),
    (v) => `<span><span class="v">${escapeHtml(v.title)}</span> <span class="sub">${escapeHtml(v.date || '')}</span></span>`);
  // #2 koinfekcje / inne badania: nazwa + wynik + data
  fill('#d-cotests', items.filter((i) => kind(i, 'cotest')).sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    (c) => `<span><span class="v">${escapeHtml(c.name)}</span> ${c.result ? '<span class="sub">' + escapeHtml(c.result) + '</span>' : ''}${c.date ? ' <span class="sub">· ' + escapeHtml(c.date) + '</span>' : ''}</span>`);
  renderInteractions(items);
  renderCoinfectionChips();
  fill('#d-notes', items.filter((i) => kind(i, 'note')).sort((a, b) => b.ts - a.ts),
    (n) => `<span><span class="sub">${dstr(n.ts)}</span> ${escapeHtml(n.note)}</span>`);
  renderPhotos(items.filter((i) => kind(i, 'photo')));
}
function fill(sel, list, row) {
  const box = $(sel); if (!box) return;
  box.innerHTML = list.length
    ? list.map((i) => `<div class="d-item">${row(i)}<span class="x" data-del="${i.ts}">${t('d.del')}</span></div>`).join('')
    : `<div class="d-empty">${t('d.none')}</div>`;
  box.querySelectorAll('[data-del]').forEach((e) => e.addEventListener('click', async () => { await del('diary', Number(e.dataset.del)); await renderDiary(); }));
}
function sparkline(series, color) {
  const vs = series.map((p) => p.v), mn = Math.min(...vs), mx = Math.max(...vs), span = (mx - mn) || 1, n = series.length;
  const xy = (p, i) => [n === 1 ? 50 : (i / (n - 1)) * 100, 28 - ((p.v - mn) / span) * 24];
  const pts = series.map((p, i) => xy(p, i).map((z) => z.toFixed(1)).join(',')).join(' ');
  const dots = series.map((p, i) => { const [x, y] = xy(p, i); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.7" fill="${color}"/>`; }).join('');
  return `<svg viewBox="0 0 100 30" preserveAspectRatio="none" style="height:44px"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" vector-effect="non-scaling-stroke"/>${dots}</svg>`;
}
function renderResults(items) {
  const res = items.filter((i) => kind(i, 'result'));
  const box = $('#d-chart'); const list = $('#d-results');
  const series = (mk) => res.filter((r) => r.marker === mk).sort((a, b) => (a.date || '').localeCompare(b.date || '')).map((r) => ({ v: r.v, date: r.date }));
  const cd4 = series('cd4'), vl = series('vl');
  let chart = '';
  if (cd4.length) chart += sparkline(cd4, '#7E9B77') + `<div class="lg"><i><span class="sw" style="background:#7E9B77"></span>CD4 · ${cd4[cd4.length - 1].v}</i></div>`;
  if (vl.length) { const last = vl[vl.length - 1].v; chart += sparkline(vl, '#C98A6B') + `<div class="lg"><i><span class="sw" style="background:#C98A6B"></span>VL · ${last < 50 ? t('d.undetectable') : last}</i></div>`; }
  if (box) box.innerHTML = chart;
  if (list) {
    const rows = res.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    list.innerHTML = rows.length
      ? rows.map((r) => `<div class="d-item"><span><span class="v">${r.marker === 'cd4' ? 'CD4' : 'VL'} ${r.marker === 'vl' && r.v < 50 ? t('d.undetectable') : r.v}</span> <span class="sub">${escapeHtml(r.date || '')}</span></span><span class="x" data-del="${r.ts}">${t('d.del')}</span></div>`).join('')
      : `<div class="d-empty">${t('d.none')}</div>`;
    list.querySelectorAll('[data-del]').forEach((e) => e.addEventListener('click', async () => { await del('diary', Number(e.dataset.del)); await renderDiary(); }));
  }
}
function renderPhotos(list) {
  const box = $('#d-photos'); if (!box) return;
  box.innerHTML = list.sort((a, b) => b.ts - a.ts).map((p) =>
    `<div class="ph"><img src="${p.img}" alt="badanie"><span class="x" data-del="${p.ts}">✕</span></div>`).join('');
  box.querySelectorAll('[data-del]').forEach((e) => e.addEventListener('click', async () => { await del('diary', Number(e.dataset.del)); await renderDiary(); }));
}
// Trener odporności (#8, wpleciony) — na danych z dziennika, wspierający i NIEdiagnostyczny.
// Zasady z researchu: pokazuje dane + ogólną wiedzę, NIE ocenia wyniku i NIE prognozuje
// (granica wyrobu medycznego, MDR reguła 11). Adherencja = jedyna udowodniona „dźwignia".
// „Samopoczucie ≠ CD4" mówimy wprost. Framing bez winy + wsparcie psychiczne z dostępem do Idy.
function renderCoach(items) {
  const box = $('#coach-card'); if (!box) return;
  const cd4 = items.filter((i) => kind(i, 'result') && i.marker === 'cd4').sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const vl = items.filter((i) => kind(i, 'result') && i.marker === 'vl').sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  if (!cd4.length && !vl.length) { box.innerHTML = ''; return; }
  const lines = [];
  if (cd4.length) {
    const last = cd4[cd4.length - 1].v;
    let line = t('coach.cd4now', { v: last });
    if (cd4.length >= 2) {
      const prev = cd4[cd4.length - 2].v;
      line += ' ' + (last > prev ? t('coach.trendUp') : last < prev ? t('coach.trendDown') : t('coach.trendFlat'));
    }
    lines.push(line);
    lines.push(t('coach.phases'));                              // fazy + „nie Twoja wina"
    if (last >= 500) lines.push(t('coach.m500')); else if (last >= 200) lines.push(t('coach.m200'));  // kontekst, nie ocena
  }
  if (vl.length && vl[vl.length - 1].v < 50) lines.push(t('coach.uu'));
  lines.push(t('coach.adh'));                                   // jedyna udowodniona dźwignia
  lines.push(t('coach.wellbeing'));                             // samopoczucie ≠ CD4 (uczciwie)
  box.innerHTML = `<div class="coach"><h3>◈ ${t('coach.title')}</h3>${lines.map((l) => `<div class="mile"><span class="b">·</span> ${l}</div>`).join('')}
    <div class="coach-mind"><span>${t('coach.mind')}</span> <button class="linklike" id="coach-talk" type="button">${t('coach.mindCta')}</button></div>
    <p style="margin:10px 0 0;font-size:12px;color:var(--tx-3)">${t('coach.note')}</p></div>`;
  const talk = $('#coach-talk');
  if (talk) talk.addEventListener('click', () => { show('ida'); idaFirstOpen(); });
}

// —— interakcje leków (#7) ——
function ixRow(h) {
  return `<div class="ix-item ${h.sev === 'high' ? 'hi' : 'med'}"><div>${escapeHtml(h.msg)}</div><div class="ix-adv">${escapeHtml(h.adv)}</div></div>`;
}
function renderInteractions(items) {
  const box = $('#ix-known'); if (!box) return;
  const meds = items.filter((i) => kind(i, 'med')).map((m) => m.name);
  if (!meds.length) { box.innerHTML = `<div class="d-empty">${t('ix.addMeds')}</div>`; return; }
  const known = knownFor(meds, getI18nLang());
  box.innerHTML = known.length ? `<div class="ctx">${t('ix.known')}</div>${known.map(ixRow).join('')}` : '';
}
async function runIxCheck() {
  const q = ($('#ix-in').value || '').trim(); const out = $('#ix-out'); if (!out) return;
  if (!q) { out.innerHTML = ''; return; }
  const meds = (await all('diary')).filter((i) => kind(i, 'med')).map((m) => m.name);
  const hits = checkSubstance(meds, q, getI18nLang());
  out.innerHTML = hits.length ? hits.map(ixRow).join('') : `<div class="ix-item ok">${t('ix.none')}</div>`;
}

// —— dodawanie wpisów ——
function today() { return ($('#d-date') && $('#d-date').value) || new Date().toISOString().slice(0, 10); }
// #2 koinfekcje/inne badania: szybkie podpowiedzi (chipy) + dodawanie
function renderCoinfectionChips() {
  const box = $('#ci-chips'); if (!box) return;
  const chips = t('d.cotestChips').split(',').map((s) => s.trim()).filter(Boolean);
  box.innerHTML = chips.map((c) => `<button class="chip sm" type="button" data-ci="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('');
  box.querySelectorAll('[data-ci]').forEach((e) => e.addEventListener('click', () => { $('#ci-name').value = e.dataset.ci; $('#ci-result').focus(); }));
}
async function fileToThumb(file) {
  return new Promise((res) => {
    const fr = new FileReader();
    fr.onload = () => { const img = new Image(); img.onload = () => { const max = 1000; let w = img.width, h = img.height; if (w > max || h > max) { const k = Math.min(max / w, max / h); w = Math.round(w * k); h = Math.round(h * k); } const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h); res(c.toDataURL('image/jpeg', 0.7)); }; img.src = fr.result; };
    fr.readAsDataURL(file);
  });
}
async function saveDiaryNote() {
  const inp = $('#diary-note'); const note = (inp.value || '').trim();
  if (!note) return;
  inp.value = '';
  await put('diary', { ts: Date.now(), kind: 'note', note });
  await renderDiary();
  toast(gwt('diary'));
}

// Podpięcie zdarzeń dziennika. deps: { idaFirstOpen, gwt } z app.js.
export function initDiary(deps = {}) {
  if (deps.idaFirstOpen) idaFirstOpen = deps.idaFirstOpen;
  if (deps.gwt) gwt = deps.gwt;

  $('#ix-check').addEventListener('click', runIxCheck);
  $('#ix-in').addEventListener('keydown', (e) => { if (e.key === 'Enter') runIxCheck(); });

  $('#d-add-result').addEventListener('click', async () => {
    const v = Number($('#d-val').value); if (!v && v !== 0) return;
    await put('diary', { ts: Date.now(), kind: 'result', marker: $('#d-marker').value, v, date: today() });
    $('#d-val').value = ''; await renderDiary(); toast(t('d.saved'));
  });
  $('#d-add-med').addEventListener('click', async () => {
    const name = ($('#d-med-name').value || '').trim(); if (!name) return;
    await put('diary', { ts: Date.now(), kind: 'med', name, dose: ($('#d-med-dose').value || '').trim(), time: $('#d-med-time').value || '' });
    $('#d-med-name').value = ''; $('#d-med-dose').value = ''; await renderDiary(); toast(t('d.saved'));
  });
  $('#d-add-visit').addEventListener('click', async () => {
    const title = ($('#d-visit-title').value || '').trim(); if (!title) return;
    await put('diary', { ts: Date.now(), kind: 'visit', title, date: $('#d-visit-date').value || '' });
    $('#d-visit-title').value = ''; await renderDiary(); toast(t('d.saved'));
  });
  $('#ci-add').addEventListener('click', async () => {
    const name = ($('#ci-name').value || '').trim(); if (!name) return;
    await put('diary', { ts: Date.now(), kind: 'cotest', name, result: ($('#ci-result').value || '').trim(), date: $('#ci-date').value || today() });
    $('#ci-name').value = ''; $('#ci-result').value = ''; await renderDiary(); toast(t('d.saved'));
  });
  // #7: JEDEN przycisk — zapisuje zdjęcie badania I próbuje odczytać z niego WSZYSTKIE wyniki
  // (CD4 + wiremia) prosto do dziennika. OCR działa online; offline zostaje samo zdjęcie.
  $('#d-photo-in').addEventListener('change', async (e) => {
    const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return;
    const msg = $('#d-ocr-msg');
    const img = await fileToThumb(f);
    await put('diary', { ts: Date.now(), kind: 'photo', img, caption: '' });
    await renderDiary();
    if (msg) msg.textContent = t('d.ocrReading');
    try {
      const v = parseLabValues(await ocrImage(f));
      const added = [];
      const base = Date.now();
      if (v.cd4 != null) { await put('diary', { ts: base, kind: 'result', marker: 'cd4', v: v.cd4, date: today() }); added.push('CD4 ' + v.cd4); }
      if (v.vl != null) { await put('diary', { ts: base + 1, kind: 'result', marker: 'vl', v: v.vl, date: today() }); added.push(t('d.vl') + ' ' + (v.vl < 50 ? t('d.undetectable') : v.vl)); }
      await renderDiary();
      if (msg) msg.textContent = added.length ? t('d.ocrAdded', { list: added.join(', ') }) : t('d.ocrNone');
    } catch (err) {
      if (msg) msg.textContent = t('d.ocrOffline');
    }
  });
  $('#diary-save').addEventListener('click', saveDiaryNote);
  $('#diary-note').addEventListener('keydown', (e) => { if (e.key === 'Enter') saveDiaryNote(); });

  // Wyczyść wszystkie dane z tego urządzenia (nieodwracalne).
  $('#wipe').addEventListener('click', async () => { await wipe(); location.reload(); });
}
