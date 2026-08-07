#!/usr/bin/env node
/* inject-kb.js — wstrzykuje zbudowaną paczkę wiedzy do index.html między znaczniki
 * /*KB_START*​/ i /*KB_END*​/ (audyt W-4). Kasuje dryf: aplikacja bierze bazę z builda,
 * a nie z ręcznie wklejonego JSON-a, który rozjeżdża się z biblioteką.
 *
 *   node scripts/inject-kb.js ../index.html dist/knowledge.demo.json
 */
const fs = require('fs');
const path = require('path');

const [, , htmlPath, bundlePath] = process.argv;
if (!htmlPath || !bundlePath) {
  console.error('inject-kb: użycie: node inject-kb.js <index.html> <bundle.json>');
  process.exit(1);
}
const START = '/*KB_START*/';
const END = '/*KB_END*/';

const html = fs.readFileSync(htmlPath, 'utf8');
const bundle = fs.readFileSync(bundlePath, 'utf8').trim();
const a = html.indexOf(START);
const b = html.indexOf(END);
if (a < 0 || b < 0 || b < a) {
  console.error(`inject-kb: brak znaczników ${START} / ${END} w ${htmlPath}`);
  process.exit(1);
}
const out = html.slice(0, a + START.length) + '\nvar KB_BUNDLE=' + bundle + ';\n' + html.slice(b);
fs.writeFileSync(htmlPath, out);
console.log(`inject-kb: wstrzyknięto ${(bundle.length / 1024 | 0)} KB do ${path.basename(htmlPath)}`);
