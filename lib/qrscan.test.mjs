/* Ścieżka skanu QR: wygeneruj kod → zrasteryzuj → zdekoduj jsQR → parseKeycode.
 * Kamery nie da się przetestować headless; to pokrywa dekodowanie. node --test lib/qrscan.test.mjs */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import jsQR from './jsqr.js';
import qrgen from './qrcode-generator.js';
import { newKeycode, parseKeycode } from './keycode.js';

function rasterize(text, scale = 4, pad = 4) {
  const qr = qrgen(0, 'M'); qr.addData(text); qr.make();
  const n = qr.getModuleCount(), size = (n + pad * 2) * scale;
  const data = new Uint8ClampedArray(size * size * 4).fill(255);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (!qr.isDark(r, c)) continue;
    for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
      const x = (c + pad) * scale + dx, y = (r + pad) * scale + dy, i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 0;
    }
  }
  return { data, size };
}

test('QR Klucza Kręgu: generacja → dekodowanie jsQR → te same bajty', () => {
  const { code, bytes } = newKeycode();
  const { data, size } = rasterize(code);
  const res = jsQR(data, size, size);
  assert.ok(res, 'jsQR zdekodował obraz');
  assert.equal(res.data, code);
  assert.deepEqual(Array.from(parseKeycode(res.data)), Array.from(bytes));
});
