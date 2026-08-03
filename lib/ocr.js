/* Krąg — odczyt wyniku ze zdjęcia badania (#3/#5).
 * Zasada bezpieczeństwa: OCR NIGDY nie zapisuje wyniku sam. Wyłuskane wartości
 * trafiają do pola formularza, a użytkownik je POTWIERDZA przed zapisem. Zdjęcie
 * i tak zostaje prywatnie na urządzeniu. OCR działa online (silnik ładowany z CDN);
 * gdy niedostępny — użytkownik wpisuje wynik ręcznie (fallback zawsze obecny).
 */

/** Czysta heurystyka: z tekstu OCR wyłuskaj kandydatów CD4 / wiremii. Testowalna offline. */
export function parseLabValues(raw) {
  const text = String(raw || '').toLowerCase().replace(/ /g, ' ');
  const out = { cd4: null, vl: null, undetectable: false };

  // CD4 — wartość bezwzględna (kom./µl). Bierzemy liczbę po „cd4", pomijając odsetek „24%".
  // Szukamy pierwszej liczby 2–4 cyfr po „cd4", która NIE jest odsetkiem.
  const cd4ctx = text.match(/cd\s?4([\s\S]{0,40})/);   // grupa 1 = tekst PO „cd4" (bez cyfry z „cd4")
  if (cd4ctx) {
    const nums = cd4ctx[1].matchAll(/(\d{1,4})\s*(%?)/g);
    for (const m of nums) {
      if (m[2] === '%') continue;                 // pomiń odsetek limfocytów
      const n = parseInt(m[1], 10);
      if (n >= 1 && n <= 3000) { out.cd4 = n; break; }
    }
  }

  // Wiremia — najpierw „niewykrywalna / poniżej progu / <20…"; potem liczba przy HIV-RNA/kopii.
  if (/(niewykryw|nie wykry|undetect|poni[żz]ej progu|<\s?(20|40|50))/.test(text)) {
    out.vl = 0; out.undetectable = true;
  } else {
    const vlm = text.match(/(hiv[\s-]?rna|wiremia|viral\s*load|kopii|copies)[\s\S]{0,30}?(\d[\d\s.]{0,11})/);
    if (vlm) {
      const n = parseInt(vlm[2].replace(/[\s.]/g, ''), 10);
      if (!isNaN(n)) out.vl = n;
    }
  }
  return out;
}

/** Co prefillować w formularzu: CD4 ma pierwszeństwo, potem wiremia. Zwraca {marker, value} albo null. */
export function pickPrefill(vals) {
  if (!vals) return null;
  if (vals.cd4 != null) return { marker: 'cd4', value: vals.cd4 };
  if (vals.vl != null) return { marker: 'vl', value: vals.vl };
  return null;
}

/** Leniwe wczytanie silnika OCR z CDN (tylko w przeglądarce, tylko online). */
let _tessP = null;
export function loadTesseract() {
  if (typeof window === 'undefined') return Promise.reject(new Error('brak przeglądarki'));
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (_tessP) return _tessP;
  _tessP = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js';
    s.async = true;
    s.onload = () => window.Tesseract ? res(window.Tesseract) : rej(new Error('OCR nie wczytał się'));
    s.onerror = () => { _tessP = null; rej(new Error('OCR niedostępny (offline?)')); };
    document.head.appendChild(s);
  });
  return _tessP;
}

/** OCR obrazu → surowy tekst. onProgress(0..1) opcjonalnie. */
export async function ocrImage(fileOrUrl, onProgress) {
  const T = await loadTesseract();
  const { data } = await T.recognize(fileOrUrl, 'pol+eng', {
    logger: (m) => { if (onProgress && m.status === 'recognizing text') onProgress(m.progress); },
  });
  return (data && data.text) || '';
}
