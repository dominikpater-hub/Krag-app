/* Krąg — mapowanie nazwy źródła (f.s) na URL strony źródłowej.
 * Wyłącznie realne adresy z kuratorskiego sources.json (Warstwa 4). Źródła bez URL
 * (czasopisma, „różne organizacje") zostają zwykłym tekstem — nie zmyślamy linków.
 */
export const SRC_URL = {
  "Krajowe Centrum ds. AIDS / gov.pl": "https://www.hiv-aids.edu.pl/",
  "Polskie Towarzystwo Naukowe AIDS": "https://ptnaids.pl/wp-content/uploads/2025/06/Rekomendacje_PTN_AIDS_2025_2.pdf",
  "Krajowe Centrum ds. AIDS": "https://www.hiv-aids.edu.pl/",
  "Centers for Disease Control and Prevention (US)": "https://www.cdc.gov/hiv/",
  "Patel P. i in., AIDS 2014;28(10):1509–1519": "https://www.ashasexualhealth.org/pdfs/cdc-hiv-risk-behaviors.pdf",
  "European AIDS Clinical Society": "https://eacs.sanfordguide.com/",
  "NIZP-PZH": "https://wwwold.pzh.gov.pl/oldpage/epimeld/hiv_aids/2024.htm",
  "University of Washington / HRSA": "https://www.hiv.uw.edu/",
  "HIV i-Base": "https://i-base.info/",
  "NAM Publications": "https://www.aidsmap.com/",
  "Prevention Access Campaign": "https://preventionaccess.org/",
  "NYSDOH AIDS Institute Clinical Guidelines Program": "https://www.hivguidelines.org/guideline/u-equals-u/",
  "NIH / DHHS (US)": "https://clinicalinfo.hiv.gov/",
  "The Well Project": "https://www.thewellproject.org/hiv-information/can-i-breastfeed-while-living-hiv",
  "amfAR": "https://www.amfar.org/",
  "International AIDS Society": "https://www.iasociety.org/",
  "UCSF": "https://prep.ucsf.edu/",
  "Molina J-M. i in., NEJM 2015": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7174437/",
  "Gilead Sciences / FDA": "https://www.gilead.com/",
  "New England Journal of Medicine": "https://www.nejm.org/",
  "World Health Organization": "https://www.who.int/health-topics/hiv-aids",
  "Rynek Zdrowia (prasa branżowa)": "https://www.rynekzdrowia.pl/",
  "GdziePoLek.pl": "https://www.gdziepolek.pl/",
  "Zjednoczenie Pozytywni w Tęczy": "https://pozytywniwteczy.pl/",
  "gov.pl": "https://www.gov.pl/web/aids",
  "Stowarzyszenie „Jeden Świat\"": "https://jedenswiat.org.pl/",
  "PKD Poznań": "https://pkdpoznan.pl/pep-poznan-gdzie-zglosic",
  "Ustawodawca RP": "https://isap.sejm.gov.pl/",
  "Termedia (prasa branżowa)": "https://www.termedia.pl/",
  "UNAIDS": "https://www.unaids.org/",
  "Parlament Europejski i Rada UE": "https://eur-lex.europa.eu/legal-content/PL/TXT/?uri=CELEX%3A32016R0679",
  "International Labour Organization": "https://www.ilo.org/",
  "Ministerstwo Zdrowia": "https://www.gov.pl/web/zdrowie",
  "Narodowy Fundusz Zdrowia": "https://www.nfz.gov.pl/",
  "Fundacja Edukacji Społecznej": "https://www.fes.edu.pl/zyjezhiv",
  "naTemat.pl": "https://natemat.pl/",
  "DHHS": "https://clinicalinfo.hiv.gov/",
  "NAM": "https://www.aidsmap.com/"
};
export function srcUrl(name) { return SRC_URL[name] || null; }

/* ——— Audyt R-1a: poziom wiarygodności wynika ze ŹRÓDŁA, nie z pojedynczego faktu ———
 *
 * Dlaczego to tu jest. Poziom `f.c` w lib/knowledge.js był nadawany osobno każdemu faktowi
 * i rozjechał się z katalogiem źródeł (sources.json). Dowody rozjazdu, nie opinie:
 *   · „NAM" → społeczność, ale „NAM Publications" (TA SAMA organizacja) → zweryfikowane;
 *   · „Stowarzyszenie »Jeden Świat«" ma w bazie RAZ jeden poziom, RAZ drugi;
 *   · „PKD Poznań" figuruje w katalogu jako FORUM — a to punkt konsultacyjno-diagnostyczny
 *     działający w krajowym programie HIV, nie forum internetowe;
 *   · „GdziePoLek.pl" figuruje jako PRASA — a to wyspecjalizowana baza cen i dostępności
 *     leków, czyli najlepsze dostępne źródło dokładnie do tego pytania, na które odpowiada.
 *
 * Autorytet jest cechą ŹRÓDŁA i jego rodzaju, więc mapujemy nazwę → rodzaj → poziom.
 * Mapa celowo obejmuje TYLKO źródła, które sprawdziliśmy; dla pozostałych zostaje poziom
 * z bazy. To pomost do czasu, aż pipeline (P-1) zacznie wyprowadzać poziomy z katalogu.
 */
export const KIND_TIER = {
  LAW_TEXT: 'official', OFFICIAL_PAGE: 'official', GUIDELINE: 'official',
  STANDARD: 'verified', TRAINING_MAT: 'verified', RESEARCH_REPORT: 'verified',
  EXPERT_NOTE: 'verified',
  SPECIALIST_DB: 'verified',   // baza dziedzinowa (np. ceny i dostępność leków)
  PRESS_TRADE: 'verified',     // prasa branżowa z redakcją, czytana przez profesjonalistów
  PRESS: 'community',          // media ogólne
  AI_RESEARCH: 'community', FORUM: 'community',
  PROJECT_RULE: 'rule',        // zasada Kręgu — poza drabiną wiarygodności (kategoria)
};

/** Nazwa źródła (f.s) → rodzaj z katalogu. Tylko sprawdzone przypadki. */
export const SRC_KIND = {
  'NAM': 'EXPERT_NOTE',
  'NAM Publications': 'EXPERT_NOTE',
  'PKD Poznań': 'EXPERT_NOTE',
  'Stowarzyszenie „Jeden Świat"': 'EXPERT_NOTE',
  'Zjednoczenie Pozytywni w Tęczy': 'EXPERT_NOTE',
  'Fundacja Edukacji Społecznej': 'EXPERT_NOTE',
  'GdziePoLek.pl': 'SPECIALIST_DB',
  'Rynek Zdrowia (prasa branżowa)': 'PRESS_TRADE',
  'Termedia (prasa branżowa)': 'PRESS_TRADE',
  'naTemat.pl': 'PRESS',
  'Projekt Krąg': 'PROJECT_RULE',
};

/** Poziom wynikający ze źródła albo null, gdy źródła nie sprawdziliśmy. */
export function srcTier(name) {
  const kind = SRC_KIND[String(name || '').trim()];
  return kind ? (KIND_TIER[kind] || null) : null;
}
