#!/usr/bin/env node
/**
 * render-places.js — entries/ → dist/lista-miejsc.md
 * Układ wg województwa i miasta, bo człowiek nie szuka „wszystkich PKD",
 * tylko „co jest u mnie".
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const places = fs.readdirSync(path.join(ROOT, 'entries'))
  .filter(f => /^(arv|pep|pkd|wsp)-/.test(f))
  .map(f => JSON.parse(fs.readFileSync(path.join(ROOT, 'entries', f), 'utf8')))
  .map(e => ({ entry: e, v: e.versions[0], d: e.versions[0].content.details }));

const VOIV = ['dolnośląskie','kujawsko-pomorskie','lubelskie','lubuskie','łódzkie','małopolskie','mazowieckie','opolskie','podkarpackie','podlaskie','pomorskie','śląskie','świętokrzyskie','warmińsko-mazurskie','wielkopolskie','zachodniopomorskie'];
const LABEL = { PKD: 'Test — PKD', PORADNIA_ARV: 'Leczenie — poradnia ARV', DYZUR_PEP: 'PEP — dyżur' };
const ORDER = ['DYZUR_PEP', 'PKD', 'PORADNIA_ARV'];

const out = [];
out.push('# Gdzie się zgłosić — HIV w Polsce\n');
out.push('Stan na 27 lipca 2026. Lista pochodzi z Krajowego Centrum ds. AIDS.\n');
out.push('**Zanim pojedziesz — zadzwoń.** Godziny i adresy zmieniają się częściej, niż aktualizuje się listy. Kilka pozycji poniżej ma dopisek o rozbieżności między źródłami; te są oznaczone.\n');

// Sekcja pilna na górze, bo przy PEP liczy się każda godzina
out.push('---\n');
out.push('## Najpierw: sytuacja nagła\n');
out.push('Jeśli w ciągu ostatnich **48 godzin** doszło do możliwego kontaktu z HIV — seks bez zabezpieczenia, wspólna igła, zakłucie, gwałt — jedź na izbę przyjęć szpitala zakaźnego. Bez skierowania, o każdej porze. Leki są najskuteczniejsze w pierwszych 2–3 godzinach, a po 72 godzinach nie działają.\n');
out.push('Telefony całodobowe znajdziesz przy swoim województwie, oznaczone jako **PEP — dyżur**.\n');

const tel = places.find(p => p.entry.id === 'wsp-0001');
const poradnia = places.find(p => p.entry.id === 'wsp-0002');
out.push('---\n');
out.push('## Rozmowa, gdy nie wiesz, od czego zacząć\n');
out.push(`**Telefon Zaufania HIV/AIDS — ${tel.d.phone.join(', ')}**  `);
out.push(`${tel.v.content.details.hours}. Połączenie bezpłatne.\n`);
out.push(`**Poradnia Internetowa HIV/AIDS** — ${poradnia.d.url}, ${poradnia.d.email}\n`);
out.push('> Uwaga: źródła podają różne godziny (gov.pl — dni robocze; organizacja prowadząca dyżury — 7 dni w tygodniu) i różne warianty drugiego numeru. Przed poleceniem komuś tego numeru warto go samemu wybrać.\n');

out.push('---\n');
for (const voiv of VOIV) {
  const inVoiv = places.filter(p => p.d.voivodeship === voiv && p.entry.kind === 'PLACE' && ['PKD','PORADNIA_ARV','DYZUR_PEP'].includes(p.d.placeKind));
  if (!inVoiv.length) continue;
  out.push(`## ${voiv}\n`);

  const missing = ORDER.filter(k => !inVoiv.some(p => p.d.placeKind === k && p.d.operational));
  if (missing.length) {
    out.push(`> **Luka:** w tym województwie nie ma na liście: ${missing.map(m => LABEL[m]).join(', ')}. Trzeba jechać do sąsiedniego.\n`);
  }

  const cities = [...new Set(inVoiv.map(p => p.d.city))].sort((a, b) => a.localeCompare(b, 'pl'));
  for (const city of cities) {
    out.push(`### ${city}\n`);
    for (const kind of ORDER) {
      const list = inVoiv.filter(p => p.d.city === city && p.d.placeKind === kind);
      for (const p of list) {
        const dz = p.d.audience === 'TYLKO_DZIECI' ? ' *(tylko dzieci)*' : p.d.audience === 'TAKZE_DZIECI' ? ' *(także dzieci)*' : '';
        const dead = !p.d.operational ? ' — **NIECZYNNY**' : '';
        out.push(`**${LABEL[kind]}${dz}${dead}**  `);
        out.push(`${p.d.address}  `);
        if (p.d.phone?.length) out.push(`tel. ${p.d.phone.join(' · ')}  `);
        if (p.d.hours) out.push(`${p.d.hours}  `);
        if (p.d.languages?.length > 1) out.push(`języki: ${p.d.languages.join(', ')}  `);
        if (p.d.accessible === true) out.push(`dostępne dla osób z niepełnosprawnościami  `);
        else if (p.d.accessible === 'częściowo') out.push(`dostępność ograniczona  `);
        for (const w of p.v.content.warnings) out.push(`> ${w}  `);
        out.push('');
      }
    }
  }
  out.push('');
}

out.push('---\n');
out.push('## Organizacje\n');
out.push('Nie są punktami medycznymi. To miejsca, gdzie rozmawia się z ludźmi, a nie z systemem.\n');
for (const p of places.filter(p => p.d.placeKind === 'ORGANIZACJA')) {
  out.push(`**${p.v.content.summary.split(' —')[0]}**${p.d.city ? ` · ${p.d.city}` : ''}  `);
  if (p.d.url) out.push(`${p.d.url}  `);
  if (p.d.email) out.push(`${p.d.email}  `);
  for (const w of p.v.content.warnings) out.push(`${w}  `);
  out.push('');
}

out.push('---\n');
out.push('## Skąd to jest i co z tym zrobić\n');
out.push('Listy poradni ARV i całodobowych dyżurów PEP pochodzą z serwisu gov.pl Krajowego Centrum ds. AIDS — treści tekstowe w tej domenie są na licencji CC BY-SA 4.0, więc wolno je rozpowszechniać z podaniem autorstwa. Lista PKD pochodzi z aids.gov.pl, gdzie prawa są zastrzeżone — tam wolno tylko odesłać do źródła.\n');
out.push('Lista poradni ARV ma na źródle datę ostatniej aktualizacji **23 lutego 2025**. To ponad rok. Przed użyciem w aplikacji każda pozycja wymaga potwierdzenia telefonicznego.\n');

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist', 'lista-miejsc.md'), out.join('\n'));
console.log(`render-places: dist/lista-miejsc.md (${out.length} linii)`);
