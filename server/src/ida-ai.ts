/* Krąg — „Ida Rozumie": ugruntowana synteza LLM (Claude). PROXY po stronie serwera.
 *
 * Prywatność (zgodne z DESIGN-IDA-AI.md): klient przysyła TYLKO tekst pytania + wybrane
 * przez siebie fakty z naszej bazy. Do Anthropic idzie wyłącznie to — nigdy pseudonim,
 * klucze, dziennik, IP (widzi je co najwyżej ten serwer). Klucz API tylko z env, nigdy
 * w kliencie. Model NIE jest źródłem prawdy: odpowiada wyłącznie z podanych faktów,
 * inaczej confident=false → klient pokazuje lokalne „nie zmyślam" + Pomoc.
 */
import { httpError } from './repo.ts';

export interface Fact { id: string; text: string; src?: string }
export interface AiInput { q: string; facts: Fact[]; lang?: string }
export interface AiOut { answer: string; usedFactIds: string[]; confident: boolean; refer: 'crisis' | 'doctor' | 'pomoc' | null }
/** Wstrzykiwalny wywoływacz modelu (test podaje atrapę). Zwraca surowy tekst (JSON). */
export type CallModel = (p: { system: string; user: string }) => Promise<string>;

const MODEL = process.env.IDA_MODEL || 'claude-haiku-4-5';

export function systemPrompt(lang = 'pl'): string {
  return [
    'Jesteś Ida — spokojna, wspierająca asystentka wiedzy w aplikacji Krąg dla osób żyjących z HIV i ich bliskich.',
    'Odpowiadasz WYŁĄCZNIE na podstawie podanych FAKTÓW (baza Kręgu, treść podpisana przez ludzi).',
    'Nie dodawaj wiedzy spoza faktów. Nie podawaj żadnych liczb, numerów telefonu ani linków, których nie ma w faktach.',
    'Jeśli fakty nie odpowiadają na pytanie: ustaw confident=false, a w answer napisz krótko, że nie masz tego w bazie i warto zajrzeć do „Pomoc".',
    'Nie diagnozuj, nie prognozuj, nie oceniaj konkretnych wyników użytkownika (to nie jest wyrób medyczny).',
    'Jeśli pytanie sugeruje myśli samobójcze/kryzys → refer="crisis". Jeśli wymaga decyzji medycznej/leczenia → refer="doctor". Jeśli pyta o numery/placówki → refer="pomoc". W innym razie refer=null.',
    `Pisz zwięźle i po ludzku w języku „${lang}", ale treści medyczne cytuj po polsku (źródło jest polskie).`,
    'Zwróć TYLKO poprawny JSON, bez markdown: {"answer": "...", "usedFactIds": ["..."], "confident": true|false, "refer": "crisis"|"doctor"|"pomoc"|null}.',
  ].join('\n');
}

export function userPrompt(q: string, facts: Fact[]): string {
  const list = facts.map((f) => `[${f.id}] ${f.text}${f.src ? ' (źródło: ' + f.src + ')' : ''}`).join('\n');
  return `PYTANIE UŻYTKOWNIKA:\n${q}\n\nDOSTĘPNE FAKTY (używaj tylko tych; cytuj ich id w usedFactIds):\n${list || '(brak)'}`;
}

/** Parsuj + waliduj odpowiedź modelu. usedFactIds zawężone do faktycznie podanych. */
export function validate(raw: string, allowedIds: Set<string>): AiOut {
  let o: any;
  try { o = JSON.parse(stripFences(raw)); } catch { throw httpError(502, 'Zła odpowiedź modelu'); }
  const used = Array.isArray(o.usedFactIds) ? o.usedFactIds.filter((id: unknown) => typeof id === 'string' && allowedIds.has(id)) : [];
  const refer = ['crisis', 'doctor', 'pomoc'].includes(o.refer) ? o.refer : null;
  let answer = typeof o.answer === 'string' ? o.answer.trim() : '';
  // twardy filtr: żadnych linków/telefonów wymyślonych przez model (nie były w faktach → usuń)
  answer = answer.replace(/https?:\/\/\S+/gi, '').replace(/\b\d[\d\s\-]{6,}\d\b/g, '').replace(/\s{2,}/g, ' ').trim();
  const confident = o.confident === true && used.length > 0 && answer.length > 0;
  return { answer, usedFactIds: used, confident, refer };
}

function stripFences(s: string): string {
  return String(s || '').replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/i, '').trim();
}

function defaultAnthropic(): CallModel {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null as unknown as CallModel;
  return async ({ system, user }) => {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 700, system, messages: [{ role: 'user', content: user }] }),
    });
    if (!res.ok) throw httpError(502, 'Model niedostępny');
    const data: any = await res.json();
    return (data?.content?.[0]?.text) || '';
  };
}

/** Atrapa modelu do dev/E2E (IDA_MOCK=1) — bez realnego wywołania Anthropic. */
function mockModel(): CallModel {
  return async ({ user }) => {
    const m = user.match(/\[([^\]]+)\]/);      // pierwsze id faktu z promptu
    const id = m ? m[1] : '';
    return JSON.stringify({ answer: 'Odpowiedź demonstracyjna ułożona z faktów Kręgu.', usedFactIds: id ? [id] : [], confident: !!id, refer: null });
  };
}

/** Główne wejście: pytanie + fakty → ugruntowana odpowiedź. deps.callModel do testów. */
export async function idaAnswer(input: AiInput, deps: { callModel?: CallModel } = {}): Promise<AiOut> {
  const q = String(input?.q || '').slice(0, 2000).trim();
  const facts: Fact[] = Array.isArray(input?.facts) ? input.facts.slice(0, 40).map((f) => ({ id: String(f.id), text: String(f.text || '').slice(0, 600), src: f.src ? String(f.src).slice(0, 120) : undefined })) : [];
  if (!q) throw httpError(400, 'Puste pytanie');
  const call = deps.callModel || (process.env.IDA_MOCK === '1' ? mockModel() : defaultAnthropic());
  if (!call) throw httpError(503, 'ai-off');   // brak klucza → funkcja wyłączona
  const raw = await call({ system: systemPrompt(input.lang), user: userPrompt(q, facts) });
  return validate(raw, new Set(facts.map((f) => f.id)));
}
