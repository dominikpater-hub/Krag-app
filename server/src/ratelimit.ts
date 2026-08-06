/* Krąg — limity zapytań (audyt S-1).
 *
 * Bez zależności zewnętrznych: licznik w pamięci procesu z LENIWYM SPRZĄTANIEM.
 * Poprzednia implementacja opisana w audycie 4× (SEC-04) filtrowała znaczniki czasu,
 * ale NIGDY nie usuwała kluczy z mapy → powolny wyciek pamięci. Tu klucz bez świeżych
 * trafień jest kasowany (patrz sweep()).
 *
 * Uwaga o zakresie: to limit per-proces. Przy wielu instancjach API trzeba go przenieść
 * do wspólnego magazynu (Redis) — do rejestru jako osobny dług, nie blokuje tej naprawy.
 */

export interface Limiter {
  /** true = mieści się w limicie (trafienie policzone); false = limit przekroczony. */
  check(key: string): boolean;
  /** Ile sekund do zwolnienia limitu dla klucza (do nagłówka Retry-After). */
  retryAfter(key: string): number;
  reset(): void;
  size(): number;
}

export interface LimiterOptions {
  windowMs: number;
  max: number;
  /** Wstrzykiwany zegar — testy nie muszą czekać w realnym czasie. */
  now?: () => number;
}

export function createLimiter({ windowMs, max, now = () => Date.now() }: LimiterOptions): Limiter {
  const hits = new Map<string, number[]>();
  let lastSweep = now();

  const fresh = (arr: number[], t: number) => arr.filter((s) => t - s < windowMs);

  const sweep = (t: number) => {
    for (const [k, arr] of hits) {
      const keep = fresh(arr, t);
      if (keep.length) hits.set(k, keep);
      else hits.delete(k);              // ← klucz znika, mapa nie rośnie w nieskończoność
    }
    lastSweep = t;
  };

  return {
    check(key) {
      const t = now();
      if (t - lastSweep >= windowMs) sweep(t);
      const arr = fresh(hits.get(key) ?? [], t);
      if (arr.length >= max) { hits.set(key, arr); return false; }
      arr.push(t);
      hits.set(key, arr);
      return true;
    },
    retryAfter(key) {
      const t = now();
      const arr = fresh(hits.get(key) ?? [], t);
      const oldest = arr[0];
      if (arr.length < max || oldest === undefined) return 0;
      return Math.max(1, Math.ceil((windowMs - (t - oldest)) / 1000));
    },
    reset() { hits.clear(); lastSweep = now(); },
    size() { return hits.size; },
  };
}

/** Odczyt liczby z env z bezpiecznym domyślnym (np. KRAG_RL_AUTH_MAX). */
export function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}
