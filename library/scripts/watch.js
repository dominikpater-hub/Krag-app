#!/usr/bin/env node
/**
 * watch.js — oczy dla currency.js.
 *
 * currency.js wie, że fakt jest przeterminowany W KALENDARZU.
 * Ten skrypt wie, że zmieniło się ŹRÓDŁO. To dwa różne wyzwalacze.
 *
 * Inwarianty egzekwowane tutaj, nie w opisie:
 *  - watch NIGDY nie dotyka verifiedBy ani verifiedAt (policy.publishGate)
 *  - watch może przestawić status wyłącznie na NEEDS_REVIEW, nigdy na PUBLISHED
 *  - brak udanego sprawdzenia jest zdarzeniem, nie ciszą (puls) — martwy
 *    obserwator wygląda identycznie jak stabilny świat
 *  - zmiana w źródle nie unieważnia faktu; stawia go w kolejce do człowieka
 *
 * Użycie:
 *   node scripts/watch.js            — sprawdź to, co wypada dziś
 *   node scripts/watch.js --all      — sprawdź wszystko, niezależnie od rytmu
 *   node scripts/watch.js --dry      — pokaż, co by zrobił, nic nie zapisuj
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const http = require('http');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const watch = JSON.parse(fs.readFileSync(path.join(ROOT, 'watch.json'), 'utf8'));
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, 'seed/facts-hiv-2026-07.json'), 'utf8'));
const STATE_DIR = path.join(ROOT, 'state');
const STATE = path.join(STATE_DIR, 'watch-state.json');
const QUEUE = path.join(STATE_DIR, 'watch-queue.json');
const ENTRIES = path.join(ROOT, 'entries');

const ALL = process.argv.includes('--all');
const DRY = process.argv.includes('--dry');
const today = new Date().toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);

fs.mkdirSync(STATE_DIR, { recursive: true });
const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : { sources: {} };

/* ---------- pobieranie ---------- */
function fetchUrl(url, { maxBytes = 90e6, timeout = 90000, redirects = 0 } = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('http:') ? http : https;
    const req = mod.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; krag-watch/1.0; +monitoring wiedzy)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pl,en;q=0.8',
        'Accept-Encoding': 'gzip'
      }
    }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        if (redirects >= 5) return reject(new Error('zbyt wiele przekierowań (>5)'));  // S-5: limit pętli
        return resolve(fetchUrl(new URL(res.headers.location, url).href, { maxBytes, timeout, redirects: redirects + 1 }));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode}`)); }
      const enc = res.headers['content-encoding'];
      const stream = enc === 'gzip' ? res.pipe(zlib.createGunzip())
                   : enc === 'deflate' ? res.pipe(zlib.createInflate()) : res;
      const chunks = []; let size = 0;
      stream.on('data', c => {
        size += c.length;
        if (size > maxBytes) { req.destroy(); return reject(new Error('plik za duży')); }
        chunks.push(c);
      });
      stream.on('end', () => resolve({ body: Buffer.concat(chunks), headers: res.headers }));
      stream.on('error', reject);
    });
    req.setTimeout(timeout, () => { req.destroy(); reject(new Error('przekroczony czas')); });
    req.on('error', reject);
  });
}

/* ---------- parsery: co w tym pliku jest naprawdę zmianą ---------- */
const parsers = {
  /* Z 68 MB rejestru bierzemy wyłącznie leki o kodach ATC z listy.
     Nowy generyk paracetamolu nie jest zdarzeniem dla tej aplikacji. */
  rplArv(buf, wp) {
    const xml = buf.toString('utf8');
    const allow = wp.atcAllow || [];
    const out = {};
    const re = /<produktLeczniczy\b([^>]*)>([\s\S]*?)<\/produktLeczniczy>/g;
    let m;
    while ((m = re.exec(xml))) {
      const attrs = m[1], body = m[2];
      const atcs = [...body.matchAll(/<kodATC>([^<]+)<\/kodATC>/g)].map(x => x[1].trim());
      if (!atcs.some(a => allow.some(p => a.startsWith(p)))) continue;
      const name = (attrs.match(/nazwaProduktu="([^"]*)"/) || [, ''])[1];
      const perm = (attrs.match(/numerPozwolenia="([^"]*)"/) || [, ''])[1];
      const valid = (attrs.match(/waznoscPozwolenia="([^"]*)"/) || [, ''])[1];
      if (name) out[`${name}|${perm}`] = { atc: atcs.sort().join(','), valid };
    }
    return out;
  }
};

/* Hash surowej strony jest bezużyteczny: banery cookie, identyfikatory sesji
   i znaczniki czasu zmieniają go przy każdym pobraniu. Porównujemy tekst
   pozbawiony rzeczy zmiennych z natury. */
function normalizeHtml(buf) {
  return buf.toString('utf8')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .replace(/\d{4}-\d{2}-\d{2}[T\s][\d:.]+/g, ' ')   // znaczniki czasu
    .replace(/\b\d{8,}\b/g, ' ')                        // identyfikatory sesji
    .replace(/\s+/g, ' ')
    .trim();
}

function diffMaps(before, after) {
  const added = [], removed = [], changed = [];
  for (const k of Object.keys(after)) {
    if (!(k in before)) added.push(k);
    else if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) changed.push(k);
  }
  for (const k of Object.keys(before)) if (!(k in after)) removed.push(k);
  return { added, removed, changed };
}

/* ---------- które wpisy dotyka dane źródło ---------- */
const factsBySource = {}, factsByBlock = {};
for (const f of seed.facts) {
  (factsBySource[f.source] ??= []).push(f.id);
  (factsByBlock[f.block] ??= []).push(f.id);
}
function affected(wp) {
  const ids = new Set();
  if (wp.affectsSource) (factsBySource[wp.affectsSource] || []).forEach(i => ids.add(i));
  for (const b of wp.affectsBlocks || []) (factsByBlock[b] || []).forEach(i => ids.add(i));
  return [...ids];
}

/* ---------- główna pętla ---------- */
(async () => {
  const queue = [];
  const log = [];

  for (const wp of watch.watchpoints) {
    const st = state.sources[wp.id] ??= { lastCheck: null, lastSuccess: null, hash: null, fails: 0 };
    const due = ALL || !st.lastCheck || daysBetween(st.lastCheck, today) >= wp.everyDays;

    /* PULS — brak udanego sprawdzenia od podwójnego rytmu to zdarzenie samo w sobie */
    if (st.lastSuccess && daysBetween(st.lastSuccess, today) > wp.everyDays * 2) {
      queue.push({
        kind: 'PULS', source: wp.id, label: wp.label,
        why: `brak udanego sprawdzenia od ${daysBetween(st.lastSuccess, today)} dni przy rytmie ${wp.everyDays}`,
        ids: [], severity: 'wysoka'
      });
    }

    /* fakty z twardą datą wygaśnięcia — kalendarz, nie obserwacja */
    if (wp.expiresOn) {
      const left = daysBetween(today, wp.expiresOn);
      if (left <= 180) queue.push({
        kind: 'WYGASA', source: wp.id, label: wp.label,
        why: `wygasa ${wp.expiresOn} — zostało ${left} dni`,
        ids: affected(wp), severity: left <= 90 ? 'wysoka' : 'średnia', howTo: wp.howTo
      });
    }

    if (!due) { log.push(`  ${wp.id.padEnd(18)} pomijam — następne za ${wp.everyDays - daysBetween(st.lastCheck, today)} dni`); continue; }

    if (wp.strategy === 'MANUAL') {
      if (wp.expiresOn && queue.some(q => q.kind === 'WYGASA' && q.source === wp.id)) {
        if (!DRY) st.lastCheck = today;
        log.push(`  ${wp.id.padEnd(18)} pominięte — już w kolejce jako wygasające`);
        continue;
      }
      queue.push({
        kind: 'CZŁOWIEK', source: wp.id, label: wp.label,
        why: `rytm ${wp.everyDays} dni — nie ma kanału, trzeba sprawdzić ręcznie`,
        ids: affected(wp), severity: 'średnia', howTo: wp.howTo
      });
      if (!DRY) { st.lastCheck = today; }
      log.push(`  ${wp.id.padEnd(18)} do zrobienia przez człowieka`);
      continue;
    }

    try {
      const { body } = await fetchUrl(wp.url);
      const basis = wp.parser ? body : normalizeHtml(body);
      const hash = crypto.createHash('sha256').update(basis).digest('hex').slice(0, 16);

      if (wp.parser && parsers[wp.parser]) {
        const snapPath = path.join(STATE_DIR, `snap-${wp.id}.json`);
        const now = parsers[wp.parser](body, wp);
        const prev = fs.existsSync(snapPath) ? JSON.parse(fs.readFileSync(snapPath, 'utf8')) : null;
        if (prev) {
          const d = diffMaps(prev, now);
          const total = d.added.length + d.removed.length + d.changed.length;
          if (total) queue.push({
            kind: 'ZMIANA', source: wp.id, label: wp.label,
            why: `rejestr: +${d.added.length} nowych, −${d.removed.length} wycofanych, ~${d.changed.length} zmienionych (tylko ATC z listy)`,
            detail: { added: d.added.slice(0, 8), removed: d.removed.slice(0, 8), changed: d.changed.slice(0, 8) },
            ids: affected(wp), severity: d.removed.length ? 'wysoka' : 'niska'
          });
          log.push(`  ${wp.id.padEnd(18)} ${Object.keys(now).length} pozycji ATC · zmian: ${total}`);
        } else {
          log.push(`  ${wp.id.padEnd(18)} pierwszy zrzut — ${Object.keys(now).length} pozycji, brak punktu odniesienia`);
        }
        if (!DRY) fs.writeFileSync(snapPath, JSON.stringify(now));
      } else {
        if (st.hash && st.hash !== hash) {
          queue.push({
            kind: 'ZMIANA', source: wp.id, label: wp.label,
            why: 'treść strony zmieniła się od ostatniego sprawdzenia — zmianę wykryto maszynowo, znaczenie musi ocenić człowiek',
            ids: affected(wp), severity: 'średnia', needsReading: true
          });
          log.push(`  ${wp.id.padEnd(18)} ZMIANA (hash ${st.hash} → ${hash})`);
        } else {
          log.push(`  ${wp.id.padEnd(18)} bez zmian`);
        }
        if (!DRY) st.hash = hash;
      }
      if (!DRY) { st.lastCheck = today; st.lastSuccess = today; st.fails = 0; }
    } catch (e) {
      if (!DRY) { st.lastCheck = today; st.fails = (st.fails || 0) + 1; }
      queue.push({
        kind: 'BŁĄD', source: wp.id, label: wp.label,
        why: `nie udało się sprawdzić: ${e.message}` + (st.fails > 2 ? ` — ${st.fails} nieudanych prób z rzędu` : ''),
        ids: [], severity: st.fails > 2 ? 'wysoka' : 'niska'
      });
      log.push(`  ${wp.id.padEnd(18)} BŁĄD — ${e.message}`);
    }
  }

  /* ---------- oznaczenie wpisów: wyłącznie NEEDS_REVIEW ---------- */
  const touched = new Set();
  for (const q of queue) for (const id of q.ids) touched.add(id);
  let flipped = 0;
  if (!DRY) {
    for (const id of touched) {
      const p = path.join(ENTRIES, `${id}.json`);
      if (!fs.existsSync(p)) continue;
      const e = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (e.status === 'NEEDS_REVIEW') continue;
      e.status = 'NEEDS_REVIEW';
      e.reviewTrigger = { at: today, by: 'watch.js', sources: queue.filter(q => q.ids.includes(id)).map(q => q.source) };
      /* celowo NIE dotykamy verifiedBy ani verifiedAt — podpis stawia człowiek */
      fs.writeFileSync(p, JSON.stringify(e, null, 2) + '\n');
      flipped++;
    }
    fs.writeFileSync(STATE, JSON.stringify(state, null, 2) + '\n');
    fs.writeFileSync(QUEUE, JSON.stringify({ generatedAt: today, queue }, null, 2) + '\n');
  }

  /* ---------- raport ---------- */
  const rank = { wysoka: 0, średnia: 1, niska: 2 };
  queue.sort((a, b) => rank[a.severity] - rank[b.severity]);
  console.log(`\nwatch: sprawdzono ${watch.watchpoints.length} punktów obserwacyjnych (${today})${DRY ? '  [PRÓBNIE]' : ''}\n`);
  log.forEach(l => console.log(l));
  console.log(`\n${queue.length} zdarzeń do kolejki:\n`);
  for (const q of queue) {
    console.log(`  [${q.severity.toUpperCase().padEnd(7)}] ${q.kind.padEnd(9)} ${q.label}`);
    console.log(`             ${q.why}`);
    if (q.howTo) console.log(`             → ${q.howTo}`);
    if (q.ids.length) console.log(`             dotyka ${q.ids.length} wpisów`);
    if (q.detail?.removed?.length) console.log(`             wycofane: ${q.detail.removed.join(', ')}`);
    console.log('');
  }
  console.log(DRY
    ? 'Próbnie — nic nie zapisano.'
    : `Przestawiono na NEEDS_REVIEW: ${flipped} wpisów. verifiedBy nietknięte — podpis stawia człowiek przez scripts/verify.js.`);
})();
