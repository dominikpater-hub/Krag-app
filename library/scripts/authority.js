'use strict';
/* authority.js — JEDNA implementacja reguły „skąd bierze się poziom wiarygodności" (K-42).
 *
 * Powstało, bo ta reguła zdążyła się rozjechać w trzech miejscach naraz: migrator liczył ją
 * po swojemu, walidator sprawdzał wobec surowego sufitu, a warstwa aplikacji (lib/sources.js)
 * miała już nową decyzję o autorytecie dziedzinowym. Skutek: fakty z PKD Poznań figurowały
 * w pipelinie jako „społeczność" i bramka wstrzymywała ich treść, choć katalog uznawał
 * to źródło za notę ekspercką. Jedna reguła, jedno miejsce.
 */

/* Poziom wynikający z rodzaju źródła, z uwzględnieniem autorytetu dziedzinowego:
 * medium ogólne jest pełnoprawnym źródłem tam, gdzie jest kompetentne (sprawy społeczne,
 * język, relacjonowanie faktów), a nie jest nim przy twierdzeniu klinicznym. */
function levelFromSource(policy, kind, block) {
  const base = policy.ceiling[kind];
  const da = policy.domainAuthority;
  if (da && Array.isArray(da.blocks) && da.blocks.includes(block) && da.raise && da.raise[kind]) {
    return da.raise[kind];
  }
  return base;
}

module.exports = { levelFromSource };
