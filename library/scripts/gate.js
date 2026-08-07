'use strict';
/* gate.js — JEDNA implementacja obu bramek publikacji (audyt K-1).
 * Wołają ją oba eksportery (export-to-app.js i paths-export.js), żeby żaden
 * nie omijał zasady: treść medyczna nie wychodzi do użytkownika bez podpisu
 * człowieka i bez prawa do redystrybucji. Dodatkowo (W-5): źródło bez lokalizatora
 * jest dla recenzenta tym samym co brak źródła — taki fakt też jest niepublikowalny.
 */

function canRedistribute(policy, rights) {
  const r = policy.rights[rights];
  return !!(r && r.redistribute === true);
}

function isVerified(entry, version) {
  return entry.status === 'PUBLISHED' && !!version.verifiedBy;
}

function hasLocator(version) {
  const s = version && version.source;
  return !!(s && typeof s === 'object' && s.locator);
}

/* A-2: parafraza faktu z atrybucją nie jest utworem źródła (chroniona jest forma wyrazu, nie fakt).
 * Domyślnie WYŁĄCZONE (bezpiecznie, jak dotąd). Włącza je decyzja prawna: policy.derivedRights.publishParaphrased.
 * Cytat dosłowny (version.verbatim / entry.kind === 'QUOTE') i prawa z blockedForParaphrase — nigdy. */
function paraphrasePublishable(policy, entry, version) {
  const dr = policy.derivedRights;
  if (!dr || !dr.publishParaphrased) return false;
  if (version && version.verbatim === true) return false;
  if (entry && String(entry.kind || '').toUpperCase() === 'QUOTE') return false;
  const blocked = dr.blockedForParaphrase || [];
  return !blocked.includes(version.rights);
}

/* D-2: bloki-katalogi z oficjalnego źródła (np. 'miejsca') publikują się z autorytetu źródła,
 * a nie z podpisu lekarza — pomijają bramkę weryfikacji i praw. Lokalizator dalej wymagany. */
function bySourceAuthority(policy, entry) {
  const list = (policy.publishGate && policy.publishGate.publishOnSourceAuthority) || [];
  return !!entry && list.includes(entry.block);
}

/* K-34 (decyzja właściciela 2026-08-05/06): o wiarygodności rozstrzyga AUTORYTET ŹRÓDŁA,
 * nie podpis człowieka. Treść ze źródła o potwierdzonym autorytecie (confidence z
 * policy.publishGate.publishReadyConfidence) publikuje się bez verifiedBy. Podpis zostaje
 * opcjonalnym wzmocnieniem. Działa tylko przy requireHumanVerification === false, więc
 * powrót do starego modelu to zmiana JEDNEJ flagi w policy.
 * UWAGA: to znosi wyłącznie bramkę PODPISU. Bramka PRAW (redystrybucja cudzego utworu)
 * jest osobnym, prawnym pytaniem i zostaje nietknięta. */
function bySourceConfidence(policy, version) {
  const pg = policy.publishGate || {};
  if (pg.requireHumanVerification !== false) return false;
  const ok = pg.publishReadyConfidence || [];
  return !!version && ok.includes(version.confidence);
}

/* Czy TREŚĆ faktu może trafić do użytkownika.
 * Zwraca null gdy wolno, albo powód wstrzymania: 'unverified' | 'rights' | 'locator'. */
function heldReason(policy, entry, version) {
  const authority = bySourceAuthority(policy, entry);
  // Podpis zastąpiony autorytetem źródła (K-34); prawa sprawdzamy dalej osobno.
  if (!authority && !bySourceConfidence(policy, version) && !isVerified(entry, version)) return 'unverified';
  if (!authority && !canRedistribute(policy, version.rights) && !paraphrasePublishable(policy, entry, version)) return 'rights';
  if (!hasLocator(version)) return 'locator';
  return null;
}

/* Bloki wymagające podpisu weryfikatora — suma OBU list z policy (audyt K-4):
 * publishGate.requireVerifierForBlocks ∪ klucze verifierByBlock. */
function gatedBlocks(policy) {
  const req = (policy.publishGate && policy.publishGate.requireVerifierForBlocks) || [];
  const byBlock = policy.verifierByBlock ? Object.keys(policy.verifierByBlock) : [];
  return new Set([...req, ...byBlock]);
}

module.exports = { canRedistribute, isVerified, hasLocator, heldReason, gatedBlocks, paraphrasePublishable, bySourceConfidence };
