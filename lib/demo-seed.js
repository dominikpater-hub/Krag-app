/* Krąg — dane demo (#3: „przekuj produkcję na demo, żeby zobrazować wszystkie funkcje").
 * Czysty builder bogatego, spójnego zestawu: dziennik (CD4 rośnie, wiremia → niewykrywalna,
 * leki, koinfekcje, wizyty, notatki), rozmowy 1:1 (w tym buddy) i pokój tematyczny.
 * Wszystko lokalne — demo działa offline, bez backendu. `now` wstrzykiwane (testowalność).
 */
const DAY = 86400000;

export function buildDemoData(self, now) {
  const iso = (d) => new Date(now - d * DAY).toISOString().slice(0, 10);
  const diary = [
    { ts: now - 200 * DAY, kind: 'result', marker: 'cd4', v: 180, date: iso(200) },
    { ts: now - 140 * DAY, kind: 'result', marker: 'cd4', v: 240, date: iso(140) },
    { ts: now - 80 * DAY, kind: 'result', marker: 'cd4', v: 360, date: iso(80) },
    { ts: now - 20 * DAY, kind: 'result', marker: 'cd4', v: 470, date: iso(20) },
    { ts: now - 200 * DAY + 1, kind: 'result', marker: 'vl', v: 120000, date: iso(200) },
    { ts: now - 140 * DAY + 1, kind: 'result', marker: 'vl', v: 800, date: iso(140) },
    { ts: now - 20 * DAY + 1, kind: 'result', marker: 'vl', v: 20, date: iso(20) },
    { ts: now - 190 * DAY, kind: 'med', name: 'Biktarvy', dose: '1 tabl.', time: '20:00' },
    { ts: now - 30 * DAY, kind: 'cotest', name: 'HCV', result: 'ujemny', date: iso(30) },
    { ts: now - 30 * DAY + 1, kind: 'cotest', name: 'HBV', result: 'szczepienie', date: iso(30) },
    { ts: now - 30 * DAY + 2, kind: 'cotest', name: 'HPV', result: 'szczepienie', date: iso(30) },
    { ts: now - 15 * DAY, kind: 'visit', title: 'Kontrola u zakaźnika', date: iso(15) },
    { ts: now - 2 * DAY, kind: 'visit', title: 'Pobranie krwi', date: iso(2) },
    { ts: now - 10 * DAY, kind: 'note', note: 'Lepsze samopoczucie, więcej energii.' },
    { ts: now - 1 * DAY, kind: 'note', note: 'Wiremia niewykrywalna — U=U!' },
  ];
  const buddy = 'Cichy Świt #A1B2', peer2 = 'Nocny Brzeg #7F3C';
  const roomId = 'demo-room-1';
  const threads = [
    { peer: buddy, ts: now - 1 * DAY, buddy: true },
    { peer: peer2, ts: now - 3 * DAY },
    { peer: 'room:' + roomId, ts: now - 5 * DAY },
  ];
  const messages = [
    { id: 'demo-m1', peer: buddy, dir: 'in', text: 'Hej, jak się trzymasz po ostatnich wynikach?', ts: now - 2 * DAY },
    { id: 'demo-m2', peer: buddy, dir: 'out', text: 'Dzięki, że pytasz — CD4 rośnie, jest lepiej.', ts: now - 2 * DAY + 60000 },
    { id: 'demo-m3', peer: buddy, dir: 'in', text: 'Super. Jakby co — jestem.', ts: now - 1 * DAY },
    { id: 'demo-m4', peer: peer2, dir: 'in', text: 'Cześć, widziałem Cię w katalogu.', ts: now - 3 * DAY },
    { id: 'demo-m5', peer: 'room:' + roomId, dir: 'in', text: 'Ktoś świeżo po diagnozie? Jak minął pierwszy miesiąc?', ts: now - 5 * DAY },
    { id: 'demo-m6', peer: 'room:' + roomId, dir: 'out', text: 'Na początku strach, ale z czasem jest lżej.', ts: now - 5 * DAY + 120000 },
  ];
  const rooms = [{ roomId, name: 'Świeżo po diagnozie', ts: now - 5 * DAY }];
  return { diary, threads, messages, rooms };
}
