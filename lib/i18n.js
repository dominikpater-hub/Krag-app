/* Krąg — i18n interfejsu i wypowiedzi Idy (PL/EN/UK/RU).
 * UWAGA: 223 fakty medyczne pozostają PO POLSKU — treść medyczna wychodzi tylko z podpisem
 * człowieka, więc nie tłumaczymy jej automatycznie. Przy języku innym niż polski Ida oznacza
 * odpowiedź etykietą „źródło: polski". Tłumaczymy tylko powłokę UI i wypowiedzi własne Idy.
 */
'use strict';

// Języki: polski + języki SĄSIADÓW Polski (de, cz, sk, ua, by, lt, ru) i angielski jako
// lingua franca. „covered" = pełne tłumaczenie UI; reszta jest DOSTĘPNA, ale UI spada na
// angielski, a fakty medyczne i tak zostają po polsku (podpis człowieka). Inny język niż
// z listy — użytkownik zgłasza zapotrzebowanie (lang.req), społeczność dopisuje tłumaczenie.
export const LANGS = [
  { code: 'pl', name: 'polski', covered: true },
  { code: 'en', name: 'English', covered: true },
  { code: 'uk', name: 'українська', covered: true },
  { code: 'ru', name: 'русский', covered: true },
  { code: 'de', name: 'Deutsch', covered: true },
  { code: 'cs', name: 'Čeština', covered: true },
  { code: 'sk', name: 'Slovenčina', covered: true },
  { code: 'be', name: 'Беларуская', covered: true },
  { code: 'lt', name: 'Lietuvių', covered: true },
];
export const LANG_NAMES = Object.fromEntries(LANGS.map((l) => [l.code, l.name]));
const COVERED = new Set(LANGS.filter((l) => l.covered).map((l) => l.code));
export function isCovered(code) { return COVERED.has(code); }
// Kontrola kompletności tłumaczeń (test): klucze z polskiego brakujące w danym języku.
export function missingKeys(code) {
  const base = Object.keys(DICT.pl || {});
  const d = DICT[code] || {};
  return base.filter((k) => !(k in d));
}

const DICT = {
  pl: {
    // wejście
    'w.h1': 'Cześć. Jestem Ida.',
    'w.intro': 'Towarzyszę osobom żyjącym z HIV i ich bliskim. Pomogę Ci znaleźć <b>sprawdzone informacje</b>, zrozumieć wyniki i być w kontakcie z ludźmi, którzy to znają.',
    'w.canDo': 'W Kręgu możesz',
    'w.b1': 'Uczyć się o HIV prostym językiem',
    'w.b2': 'Prowadzić prywatną historię badań',
    'w.b3': 'Pilnować leczenia',
    'w.b4': 'Porozmawiać z ludźmi, którzy przechodzą przez to samo',
    'w.b5': 'Zapytać mnie o wszystko',
    'w.privacy': 'Prywatność jest tu domyślna, nie opcją do włączenia. To, co zapisujesz o swoim zdrowiu, zostaje zaszyfrowane na Twoim urządzeniu — i nikt w Kręgu tego nie widzi, także my.',
    'w.passkey': 'Wejdź — Face ID lub odcisk',
    'w.anon': 'Wejdź',
    'w.have': 'Mam już konto',
    // logowanie
    'login.h1': 'Mam już konto',
    'login.p': 'Odtwórz konto na tym urządzeniu — passkeyem (Face ID / odcisk) albo Kluczem Kręgu. Wszystko odszyfrowuje się <b>tutaj</b>; serwer nie widzi ani jednego, ani drugiego.',
    'login.passkey': 'Zaloguj — Face ID lub odcisk',
    'login.orKc': 'albo Kluczem Kręgu',
    'login.ph': 'krag1:…  (wklej albo zeskanuj)',
    'login.do': 'Zaloguj i zsynchronizuj',
    'back': 'Wróć',
    // klucz kręgu
    'kc.h1': 'Twój Klucz Kręgu',
    'kc.p': 'To sposób, by wejść na koncie z innego urządzenia albo je odzyskać. Zapisz go — zrzut ekranu lub menedżer haseł. <b>Nikt, także Krąg, go nie odtworzy.</b>',
    'kc.copy': 'Kopiuj klucz',
    'kc.ack': 'Zapisałem/am Klucz Kręgu w bezpiecznym miejscu',
    'kc.enter': 'Wejdź do Kręgu',
    'kc.copied': 'Skopiowano Klucz Kręgu.',
    // ida
    'ida.kicker': 'Krąg wiedzy',
    'ida.title': 'Zapytaj Idę',
    'ida.ph': 'Zapytaj o HIV, PrEP, leczenie, wyniki…',
    'ida.hello': 'Cześć. Jestem Ida — towarzyszę Ci w Kręgu i odpowiadam z materiałów, które mam. Kiedy czegoś nie mam, mówię to wprost, zamiast zgadywać.',
    'ida.s1': 'Co to znaczy niewykrywalny?',
    'ida.s2': 'Jak działa PrEP?',
    'ida.s3': 'Co robić po ryzyku?',
    'ida.s4': 'Co znaczy CD4?',
    'ida.s5': 'Czy muszę powiedzieć pracodawcy?',
    'ida.unsure': 'Nie jestem pewna, czy dobrze rozumiem — najbliżej mam to. Jeśli chodziło o coś innego, wybierz temat niżej.',
    'ida.bound': 'Nie odpowiem na pytanie o Twój własny wynik — i to jest celowe. To rozmowa z lekarzem, nie z bazą.',
    'ida.negctx': 'odpowiedź dla osoby niezakażonej',
    'ida.inThread': 'w wątku: ',
    'ida.clock': 'To jest sytuacja z zegarem. Czytaj od razu:',
    'ida.gate': 'Blok medyczny — przed wydaniem wymaga podpisu lekarza. W tej wersji nikt tego jeszcze nie zatwierdził.',
    'ida.srcPl': 'źródło: polski',
    'ida.baseUnverified': 'Baza {ed} · nikt z ludzi jeszcze tego nie sprawdził',
    'ida.noCover': '<b>Nie mam tego w bazie Kręgu — i nie chcę zmyślać.</b><br><br>Zapisuję Twoje pytanie jako lukę, żeby ktoś ją uzupełnił. Po prawdziwe numery i placówki zajrzyj do <b>Pomocy</b>, a decyzje medyczne omów z lekarzem.<br><br><span style="color:var(--tx-3)">Mogę za to opowiedzieć o:</span>',
    'ida.gapTag': 'poza pokryciem',
    'ida.gapSaved': 'zapisano jako luka',
    'ida.crisis': 'Zatrzymuję się tutaj, bo przeczytałam w tym coś ciężkiego. Nie jestem od tego, żeby to unieść — ale wiem, kto jest. Zostaję. Możesz pisać dalej.',
    'ida.crisisLine': 'Kryzys psychiczny — 24/7',
    'ida.notYourLang': 'Ta linia odpowiada po polsku. Pod numerem {eu} poprosisz o tłumacza.',
    'ida.stopMeds': 'To ważne, że o tym mówisz — i to jest rozmowa do przeprowadzenia z lekarzem prowadzącym, nie samodzielnie. Powody bywają różne: objawy uboczne, zmęczenie codziennością, koszty, wstyd. Każdy z nich da się z kimś omówić i każdy ma zwykle jakieś wyjście.',
    'trust.t3': 'do weryfikacji',
    'trust.t4': 'społeczność',
    // rozmowy
    'app.loggedAs': 'Zalogowano jako',
    'app.threads': 'Rozmowy',
    'app.start': 'Rozpocznij rozmowę',
    'app.startHint': 'Wpisz pseudonim osoby, którą znasz z Kręgu.',
    'app.peerPh': 'Spokojna Rzeka #C3D4',
    'app.open': 'Otwórz rozmowę',
    'app.empty': 'Nie masz jeszcze rozmów. Porozmawiaj z kimś, kto rozumie — zacznij poniżej: znajdź kogoś albo dołącz do pokoju.',
    'app.newConvo': 'Nowa rozmowa',
    'app.discover': 'Porozmawiaj z ludźmi',
    'app.discoverP': 'Krąg łączy osoby, które przez to przechodzą. Nie musisz nikogo znać — zacznij od okolicy albo tematu.',
    'app.findPeople': 'Znajdź osoby w okolicy albo po temacie',
    'app.joinRoom': 'Dołącz do pokoju tematycznego',
    'app.knowAddr': 'Masz już czyjś adres albo link?',
    // dziennik
    'diary.kicker': 'Twoje zdrowie',
    'diary.title': 'Dziennik',
    'diary.p': 'Twoje wyniki, leki, wizyty i badania w jednym miejscu — a Ida czyta z nich trend i podpowiada.',
    'diary.priv': '🔒 Zostaje na tym telefonie.', 'diary.privLong': 'Wszystko w dzienniku zostaje na tym telefonie. Zrób kopię w Profilu, zanim wyczyścisz dane przeglądarki.',
    'diary.new': 'Nowy wpis',
    'diary.notePh': 'np. CD4 268, wiremia poniżej progu',
    'diary.save': 'Zapisz w dzienniku',
    'diary.empty': 'Dziennik jest pusty. Nic z niego nie opuszcza tego urządzenia.',
    'diary.device': 'Szczegóły techniczne',
    'diary.rAcc': 'Konto (klucz lokalny)',
    'diary.rAccV': 'na urządzeniu',
    'diary.rDiary': 'Dziennik zdrowia (IndexedDB)',
    'diary.rSw': 'Tryb offline (service worker)',
    'diary.rE2e': 'Rozmowy 1:1 (E2E)',
    'diary.rE2eV': 'aktywne',
    'diary.sample': 'Dodaj przykładowy wpis',
    'diary.wipe': 'Usuń wszystko z tego urządzenia',
    // profil
    'pf.kicker': 'Twój profil',
    'pf.title': 'Profil',
    'pf.p': 'To Twój profil. Nazwę i język zmienisz, kiedy chcesz — zapiszą się bezpiecznie i pojawią na Twoich innych urządzeniach.',
    'pf.pseudo': 'Nazwa, którą widzą inni',
    'pf.handle': 'Twój adres w Kręgu (na niego piszą do Ciebie)',
    'pf.handleHint': 'Powstaje z Twojego klucza i nigdy się nie zmienia — to jak numer, tylko bez podawania kto to.',
    'pf.lang': 'Język',
    'pf.role': 'Kim jesteś w Kręgu',
    'pf.gram': 'Jak mam się do Ciebie zwracać?',
    'pf.save': 'Zapisz i zsynchronizuj',
    'pf.kcSummary': 'Twój Klucz Kręgu',
    'pf.kcP': 'Sposób, by wejść na koncie z innego urządzenia albo je odzyskać. Zapisz go bezpiecznie. Nikt, także Krąg, go nie odtworzy.',
    'role.plhiv': 'Żyję z HIV',
    'role.partner': 'Jestem partnerem/partnerką',
    'role.bliska': 'Jestem osobą bliską',
    'gram.n': 'Neutralnie (bezosobowo)',
    'gram.f': 'W formie żeńskiej',
    'gram.m': 'W formie męskiej',
    'sync.on': '✓ zsynchronizowano',
    'sync.syncing': 'synchronizuję…',
    'sync.off': 'offline',
    // wątek
    'th.lock': '🔒 Szyfrowane od końca do końca. Serwer nie czyta tych wiadomości.',
    'th.msgPh': 'Napisz…',
    // zakładki
    'tab.ida': 'Ida', 'tab.app': 'Rozmowy', 'tab.diary': 'Dziennik', 'tab.profile': 'Profil',
    // toasty (formy zależne od płci językowej — patrz gw())
    'toast.profM': 'Zapisałeś profil.', 'toast.profF': 'Zapisałaś profil.', 'toast.profN': 'Profil zapisany.',
    'toast.diaryM': 'Zapisałeś wpis.', 'toast.diaryF': 'Zapisałaś wpis.', 'toast.diaryN': 'Wpis zapisany.',
  },

  en: {
    'w.h1': 'Hi. I am Ida.',
    'w.intro': 'I keep company to people living with HIV and those close to them. I will help you find <b>trustworthy information</b>, understand results and stay in touch with people who get it.',
    'w.canDo': 'In the Circle you can',
    'w.b1': 'Learn about HIV in plain language',
    'w.b2': 'Keep a private history of your results',
    'w.b3': 'Stay on top of treatment',
    'w.b4': 'Talk to people going through the same',
    'w.b5': 'Ask me anything',
    'w.privacy': 'Privacy here is the default, not a setting to turn on. What you record about your health is encrypted on your device — and no one in the Circle sees it, not even us.',
    'w.passkey': 'Enter — Face ID or fingerprint',
    'w.anon': 'Enter',
    'w.have': 'I already have an account',
    'login.h1': 'I already have an account',
    'login.p': 'Restore your account on this device — with a passkey (Face ID / fingerprint) or your Circle Key. Everything is decrypted <b>here</b>; the server sees neither.',
    'login.passkey': 'Sign in — Face ID or fingerprint',
    'login.orKc': 'or with your Circle Key',
    'login.ph': 'krag1:…  (paste or scan)',
    'login.do': 'Sign in and sync',
    'back': 'Back',
    'kc.h1': 'Your Circle Key',
    'kc.p': 'This is how you enter your account from another device or recover it. Save it — a screenshot or a password manager. <b>No one, not even the Circle, can recreate it.</b>',
    'kc.copy': 'Copy key',
    'kc.ack': 'I saved my Circle Key somewhere safe',
    'kc.enter': 'Enter the Circle',
    'kc.copied': 'Circle Key copied.',
    'ida.kicker': 'Circle knowledge',
    'ida.title': 'Ask Ida',
    'ida.ph': 'Ask about HIV, PrEP, treatment, results…',
    'ida.hello': 'Hi. I am Ida — I keep you company in the Circle and answer from the material I have. When I do not have something, I say so plainly instead of guessing.',
    'ida.s1': 'What does undetectable mean?',
    'ida.s2': 'How does PrEP work?',
    'ida.s3': 'What to do after a risk?',
    'ida.s4': 'What does CD4 mean?',
    'ida.s5': 'Must I tell my employer?',
    'ida.unsure': 'I am not sure I understood — this is the closest I have. If you meant something else, pick a topic below.',
    'ida.bound': 'I will not answer about your own result — and that is deliberate. That is a conversation for a doctor, not a database.',
    'ida.negctx': 'answer for an HIV-negative person',
    'ida.inThread': 'in thread: ',
    'ida.clock': 'This is time-critical. Read now:',
    'ida.gate': 'Medical block — requires a physician signature before release. Nobody has approved this yet.',
    'ida.srcPl': 'source: Polish',
    'ida.baseUnverified': 'Base {ed} · not yet human-verified',
    'ida.noCover': '<b>I do not have this in the Circle base — and I will not make it up.</b><br><br>I am saving your question as a gap so someone can fill it. For real numbers and places, check <b>Help</b>, and discuss medical decisions with your doctor.<br><br><span style="color:var(--tx-3)">I can tell you about:</span>',
    'ida.gapTag': 'out of coverage',
    'ida.gapSaved': 'saved as a gap',
    'ida.crisis': 'I am stopping here, because I read something heavy in this. I am not the one to carry it — but I know who is. I am staying. You can keep writing.',
    'ida.crisisLine': 'Mental health crisis — 24/7',
    'ida.notYourLang': 'This line answers in Polish. On {eu} you can ask for an interpreter.',
    'ida.stopMeds': 'It matters that you are saying this — and it is a conversation to have with your doctor, not alone. Reasons vary: side effects, daily fatigue, cost, shame. Each can be talked through, and each usually has a way out.',
    'trust.t3': 'to verify',
    'trust.t4': 'community',
    'app.loggedAs': 'Signed in as',
    'app.threads': 'Conversations',
    'app.start': 'Start a conversation',
    'app.startHint': 'Enter the nickname of someone you know from the Circle.',
    'app.peerPh': 'Calm River #C3D4',
    'app.open': 'Open conversation',
    'app.empty': 'No conversations yet. Talk to someone who gets it — start below: find someone or join a room.',
    'app.newConvo': 'New conversation',
    'app.discover': 'Talk to people',
    'app.discoverP': 'The Circle connects people going through this. You do not need to know anyone — start by area or topic.',
    'app.findPeople': 'Find people by area or topic',
    'app.joinRoom': 'Join a topic room',
    'app.knowAddr': 'Already have someone’s address or link?',
    'diary.kicker': 'Your health',
    'diary.title': 'Journal',
    'diary.p': 'Your results, meds, visits and tests in one place — and Ida reads the trend from them and nudges you.',
    'diary.priv': '🔒 Stays on this phone.', 'diary.privLong': 'Everything in the diary stays on this phone. Make a backup in Profile before clearing your browser data.',
    'diary.new': 'New entry',
    'diary.notePh': 'e.g. CD4 268, viral load below threshold',
    'diary.save': 'Save to journal',
    'diary.empty': 'The journal is empty. Nothing in it leaves this device.',
    'diary.device': 'Technical details',
    'diary.rAcc': 'Account (local key)',
    'diary.rAccV': 'on device',
    'diary.rDiary': 'Health journal (IndexedDB)',
    'diary.rSw': 'Offline mode (service worker)',
    'diary.rE2e': '1:1 chats (E2E)',
    'diary.rE2eV': 'active',
    'diary.sample': 'Add a sample entry',
    'diary.wipe': 'Erase everything on this device',
    'pf.kicker': 'Your profile',
    'pf.title': 'Profile',
    'pf.p': 'This is your profile. Change your name and language anytime — it saves securely and shows up on your other devices.',
    'pf.pseudo': 'The name others see',
    'pf.handle': 'Your address in the Circle (people write to you here)',
    'pf.handleHint': 'It comes from your key and never changes — like a number, but without saying who you are.',
    'pf.lang': 'Language',
    'pf.role': 'Who you are in the Circle',
    'pf.gram': 'How should I address you?',
    'pf.save': 'Save and sync',
    'pf.kcSummary': 'Your Circle Key',
    'pf.kcP': 'A way to enter your account from another device or recover it. Save it safely. No one, not even the Circle, can recreate it.',
    'role.plhiv': 'I live with HIV',
    'role.partner': 'I am a partner',
    'role.bliska': 'I am family or a friend',
    'gram.n': 'Neutral (impersonal)',
    'gram.f': 'Feminine forms',
    'gram.m': 'Masculine forms',
    'sync.on': '✓ synced',
    'sync.syncing': 'syncing…',
    'sync.off': 'offline',
    'th.lock': '🔒 End-to-end encrypted. The server cannot read these messages.',
    'th.msgPh': 'Write…',
    'tab.ida': 'Ida', 'tab.app': 'Chats', 'tab.diary': 'Journal', 'tab.profile': 'Profile',
    'toast.profM': 'Profile saved.', 'toast.profF': 'Profile saved.', 'toast.profN': 'Profile saved.',
    'toast.diaryM': 'Entry saved.', 'toast.diaryF': 'Entry saved.', 'toast.diaryN': 'Entry saved.',
  },

  uk: {
    'w.h1': 'Привіт. Я Іда.',
    'w.intro': 'Я поруч із людьми, які живуть з ВІЛ, та їхніми близькими. Допоможу знайти <b>перевірену інформацію</b>, зрозуміти результати й бути на зв’язку з тими, хто це знає.',
    'w.canDo': 'У Колі ти можеш',
    'w.b1': 'Дізнаватися про ВІЛ простою мовою',
    'w.b2': 'Вести приватну історію аналізів',
    'w.b3': 'Стежити за лікуванням',
    'w.b4': 'Поговорити з людьми, які проходять через те саме',
    'w.b5': 'Запитати мене про будь-що',
    'w.privacy': 'Приватність тут — це стандарт, а не опція. Те, що ти записуєш про своє здоров’я, шифрується на твоєму пристрої — і ніхто в Колі цього не бачить, зокрема ми.',
    'w.passkey': 'Увійти — Face ID або відбиток',
    'w.anon': 'Увійти',
    'w.have': 'У мене вже є акаунт',
    'login.h1': 'У мене вже є акаунт',
    'login.p': 'Відновити акаунт на цьому пристрої — passkey (Face ID / відбиток) або Ключем Кола. Усе розшифровується <b>тут</b>; сервер не бачить жодного.',
    'login.passkey': 'Увійти — Face ID або відбиток',
    'login.orKc': 'або Ключем Кола',
    'login.ph': 'krag1:…  (встав або скануй)',
    'login.do': 'Увійти та синхронізувати',
    'back': 'Назад',
    'kc.h1': 'Твій Ключ Кола',
    'kc.p': 'Так ти зайдеш до акаунту з іншого пристрою або відновиш його. Збережи його — знімок екрана чи менеджер паролів. <b>Ніхто, зокрема Коло, його не відтворить.</b>',
    'kc.copy': 'Копіювати ключ',
    'kc.ack': 'Я зберіг(-ла) Ключ Кола в безпечному місці',
    'kc.enter': 'Увійти до Кола',
    'kc.copied': 'Ключ Кола скопійовано.',
    'ida.kicker': 'Знання Кола',
    'ida.title': 'Запитай Іду',
    'ida.ph': 'Запитай про ВІЛ, PrEP, лікування, результати…',
    'ida.hello': 'Привіт. Я Іда — я поруч у Колі й відповідаю з матеріалів, які маю. Коли чогось не маю, кажу це прямо, а не вгадую.',
    'ida.s1': 'Що означає невизначуваний?',
    'ida.s2': 'Як діє PrEP?',
    'ida.s3': 'Що робити після ризику?',
    'ida.s4': 'Що означає CD4?',
    'ida.s5': 'Чи маю сказати роботодавцю?',
    'ida.unsure': 'Не впевнена, що зрозуміла — це найближче, що маю. Якщо йшлося про інше, обери тему нижче.',
    'ida.bound': 'Я не відповім про твій власний результат — і це навмисно. Це розмова з лікарем, а не з базою.',
    'ida.negctx': 'відповідь для ВІЛ-негативної особи',
    'ida.inThread': 'у темі: ',
    'ida.clock': 'Це ситуація з годинником. Читай одразу:',
    'ida.gate': 'Медичний блок — перед публікацією потрібен підпис лікаря. У цій версії цього ще ніхто не підтвердив.',
    'ida.srcPl': 'джерело: польською',
    'ida.baseUnverified': 'База {ed} · ще ніхто з людей це не перевірив',
    'ida.noCover': '<b>Цього немає в базі Кола — і я не вигадуватиму.</b><br><br>Записую твоє питання як прогалину, щоб хтось її заповнив. По справжні номери й заклади зазирни в <b>Допомогу</b>, а медичні рішення обговори з лікарем.<br><br><span style="color:var(--tx-3)">Натомість можу розповісти про:</span>',
    'ida.gapTag': 'поза покриттям',
    'ida.gapSaved': 'збережено як прогалину',
    'ida.crisis': 'Я зупиняюся тут, бо прочитала щось важке. Я не та, хто це підніме, — але знаю, хто зможе. Я поруч. Можеш писати далі.',
    'ida.crisisLine': 'Психічна криза — 24/7',
    'ida.notYourLang': 'Ця лінія відповідає польською. За номером {eu} можна попросити перекладача.',
    'ida.stopMeds': 'Важливо, що ти про це говориш — і це розмова з твоїм лікарем, не самотужки. Причини бувають різні: побічні ефекти, втома, витрати, сором. Кожну можна обговорити, і кожна зазвичай має вихід.',
    'trust.t3': 'до перевірки',
    'trust.t4': 'спільнота',
    'app.loggedAs': 'Ви увійшли як',
    'app.threads': 'Розмови',
    'app.start': 'Почати розмову',
    'app.startHint': 'Введи псевдонім людини, яку знаєш із Кола.',
    'app.peerPh': 'Спокійна Ріка #C3D4',
    'app.open': 'Відкрити розмову',
    'app.empty': 'Розмов ще немає. Поговори з кимось, хто розуміє — почни нижче: знайди когось або приєднайся до кімнати.',
    'app.newConvo': 'Нова розмова',
    'app.discover': 'Поговори з людьми',
    'app.discoverP': 'Коло з’єднує людей, які проходять через це. Не треба нікого знати — почни з околиці або теми.',
    'app.findPeople': 'Знайди людей поруч або за темою',
    'app.joinRoom': 'Приєднайся до тематичної кімнати',
    'app.knowAddr': 'Уже маєш чиюсь адресу або посилання?',
    'diary.kicker': 'Твоє здоров’я',
    'diary.priv': '🔒 Залишається на цьому телефоні.', 'diary.privLong': 'Усе в щоденнику залишається на цьому телефоні. Зроби копію в Профілі, перш ніж чистити дані браузера.',
    'diary.title': 'Щоденник',
    'diary.p': 'Твої результати, ліки, візити й аналізи в одному місці — а Іда читає з них тренд і підказує.',
    'diary.new': 'Новий запис',
    'diary.notePh': 'напр. CD4 268, вірусне навантаження нижче порога',
    'diary.save': 'Зберегти у щоденнику',
    'diary.empty': 'Щоденник порожній. Нічого з нього не залишає цей пристрій.',
    'diary.device': 'Технічні деталі',
    'diary.rAcc': 'Акаунт (локальний ключ)',
    'diary.rAccV': 'на пристрої',
    'diary.rDiary': 'Щоденник здоров’я (IndexedDB)',
    'diary.rSw': 'Офлайн-режим (service worker)',
    'diary.rE2e': 'Розмови 1:1 (E2E)',
    'diary.rE2eV': 'активні',
    'diary.sample': 'Додати приклад запису',
    'diary.wipe': 'Стерти все з цього пристрою',
    'pf.kicker': 'Твій профіль',
    'pf.title': 'Профіль',
    'pf.p': 'Це твій профіль. Ім’я та мову зміниш будь-коли — вони збережуться безпечно й з’являться на інших твоїх пристроях.',
    'pf.pseudo': 'Ім’я, яке бачать інші',
    'pf.handle': 'Твоя адреса в Колі (сюди тобі пишуть)',
    'pf.handleHint': 'Вона походить із твого ключа й ніколи не змінюється — як номер, але без вказівки, хто ти.',
    'pf.lang': 'Мова',
    'pf.role': 'Хто ти в Колі',
    'pf.gram': 'Як до тебе звертатися?',
    'pf.save': 'Зберегти та синхронізувати',
    'pf.kcSummary': 'Твій Ключ Кола',
    'pf.kcP': 'Спосіб зайти до акаунту з іншого пристрою або відновити його. Збережи безпечно. Ніхто, зокрема Коло, його не відтворить.',
    'role.plhiv': 'Я живу з ВІЛ',
    'role.partner': 'Я партнер або партнерка',
    'role.bliska': 'Я близька людина',
    'gram.n': 'Нейтрально (безособово)',
    'gram.f': 'Жіночий рід',
    'gram.m': 'Чоловічий рід',
    'sync.on': '✓ синхронізовано',
    'sync.syncing': 'синхронізую…',
    'sync.off': 'офлайн',
    'th.lock': '🔒 Наскрізне шифрування. Сервер не читає цих повідомлень.',
    'th.msgPh': 'Напиши…',
    'tab.ida': 'Іда', 'tab.app': 'Розмови', 'tab.diary': 'Щоденник', 'tab.profile': 'Профіль',
    'toast.profM': 'Профіль збережено.', 'toast.profF': 'Профіль збережено.', 'toast.profN': 'Профіль збережено.',
    'toast.diaryM': 'Запис збережено.', 'toast.diaryF': 'Запис збережено.', 'toast.diaryN': 'Запис збережено.',
  },

  ru: {
    'w.h1': 'Привет. Я Ида.',
    'w.intro': 'Я рядом с людьми, живущими с ВИЧ, и их близкими. Помогу найти <b>проверенную информацию</b>, понять результаты и быть на связи с теми, кто это знает.',
    'w.canDo': 'В Круге ты можешь',
    'w.b1': 'Узнавать о ВИЧ простым языком',
    'w.b2': 'Вести приватную историю анализов',
    'w.b3': 'Следить за лечением',
    'w.b4': 'Поговорить с людьми, которые проходят через то же',
    'w.b5': 'Спросить меня о чём угодно',
    'w.privacy': 'Приватность здесь — это стандарт, а не опция. То, что ты записываешь о своём здоровье, шифруется на твоём устройстве — и никто в Круге этого не видит, включая нас.',
    'w.passkey': 'Войти — Face ID или отпечаток',
    'w.anon': 'Войти',
    'w.have': 'У меня уже есть аккаунт',
    'login.h1': 'У меня уже есть аккаунт',
    'login.p': 'Восстанови аккаунт на этом устройстве — passkey (Face ID / отпечаток) или Ключом Круга. Всё расшифровывается <b>здесь</b>; сервер не видит ни того, ни другого.',
    'login.passkey': 'Войти — Face ID или отпечаток',
    'login.orKc': 'или Ключом Круга',
    'login.ph': 'krag1:…  (вставь или отсканируй)',
    'login.do': 'Войти и синхронизировать',
    'back': 'Назад',
    'kc.h1': 'Твой Ключ Круга',
    'kc.p': 'Так ты войдёшь в аккаунт с другого устройства или восстановишь его. Сохрани его — снимок экрана или менеджер паролей. <b>Никто, включая Круг, его не восстановит.</b>',
    'kc.copy': 'Копировать ключ',
    'kc.ack': 'Я сохранил(-а) Ключ Круга в надёжном месте',
    'kc.enter': 'Войти в Круг',
    'kc.copied': 'Ключ Круга скопирован.',
    'ida.kicker': 'Знания Круга',
    'ida.title': 'Спроси Иду',
    'ida.ph': 'Спроси о ВИЧ, PrEP, лечении, результатах…',
    'ida.hello': 'Привет. Я Ида — я рядом в Круге и отвечаю из материалов, которые у меня есть. Когда чего-то нет, говорю прямо, а не гадаю.',
    'ida.s1': 'Что значит неопределяемый?',
    'ida.s2': 'Как работает PrEP?',
    'ida.s3': 'Что делать после риска?',
    'ida.s4': 'Что значит CD4?',
    'ida.s5': 'Должен ли я сказать работодателю?',
    'ida.unsure': 'Не уверена, что поняла — это ближайшее, что есть. Если ты имел(-а) в виду другое, выбери тему ниже.',
    'ida.bound': 'Я не отвечу про твой собственный результат — и это намеренно. Это разговор с врачом, а не с базой.',
    'ida.negctx': 'ответ для ВИЧ-отрицательного человека',
    'ida.inThread': 'в теме: ',
    'ida.clock': 'Это ситуация с часами. Читай сразу:',
    'ida.gate': 'Медицинский блок — перед публикацией нужна подпись врача. В этой версии это ещё никто не подтвердил.',
    'ida.srcPl': 'источник: польский',
    'ida.baseUnverified': 'База {ed} · это ещё никто из людей не проверил',
    'ida.noCover': '<b>Этого нет в базе Круга — и я не буду выдумывать.</b><br><br>Записываю твой вопрос как пробел, чтобы кто-то его заполнил. За настоящими номерами и учреждениями загляни в <b>Помощь</b>, а медицинские решения обсуди с врачом.<br><br><span style="color:var(--tx-3)">Зато могу рассказать о:</span>',
    'ida.gapTag': 'вне покрытия',
    'ida.gapSaved': 'сохранено как пробел',
    'ida.crisis': 'Я останавливаюсь здесь, потому что прочитала что-то тяжёлое. Я не та, кто это вынесет, — но знаю, кто сможет. Я рядом. Можешь писать дальше.',
    'ida.crisisLine': 'Психический кризис — 24/7',
    'ida.notYourLang': 'Эта линия отвечает по-польски. По номеру {eu} можно попросить переводчика.',
    'ida.stopMeds': 'Важно, что ты об этом говоришь — и это разговор с твоим врачом, не в одиночку. Причины бывают разные: побочные эффекты, усталость, расходы, стыд. Каждую можно обсудить, и у каждой обычно есть выход.',
    'trust.t3': 'к проверке',
    'trust.t4': 'сообщество',
    'app.loggedAs': 'Вы вошли как',
    'app.threads': 'Разговоры',
    'app.start': 'Начать разговор',
    'app.startHint': 'Введи псевдоним человека, которого знаешь из Круга.',
    'app.peerPh': 'Тихая Река #C3D4',
    'app.open': 'Открыть разговор',
    'app.empty': 'Разговоров пока нет. Поговори с тем, кто понимает — начни ниже: найди кого-то или войди в комнату.',
    'app.newConvo': 'Новый разговор',
    'app.discover': 'Поговори с людьми',
    'app.discoverP': 'Круг связывает людей, которые проходят через это. Не нужно никого знать — начни с района или темы.',
    'app.findPeople': 'Найди людей рядом или по теме',
    'app.joinRoom': 'Войди в тематическую комнату',
    'app.knowAddr': 'Уже есть чей-то адрес или ссылка?',
    'diary.kicker': 'Твоё здоровье',
    'diary.priv': '🔒 Остаётся на этом телефоне.', 'diary.privLong': 'Всё в дневнике остаётся на этом телефоне. Сделай копию в Профиле, прежде чем чистить данные браузера.',
    'diary.title': 'Дневник',
    'diary.p': 'Твои результаты, лекарства, визиты и анализы в одном месте — а Ида читает по ним тренд и подсказывает.',
    'diary.new': 'Новая запись',
    'diary.notePh': 'напр. CD4 268, вирусная нагрузка ниже порога',
    'diary.save': 'Сохранить в дневник',
    'diary.empty': 'Дневник пуст. Ничего из него не покидает это устройство.',
    'diary.device': 'Технические детали',
    'diary.rAcc': 'Аккаунт (локальный ключ)',
    'diary.rAccV': 'на устройстве',
    'diary.rDiary': 'Дневник здоровья (IndexedDB)',
    'diary.rSw': 'Офлайн-режим (service worker)',
    'diary.rE2e': 'Разговоры 1:1 (E2E)',
    'diary.rE2eV': 'активны',
    'diary.sample': 'Добавить пример записи',
    'diary.wipe': 'Стереть всё с этого устройства',
    'pf.kicker': 'Твой профиль',
    'pf.title': 'Профиль',
    'pf.p': 'Это твой профиль. Имя и язык изменишь когда угодно — они сохранятся безопасно и появятся на других твоих устройствах.',
    'pf.pseudo': 'Имя, которое видят другие',
    'pf.handle': 'Твой адрес в Круге (сюда тебе пишут)',
    'pf.handleHint': 'Он создаётся из твоего ключа и никогда не меняется — как номер, но без указания, кто ты.',
    'pf.lang': 'Язык',
    'pf.role': 'Кто ты в Круге',
    'pf.gram': 'Как к тебе обращаться?',
    'pf.save': 'Сохранить и синхронизировать',
    'pf.kcSummary': 'Твой Ключ Круга',
    'pf.kcP': 'Способ войти в аккаунт с другого устройства или восстановить его. Сохрани надёжно. Никто, включая Круг, его не восстановит.',
    'role.plhiv': 'Я живу с ВИЧ',
    'role.partner': 'Я партнёр или партнёрша',
    'role.bliska': 'Я близкий человек',
    'gram.n': 'Нейтрально (безлично)',
    'gram.f': 'Женский род',
    'gram.m': 'Мужской род',
    'sync.on': '✓ синхронизировано',
    'sync.syncing': 'синхронизирую…',
    'sync.off': 'офлайн',
    'th.lock': '🔒 Сквозное шифрование. Сервер не читает эти сообщения.',
    'th.msgPh': 'Напиши…',
    'tab.ida': 'Ида', 'tab.app': 'Разговоры', 'tab.diary': 'Дневник', 'tab.profile': 'Профиль',
    'toast.profM': 'Профиль сохранён.', 'toast.profF': 'Профиль сохранён.', 'toast.profN': 'Профиль сохранён.',
    'toast.diaryM': 'Запись сохранена.', 'toast.diaryF': 'Запись сохранена.', 'toast.diaryN': 'Запись сохранена.',
  },
};

// —— Dziennik (#7): rozbudowa. Dokładane osobno, by nie puchł główny blok. ——
Object.assign(DICT.pl, {
  'd.results': 'Wyniki i badania', 'd.trend': 'Trajektoria', 'd.addResult': 'Dodaj wynik',
  'd.cd4': 'CD4 (komórki/µl)', 'd.vl': 'Wiremia (kopie/ml)', 'd.value': 'Wartość', 'd.date': 'Data',
  'd.meds': 'Leki', 'd.medName': 'Nazwa leku', 'd.medDose': 'Dawka', 'd.medTime': 'Godzina', 'd.addMed': 'Dodaj lek',
  'd.visits': 'Wizyty', 'd.visitTitle': 'Opis wizyty', 'd.addVisit': 'Dodaj wizytę',
  'd.photos': 'Zdjęcia badań', 'd.addPhoto': 'Wgraj zdjęcie badań', 'd.notes': 'Notatki', 'd.addNote': 'Dodaj notatkę',
  'd.photoHint': 'Wgraj zdjęcie wyniku — Ida spróbuje odczytać wartości i wpisać je niżej w „Wyniki i badania". Sprawdź i popraw. Zdjęcie zostaje na tym telefonie.',
  'd.scanResult': 'Odczytaj wynik ze zdjęcia', 'd.ocrReading': 'Odczytuję wynik…',
  'd.ocrPrefilled': 'Odczytano — sprawdź wartość powyżej i zapisz.', 'd.ocrNone': 'Nie rozpoznałem wyniku — wpisz go ręcznie.',
  'd.ocrOffline': 'Odczyt ze zdjęcia działa online. Możesz wpisać wynik ręcznie.',
  'd.cotests': 'Inne badania i koinfekcje', 'd.cotestHint': 'HIV to nie tylko HIV. Śledź też HCV, HBV, kiłę, CMV, HPV, gruźlicę, szczepienia i badania ogólne.',
  'd.cotestName': 'Co badano', 'd.cotestResult': 'Wynik (np. ujemny, wykryto, szczepienie)', 'd.addCotest': 'Dodaj badanie',
  'd.cotestChips': 'HCV,HBV,Kiła,CMV,HPV,Gruźlica,Lipidy,Nerki',
  'd.demo': 'Wypełnij danymi demo', 'd.del': 'usuń', 'd.none': 'jeszcze nic tu nie ma',
  'd.undetectable': 'poniżej progu', 'd.at': 'o', 'd.saved': 'Zapisano.',
});
Object.assign(DICT.pl, {
  'coach.title': 'Trener odporności', 'coach.cd4now': 'Ostatnie CD4: {v}.',
  'coach.trendUp': 'Od poprzedniego pomiaru: wzrost.',
  'coach.trendDown': 'Od poprzedniego pomiaru: spadek — wahania się zdarzają; jeśli się powtarza, wspomnij o tym lekarzowi.',
  'coach.trendFlat': 'Od poprzedniego pomiaru: bez większych zmian.',
  'coach.phases': 'Odbudowa CD4 ma fazy: najszybciej w pierwszym półroczu, potem wolniej — przez lata. Wolniejszy wzrost i wahania są normalne i nie są Twoją winą.',
  'coach.m200': 'Dla kontekstu: 200 to próg, poniżej którego rośnie ryzyko zakażeń oportunistycznych. Informacja ogólna, nie ocena Twojego wyniku.',
  'coach.m500': 'Dla kontekstu: okolice 500 i wyżej bywają opisywane jako zbliżone do typowych. Informacja ogólna, nie ocena Twojego wyniku.',
  'coach.uu': 'Wiremia poniżej progu — U=U: niewykrywalny = nieprzenoszący HIV drogą płciową.',
  'coach.adh': 'Jedyne, co naprawdę odbudowuje odporność, to regularne branie leków i konsekwentne leczenie — a to akurat najbardziej w Twoich rękach.',
  'coach.wellbeing': 'Ruch, sen czy suplementy poprawiają samopoczucie, ale same nie podnoszą CD4 — i to jest w porządku. Nie musisz „zasłużyć" na lepszy wynik.',
  'coach.mind': 'Pierwsze miesiące po diagnozie bywają najtrudniejsze psychicznie. Gorszy czas to nic dziwnego — i można z tym coś zrobić.',
  'coach.mindCta': 'Porozmawiaj z Idą',
  'coach.note': 'To wsparcie, nie porada medyczna. Trener pokazuje Twoje dane i ogólną wiedzę — nie ocenia wyników ani ich nie przewiduje. Decyzje — z lekarzem prowadzącym.',
});
Object.assign(DICT.en, {
  'coach.title': 'Immunity coach', 'coach.cd4now': 'Latest CD4: {v}.',
  'coach.trendUp': 'Since the previous reading: up.',
  'coach.trendDown': 'Since the previous reading: down — fluctuations happen; if it repeats, mention it to your doctor.',
  'coach.trendFlat': 'Since the previous reading: little change.',
  'coach.phases': 'CD4 rebuilds in phases: fastest in the first six months, then slowly — over years. Slower growth and ups and downs are normal, and not your fault.',
  'coach.m200': 'For context: 200 is the threshold below which the risk of opportunistic infections rises. General information, not a judgement of your result.',
  'coach.m500': 'For context: around 500 and above is sometimes described as close to typical. General information, not a judgement of your result.',
  'coach.uu': 'Viral load below threshold — U=U: undetectable = does not transmit HIV sexually.',
  'coach.adh': 'The only thing that truly rebuilds immunity is taking your meds consistently and treating early — and that part is most in your hands.',
  'coach.wellbeing': 'Exercise, sleep or supplements improve how you feel, but on their own they do not raise CD4 — and that is okay. You do not have to "earn" a better result.',
  'coach.mind': 'The first months after diagnosis can be the hardest mentally. A rough patch is nothing strange — and there is something you can do about it.',
  'coach.mindCta': 'Talk to Ida',
  'coach.note': 'This is support, not medical advice. The coach shows your data and general knowledge — it does not judge results or predict them. Decisions — with your doctor.',
});
Object.assign(DICT.uk, {
  'coach.title': 'Тренер імунітету', 'coach.cd4now': 'Останній CD4: {v}.',
  'coach.trendUp': 'Від попереднього виміру: зростання.',
  'coach.trendDown': 'Від попереднього виміру: зниження — коливання трапляються; якщо повторюється, згадай про це лікарю.',
  'coach.trendFlat': 'Від попереднього виміру: без суттєвих змін.',
  'coach.phases': 'CD4 відновлюється фазами: найшвидше в перші пів року, потім повільно — роками. Повільніше зростання й коливання — це нормально і не твоя провина.',
  'coach.m200': 'Для контексту: 200 — поріг, нижче якого зростає ризик опортуністичних інфекцій. Загальна інформація, не оцінка твого результату.',
  'coach.m500': 'Для контексту: близько 500 і вище іноді описують як близьке до типового. Загальна інформація, не оцінка твого результату.',
  'coach.uu': 'Вірусне навантаження нижче порога — U=U: невизначуваний = не передає ВІЛ статевим шляхом.',
  'coach.adh': 'Єдине, що справді відновлює імунітет, — регулярний прийом ліків і послідовне лікування, а це саме те, що найбільше залежить від тебе.',
  'coach.wellbeing': 'Рух, сон чи добавки покращують самопочуття, але самі не підвищують CD4 — і це нормально. Не треба «заслуговувати» на кращий результат.',
  'coach.mind': 'Перші місяці після діагнозу бувають найважчими психологічно. Важкий період — це не дивно, і з цим можна щось зробити.',
  'coach.mindCta': 'Поговори з Ідою',
  'coach.note': 'Це підтримка, не медична порада. Тренер показує твої дані й загальні знання — не оцінює результати й не прогнозує їх. Рішення — з лікарем.',
});
Object.assign(DICT.ru, {
  'coach.title': 'Тренер иммунитета', 'coach.cd4now': 'Последний CD4: {v}.',
  'coach.trendUp': 'С прошлого измерения: рост.',
  'coach.trendDown': 'С прошлого измерения: снижение — колебания случаются; если повторяется, скажи об этом врачу.',
  'coach.trendFlat': 'С прошлого измерения: без существенных изменений.',
  'coach.phases': 'CD4 восстанавливается фазами: быстрее всего в первые полгода, потом медленно — годами. Более медленный рост и колебания — это нормально и не твоя вина.',
  'coach.m200': 'Для контекста: 200 — порог, ниже которого растёт риск оппортунистических инфекций. Общая информация, не оценка твоего результата.',
  'coach.m500': 'Для контекста: около 500 и выше иногда описывают как близкое к типичному. Общая информация, не оценка твоего результата.',
  'coach.uu': 'Вирусная нагрузка ниже порога — U=U: неопределяемый = не передаёт ВИЧ половым путём.',
  'coach.adh': 'Единственное, что действительно восстанавливает иммунитет, — регулярный приём лекарств и последовательное лечение, а это как раз больше всего в твоих руках.',
  'coach.wellbeing': 'Движение, сон или добавки улучшают самочувствие, но сами не повышают CD4 — и это нормально. Не нужно «заслуживать» лучший результат.',
  'coach.mind': 'Первые месяцы после диагноза бывают самыми тяжёлыми психологически. Трудный период — это не странно, и с этим можно что-то сделать.',
  'coach.mindCta': 'Поговори с Идой',
  'coach.note': 'Это поддержка, не медицинский совет. Тренер показывает твои данные и общие знания — не оценивает результаты и не прогнозирует их. Решения — с врачом.',
});
Object.assign(DICT.en, {
  'd.results': 'Results & tests', 'd.trend': 'Trajectory', 'd.addResult': 'Add result',
  'd.cd4': 'CD4 (cells/µl)', 'd.vl': 'Viral load (copies/ml)', 'd.value': 'Value', 'd.date': 'Date',
  'd.meds': 'Medication', 'd.medName': 'Drug name', 'd.medDose': 'Dose', 'd.medTime': 'Time', 'd.addMed': 'Add drug',
  'd.visits': 'Appointments', 'd.visitTitle': 'Appointment', 'd.addVisit': 'Add appointment',
  'd.photos': 'Test photos', 'd.addPhoto': 'Upload a test photo', 'd.notes': 'Notes', 'd.addNote': 'Add note',
  'd.photoHint': 'Upload a photo of your result — Ida will try to read the values into “Results & tests” below. Check and fix. The photo stays on this phone.',
  'd.scanResult': 'Read result from photo', 'd.ocrReading': 'Reading result…',
  'd.ocrPrefilled': 'Read — check the value above and save.', 'd.ocrNone': 'Could not recognize a result — enter it manually.',
  'd.ocrOffline': 'Reading from a photo works online. You can enter the result manually.',
  'd.cotests': 'Other tests & co-infections', 'd.cotestHint': 'HIV is not only HIV. Track HCV, HBV, syphilis, CMV, HPV, TB, vaccinations and general tests too.',
  'd.cotestName': 'What was tested', 'd.cotestResult': 'Result (e.g. negative, detected, vaccinated)', 'd.addCotest': 'Add test',
  'd.cotestChips': 'HCV,HBV,Syphilis,CMV,HPV,TB,Lipids,Kidney',
  'd.demo': 'Fill with demo data', 'd.del': 'delete', 'd.none': 'nothing here yet',
  'd.undetectable': 'below threshold', 'd.at': 'at', 'd.saved': 'Saved.',
});
Object.assign(DICT.uk, {
  'd.results': 'Результати та аналізи', 'd.trend': 'Траєкторія', 'd.addResult': 'Додати результат',
  'd.cd4': 'CD4 (клітини/µl)', 'd.vl': 'Вірусне навантаження (копій/мл)', 'd.value': 'Значення', 'd.date': 'Дата',
  'd.meds': 'Ліки', 'd.medName': 'Назва ліків', 'd.medDose': 'Доза', 'd.medTime': 'Час', 'd.addMed': 'Додати ліки',
  'd.visits': 'Візити', 'd.visitTitle': 'Опис візиту', 'd.addVisit': 'Додати візит',
  'd.photos': 'Фото аналізів', 'd.addPhoto': 'Завантажити фото аналізу', 'd.notes': 'Нотатки', 'd.addNote': 'Додати нотатку',
  'd.photoHint': 'Завантаж фото результату — Іда спробує зчитати значення нижче в „Результати та аналізи". Перевір і виправ. Фото залишається на цьому телефоні.',
  'd.scanResult': 'Зчитати результат із фото', 'd.ocrReading': 'Зчитую результат…',
  'd.ocrPrefilled': 'Зчитано — перевір значення вгорі та збережи.', 'd.ocrNone': 'Не вдалося розпізнати результат — впиши вручну.',
  'd.ocrOffline': 'Зчитування з фото працює онлайн. Можеш ввести результат вручну.',
  'd.cotests': 'Інші аналізи та коінфекції', 'd.cotestHint': 'ВІЛ — це не лише ВІЛ. Стеж також за HCV, HBV, сифілісом, CMV, HPV, туберкульозом, щепленнями та загальними аналізами.',
  'd.cotestName': 'Що досліджували', 'd.cotestResult': 'Результат (напр. негативний, виявлено, щеплення)', 'd.addCotest': 'Додати аналіз',
  'd.cotestChips': 'HCV,HBV,Сифіліс,CMV,HPV,Туберкульоз,Ліпіди,Нирки',
  'd.demo': 'Заповнити демоданими', 'd.del': 'видалити', 'd.none': 'тут поки нічого немає',
  'd.undetectable': 'нижче порога', 'd.at': 'о', 'd.saved': 'Збережено.',
});
Object.assign(DICT.ru, {
  'd.results': 'Результаты и анализы', 'd.trend': 'Траектория', 'd.addResult': 'Добавить результат',
  'd.cd4': 'CD4 (клетки/µl)', 'd.vl': 'Вирусная нагрузка (копий/мл)', 'd.value': 'Значение', 'd.date': 'Дата',
  'd.meds': 'Лекарства', 'd.medName': 'Название лекарства', 'd.medDose': 'Доза', 'd.medTime': 'Время', 'd.addMed': 'Добавить лекарство',
  'd.visits': 'Визиты', 'd.visitTitle': 'Описание визита', 'd.addVisit': 'Добавить визит',
  'd.photos': 'Фото анализов', 'd.addPhoto': 'Загрузить фото анализа', 'd.notes': 'Заметки', 'd.addNote': 'Добавить заметку',
  'd.photoHint': 'Загрузи фото результата — Ида попробует считать значения ниже в „Результаты и анализы". Проверь и поправь. Фото остаётся на этом телефоне.',
  'd.scanResult': 'Считать результат с фото', 'd.ocrReading': 'Считываю результат…',
  'd.ocrPrefilled': 'Считано — проверь значение выше и сохрани.', 'd.ocrNone': 'Не удалось распознать результат — впиши вручную.',
  'd.ocrOffline': 'Считывание с фото работает онлайн. Можешь ввести результат вручную.',
  'd.cotests': 'Другие анализы и коинфекции', 'd.cotestHint': 'ВИЧ — это не только ВИЧ. Отслеживай также HCV, HBV, сифилис, CMV, HPV, туберкулёз, прививки и общие анализы.',
  'd.cotestName': 'Что исследовали', 'd.cotestResult': 'Результат (напр. отрицательный, выявлено, прививка)', 'd.addCotest': 'Добавить анализ',
  'd.cotestChips': 'HCV,HBV,Сифилис,CMV,HPV,Туберкулёз,Липиды,Почки',
  'd.demo': 'Заполнить демоданными', 'd.del': 'удалить', 'd.none': 'здесь пока ничего нет',
  'd.undetectable': 'ниже порога', 'd.at': 'в', 'd.saved': 'Сохранено.',
});

Object.assign(DICT.pl, {
  'ix.title': 'Interakcje leków', 'ix.check': 'Sprawdź', 'ix.checkPh': 'Sprawdź lek, suplement, jedzenie…',
  'ix.note': 'Informacyjnie — nie zastępuje konsultacji. Zawsze potwierdź z lekarzem lub farmaceutą. Pełne sprawdzenie: baza Liverpool HIV Drug Interactions.',
  'ix.none': 'Nie znam interakcji tego z Twoimi lekami — to nie znaczy, że jej nie ma. Sprawdź w bazie Liverpool.',
  'ix.addMeds': 'Dodaj swoje leki wyżej, żeby sprawdzać interakcje.', 'ix.known': 'Warto wiedzieć przy Twoim schemacie:',
});
Object.assign(DICT.en, {
  'ix.title': 'Drug interactions', 'ix.check': 'Check', 'ix.checkPh': 'Check a drug, supplement, food…',
  'ix.note': 'Informational — does not replace a consultation. Always confirm with your doctor or pharmacist. Full check: Liverpool HIV Drug Interactions.',
  'ix.none': "I don't know of an interaction with your drugs — that doesn't mean there isn't one. Check Liverpool.",
  'ix.addMeds': 'Add your drugs above to check interactions.', 'ix.known': 'Worth knowing with your regimen:',
});
Object.assign(DICT.uk, {
  'ix.title': 'Взаємодії ліків', 'ix.check': 'Перевірити', 'ix.checkPh': 'Перевір ліки, добавку, їжу…',
  'ix.note': 'Інформаційно — не замінює консультації. Завжди підтверджуй з лікарем або фармацевтом. Повна перевірка: база Liverpool HIV Drug Interactions.',
  'ix.none': 'Не знаю взаємодії цього з твоїми ліками — це не означає, що її немає. Перевір у базі Liverpool.',
  'ix.addMeds': 'Додай свої ліки вище, щоб перевіряти взаємодії.', 'ix.known': 'Варто знати за твоєї схеми:',
});
Object.assign(DICT.ru, {
  'ix.title': 'Взаимодействия лекарств', 'ix.check': 'Проверить', 'ix.checkPh': 'Проверь лекарство, добавку, еду…',
  'ix.note': 'Информационно — не заменяет консультацию. Всегда подтверждай с врачом или фармацевтом. Полная проверка: база Liverpool HIV Drug Interactions.',
  'ix.none': 'Не знаю взаимодействия этого с твоими лекарствами — это не значит, что его нет. Проверь в базе Liverpool.',
  'ix.addMeds': 'Добавь свои лекарства выше, чтобы проверять взаимодействия.', 'ix.known': 'Стоит знать при твоей схеме:',
});

Object.assign(DICT.pl, {
  'cat.open': 'Znajdź', 'cat.title': 'Znajdź kogoś do rozmowy', 'cat.lead': 'Ogłoś się (opcjonalnie) i znajdź osoby z okolicy albo po temacie.',
  'cat.mine': 'Twoje ogłoszenie', 'cat.region': 'Okolica (np. Warszawa)', 'cat.tags': 'Tematy (np. świeżo po diagnozie, PrEP)', 'cat.bio': 'Kilka słów o sobie',
  'cat.publish': 'Ogłoś się', 'cat.remove': 'Usuń ogłoszenie', 'cat.browse': 'Przeglądaj',
  'cat.fRegion': 'Okolica', 'cat.fTag': 'Temat', 'cat.search': 'Szukaj', 'cat.none': 'Nikt się jeszcze nie ogłosił (albo brak wyników).',
  'cat.write': 'Napisz', 'cat.you': '(to Ty)', 'cat.offline': 'Katalog wymaga połączenia — dostępny po wpięciu backendu.',
  'cat.note': 'Ogłoszenie jest widoczne dla innych członków Kręgu. Bez GPS — tylko to, co sam wpiszesz. Nie podawaj danych, których nie chcesz ujawnić.',
  'cat.mentorOffer': 'Mogę wspierać jako buddy/mentor', 'cat.mentorFilter': 'Tylko buddy/mentorzy', 'cat.mentorBadge': 'buddy',
  'th.buddyOn': 'Oznaczono jako buddy/mentor.', 'th.buddyOff': 'Zdjęto oznaczenie buddy.', 'th.buddyTag': 'buddy',
});
Object.assign(DICT.en, {
  'cat.open': 'Find', 'cat.title': 'Find someone to talk to', 'cat.lead': 'List yourself (optional) and find people by area or topic.',
  'cat.mine': 'Your listing', 'cat.region': 'Area (e.g. Warsaw)', 'cat.tags': 'Topics (e.g. newly diagnosed, PrEP)', 'cat.bio': 'A few words about you',
  'cat.publish': 'List me', 'cat.remove': 'Remove listing', 'cat.browse': 'Browse',
  'cat.fRegion': 'Area', 'cat.fTag': 'Topic', 'cat.search': 'Search', 'cat.none': 'No one has listed yet (or no results).',
  'cat.write': 'Message', 'cat.you': '(you)', 'cat.offline': 'The directory needs a connection — available once the backend is deployed.',
  'cat.note': 'Your listing is visible to other Circle members. No GPS — only what you type. Do not share what you would not want revealed.',
  'cat.mentorOffer': 'I can support as a buddy/mentor', 'cat.mentorFilter': 'Buddies/mentors only', 'cat.mentorBadge': 'buddy',
  'th.buddyOn': 'Marked as buddy/mentor.', 'th.buddyOff': 'Buddy mark removed.', 'th.buddyTag': 'buddy',
});
Object.assign(DICT.uk, {
  'cat.open': 'Знайти', 'cat.title': 'Знайти когось для розмови', 'cat.lead': 'Заяви про себе (необов’язково) і знайди людей поруч або за темою.',
  'cat.mine': 'Твоє оголошення', 'cat.region': 'Околиця (напр. Варшава)', 'cat.tags': 'Теми (напр. щойно діагностовані, PrEP)', 'cat.bio': 'Кілька слів про себе',
  'cat.publish': 'Оголосити', 'cat.remove': 'Видалити оголошення', 'cat.browse': 'Переглядати',
  'cat.fRegion': 'Околиця', 'cat.fTag': 'Тема', 'cat.search': 'Пошук', 'cat.none': 'Ще ніхто не оголосився (або немає результатів).',
  'cat.write': 'Написати', 'cat.you': '(це ти)', 'cat.offline': 'Каталог потребує з’єднання — доступний після підключення бекенду.',
  'cat.note': 'Оголошення видно іншим членам Кола. Без GPS — лише те, що впишеш. Не вказуй те, чого не хочеш розкривати.',
  'cat.mentorOffer': 'Можу підтримати як buddy/ментор', 'cat.mentorFilter': 'Лише buddy/ментори', 'cat.mentorBadge': 'buddy',
  'th.buddyOn': 'Позначено як buddy/ментор.', 'th.buddyOff': 'Позначку buddy знято.', 'th.buddyTag': 'buddy',
});
Object.assign(DICT.ru, {
  'cat.open': 'Найти', 'cat.title': 'Найти собеседника', 'cat.lead': 'Заяви о себе (необязательно) и найди людей рядом или по теме.',
  'cat.mine': 'Твоё объявление', 'cat.region': 'Район (напр. Варшава)', 'cat.tags': 'Темы (напр. недавно диагностированные, PrEP)', 'cat.bio': 'Несколько слов о себе',
  'cat.publish': 'Заявить', 'cat.remove': 'Удалить объявление', 'cat.browse': 'Просмотр',
  'cat.fRegion': 'Район', 'cat.fTag': 'Тема', 'cat.search': 'Поиск', 'cat.none': 'Пока никто не заявил (или нет результатов).',
  'cat.write': 'Написать', 'cat.you': '(это ты)', 'cat.offline': 'Каталог требует соединения — доступен после подключения бэкенда.',
  'cat.note': 'Объявление видно другим членам Круга. Без GPS — только то, что впишешь. Не указывай то, что не хочешь раскрывать.',
  'cat.mentorOffer': 'Могу поддержать как buddy/ментор', 'cat.mentorFilter': 'Только buddy/менторы', 'cat.mentorBadge': 'buddy',
  'th.buddyOn': 'Отмечено как buddy/ментор.', 'th.buddyOff': 'Отметка buddy снята.', 'th.buddyTag': 'buddy',
});
Object.assign(DICT.pl, { 'login.scan': 'Zeskanuj kod QR', 'scan.hint': 'Skieruj aparat na kod QR Klucza Kręgu', 'scan.cancel': 'Anuluj', 'scan.deny': 'Brak dostępu do aparatu — wklej klucz ręcznie.' });
Object.assign(DICT.en, { 'login.scan': 'Scan QR code', 'scan.hint': 'Point the camera at the Circle Key QR', 'scan.cancel': 'Cancel', 'scan.deny': 'No camera access — paste the key manually.' });
Object.assign(DICT.uk, { 'login.scan': 'Сканувати QR-код', 'scan.hint': 'Наведи камеру на QR-код Ключа Кола', 'scan.cancel': 'Скасувати', 'scan.deny': 'Немає доступу до камери — встав ключ вручну.' });
Object.assign(DICT.ru, { 'login.scan': 'Сканировать QR-код', 'scan.hint': 'Наведи камеру на QR-код Ключа Круга', 'scan.cancel': 'Отмена', 'scan.deny': 'Нет доступа к камере — вставь ключ вручную.' });
Object.assign(DICT.pl, { 'lib.open': 'Biblioteka', 'lib.title': 'Biblioteka', 'lib.lead': 'Wiedza o HIV prostym językiem — przejrzyj tematy w swoim tempie.', 'lib.facts': 'fakty' });
Object.assign(DICT.en, { 'lib.open': 'Library', 'lib.title': 'Library', 'lib.lead': 'Knowledge about HIV in plain language — browse topics at your own pace.', 'lib.facts': 'facts' });
Object.assign(DICT.uk, { 'lib.open': 'Бібліотека', 'lib.title': 'Бібліотека', 'lib.lead': 'Знання про ВІЛ простою мовою — переглядай теми у своєму темпі.', 'lib.facts': 'факти' });
Object.assign(DICT.ru, { 'lib.open': 'Библиотека', 'lib.title': 'Библиотека', 'lib.lead': 'Знания о ВИЧ простым языком — просматривай темы в своём темпе.', 'lib.facts': 'факты' });

// Pokoje tematyczne + linki-zaproszenia (#6/2)
Object.assign(DICT.pl, {
  'room.open2': 'Pokoje', 'room.title': 'Pokoje tematyczne', 'room.lead': 'Grupy wokół tematu. Wiadomości szyfrowane od końca do końca — osobno do każdej osoby.',
  'room.create': 'Załóż pokój', 'room.namePh': 'np. Świeżo po diagnozie', 'room.createBtn': 'Załóż', 'room.searchPh': 'Szukaj pokoju',
  'room.none': 'Brak pokojów (albo brak wyników). Załóż pierwszy.', 'room.join': 'Dołącz', 'room.open': 'Otwórz',
  'room.count': '{n} osób', 'room.one': 'Pokój', 'room.tag': 'grupa', 'room.needName': 'Podaj nazwę pokoju.',
  'room.note': 'Nazwa pokoju jest jawna (żeby dało się go znaleźć). Treść rozmów — nie.',
  'inv.summary': 'Zaproś do rozmowy', 'inv.p': 'Udostępnij link lub kod QR. Osoba otworzy aplikację i od razu zacznie z Tobą rozmowę. Link nie zawiera danych osobowych ani kluczy.',
  'inv.share': 'Udostępnij link', 'inv.copied': 'Skopiowano link zaproszenia.', 'inv.shareText': 'Napisz do mnie w Kręgu:',
  'inv.opened': 'Otwarto rozmowę z zaproszenia.', 'inv.notFound': 'Nie znaleziono tej osoby (albo nie ma jeszcze konta).',
});
Object.assign(DICT.en, {
  'room.open2': 'Rooms', 'room.title': 'Topic rooms', 'room.lead': 'Groups around a topic. Messages are end-to-end encrypted — separately to each person.',
  'room.create': 'Create a room', 'room.namePh': 'e.g. Newly diagnosed', 'room.createBtn': 'Create', 'room.searchPh': 'Search rooms',
  'room.none': 'No rooms yet (or no results). Create the first one.', 'room.join': 'Join', 'room.open': 'Open',
  'room.count': '{n} people', 'room.one': 'Room', 'room.tag': 'group', 'room.needName': 'Enter a room name.',
  'room.note': 'The room name is public (so it can be found). The conversations are not.',
  'inv.summary': 'Invite to chat', 'inv.p': 'Share a link or QR code. The person opens the app and starts chatting with you right away. The link carries no personal data or keys.',
  'inv.share': 'Share link', 'inv.copied': 'Invite link copied.', 'inv.shareText': 'Message me on Krąg:',
  'inv.opened': 'Opened chat from invite.', 'inv.notFound': 'Could not find that person (or they have no account yet).',
});
Object.assign(DICT.uk, {
  'room.open2': 'Кімнати', 'room.title': 'Тематичні кімнати', 'room.lead': 'Групи навколо теми. Повідомлення шифруються наскрізно — окремо для кожного.',
  'room.create': 'Створити кімнату', 'room.namePh': 'напр. Щойно діагностовані', 'room.createBtn': 'Створити', 'room.searchPh': 'Пошук кімнат',
  'room.none': 'Кімнат ще немає (або немає результатів). Створи першу.', 'room.join': 'Приєднатися', 'room.open': 'Відкрити',
  'room.count': '{n} осіб', 'room.one': 'Кімната', 'room.tag': 'група', 'room.needName': 'Вкажи назву кімнати.',
  'room.note': 'Назва кімнати відкрита (щоб її можна було знайти). Зміст розмов — ні.',
  'inv.summary': 'Запросити до розмови', 'inv.p': 'Поділися посиланням або QR-кодом. Людина відкриє застосунок і одразу почне з тобою розмову. Посилання не містить особистих даних чи ключів.',
  'inv.share': 'Поділитися посиланням', 'inv.copied': 'Посилання скопійовано.', 'inv.shareText': 'Напиши мені в Колі:',
  'inv.opened': 'Відкрито розмову із запрошення.', 'inv.notFound': 'Не вдалося знайти цю людину (або вона ще не має акаунта).',
});
Object.assign(DICT.ru, {
  'room.open2': 'Комнаты', 'room.title': 'Тематические комнаты', 'room.lead': 'Группы вокруг темы. Сообщения шифруются сквозно — отдельно для каждого.',
  'room.create': 'Создать комнату', 'room.namePh': 'напр. Недавно диагностированные', 'room.createBtn': 'Создать', 'room.searchPh': 'Поиск комнат',
  'room.none': 'Комнат пока нет (или нет результатов). Создай первую.', 'room.join': 'Войти', 'room.open': 'Открыть',
  'room.count': '{n} чел.', 'room.one': 'Комната', 'room.tag': 'группа', 'room.needName': 'Укажи название комнаты.',
  'room.note': 'Название комнаты открыто (чтобы её можно было найти). Содержание разговоров — нет.',
  'inv.summary': 'Пригласить в разговор', 'inv.p': 'Поделись ссылкой или QR-кодом. Человек откроет приложение и сразу начнёт с тобой разговор. Ссылка не содержит личных данных или ключей.',
  'inv.share': 'Поделиться ссылкой', 'inv.copied': 'Ссылка скопирована.', 'inv.shareText': 'Напиши мне в Круге:',
  'inv.opened': 'Открыт разговор по приглашению.', 'inv.notFound': 'Не удалось найти этого человека (или у него ещё нет аккаунта).',
});

// Wyjaśnienie kropki połączenia (dotyk → dymek) — #2
Object.assign(DICT.pl, {
  'conn.on': 'Połączono z Kręgiem — rozmowy i synchronizacja działają.',
  'conn.off': 'Tryb offline: Krąg działa też bez sieci. Ida, biblioteka i dziennik są dostępne, a Twoje dane zostają bezpiecznie na tym urządzeniu. Rozmowy dołączą, gdy wróci połączenie.',
});
Object.assign(DICT.en, {
  'conn.on': 'Connected to the Circle — chats and sync are working.',
  'conn.off': 'Offline mode: the Circle works without a connection too. Ida, the library and the diary are available, and your data stays safely on this device. Chats will catch up once you are back online.',
});
Object.assign(DICT.uk, {
  'conn.on': 'З’єднано з Колом — розмови й синхронізація працюють.',
  'conn.off': 'Офлайн-режим: Коло працює й без мережі. Іда, бібліотека та щоденник доступні, а твої дані лишаються безпечно на цьому пристрої. Розмови синхронізуються, коли зв’язок повернеться.',
});
Object.assign(DICT.ru, {
  'conn.on': 'Соединено с Кругом — разговоры и синхронизация работают.',
  'conn.off': 'Офлайн-режим: Круг работает и без сети. Ида, библиотека и дневник доступны, а твои данные остаются безопасно на этом устройстве. Разговоры синхронизируются, когда связь вернётся.',
});

// Pomoc — prawdziwe numery i placówki (#1). Numery są neutralne językowo (w HTML), tu etykiety.
Object.assign(DICT.pl, {
  'help.open': 'Pomoc', 'help.title': 'Pomoc', 'help.lead': 'Gdy potrzebujesz rozmowy albo pomocy od zaraz — tu masz sprawdzone, w większości bezpłatne numery i miejsca. Zadzwonić możesz anonimowo.',
  'help.emergency': 'Nagły wypadek', 'help.crisis': 'Kryzys psychiczny (24/7)', 'help.youth': 'Dzieci i młodzież (24/7)',
  'help.hiv': 'Telefon Zaufania HIV/AIDS', 'help.hivHours': 'pon–pt 9:00–21:00', 'help.free': 'bezpłatny',
  'help.test': 'Poradnie i ośrodki leczące HIV', 'help.testCta': 'Znajdź placówkę (aids.gov.pl)',
  'help.pep': 'Po ryzykownym kontakcie (PEP)', 'help.pepD': 'Im szybciej, tym lepiej — do 48–72 h. Zgłoś się na SOR lub do szpitala zakaźnego (bez skierowania).',
  'help.call': 'Zadzwoń',
  'ida.help1': 'Pomoc i numery zaufania', 'ida.help2': 'Gdzie zrobić test HIV?',
});
Object.assign(DICT.en, {
  'help.open': 'Help', 'help.title': 'Help', 'help.lead': 'When you need to talk or get help right now — here are trusted, mostly free numbers and places. You can call anonymously.',
  'help.emergency': 'Emergency', 'help.crisis': 'Mental-health crisis (24/7)', 'help.youth': 'Children & youth (24/7)',
  'help.hiv': 'HIV/AIDS trust line', 'help.hivHours': 'Mon–Fri 9:00–21:00', 'help.free': 'free',
  'help.test': 'Clinics that treat HIV', 'help.testCta': 'Find a clinic (aids.gov.pl)',
  'help.pep': 'After a risky exposure (PEP)', 'help.pepD': 'The sooner the better — within 48–72 h. Go to an ER or an infectious-diseases hospital (no referral needed).',
  'help.call': 'Call',
  'ida.help1': 'Help and trust lines', 'ida.help2': 'Where can I test for HIV?',
});
Object.assign(DICT.uk, {
  'help.open': 'Допомога', 'help.title': 'Допомога', 'help.lead': 'Коли потрібна розмова чи допомога негайно — тут перевірені, здебільшого безкоштовні номери й місця. Подзвонити можна анонімно.',
  'help.emergency': 'Екстрений випадок', 'help.crisis': 'Психічна криза (24/7)', 'help.youth': 'Діти та молодь (24/7)',
  'help.hiv': 'Телефон довіри ВІЛ/СНІД', 'help.hivHours': 'пн–пт 9:00–21:00', 'help.free': 'безкоштовно',
  'help.test': 'Заклади, що лікують ВІЛ', 'help.testCta': 'Знайти заклад (aids.gov.pl)',
  'help.pep': 'Після ризикованого контакту (PEP)', 'help.pepD': 'Що швидше, то краще — до 48–72 год. Звернися до приймального відділення або інфекційної лікарні (без направлення).',
  'help.call': 'Подзвонити',
  'ida.help1': 'Допомога й телефони довіри', 'ida.help2': 'Де здати тест на ВІЛ?',
});
Object.assign(DICT.ru, {
  'help.open': 'Помощь', 'help.title': 'Помощь', 'help.lead': 'Когда нужен разговор или помощь прямо сейчас — здесь проверенные, в основном бесплатные номера и места. Позвонить можно анонимно.',
  'help.emergency': 'Экстренный случай', 'help.crisis': 'Психический кризис (24/7)', 'help.youth': 'Дети и молодёжь (24/7)',
  'help.hiv': 'Телефон доверия ВИЧ/СПИД', 'help.hivHours': 'пн–пт 9:00–21:00', 'help.free': 'бесплатно',
  'help.test': 'Учреждения, лечащие ВИЧ', 'help.testCta': 'Найти учреждение (aids.gov.pl)',
  'help.pep': 'После рискованного контакта (PEP)', 'help.pepD': 'Чем раньше, тем лучше — в течение 48–72 ч. Обратись в приёмное отделение или инфекционную больницу (без направления).',
  'help.call': 'Позвонить',
  'ida.help1': 'Помощь и телефоны доверия', 'ida.help2': 'Где сдать тест на ВИЧ?',
});

// Kopia zapasowa (#5)
Object.assign(DICT.pl, {
  'bk.summary': 'Kopia zapasowa (na wypadek utraty danych)',
  'bk.p': 'To co innego niż Klucz Kręgu: klucz przenosi Twoje konto, a ta kopia — Twój dziennik (który zostaje tylko na urządzeniu). Jeśli wyczyścisz dane przeglądarki, dziennik zniknie — zapisz zaszyfrowaną kopię, otworzysz ją swoim Kluczem Kręgu.',
  'bk.export': 'Zapisz kopię do pliku', 'bk.import': 'Wczytaj kopię z pliku',
  'bk.done': 'Wczytano wpisów: {n}.', 'bk.empty': 'Kopia nie zawiera nic nowego.',
  'bk.badkey': 'Ten plik nie pasuje do Twojego Klucza Kręgu.', 'bk.badfile': 'To nie wygląda na kopię Kręgu.',
  'bk.nokey': 'Potrzebny Klucz Kręgu na tym urządzeniu.', 'bk.err': 'Nie udało się zapisać kopii.',
  'bk.warn': '🔒 Plik jest zaszyfrowany — bezużyteczny bez Twojego klucza. Trzymaj go w bezpiecznym miejscu.',
});
Object.assign(DICT.en, {
  'bk.summary': 'Backup (in case data is lost)',
  'bk.p': 'Different from the Circle Key: the key moves your account, this copy moves your diary (which stays only on the device). If you clear browser data the diary is gone — save an encrypted copy, openable with your Circle Key.',
  'bk.export': 'Save a copy to a file', 'bk.import': 'Load a copy from a file',
  'bk.done': 'Entries loaded: {n}.', 'bk.empty': 'The copy has nothing new.',
  'bk.badkey': 'This file does not match your Circle Key.', 'bk.badfile': 'This does not look like a Circle backup.',
  'bk.nokey': 'Your Circle Key is needed on this device.', 'bk.err': 'Could not save the copy.',
  'bk.warn': '🔒 The file is encrypted — useless without your key. Keep it somewhere safe.',
});
Object.assign(DICT.uk, {
  'bk.summary': 'Резервна копія (на випадок втрати даних)',
  'bk.p': 'Це не те саме, що Ключ Кола: ключ переносить твій акаунт, а ця копія — твій щоденник (який лишається тільки на пристрої). Якщо очистиш дані браузера — щоденник зникне; збережи зашифровану копію, відкриється твоїм Ключем Кола.',
  'bk.export': 'Зберегти копію у файл', 'bk.import': 'Завантажити копію з файлу',
  'bk.done': 'Завантажено записів: {n}.', 'bk.empty': 'У копії немає нічого нового.',
  'bk.badkey': 'Цей файл не відповідає твоєму Ключу Кола.', 'bk.badfile': 'Це не схоже на копію Кола.',
  'bk.nokey': 'Потрібен Ключ Кола на цьому пристрої.', 'bk.err': 'Не вдалося зберегти копію.',
  'bk.warn': '🔒 Файл зашифрований — марний без твого ключа. Тримай його в безпечному місці.',
});
Object.assign(DICT.ru, {
  'bk.summary': 'Резервная копия (на случай потери данных)',
  'bk.p': 'Это не то же, что Ключ Круга: ключ переносит твой аккаунт, а эта копия — твой дневник (который остаётся только на устройстве). Если очистишь данные браузера — дневник исчезнет; сохрани зашифрованную копию, откроется твоим Ключом Круга.',
  'bk.export': 'Сохранить копию в файл', 'bk.import': 'Загрузить копию из файла',
  'bk.done': 'Загружено записей: {n}.', 'bk.empty': 'В копии нет ничего нового.',
  'bk.badkey': 'Этот файл не подходит к твоему Ключу Круга.', 'bk.badfile': 'Это не похоже на копию Круга.',
  'bk.nokey': 'Нужен Ключ Круга на этом устройстве.', 'bk.err': 'Не удалось сохранить копию.',
  'bk.warn': '🔒 Файл зашифрован — бесполезен без твоего ключа. Храни его в безопасном месте.',
});

// Wsparcie emocjonalne (nie-kryzysowe) — ciepło + realne wyjścia. #emocje
Object.assign(DICT.pl, {
  'emo.lonely': 'Słyszę Cię. Samotność z HIV potrafi przytłaczać — ale tutaj naprawdę nie musisz być w tym sam. W Kręgu są ludzie, którzy przechodzą przez to samo; mogę pomóc Ci kogoś znaleźć. Zostaję.',
  'emo.low': 'Przykro mi, że masz teraz tak ciężko. Nie musisz nieść tego sam — możesz napisać do kogoś, kto rozumie, albo sięgnąć po wsparcie w Pomocy. Jestem tu.',
  'emo.fear': 'To, co czujesz, ma sens — strach i wstyd często chodzą z diagnozą, ale nie muszą zostać na zawsze. Nie jesteś z tym sam; mogę pomóc znaleźć wsparcie.',
  'emo.meet': 'Porozmawiaj z ludźmi', 'emo.help': 'Zobacz Pomoc',
});
Object.assign(DICT.en, {
  'emo.lonely': 'I hear you. Loneliness with HIV can be overwhelming — but here you really do not have to be in it alone. In the Circle there are people going through the same; I can help you find someone. I am staying.',
  'emo.low': 'I am sorry it is so hard right now. You do not have to carry it alone — you can message someone who gets it, or reach for support in Help. I am here.',
  'emo.fear': 'What you feel makes sense — fear and shame often come with a diagnosis, but they do not have to stay forever. You are not alone in this; I can help you find support.',
  'emo.meet': 'Talk to people', 'emo.help': 'See Help',
});
Object.assign(DICT.uk, {
  'emo.lonely': 'Я тебе чую. Самотність із ВІЛ може бути виснажливою — але тут ти справді не мусиш бути в цьому сам. У Колі є люди, які проходять через те саме; я можу допомогти когось знайти. Я поруч.',
  'emo.low': 'Мені прикро, що зараз так важко. Не мусиш нести це сам — можеш написати тому, хто розуміє, або звернутися по підтримку в Допомозі. Я тут.',
  'emo.fear': 'Те, що ти відчуваєш, має сенс — страх і сором часто приходять із діагнозом, але не мусять лишитися назавжди. Ти не сам; я можу допомогти знайти підтримку.',
  'emo.meet': 'Поговори з людьми', 'emo.help': 'Переглянь Допомогу',
});
Object.assign(DICT.ru, {
  'emo.lonely': 'Я тебя слышу. Одиночество с ВИЧ может быть невыносимым — но здесь ты правда не обязан быть в этом один. В Круге есть люди, которые проходят через то же; я могу помочь кого-то найти. Я рядом.',
  'emo.low': 'Мне жаль, что сейчас так тяжело. Не обязательно нести это одному — можешь написать тому, кто понимает, или обратиться за поддержкой в Помощь. Я здесь.',
  'emo.fear': 'То, что ты чувствуешь, имеет смысл — страх и стыд часто приходят с диагнозом, но не обязаны остаться навсегда. Ты не один; я могу помочь найти поддержку.',
  'emo.meet': 'Поговори с людьми', 'emo.help': 'Открой Помощь',
});

// Ida Rozumie (LLM) — opt-in + oznaczenia. #AI
Object.assign(DICT.pl, {
  'pf.ai': 'Ida Rozumie (AI)',
  'pf.aiHint': 'Bez tego Ida odpowiada prostym dopasowaniem słów — czasem nie rozumie pytania. Włączone: rozumie lepiej i pamięta wątek rozmowy (ciągłość). Do modelu AI (przez nasz serwer) idzie tylko tekst pytania i kilku ostatnich tur — bez pseudonimu, kluczy i dziennika. Odpowiada wyłącznie z faktów Kręgu. Domyślnie wyłączone; działa po wdrożeniu serwera.',
  'ai.thinking': 'Myślę…', 'ai.badge': 'AI ułożyło to z faktów Kręgu',
});
Object.assign(DICT.en, {
  'pf.ai': 'Ida Understands (AI)',
  'pf.aiHint': 'Without this, Ida replies by simple word-matching — and sometimes misses the question. On: she understands better and keeps the thread of the conversation (continuity). Only the question text and the last few turns go to the AI model (via our server) — no pseudonym, keys or diary. She answers only from Circle facts. Off by default; works once the server is deployed.',
  'ai.thinking': 'Thinking…', 'ai.badge': 'AI composed this from Circle facts',
});
Object.assign(DICT.uk, {
  'pf.ai': 'Іда Розуміє (AI)',
  'pf.aiHint': 'Без цього Іда відповідає простим збігом слів — інколи не розуміє запитання. Увімкнено: розуміє краще і памʼятає хід розмови (безперервність). До моделі AI (через наш сервер) іде лише текст запитання й кілька останніх реплік — без псевдоніма, ключів і щоденника. Відповідає лише з фактів Кола. Типово вимкнено; працює після розгортання сервера.',
  'ai.thinking': 'Думаю…', 'ai.badge': 'AI склало це з фактів Кола',
});
Object.assign(DICT.ru, {
  'pf.ai': 'Ида Понимает (AI)',
  'pf.aiHint': 'Без этого Ида отвечает простым совпадением слов — иногда не понимает вопрос. Включено: понимает лучше и помнит ход разговора (непрерывность). К AI-модели (через наш сервер) идёт только текст вопроса и несколько последних реплик — без псевдонима, ключей и дневника. Отвечает только из фактов Круга. По умолчанию выключено; работает после развёртывания сервера.',
  'ai.thinking': 'Думаю…', 'ai.badge': 'AI собрало это из фактов Круга',
});

// Powitania Idy — kilka wariantów (losowo), krótkie, NIE powielają onboardingu. #2
Object.assign(DICT.pl, { 'ida.hellos': 'Dobrze Cię widzieć. O co chcesz dziś zapytać?|Cześć! Dobrze, że jesteś. Od czego zaczynamy?|Jestem tu. O czym chcesz porozmawiać?|Hej. Zadaj pytanie — odpowiem z tego, co mam, bez zgadywania.' });
Object.assign(DICT.en, { 'ida.hellos': "Good to see you. What would you like to ask today?|Hi! Glad you're here. Where do we start?|I'm here. What do you want to talk about?|Hey. Ask me anything — I answer from what I have, no guessing." });
Object.assign(DICT.uk, { 'ida.hellos': 'Рада тебе бачити. Про що хочеш запитати сьогодні?|Привіт! Добре, що ти тут. З чого почнемо?|Я тут. Про що хочеш поговорити?|Гей. Постав запитання — відповім із того, що маю, без вгадування.' });
Object.assign(DICT.ru, { 'ida.hellos': 'Рада тебя видеть. О чём хочешь спросить сегодня?|Привет! Хорошо, что ты здесь. С чего начнём?|Я здесь. О чём хочешь поговорить?|Привет. Задай вопрос — отвечу из того, что есть, без догадок.' });

// Tryb demo (#3)
Object.assign(DICT.pl, { 'demo.banner': 'DEMO — przykładowe dane, wszystko lokalnie na tym urządzeniu' });
Object.assign(DICT.en, { 'demo.banner': 'DEMO — sample data, everything local on this device' });
Object.assign(DICT.uk, { 'demo.banner': 'ДЕМО — приклад даних, усе локально на цьому пристрої' });
Object.assign(DICT.ru, { 'demo.banner': 'ДЕМО — примерные данные, всё локально на этом устройстве' });

// Selektor języka (#4)
Object.assign(DICT.pl, { 'lang.partial': '(interfejs po angielsku)', 'lang.note': 'Lista to polski i języki sąsiadów. Interfejs w „(po angielsku)" pokaże się po angielsku, a fakty zostają po polsku, dopóki społeczność nie dopisze tłumaczenia. Twojego języka nie ma? Zgłoś go poniżej.' });
Object.assign(DICT.en, { 'lang.partial': '(interface in English)', 'lang.note': 'The list is Polish and neighbouring languages. Ones marked “(in English)” show the UI in English, with facts staying Polish until the community adds a translation. Language not here? Request it below.' });
Object.assign(DICT.uk, { 'lang.partial': '(інтерфейс англійською)', 'lang.note': 'Список — це польська та мови сусідів. Позначені „(англійською)" показують інтерфейс англійською, а факти лишаються польською, доки спільнота не додасть переклад. Немає твоєї мови? Повідом нижче.' });
Object.assign(DICT.ru, { 'lang.partial': '(интерфейс на английском)', 'lang.note': 'В списке польский и языки соседей. Отмеченные „(на английском)" показывают интерфейс на английском, а факты остаются на польском, пока сообщество не добавит перевод. Нет твоего языка? Сообщи ниже.' });

// OCR-all, zgłaszanie języka (#7/#8)
Object.assign(DICT.pl, { 'd.ocrAdded': 'Dodano do dziennika: {list}. Sprawdź i popraw, jeśli trzeba.', 'lang.req': 'Zgłoś brakujący język', 'lang.reqDone': 'Dzięki — zapiszemy zapotrzebowanie na: {lang}.' });
Object.assign(DICT.en, { 'd.ocrAdded': 'Added to the diary: {list}. Check and fix if needed.', 'lang.req': 'Request a missing language', 'lang.reqDone': "Thanks — we'll note the demand for: {lang}." });
Object.assign(DICT.uk, { 'd.ocrAdded': 'Додано до щоденника: {list}. Перевір і виправ, якщо треба.', 'lang.req': 'Повідомити про мову, якої бракує', 'lang.reqDone': 'Дякуємо — врахуємо потребу: {lang}.' });
Object.assign(DICT.ru, { 'd.ocrAdded': 'Добавлено в дневник: {list}. Проверь и поправь, если нужно.', 'lang.req': 'Сообщить о недостающем языке', 'lang.reqDone': 'Спасибо — учтём спрос на: {lang}.' });

// #3 „Gdzie do lekarza?" — ośrodki leczące HIV po ustaleniu miasta
Object.assign(DICT.pl, {
  'ida.docChip': 'Gdzie do lekarza?',
  'ida.clinicAsk': 'W jakim jesteś mieście? Podam adres poradni leczącej HIV najbliżej Ciebie.',
  'ida.clinicIntro': 'Poradnie leczące HIV (ARV) w tej okolicy:',
  'ida.clinicNear': 'W {city} nie ma poradni ARV. Najbliższe:',
  'ida.clinicNearby': 'Najbliżej Ciebie:',
  'ida.clinicGeo': 'Najbliższe (użyj lokalizacji)',
  'ida.clinicLocating': 'Sprawdzam lokalizację…',
  'ida.clinicGeoNo': 'Nie udało się ustalić lokalizacji. Podaj miasto albo wybierz z listy:',
  'ida.clinicKids': 'dzieci',
  'ida.clinicConfirm': 'Zadzwoń, zanim pojedziesz — godziny i zasady zapisów bywają różne. Leczenie ARV w Polsce jest bezpłatne, także bez ubezpieczenia.',
  'ida.clinicSrc': 'Źródło: Krajowe Centrum ds. AIDS (gov.pl)',
  'ida.clinicMore': 'Pełna lista i numery (Pomoc)',
  'ida.clinicNone': 'Nie mam tego miasta na liście. Użyj lokalizacji, wybierz najbliższe albo zobacz pełną listę w Pomocy:',
});
Object.assign(DICT.en, {
  'ida.docChip': 'Where do I see a doctor?',
  'ida.clinicAsk': 'Which city are you in? I’ll give the nearest HIV clinic’s address.',
  'ida.clinicIntro': 'HIV (ARV) clinics in this area:',
  'ida.clinicNear': 'No ARV clinic in {city}. Nearest ones:',
  'ida.clinicNearby': 'Nearest to you:',
  'ida.clinicGeo': 'Nearest (use my location)',
  'ida.clinicLocating': 'Checking your location…',
  'ida.clinicGeoNo': 'Couldn’t get your location. Type a city or pick from the list:',
  'ida.clinicKids': 'children',
  'ida.clinicConfirm': 'Call before you go — hours and booking rules vary. ARV treatment in Poland is free, also without insurance.',
  'ida.clinicSrc': 'Source: National AIDS Centre, Poland (gov.pl)',
  'ida.clinicMore': 'Full list and numbers (Help)',
  'ida.clinicNone': 'I don’t have that city on the list. Use your location, pick the nearest, or see the full list in Help:',
});
Object.assign(DICT.uk, {
  'ida.docChip': 'Куди до лікаря?',
  'ida.clinicAsk': 'У якому ти місті? Дам адресу найближчої клініки, що лікує ВІЛ.',
  'ida.clinicIntro': 'Клініки лікування ВІЛ (АРТ) у цьому регіоні:',
  'ida.clinicNear': 'У місті {city} немає клініки АРТ. Найближчі:',
  'ida.clinicNearby': 'Найближче до тебе:',
  'ida.clinicGeo': 'Найближчі (за локацією)',
  'ida.clinicLocating': 'Визначаю локацію…',
  'ida.clinicGeoNo': 'Не вдалося визначити локацію. Введи місто або обери зі списку:',
  'ida.clinicKids': 'діти',
  'ida.clinicConfirm': 'Зателефонуй перед візитом — години і правила запису різні. Лікування АРТ у Польщі безкоштовне, навіть без страховки.',
  'ida.clinicSrc': 'Джерело: Національний центр із питань СНІДу, Польща (gov.pl)',
  'ida.clinicMore': 'Повний список і номери (Допомога)',
  'ida.clinicNone': 'Цього міста немає в списку. Скористайся локацією, обери найближче або переглянь повний список у Допомозі:',
});
Object.assign(DICT.ru, {
  'ida.docChip': 'Куда к врачу?',
  'ida.clinicAsk': 'В каком ты городе? Дам адрес ближайшей клиники, лечащей ВИЧ.',
  'ida.clinicIntro': 'Клиники лечения ВИЧ (АРТ) в этом регионе:',
  'ida.clinicNear': 'В городе {city} нет клиники АРТ. Ближайшие:',
  'ida.clinicNearby': 'Ближе всего к тебе:',
  'ida.clinicGeo': 'Ближайшие (по геолокации)',
  'ida.clinicLocating': 'Определяю местоположение…',
  'ida.clinicGeoNo': 'Не удалось определить местоположение. Введи город или выбери из списка:',
  'ida.clinicKids': 'дети',
  'ida.clinicConfirm': 'Позвони перед визитом — часы и правила записи разные. Лечение АРТ в Польше бесплатное, даже без страховки.',
  'ida.clinicSrc': 'Источник: Национальный центр по СПИДу, Польша (gov.pl)',
  'ida.clinicMore': 'Полный список и номера (Помощь)',
  'ida.clinicNone': 'Этого города нет в списке. Используй геолокацию, выбери ближайший или посмотри полный список в Помощи:',
});

// —— Pełne tłumaczenia UI: języki sąsiadów (fakty medyczne pozostają po polsku) ——
DICT.de = {"login.h1":"Ich habe bereits ein Konto","login.p":"Stelle dein Konto auf diesem Gerät wieder her — mit einem Passkey (Face ID / Fingerabdruck) oder deinem Klucz Kręgu. Alles wird <b>hier</b> entschlüsselt; der Server sieht weder das eine noch das andere.","login.passkey":"Anmelden — Face ID oder Fingerabdruck","login.orKc":"oder mit deinem Klucz Kręgu","login.ph":"krag1:…  (einfügen oder scannen)","login.do":"Anmelden und synchronisieren","kc.h1":"Dein Klucz Kręgu","kc.p":"So meldest du dich von einem anderen Gerät an oder stellst dein Konto wieder her. Speichere ihn — als Screenshot oder im Passwort-Manager. <b>Niemand, auch Krąg nicht, kann ihn wiederherstellen.</b>","kc.copy":"Schlüssel kopieren","kc.ack":"Ich habe meinen Klucz Kręgu an einem sicheren Ort gespeichert","kc.enter":"In den Krąg eintreten","kc.copied":"Klucz Kręgu kopiert.","ida.kicker":"Wissen des Kręgu","ida.title":"Frag Ida","ida.ph":"Frag zu HIV, PrEP, Behandlung, Werten…","ida.hello":"Hallo. Ich bin Ida — ich begleite dich im Krąg und antworte aus dem Material, das ich habe. Wenn ich etwas nicht habe, sage ich das offen, statt zu raten.","ida.s1":"Was bedeutet nicht nachweisbar?","ida.s2":"Wie funktioniert PrEP?","ida.s3":"Was tun nach einem Risiko?","ida.s4":"Was bedeutet CD4?","ida.s5":"Muss ich es meinem Arbeitgeber sagen?","ida.unsure":"Ich bin nicht sicher, ob ich dich richtig verstanden habe — das kommt am nächsten. Wenn du etwas anderes gemeint hast, wähl unten ein Thema.","ida.bound":"Zu deinem eigenen Ergebnis antworte ich nicht — und das ist Absicht. Das ist ein Gespräch für eine Ärztin oder einen Arzt, nicht für eine Datenbank.","ida.negctx":"Antwort für eine HIV-negative Person","ida.inThread":"im Verlauf: ","ida.clock":"Das ist zeitkritisch. Lies jetzt:","ida.gate":"Medizinischer Block — vor der Freigabe ist eine ärztliche Unterschrift nötig. In dieser Version hat das noch niemand freigegeben.","ida.srcPl":"Quelle: Polnisch","ida.baseUnverified":"Basis {ed} · noch nicht von Menschen geprüft","ida.noCover":"<b>Das habe ich nicht in der Basis des Kręgu — und ich will nichts erfinden.</b><br><br>Ich speichere deine Frage als Lücke, damit sie jemand ergänzen kann. Echte Nummern und Anlaufstellen findest du unter <b>Hilfe</b>, und medizinische Entscheidungen besprich mit deiner Ärztin oder deinem Arzt.<br><br><span style=\"color:var(--tx-3)\">Dafür kann ich dir erzählen über:</span>","ida.gapTag":"außerhalb der Abdeckung","ida.gapSaved":"als Lücke gespeichert","ida.crisis":"Ich halte hier inne, weil ich darin etwas Schweres gelesen habe. Ich bin nicht die Richtige, um das zu tragen — aber ich weiß, wer es ist. Ich bleibe. Du kannst weiterschreiben.","ida.crisisLine":"Seelische Krise — rund um die Uhr","ida.notYourLang":"Diese Leitung antwortet auf Polnisch. Unter {eu} kannst du um eine dolmetschende Person bitten.","ida.stopMeds":"Es ist wichtig, dass du darüber sprichst — und das ist ein Gespräch für deine behandelnde Ärztin oder deinen Arzt, nicht etwas, das du allein entscheidest. Die Gründe sind verschieden: Nebenwirkungen, die Erschöpfung des Alltags, Kosten, Scham. Über jeden lässt sich reden, und für jeden gibt es meist einen Weg.","trust.t3":"zu prüfen","trust.t4":"Community","app.loggedAs":"Angemeldet als","app.threads":"Gespräche","app.start":"Ein Gespräch beginnen","app.startHint":"Gib den Spitznamen einer Person ein, die du aus dem Krąg kennst.","app.peerPh":"Ruhiger Fluss #C3D4","app.open":"Gespräch öffnen","app.empty":"Noch keine Gespräche. Sprich mit jemandem, der es versteht — starte unten: finde jemanden oder tritt einem Raum bei.","app.newConvo":"Neues Gespräch","app.discover":"Sprich mit Menschen","app.discoverP":"Der Krąg verbindet Menschen, die das gerade durchmachen. Du musst niemanden kennen — starte nach Region oder Thema.","app.findPeople":"Menschen nach Region oder Thema finden","app.joinRoom":"Einem Themenraum beitreten","app.knowAddr":"Hast du schon die Adresse oder einen Link von jemandem?","diary.kicker":"Deine Gesundheit","diary.title":"Tagebuch","diary.p":"Deine Werte, Medikamente, Termine und Untersuchungen an einem Ort — und Ida liest den Trend daraus und gibt dir Hinweise.","diary.priv":"🔒 Bleibt auf diesem Telefon.","diary.privLong":"Alles im Tagebuch bleibt auf diesem Telefon. Erstelle im Profil eine Sicherung, bevor du deine Browserdaten löschst.","diary.new":"Neuer Eintrag","diary.notePh":"z. B. CD4 268, Viruslast unter der Nachweisgrenze","diary.save":"Im Tagebuch speichern","diary.empty":"Das Tagebuch ist leer. Nichts davon verlässt dieses Gerät.","diary.device":"Technische Details","diary.rAcc":"Konto (lokaler Schlüssel)","diary.rAccV":"auf dem Gerät","diary.rDiary":"Gesundheitstagebuch (IndexedDB)","diary.rSw":"Offline-Modus (Service Worker)","diary.rE2e":"1:1-Gespräche (E2E)","diary.rE2eV":"aktiv","diary.sample":"Beispieleintrag hinzufügen","diary.wipe":"Alles auf diesem Gerät löschen","pf.kicker":"Dein Profil","pf.title":"Profil","pf.p":"Das ist dein Profil. Namen und Sprache kannst du jederzeit ändern — sie werden sicher gespeichert und erscheinen auf deinen anderen Geräten.","pf.pseudo":"Der Name, den andere sehen","pf.handle":"Deine Adresse im Krąg (hierüber schreibt man dir)","pf.handleHint":"Sie entsteht aus deinem Schlüssel und ändert sich nie — wie eine Nummer, aber ohne zu verraten, wer du bist.","pf.lang":"Sprache","pf.role":"Wer du im Krąg bist","pf.gram":"Wie soll ich dich ansprechen?","pf.save":"Speichern und synchronisieren","pf.kcSummary":"Dein Klucz Kręgu","pf.kcP":"Ein Weg, dich von einem anderen Gerät anzumelden oder dein Konto wiederherzustellen. Speichere ihn sicher. Niemand, auch Krąg nicht, kann ihn wiederherstellen.","role.plhiv":"Ich lebe mit HIV","role.partner":"Ich bin Partnerin oder Partner","role.bliska":"Ich bin eine nahestehende Person","gram.n":"Neutral (unpersönlich)","gram.f":"Weibliche Form","gram.m":"Männliche Form","sync.on":"✓ synchronisiert","sync.syncing":"synchronisiere…","sync.off":"offline","th.lock":"🔒 Ende-zu-Ende-verschlüsselt. Der Server kann diese Nachrichten nicht lesen.","th.msgPh":"Schreib…","tab.ida":"Ida","tab.app":"Chats","tab.diary":"Tagebuch","tab.profile":"Profil","toast.profM":"Profil gespeichert.","toast.profF":"Profil gespeichert.","toast.profN":"Profil gespeichert.","toast.diaryM":"Eintrag gespeichert.","toast.diaryF":"Eintrag gespeichert.","toast.diaryN":"Eintrag gespeichert.","coach.title":"Immun-Coach","coach.cd4now":"Letzter CD4-Wert: {v}.","coach.trendUp":"Seit der letzten Messung: gestiegen.","coach.trendDown":"Seit der letzten Messung: gesunken — Schwankungen kommen vor; wenn es sich wiederholt, sprich es bei deiner Ärztin oder deinem Arzt an.","coach.trendFlat":"Seit der letzten Messung: kaum verändert.","coach.phases":"Die CD4-Werte bauen sich in Phasen wieder auf: am schnellsten im ersten halben Jahr, danach langsamer — über Jahre hinweg. Langsameres Wachstum und Schwankungen sind normal und nicht deine Schuld.","coach.m200":"Zur Einordnung: 200 ist die Grenze, unter der das Risiko opportunistischer Infektionen steigt. Allgemeine Information, keine Bewertung deines Werts.","coach.m500":"Zur Einordnung: Werte um 500 und darüber werden manchmal als nahe am üblichen Bereich beschrieben. Allgemeine Information, keine Bewertung deines Werts.","coach.uu":"Viruslast unter der Nachweisgrenze — U=U: nicht nachweisbar = nicht übertragbar beim Sex.","coach.adh":"Das Einzige, was die Abwehr wirklich wieder aufbaut, ist die regelmäßige Einnahme der Medikamente und eine konsequente Behandlung — und das liegt gerade am meisten in deiner Hand.","coach.wellbeing":"Bewegung, Schlaf oder Nahrungsergänzung verbessern das Wohlbefinden, heben aber allein die CD4-Werte nicht — und das ist in Ordnung. Du musst dir kein besseres Ergebnis „verdienen“.","coach.mind":"Die ersten Monate nach der Diagnose sind seelisch oft die schwersten. Eine schwere Zeit ist nichts Ungewöhnliches — und man kann etwas dagegen tun.","coach.mindCta":"Sprich mit Ida","coach.note":"Das ist Unterstützung, keine medizinische Beratung. Der Coach zeigt deine Daten und allgemeines Wissen — er bewertet Ergebnisse nicht und sagt sie nicht voraus. Entscheidungen — mit deiner behandelnden Ärztin oder deinem Arzt.","ix.title":"Wechselwirkungen von Medikamenten","ix.check":"Prüfen","ix.checkPh":"Medikament, Nahrungsergänzung, Lebensmittel prüfen…","ix.note":"Zur Information — ersetzt keine Beratung. Bestätige es immer mit deiner Ärztin, deinem Arzt oder in der Apotheke. Vollständige Prüfung: Liverpool HIV Drug Interactions.","ix.none":"Ich kenne keine Wechselwirkung mit deinen Medikamenten — das heißt nicht, dass es keine gibt. Prüf es in der Liverpool-Datenbank.","ix.addMeds":"Füge oben deine Medikamente hinzu, um Wechselwirkungen zu prüfen.","ix.known":"Bei deinem Therapieschema gut zu wissen:","cat.open":"Finden","cat.title":"Jemanden zum Reden finden","cat.lead":"Stell dich vor (optional) und finde Menschen nach Region oder Thema.","cat.mine":"Deine Anzeige","cat.region":"Region (z. B. Warszawa)","cat.tags":"Themen (z. B. frisch diagnostiziert, PrEP)","cat.bio":"Ein paar Worte über dich","cat.publish":"Anzeige veröffentlichen","cat.remove":"Anzeige entfernen","cat.browse":"Durchsuchen","cat.fRegion":"Region","cat.fTag":"Thema","cat.search":"Suchen","cat.none":"Noch niemand hat eine Anzeige veröffentlicht (oder keine Ergebnisse).","cat.write":"Schreiben","cat.you":"(das bist du)","cat.offline":"Das Verzeichnis braucht eine Verbindung — verfügbar, sobald das Backend angebunden ist.","cat.note":"Deine Anzeige ist für andere Mitglieder des Kręgu sichtbar. Kein GPS — nur das, was du selbst einträgst. Gib keine Daten an, die du nicht preisgeben möchtest.","cat.mentorOffer":"Ich kann als Buddy/Mentor unterstützen","cat.mentorFilter":"Nur Buddys/Mentoren","cat.mentorBadge":"Buddy","th.buddyOn":"Als Buddy/Mentor markiert.","th.buddyOff":"Buddy-Markierung entfernt.","th.buddyTag":"Buddy","login.scan":"QR-Code scannen","scan.hint":"Richte die Kamera auf den QR-Code deines Klucz Kręgu","scan.cancel":"Abbrechen","scan.deny":"Kein Kamerazugriff — füge den Schlüssel manuell ein.","lib.open":"Bibliothek","lib.title":"Bibliothek","lib.lead":"Wissen über HIV in einfacher Sprache — schau dir die Themen in deinem Tempo an.","lib.facts":"Fakten","room.open2":"Räume","room.title":"Themenräume","room.lead":"Gruppen rund um ein Thema. Nachrichten sind Ende-zu-Ende-verschlüsselt — einzeln an jede Person.","room.create":"Raum erstellen","room.namePh":"z. B. Frisch diagnostiziert","room.createBtn":"Erstellen","room.searchPh":"Räume suchen","room.none":"Noch keine Räume (oder keine Ergebnisse). Erstelle den ersten.","room.join":"Beitreten","room.open":"Öffnen","room.count":"{n} Personen","room.one":"Raum","room.tag":"Gruppe","room.needName":"Gib einen Raumnamen an.","room.note":"Der Raumname ist öffentlich (damit man ihn finden kann). Die Gespräche sind es nicht.","inv.summary":"Zum Gespräch einladen","inv.p":"Teile einen Link oder QR-Code. Die Person öffnet die App und beginnt sofort ein Gespräch mit dir. Der Link enthält keine persönlichen Daten und keine Schlüssel.","inv.share":"Link teilen","inv.copied":"Einladungslink kopiert.","inv.shareText":"Schreib mir im Krąg:","inv.opened":"Gespräch aus Einladung geöffnet.","inv.notFound":"Diese Person wurde nicht gefunden (oder sie hat noch kein Konto).","conn.on":"Mit dem Krąg verbunden — Gespräche und Synchronisierung funktionieren.","conn.off":"Offline-Modus: Der Krąg funktioniert auch ohne Netz. Ida, die Bibliothek und das Tagebuch sind verfügbar, und deine Daten bleiben sicher auf diesem Gerät. Gespräche werden nachgeholt, sobald du wieder online bist.","help.open":"Hilfe","help.title":"Hilfe","help.lead":"Wenn du gerade jetzt reden oder Hilfe brauchst — hier findest du geprüfte, meist kostenlose Nummern und Anlaufstellen. Anrufen kannst du anonym.","help.emergency":"Notfall","help.crisis":"Seelische Krise (rund um die Uhr)","help.youth":"Kinder & Jugendliche (rund um die Uhr)","help.hiv":"HIV/AIDS-Beratungstelefon","help.hivHours":"Mo–Fr 9:00–21:00","help.free":"kostenlos","help.test":"Beratungsstellen und HIV-Behandlungszentren","help.testCta":"Einrichtung finden (aids.gov.pl)","help.pep":"Nach einem riskanten Kontakt (PEP)","help.pepD":"Je früher, desto besser — innerhalb von 48–72 Std. Geh in die Notaufnahme oder in ein Krankenhaus für Infektionskrankheiten (ohne Überweisung).","help.call":"Anrufen","ida.help1":"Hilfe und Beratungstelefone","ida.help2":"Wo kann ich einen HIV-Test machen?","bk.summary":"Sicherung (für den Fall von Datenverlust)","bk.p":"Etwas anderes als der Klucz Kręgu: Der Schlüssel überträgt dein Konto, diese Kopie dein Tagebuch (das nur auf dem Gerät bleibt). Wenn du deine Browserdaten löschst, ist das Tagebuch weg — speichere eine verschlüsselte Kopie, die du mit deinem Klucz Kręgu öffnest.","bk.export":"Kopie in Datei speichern","bk.import":"Kopie aus Datei laden","bk.done":"Geladene Einträge: {n}.","bk.empty":"Die Kopie enthält nichts Neues.","bk.badkey":"Diese Datei passt nicht zu deinem Klucz Kręgu.","bk.badfile":"Das sieht nicht nach einer Sicherung des Kręgu aus.","bk.nokey":"Auf diesem Gerät wird dein Klucz Kręgu benötigt.","bk.err":"Die Kopie konnte nicht gespeichert werden.","bk.warn":"🔒 Die Datei ist verschlüsselt — ohne deinen Schlüssel nutzlos. Bewahre sie an einem sicheren Ort auf.","emo.lonely":"Ich höre dich. Einsamkeit mit HIV kann überwältigend sein — aber hier musst du damit wirklich nicht allein sein. Im Krąg gibt es Menschen, die dasselbe durchmachen; ich kann dir helfen, jemanden zu finden. Ich bleibe.","emo.low":"Es tut mir leid, dass es dir gerade so schwerfällt. Du musst das nicht allein tragen — du kannst jemandem schreiben, der es versteht, oder dir unter Hilfe Unterstützung holen. Ich bin da.","emo.fear":"Was du fühlst, ergibt Sinn — Angst und Scham gehören oft zu einer Diagnose, aber sie müssen nicht für immer bleiben. Du bist damit nicht allein; ich kann dir helfen, Unterstützung zu finden.","emo.meet":"Sprich mit Menschen","emo.help":"Zur Hilfe","pf.ai":"Ida versteht (KI)","pf.aiHint":"Ohne dies antwortet Ida durch einfachen Wortabgleich — und versteht die Frage manchmal nicht. Eingeschaltet: Sie versteht besser und behält den Gesprächsverlauf im Blick (Kontinuität). An das KI-Modell (über unseren Server) geht nur der Fragetext und die letzten paar Wortwechsel — kein Spitzname, keine Schlüssel, kein Tagebuch. Sie antwortet ausschließlich aus den Fakten des Kręgu. Standardmäßig ausgeschaltet; funktioniert nach dem Aufsetzen des Servers.","ai.thinking":"Ich denke nach…","ai.badge":"Die KI hat dies aus den Fakten des Kręgu zusammengestellt","ida.hellos":"Schön, dich zu sehen. Was möchtest du heute fragen?|Hallo! Schön, dass du da bist. Womit fangen wir an?|Ich bin da. Worüber möchtest du reden?|Hey. Stell deine Frage — ich antworte aus dem, was ich habe, ohne zu raten.","demo.banner":"DEMO — Beispieldaten, alles lokal auf diesem Gerät","lang.partial":"(Oberfläche auf Englisch)","lang.note":"Die Liste umfasst Polnisch und die Sprachen der Nachbarländer. Die mit „(auf Englisch)“ markierten zeigen die Oberfläche auf Englisch, während die Fakten auf Polnisch bleiben, bis die Community eine Übersetzung ergänzt. Deine Sprache fehlt? Melde sie unten.","lang.req":"Fehlende Sprache melden","lang.reqDone":"Danke — wir notieren den Bedarf für: {lang}.","ida.docChip":"Wo finde ich eine Ärztin oder einen Arzt?","ida.clinicAsk":"In welcher Stadt bist du? Ich nenne dir die Adresse der nächsten HIV-Behandlungsstelle.","ida.clinicIntro":"HIV-Behandlungsstellen (ARV) in dieser Gegend:","ida.clinicNear":"In {city} gibt es keine ARV-Behandlungsstelle. Die nächsten:","ida.clinicNearby":"Am nächsten bei dir:","ida.clinicGeo":"Am nächsten (Standort verwenden)","ida.clinicLocating":"Ich prüfe den Standort…","ida.clinicGeoNo":"Der Standort konnte nicht ermittelt werden. Gib eine Stadt an oder wähl aus der Liste:","ida.clinicKids":"Kinder","ida.clinicConfirm":"Ruf an, bevor du hinfährst — Öffnungszeiten und Anmelderegeln sind unterschiedlich. Die ARV-Behandlung ist in Polen kostenlos, auch ohne Versicherung.","ida.clinicSrc":"Quelle: Krajowe Centrum ds. AIDS (gov.pl)","ida.clinicMore":"Vollständige Liste und Nummern (Hilfe)","ida.clinicNone":"Diese Stadt habe ich nicht auf der Liste. Verwende deinen Standort, wähl die nächste oder sieh dir die vollständige Liste unter Hilfe an:","w.h1":"Hallo. Ich bin Ida.","w.intro":"Ich begleite Menschen, die mit HIV leben, und ihre Angehörigen. Ich helfe dir, <b>verlässliche Informationen</b> zu finden, Werte zu verstehen und mit Menschen in Kontakt zu bleiben, die das kennen.","w.canDo":"Im Krąg kannst du","w.b1":"In einfacher Sprache über HIV lernen","w.b2":"Eine private Historie deiner Werte führen","w.b3":"Deine Behandlung im Blick behalten","w.b4":"Mit Menschen reden, die dasselbe durchmachen","w.b5":"Mich alles fragen","w.privacy":"Privatsphäre ist hier der Standard, keine Einstellung zum Einschalten. Was du über deine Gesundheit festhältst, wird auf deinem Gerät verschlüsselt — und niemand im Krąg sieht es, auch wir nicht.","w.passkey":"Eintreten — Face ID oder Fingerabdruck","w.anon":"Eintreten","w.have":"Ich habe bereits ein Konto","d.results":"Werte & Untersuchungen","d.trend":"Verlauf","d.addResult":"Wert hinzufügen","d.cd4":"CD4 (Zellen/µl)","d.vl":"Viruslast (Kopien/ml)","d.value":"Wert","d.date":"Datum","d.meds":"Medikamente","d.medName":"Name des Medikaments","d.medDose":"Dosis","d.medTime":"Uhrzeit","d.addMed":"Medikament hinzufügen","d.visits":"Termine","d.visitTitle":"Termin","d.addVisit":"Termin hinzufügen","d.photos":"Fotos der Untersuchungen","d.addPhoto":"Foto einer Untersuchung hochladen","d.notes":"Notizen","d.addNote":"Notiz hinzufügen","d.photoHint":"Lade ein Foto deines Werts hoch — Ida versucht, die Werte auszulesen und sie unten unter „Werte & Untersuchungen“ einzutragen. Prüf und korrigier sie. Das Foto bleibt auf diesem Telefon.","d.scanResult":"Wert aus Foto auslesen","d.ocrReading":"Ich lese den Wert aus…","d.ocrPrefilled":"Ausgelesen — prüf den Wert oben und speichere.","d.ocrNone":"Ich konnte keinen Wert erkennen — gib ihn manuell ein.","d.ocrOffline":"Das Auslesen aus einem Foto funktioniert online. Du kannst den Wert manuell eingeben.","d.cotests":"Weitere Untersuchungen & Koinfektionen","d.cotestHint":"HIV ist nicht nur HIV. Behalte auch HCV, HBV, Syphilis, CMV, HPV, Tuberkulose, Impfungen und allgemeine Untersuchungen im Blick.","d.cotestName":"Was untersucht wurde","d.cotestResult":"Ergebnis (z. B. negativ, nachgewiesen, geimpft)","d.addCotest":"Untersuchung hinzufügen","d.cotestChips":"HCV,HBV,Syphilis,CMV,HPV,Tuberkulose,Lipide,Nieren","d.demo":"Mit Demodaten füllen","d.del":"löschen","d.none":"hier ist noch nichts","d.undetectable":"unter der Nachweisgrenze","d.at":"um","d.saved":"Gespeichert.","d.ocrAdded":"Zum Tagebuch hinzugefügt: {list}. Prüf und korrigier bei Bedarf."};
DICT.cs = {"login.h1":"Už mám účet","login.p":"Obnov si účet na tomto zařízení — pomocí passkey (Face ID / otisk prstu) nebo svého Klucz Kręgu. Všechno se dešifruje <b>tady</b>; server nevidí ani jedno, ani druhé.","login.passkey":"Přihlásit se — Face ID nebo otisk prstu","login.orKc":"nebo pomocí Klucz Kręgu","login.ph":"krag1:…  (vlož nebo naskenuj)","login.do":"Přihlásit se a synchronizovat","kc.h1":"Tvůj Klucz Kręgu","kc.p":"Takto se dostaneš ke svému účtu z jiného zařízení nebo ho obnovíš. Ulož si ho — jako snímek obrazovky nebo do správce hesel. <b>Nikdo, ani Krąg, ho neobnoví.</b>","kc.copy":"Kopírovat klíč","kc.ack":"Uložil/a jsem si Klucz Kręgu na bezpečné místo","kc.enter":"Vstoupit do Kręgu","kc.copied":"Klucz Kręgu zkopírován.","ida.kicker":"Znalosti Kręgu","ida.title":"Zeptej se Idy","ida.ph":"Zeptej se na HIV, PrEP, léčbu, výsledky…","ida.hello":"Ahoj. Jsem Ida — provázím tě v Kręgu a odpovídám z materiálů, které mám. Když něco nemám, řeknu to na rovinu, místo abych hádala.","ida.s1":"Co znamená nedetekovatelný?","ida.s2":"Jak funguje PrEP?","ida.s3":"Co dělat po riziku?","ida.s4":"Co znamená CD4?","ida.s5":"Musím to říct zaměstnavateli?","ida.unsure":"Nejsem si jistá, jestli ti dobře rozumím — tohle mám nejblíž. Jestli jsi myslel/a něco jiného, vyber si téma níže.","ida.bound":"Na otázku o tvém vlastním výsledku neodpovím — a je to záměr. To je rozhovor s lékařem, ne s databází.","ida.negctx":"odpověď pro HIV negativní osobu","ida.inThread":"ve vláknu: ","ida.clock":"Tohle je situace, kde běží čas. Čti hned:","ida.gate":"Zdravotní blok — před zveřejněním vyžaduje podpis lékaře. V této verzi to zatím nikdo neschválil.","ida.srcPl":"zdroj: polština","ida.baseUnverified":"Báze {ed} · zatím to nikdo z lidí neověřil","ida.noCover":"<b>Tohle nemám v bázi Kręgu — a nechci si nic vymýšlet.</b><br><br>Ukládám tvou otázku jako mezeru, aby ji někdo doplnil. Pro skutečná čísla a místa mrkni do <b>Pomoci</b> a zdravotní rozhodnutí prober s lékařem.<br><br><span style=\"color:var(--tx-3)\">Zato ti můžu povědět o:</span>","ida.gapTag":"mimo pokrytí","ida.gapSaved":"uloženo jako mezera","ida.crisis":"Zastavuji se tady, protože jsem v tom četla něco těžkého. Nejsem od toho, abych to unesla — ale vím, kdo je. Zůstávám. Můžeš psát dál.","ida.crisisLine":"Psychická krize — 24/7","ida.notYourLang":"Tato linka odpovídá polsky. Na čísle {eu} si můžeš požádat o tlumočníka.","ida.stopMeds":"Je důležité, že o tom mluvíš — a je to rozhovor, který je potřeba vést s ošetřujícím lékařem, ne o samotě. Důvody bývají různé: vedlejší účinky, únava z každodennosti, náklady, stud. Každý z nich se dá s někým probrat a každý má obvykle nějaké řešení.","trust.t3":"k ověření","trust.t4":"komunita","app.loggedAs":"Přihlášen/a jako","app.threads":"Rozhovory","app.start":"Začít rozhovor","app.startHint":"Zadej přezdívku někoho, koho znáš z Kręgu.","app.peerPh":"Klidná Řeka #C3D4","app.open":"Otevřít rozhovor","app.empty":"Zatím nemáš žádné rozhovory. Popovídej si s někým, kdo to chápe — začni níže: najdi někoho nebo se připoj do místnosti.","app.newConvo":"Nový rozhovor","app.discover":"Popovídej si s lidmi","app.discoverP":"Krąg spojuje lidi, kteří tím procházejí. Nemusíš nikoho znát — začni podle okolí nebo tématu.","app.findPeople":"Najdi lidi v okolí nebo podle tématu","app.joinRoom":"Připoj se do tematické místnosti","app.knowAddr":"Máš už něčí adresu nebo odkaz?","diary.kicker":"Tvé zdraví","diary.title":"Deník","diary.p":"Tvé výsledky, léky, návštěvy a vyšetření na jednom místě — a Ida z nich čte trend a napovídá.","diary.priv":"🔒 Zůstává v tomto telefonu.","diary.privLong":"Všechno v deníku zůstává v tomto telefonu. Než vymažeš data prohlížeče, udělej si zálohu v Profilu.","diary.new":"Nový záznam","diary.notePh":"např. CD4 268, virová nálož pod prahem","diary.save":"Uložit do deníku","diary.empty":"Deník je prázdný. Nic z něj neopouští toto zařízení.","diary.device":"Technické podrobnosti","diary.rAcc":"Účet (lokální klíč)","diary.rAccV":"na zařízení","diary.rDiary":"Zdravotní deník (IndexedDB)","diary.rSw":"Režim offline (service worker)","diary.rE2e":"Rozhovory 1:1 (E2E)","diary.rE2eV":"aktivní","diary.sample":"Přidat ukázkový záznam","diary.wipe":"Smazat vše z tohoto zařízení","pf.kicker":"Tvůj profil","pf.title":"Profil","pf.p":"Tohle je tvůj profil. Jméno a jazyk můžeš změnit, kdykoli chceš — uloží se bezpečně a objeví se na tvých dalších zařízeních.","pf.pseudo":"Jméno, které vidí ostatní","pf.handle":"Tvá adresa v Kręgu (na ni ti píšou)","pf.handleHint":"Vzniká z tvého klíče a nikdy se nemění — je to jako číslo, jen bez toho, aby prozradilo, kdo jsi.","pf.lang":"Jazyk","pf.role":"Kdo jsi v Kręgu","pf.gram":"Jak tě mám oslovovat?","pf.save":"Uložit a synchronizovat","pf.kcSummary":"Tvůj Klucz Kręgu","pf.kcP":"Způsob, jak se dostat ke svému účtu z jiného zařízení nebo ho obnovit. Ulož si ho bezpečně. Nikdo, ani Krąg, ho neobnoví.","role.plhiv":"Žiji s HIV","role.partner":"Jsem partner/partnerka","role.bliska":"Jsem blízká osoba","gram.n":"Neutrálně (neosobně)","gram.f":"V ženském rodě","gram.m":"V mužském rodě","sync.on":"✓ synchronizováno","sync.syncing":"synchronizuji…","sync.off":"offline","th.lock":"🔒 Šifrováno od konce ke konci. Server tyto zprávy nečte.","th.msgPh":"Napiš…","tab.ida":"Ida","tab.app":"Rozhovory","tab.diary":"Deník","tab.profile":"Profil","toast.profM":"Profil uložen.","toast.profF":"Profil uložen.","toast.profN":"Profil uložen.","toast.diaryM":"Záznam uložen.","toast.diaryF":"Záznam uložen.","toast.diaryN":"Záznam uložen.","coach.title":"Kouč imunity","coach.cd4now":"Poslední CD4: {v}.","coach.trendUp":"Od předchozího měření: nárůst.","coach.trendDown":"Od předchozího měření: pokles — výkyvy se stávají; pokud se to opakuje, zmiň to lékaři.","coach.trendFlat":"Od předchozího měření: bez větších změn.","coach.phases":"Obnova CD4 má své fáze: nejrychleji v prvním půlroce, potom pomaleji — celé roky. Pomalejší nárůst a výkyvy jsou normální a nejsou tvoje vina.","coach.m200":"Pro kontext: 200 je práh, pod kterým roste riziko oportunních infekcí. Obecná informace, ne hodnocení tvého výsledku.","coach.m500":"Pro kontext: okolí 500 a výše se někdy popisuje jako blízké běžným hodnotám. Obecná informace, ne hodnocení tvého výsledku.","coach.uu":"Virová nálož pod prahem — U=U: nedetekovatelný = nepřenášející HIV pohlavní cestou.","coach.adh":"Jediné, co skutečně obnovuje imunitu, je pravidelné braní léků a důsledná léčba — a to je právě nejvíc ve tvých rukou.","coach.wellbeing":"Pohyb, spánek nebo doplňky zlepšují to, jak se cítíš, ale samy o sobě CD4 nezvyšují — a to je v pořádku. Nemusíš si lepší výsledek „zasloužit\".","coach.mind":"První měsíce po diagnóze bývají psychicky nejtěžší. Horší období není nic divného — a dá se s ním něco udělat.","coach.mindCta":"Popovídej si s Idou","coach.note":"Tohle je podpora, ne lékařská rada. Kouč ukazuje tvá data a obecné znalosti — nehodnotí výsledky ani je nepředpovídá. Rozhodnutí — s ošetřujícím lékařem.","ix.title":"Lékové interakce","ix.check":"Zkontrolovat","ix.checkPh":"Zkontroluj lék, doplněk, jídlo…","ix.note":"Pro informaci — nenahrazuje konzultaci. Vždy si to potvrď u lékaře nebo lékárníka. Úplná kontrola: databáze Liverpool HIV Drug Interactions.","ix.none":"Neznám interakci tohohle s tvými léky — to neznamená, že žádná není. Zkontroluj v databázi Liverpool.","ix.addMeds":"Přidej výše své léky, aby šlo kontrolovat interakce.","ix.known":"Dobré vědět u tvého režimu:","cat.open":"Najít","cat.title":"Najdi si někoho na popovídání","cat.lead":"Zveřejni se (nepovinně) a najdi lidi z okolí nebo podle tématu.","cat.mine":"Tvůj inzerát","cat.region":"Okolí (např. Varšava)","cat.tags":"Témata (např. čerstvě po diagnóze, PrEP)","cat.bio":"Pár slov o sobě","cat.publish":"Zveřejnit se","cat.remove":"Odstranit inzerát","cat.browse":"Procházet","cat.fRegion":"Okolí","cat.fTag":"Téma","cat.search":"Hledat","cat.none":"Zatím se nikdo nezveřejnil (nebo žádné výsledky).","cat.write":"Napsat","cat.you":"(to jsi ty)","cat.offline":"Katalog vyžaduje připojení — dostupný po zapojení backendu.","cat.note":"Inzerát je viditelný pro ostatní členy Kręgu. Bez GPS — jen to, co sám/sama napíšeš. Neuváděj údaje, které nechceš zveřejnit.","cat.mentorOffer":"Můžu podpořit jako buddy/mentor","cat.mentorFilter":"Jen buddy/mentoři","cat.mentorBadge":"buddy","th.buddyOn":"Označeno jako buddy/mentor.","th.buddyOff":"Označení buddy zrušeno.","th.buddyTag":"buddy","login.scan":"Naskenuj QR kód","scan.hint":"Namiř fotoaparát na QR kód Klucz Kręgu","scan.cancel":"Zrušit","scan.deny":"Bez přístupu k fotoaparátu — vlož klíč ručně.","lib.open":"Knihovna","lib.title":"Knihovna","lib.lead":"Znalosti o HIV jednoduchým jazykem — procházej témata svým tempem.","lib.facts":"faktů","room.open2":"Místnosti","room.title":"Tematické místnosti","room.lead":"Skupiny okolo tématu. Zprávy šifrované od konce ke konci — zvlášť pro každou osobu.","room.create":"Založit místnost","room.namePh":"např. Čerstvě po diagnóze","room.createBtn":"Založit","room.searchPh":"Hledat místnost","room.none":"Žádné místnosti (nebo žádné výsledky). Založ první.","room.join":"Připojit se","room.open":"Otevřít","room.count":"{n} lidí","room.one":"Místnost","room.tag":"skupina","room.needName":"Zadej název místnosti.","room.note":"Název místnosti je veřejný (aby ji šlo najít). Obsah rozhovorů ne.","inv.summary":"Pozvat k rozhovoru","inv.p":"Sdílej odkaz nebo QR kód. Ten člověk otevře aplikaci a hned s tebou začne rozhovor. Odkaz neobsahuje žádné osobní údaje ani klíče.","inv.share":"Sdílet odkaz","inv.copied":"Odkaz s pozvánkou zkopírován.","inv.shareText":"Napiš mi v Kręgu:","inv.opened":"Rozhovor z pozvánky otevřen.","inv.notFound":"Tuto osobu se nepodařilo najít (nebo zatím nemá účet).","conn.on":"Připojeno ke Kręgu — rozhovory a synchronizace fungují.","conn.off":"Režim offline: Krąg funguje i bez sítě. Ida, knihovna a deník jsou dostupné a tvá data zůstávají bezpečně v tomto zařízení. Rozhovory se doplní, až se vrátí připojení.","help.open":"Pomoc","help.title":"Pomoc","help.lead":"Když potřebuješ popovídat nebo pomoc hned teď — tady máš ověřená, většinou bezplatná čísla a místa. Zavolat můžeš anonymně.","help.emergency":"Naléhavý případ","help.crisis":"Psychická krize (24/7)","help.youth":"Děti a mládež (24/7)","help.hiv":"Linka důvěry HIV/AIDS","help.hivHours":"po–pá 9:00–21:00","help.free":"bezplatná","help.test":"Poradny a centra léčící HIV","help.testCta":"Najít zařízení (aids.gov.pl)","help.pep":"Po rizikovém kontaktu (PEP)","help.pepD":"Čím dřív, tím líp — do 48–72 h. Zajdi na pohotovost nebo do infekční nemocnice (bez doporučení).","help.call":"Zavolat","ida.help1":"Pomoc a linky důvěry","ida.help2":"Kde se dá udělat test na HIV?","bk.summary":"Záloha (pro případ ztráty dat)","bk.p":"Něco jiného než Klucz Kręgu: klíč přenáší tvůj účet, a tato záloha — tvůj deník (který zůstává jen na zařízení). Když vymažeš data prohlížeče, deník zmizí — ulož si šifrovanou zálohu, otevřeš ji svým Klucz Kręgu.","bk.export":"Uložit zálohu do souboru","bk.import":"Načíst zálohu ze souboru","bk.done":"Načteno záznamů: {n}.","bk.empty":"Záloha neobsahuje nic nového.","bk.badkey":"Tento soubor nepasuje k tvému Klucz Kręgu.","bk.badfile":"Tohle nevypadá jako záloha Kręgu.","bk.nokey":"Na tomto zařízení je potřeba Klucz Kręgu.","bk.err":"Zálohu se nepodařilo uložit.","bk.warn":"🔒 Soubor je šifrovaný — bez tvého klíče je k ničemu. Uchovej ho na bezpečném místě.","emo.lonely":"Slyším tě. Samota s HIV dokáže zavalit — ale tady na to opravdu nemusíš být sám/sama. V Kręgu jsou lidé, kteří procházejí tím samým; můžu ti pomoct někoho najít. Zůstávám.","emo.low":"Je mi líto, že to teď máš tak těžké. Nemusíš to nést sám/sama — můžeš napsat někomu, kdo to chápe, nebo sáhnout po podpoře v Pomoci. Jsem tu.","emo.fear":"To, co cítíš, dává smysl — strach a stud často chodí s diagnózou, ale nemusí zůstat navždy. Nejsi v tom sám/sama; můžu pomoct najít podporu.","emo.meet":"Popovídej si s lidmi","emo.help":"Zobrazit Pomoc","pf.ai":"Ida Rozumí (AI)","pf.aiHint":"Bez tohohle Ida odpovídá jednoduchým párováním slov — někdy otázce nerozumí. Zapnuté: rozumí líp a pamatuje si vlákno rozhovoru (návaznost). Do AI modelu (přes náš server) jde jen text otázky a několika posledních tahů — bez přezdívky, klíčů a deníku. Odpovídá výhradně z faktů Kręgu. Ve výchozím stavu vypnuté; funguje po nasazení serveru.","ai.thinking":"Přemýšlím…","ai.badge":"AI to sestavilo z faktů Kręgu","ida.hellos":"Ráda tě vidím. Na co se dnes chceš zeptat?|Ahoj! Ráda, že jsi tady. Čím začneme?|Jsem tady. O čem si chceš popovídat?|Ahoj. Zeptej se — odpovím z toho, co mám, bez hádání.","demo.banner":"DEMO — ukázková data, všechno lokálně na tomto zařízení","lang.partial":"(rozhraní v angličtině)","lang.note":"Seznam obsahuje polštinu a jazyky sousedů. Rozhraní označené „(v angličtině)\" se zobrazí anglicky a fakty zůstávají v polštině, dokud komunita nedoplní překlad. Tvůj jazyk tu není? Nahlas ho níže.","lang.req":"Nahlásit chybějící jazyk","lang.reqDone":"Díky — zaznamenáme poptávku po: {lang}.","ida.docChip":"Kam k lékaři?","ida.clinicAsk":"Ve kterém jsi městě? Dám ti adresu poradny léčící HIV nejblíž k tobě.","ida.clinicIntro":"Poradny léčící HIV (ARV) v tomto okolí:","ida.clinicNear":"V {city} není poradna ARV. Nejbližší:","ida.clinicNearby":"Nejblíž k tobě:","ida.clinicGeo":"Nejbližší (použij polohu)","ida.clinicLocating":"Zjišťuji polohu…","ida.clinicGeoNo":"Polohu se nepodařilo zjistit. Zadej město nebo vyber ze seznamu:","ida.clinicKids":"děti","ida.clinicConfirm":"Zavolej, než vyrazíš — hodiny a pravidla objednávání bývají různé. Léčba ARV je v Polsku bezplatná, i bez pojištění.","ida.clinicSrc":"Zdroj: Krajowe Centrum ds. AIDS (gov.pl)","ida.clinicMore":"Úplný seznam a čísla (Pomoc)","ida.clinicNone":"Toto město nemám na seznamu. Použij polohu, vyber nejbližší nebo se podívej na úplný seznam v Pomoci:","w.h1":"Ahoj. Jsem Ida.","w.intro":"Provázím lidi žijící s HIV a jejich blízké. Pomůžu ti najít <b>ověřené informace</b>, porozumět výsledkům a být v kontaktu s lidmi, kteří to znají.","w.canDo":"V Kręgu můžeš","w.b1":"Učit se o HIV jednoduchým jazykem","w.b2":"Vést si soukromou historii vyšetření","w.b3":"Hlídat si léčbu","w.b4":"Popovídat si s lidmi, kteří procházejí tím samým","w.b5":"Zeptat se mě na cokoli","w.privacy":"Soukromí je tu výchozí nastavení, ne volba k zapnutí. To, co si zaznamenáš o svém zdraví, zůstává zašifrované na tvém zařízení — a nikdo v Kręgu to nevidí, ani my.","w.passkey":"Vstoupit — Face ID nebo otisk prstu","w.anon":"Vstoupit","w.have":"Už mám účet","d.results":"Výsledky a vyšetření","d.trend":"Trajektorie","d.addResult":"Přidat výsledek","d.cd4":"CD4 (buňky/µl)","d.vl":"Virová nálož (kopie/ml)","d.value":"Hodnota","d.date":"Datum","d.meds":"Léky","d.medName":"Název léku","d.medDose":"Dávka","d.medTime":"Čas","d.addMed":"Přidat lék","d.visits":"Návštěvy","d.visitTitle":"Popis návštěvy","d.addVisit":"Přidat návštěvu","d.photos":"Fotky vyšetření","d.addPhoto":"Nahrát fotku vyšetření","d.notes":"Poznámky","d.addNote":"Přidat poznámku","d.photoHint":"Nahraj fotku výsledku — Ida se pokusí přečíst hodnoty a zapsat je níže do „Výsledků a vyšetření\". Zkontroluj a oprav. Fotka zůstává v tomto telefonu.","d.scanResult":"Přečíst výsledek z fotky","d.ocrReading":"Čtu výsledek…","d.ocrPrefilled":"Přečteno — zkontroluj hodnotu výše a ulož.","d.ocrNone":"Výsledek se nepodařilo rozpoznat — zadej ho ručně.","d.ocrOffline":"Čtení z fotky funguje online. Výsledek můžeš zadat ručně.","d.cotests":"Další vyšetření a koinfekce","d.cotestHint":"HIV není jen HIV. Sleduj i HCV, HBV, syfilis, CMV, HPV, tuberkulózu, očkování a obecná vyšetření.","d.cotestName":"Co se vyšetřovalo","d.cotestResult":"Výsledek (např. negativní, zjištěno, očkování)","d.addCotest":"Přidat vyšetření","d.cotestChips":"HCV,HBV,Syfilis,CMV,HPV,Tuberkulóza,Lipidy,Ledviny","d.demo":"Vyplnit demo daty","d.del":"smazat","d.none":"zatím tu nic není","d.undetectable":"pod prahem","d.at":"v","d.saved":"Uloženo.","d.ocrAdded":"Přidáno do deníku: {list}. Zkontroluj a oprav, pokud je třeba."};
DICT.sk = {"login.h1":"Už mám účet","login.p":"Obnov si účet na tomto zariadení — pomocou passkey (Face ID / odtlačok) alebo svojho Klucza Kręgu. Všetko sa dešifruje <b>tu</b>; server nevidí ani jedno, ani druhé.","login.passkey":"Prihlásiť sa — Face ID alebo odtlačok","login.orKc":"alebo cez Klucz Kręgu","login.ph":"krag1:…  (vlož alebo naskenuj)","login.do":"Prihlásiť sa a synchronizovať","kc.h1":"Tvoj Klucz Kręgu","kc.p":"Takto sa dostaneš k svojmu účtu z iného zariadenia alebo ho obnovíš. Ulož si ho — snímkou obrazovky alebo do správcu hesiel. <b>Nikto, ani Krąg, ho nedokáže obnoviť.</b>","kc.copy":"Kopírovať kľúč","kc.ack":"Uložil/a som si Klucz Kręgu na bezpečné miesto","kc.enter":"Vstúpiť do Kręgu","kc.copied":"Klucz Kręgu skopírovaný.","ida.kicker":"Krąg vedomostí","ida.title":"Opýtaj sa Idy","ida.ph":"Opýtaj sa na HIV, PrEP, liečbu, výsledky…","ida.hello":"Ahoj. Som Ida — sprevádzam ťa v Kręgu a odpovedám z materiálov, ktoré mám. Keď niečo nemám, poviem to priamo, namiesto toho, aby som hádala.","ida.s1":"Čo znamená nedetegovateľný?","ida.s2":"Ako funguje PrEP?","ida.s3":"Čo robiť po riziku?","ida.s4":"Čo znamená CD4?","ida.s5":"Musím to povedať zamestnávateľovi?","ida.unsure":"Nie som si istá, či dobre rozumiem — toto mám najbližšie. Ak si mal/a na mysli niečo iné, vyber tému nižšie.","ida.bound":"Neodpoviem na otázku o tvojom vlastnom výsledku — a je to zámerné. To je rozhovor s lekárom, nie s databázou.","ida.negctx":"odpoveď pre osobu bez infekcie","ida.inThread":"vo vlákne: ","ida.clock":"Toto je situácia s hodinami. Čítaj hneď:","ida.gate":"Medicínsky blok — pred zverejnením vyžaduje podpis lekára. V tejto verzii to zatiaľ nikto neschválil.","ida.srcPl":"zdroj: poľština","ida.baseUnverified":"Báza {ed} · zatiaľ to nikto z ľudí neoveril","ida.noCover":"<b>Toto v báze Kręgu nemám — a nechcem si vymýšľať.</b><br><br>Tvoju otázku si ukladám ako medzeru, aby ju niekto doplnil. Skutočné čísla a zariadenia nájdeš v <b>Pomoci</b> a medicínske rozhodnutia prober s lekárom.<br><br><span style=\"color:var(--tx-3)\">Zato ti viem povedať o:</span>","ida.gapTag":"mimo pokrytia","ida.gapSaved":"uložené ako medzera","ida.crisis":"Tu sa zastavím, lebo som v tom prečítala niečo ťažké. Nie som na to, aby som to uniesla — ale viem, kto je. Zostávam. Môžeš písať ďalej.","ida.crisisLine":"Psychická kríza — 24/7","ida.notYourLang":"Táto linka odpovedá po poľsky. Na čísle {eu} si vyžiadaš tlmočníka.","ida.stopMeds":"Je dôležité, že o tom hovoríš — a je to rozhovor, ktorý treba viesť s ošetrujúcim lekárom, nie sám/sama. Dôvody bývajú rôzne: vedľajšie účinky, únava z každodennosti, náklady, hanba. Každý z nich sa dá s niekým prebrať a každý má zvyčajne nejaké východisko.","trust.t3":"na overenie","trust.t4":"komunita","app.loggedAs":"Prihlásený/á ako","app.threads":"Rozhovory","app.start":"Začať rozhovor","app.startHint":"Zadaj prezývku niekoho, koho poznáš z Kręgu.","app.peerPh":"Pokojná Rieka #C3D4","app.open":"Otvoriť rozhovor","app.empty":"Zatiaľ nemáš žiadne rozhovory. Porozprávaj sa s niekým, kto to chápe — začni nižšie: nájdi niekoho alebo sa pridaj do miestnosti.","app.newConvo":"Nový rozhovor","app.discover":"Porozprávaj sa s ľuďmi","app.discoverP":"Krąg spája ľudí, ktorí si tým prechádzajú. Nemusíš nikoho poznať — začni podľa okolia alebo témy.","app.findPeople":"Nájdi ľudí v okolí alebo podľa témy","app.joinRoom":"Pridaj sa do tematickej miestnosti","app.knowAddr":"Máš už niečiu adresu alebo odkaz?","diary.kicker":"Tvoje zdravie","diary.title":"Denník","diary.p":"Tvoje výsledky, lieky, návštevy a vyšetrenia na jednom mieste — a Ida z nich číta trend a poradí.","diary.priv":"🔒 Zostáva v tomto telefóne.","diary.privLong":"Všetko v denníku zostáva v tomto telefóne. Než vymažeš dáta prehliadača, urob si zálohu v Profile.","diary.new":"Nový záznam","diary.notePh":"napr. CD4 268, vírusová nálož pod prahom","diary.save":"Uložiť do denníka","diary.empty":"Denník je prázdny. Nič z neho neopúšťa toto zariadenie.","diary.device":"Technické podrobnosti","diary.rAcc":"Účet (lokálny kľúč)","diary.rAccV":"na zariadení","diary.rDiary":"Zdravotný denník (IndexedDB)","diary.rSw":"Offline režim (service worker)","diary.rE2e":"Rozhovory 1:1 (E2E)","diary.rE2eV":"aktívne","diary.sample":"Pridať ukážkový záznam","diary.wipe":"Vymazať všetko z tohto zariadenia","pf.kicker":"Tvoj profil","pf.title":"Profil","pf.p":"Toto je tvoj profil. Meno a jazyk zmeníš, kedy chceš — uložia sa bezpečne a objavia sa na tvojich ďalších zariadeniach.","pf.pseudo":"Meno, ktoré vidia ostatní","pf.handle":"Tvoja adresa v Kręgu (na túto ti píšu)","pf.handleHint":"Vzniká z tvojho kľúča a nikdy sa nemení — je to ako číslo, len bez toho, aby prezradilo, kto si.","pf.lang":"Jazyk","pf.role":"Kto si v Kręgu","pf.gram":"Ako sa ti mám prihovárať?","pf.save":"Uložiť a synchronizovať","pf.kcSummary":"Tvoj Klucz Kręgu","pf.kcP":"Spôsob, ako sa dostať k svojmu účtu z iného zariadenia alebo ho obnoviť. Ulož si ho bezpečne. Nikto, ani Krąg, ho nedokáže obnoviť.","role.plhiv":"Žijem s HIV","role.partner":"Som partner/partnerka","role.bliska":"Som blízka osoba","gram.n":"Neutrálne (neosobne)","gram.f":"V ženskom rode","gram.m":"V mužskom rode","sync.on":"✓ zosynchronizované","sync.syncing":"synchronizujem…","sync.off":"offline","th.lock":"🔒 Šifrované od konca ku koncu. Server tieto správy nečíta.","th.msgPh":"Napíš…","tab.ida":"Ida","tab.app":"Rozhovory","tab.diary":"Denník","tab.profile":"Profil","toast.profM":"Profil uložený.","toast.profF":"Profil uložený.","toast.profN":"Profil uložený.","toast.diaryM":"Záznam uložený.","toast.diaryF":"Záznam uložený.","toast.diaryN":"Záznam uložený.","coach.title":"Tréner imunity","coach.cd4now":"Posledné CD4: {v}.","coach.trendUp":"Od predchádzajúceho merania: nárast.","coach.trendDown":"Od predchádzajúceho merania: pokles — výkyvy sa stávajú; ak sa to opakuje, spomeň to lekárovi.","coach.trendFlat":"Od predchádzajúceho merania: bez väčších zmien.","coach.phases":"Obnova CD4 má fázy: najrýchlejšie v prvom polroku, potom pomalšie — celé roky. Pomalší rast a výkyvy sú normálne a nie sú tvojou vinou.","coach.m200":"Pre kontext: 200 je prah, pod ktorým rastie riziko oportúnnych infekcií. Všeobecná informácia, nie hodnotenie tvojho výsledku.","coach.m500":"Pre kontext: okolo 500 a vyššie sa niekedy opisuje ako blízke bežným hodnotám. Všeobecná informácia, nie hodnotenie tvojho výsledku.","coach.uu":"Vírusová nálož pod prahom — U=U: nedetegovateľný = neprenášajúci HIV pohlavnou cestou.","coach.adh":"Jediné, čo naozaj obnovuje imunitu, je pravidelné užívanie liekov a dôsledná liečba — a to je práve najviac v tvojich rukách.","coach.wellbeing":"Pohyb, spánok či doplnky zlepšujú pocit, ale samy o sebe CD4 nezvýšia — a to je v poriadku. Nemusíš si lepší výsledok „zaslúžiť“.","coach.mind":"Prvé mesiace po diagnóze bývajú psychicky najťažšie. Horšie obdobie nie je nič zvláštne — a dá sa s tým niečo robiť.","coach.mindCta":"Porozprávaj sa s Idou","coach.note":"Toto je podpora, nie lekárska rada. Tréner ukazuje tvoje dáta a všeobecné vedomosti — nehodnotí výsledky ani ich nepredpovedá. Rozhodnutia — s ošetrujúcim lekárom.","ix.title":"Interakcie liekov","ix.check":"Skontrolovať","ix.checkPh":"Skontroluj liek, doplnok, jedlo…","ix.note":"Informatívne — nenahrádza konzultáciu. Vždy si to over u lekára alebo lekárnika. Úplná kontrola: databáza Liverpool HIV Drug Interactions.","ix.none":"Nepoznám interakciu tohto s tvojimi liekmi — to neznamená, že neexistuje. Skontroluj v databáze Liverpool.","ix.addMeds":"Pridaj svoje lieky vyššie, aby si mohol/mohla kontrolovať interakcie.","ix.known":"Pri tvojom režime je dobré vedieť:","cat.open":"Nájsť","cat.title":"Nájdi niekoho na rozhovor","cat.lead":"Zverejni sa (nepovinné) a nájdi ľudí z okolia alebo podľa témy.","cat.mine":"Tvoj inzerát","cat.region":"Okolie (napr. Varšava)","cat.tags":"Témy (napr. čerstvo po diagnóze, PrEP)","cat.bio":"Pár slov o sebe","cat.publish":"Zverejniť sa","cat.remove":"Odstrániť inzerát","cat.browse":"Prehliadať","cat.fRegion":"Okolie","cat.fTag":"Téma","cat.search":"Hľadať","cat.none":"Zatiaľ sa nikto nezverejnil (alebo žiadne výsledky).","cat.write":"Napísať","cat.you":"(to si ty)","cat.offline":"Katalóg vyžaduje pripojenie — dostupný po zapojení backendu.","cat.note":"Inzerát je viditeľný pre ostatných členov Kręgu. Bez GPS — len to, čo sám/sama napíšeš. Neuvádzaj údaje, ktoré nechceš prezradiť.","cat.mentorOffer":"Môžem podporovať ako buddy/mentor","cat.mentorFilter":"Len buddy/mentori","cat.mentorBadge":"buddy","th.buddyOn":"Označené ako buddy/mentor.","th.buddyOff":"Označenie buddy zrušené.","th.buddyTag":"buddy","login.scan":"Naskenuj QR kód","scan.hint":"Namier fotoaparát na QR kód Klucza Kręgu","scan.cancel":"Zrušiť","scan.deny":"Bez prístupu k fotoaparátu — vlož kľúč ručne.","lib.open":"Knižnica","lib.title":"Knižnica","lib.lead":"Vedomosti o HIV jednoduchým jazykom — prechádzaj témy vlastným tempom.","lib.facts":"fakty","room.open2":"Miestnosti","room.title":"Tematické miestnosti","room.lead":"Skupiny okolo témy. Správy sú šifrované od konca ku koncu — zvlášť pre každú osobu.","room.create":"Založiť miestnosť","room.namePh":"napr. Čerstvo po diagnóze","room.createBtn":"Založiť","room.searchPh":"Hľadať miestnosť","room.none":"Žiadne miestnosti (alebo žiadne výsledky). Založ prvú.","room.join":"Pridať sa","room.open":"Otvoriť","room.count":"{n} ľudí","room.one":"Miestnosť","room.tag":"skupina","room.needName":"Zadaj názov miestnosti.","room.note":"Názov miestnosti je verejný (aby sa dala nájsť). Obsah rozhovorov nie.","inv.summary":"Pozvi na rozhovor","inv.p":"Zdieľaj odkaz alebo QR kód. Osoba otvorí aplikáciu a hneď s tebou začne rozhovor. Odkaz neobsahuje osobné údaje ani kľúče.","inv.share":"Zdieľať odkaz","inv.copied":"Odkaz na pozvánku skopírovaný.","inv.shareText":"Napíš mi v Kręgu:","inv.opened":"Rozhovor z pozvánky otvorený.","inv.notFound":"Táto osoba sa nenašla (alebo zatiaľ nemá účet).","conn.on":"Pripojené ku Kręgu — rozhovory a synchronizácia fungujú.","conn.off":"Offline režim: Krąg funguje aj bez siete. Ida, knižnica a denník sú dostupné a tvoje dáta zostávajú bezpečne v tomto zariadení. Rozhovory sa doplnia, keď sa vráti pripojenie.","help.open":"Pomoc","help.title":"Pomoc","help.lead":"Keď potrebuješ rozhovor alebo pomoc hneď — tu máš overené, väčšinou bezplatné čísla a miesta. Zavolať môžeš anonymne.","help.emergency":"Núdzový prípad","help.crisis":"Psychická kríza (24/7)","help.youth":"Deti a mládež (24/7)","help.hiv":"Linka dôvery HIV/AIDS","help.hivHours":"po–pi 9:00–21:00","help.free":"bezplatná","help.test":"Poradne a centrá liečiace HIV","help.testCta":"Nájdi zariadenie (aids.gov.pl)","help.pep":"Po rizikovom kontakte (PEP)","help.pepD":"Čím skôr, tým lepšie — do 48–72 h. Choď na pohotovosť alebo do infekčnej nemocnice (bez odporúčania).","help.call":"Zavolať","ida.help1":"Pomoc a linky dôvery","ida.help2":"Kde si urobiť test na HIV?","bk.summary":"Záloha (pre prípad straty dát)","bk.p":"Je to niečo iné ako Klucz Kręgu: kľúč prenáša tvoj účet, a táto záloha — tvoj denník (ktorý zostáva len na zariadení). Ak vymažeš dáta prehliadača, denník zmizne — ulož si zašifrovanú zálohu, otvoríš ju svojím Kluczem Kręgu.","bk.export":"Uložiť zálohu do súboru","bk.import":"Načítať zálohu zo súboru","bk.done":"Načítané záznamy: {n}.","bk.empty":"Záloha neobsahuje nič nové.","bk.badkey":"Tento súbor sa nezhoduje s tvojím Kluczem Kręgu.","bk.badfile":"Toto nevyzerá ako záloha Kręgu.","bk.nokey":"Na tomto zariadení je potrebný Klucz Kręgu.","bk.err":"Zálohu sa nepodarilo uložiť.","bk.warn":"🔒 Súbor je zašifrovaný — bez tvojho kľúča je nepoužiteľný. Uchovávaj ho na bezpečnom mieste.","emo.lonely":"Počujem ťa. Osamelosť s HIV dokáže zavaliť — ale tu na to naozaj nemusíš byť sám/sama. V Kręgu sú ľudia, ktorí si prechádzajú tým istým; môžem ti pomôcť niekoho nájsť. Zostávam.","emo.low":"Je mi ľúto, že to máš teraz také ťažké. Nemusíš to niesť sám/sama — môžeš napísať niekomu, kto to chápe, alebo siahnuť po podpore v Pomoci. Som tu.","emo.fear":"To, čo cítiš, dáva zmysel — strach a hanba často chodia s diagnózou, ale nemusia zostať navždy. Nie si v tom sám/sama; môžem pomôcť nájsť podporu.","emo.meet":"Porozprávaj sa s ľuďmi","emo.help":"Pozri Pomoc","pf.ai":"Ida Rozumie (AI)","pf.aiHint":"Bez toho Ida odpovedá jednoduchým párovaním slov — niekedy otázke nerozumie. Zapnuté: rozumie lepšie a pamätá si vlákno rozhovoru (kontinuita). Do modelu AI (cez náš server) ide len text otázky a niekoľko posledných ťahov — bez prezývky, kľúčov a denníka. Odpovedá výlučne z faktov Kręgu. Predvolene vypnuté; funguje po nasadení servera.","ai.thinking":"Rozmýšľam…","ai.badge":"AI to zostavilo z faktov Kręgu","ida.hellos":"Rada ťa vidím. Na čo sa dnes chceš opýtať?|Ahoj! Dobre, že si tu. Od čoho začneme?|Som tu. O čom sa chceš porozprávať?|Ahoj. Polož otázku — odpoviem z toho, čo mám, bez hádania.","demo.banner":"DEMO — ukážkové dáta, všetko lokálne v tomto zariadení","lang.partial":"(rozhranie v angličtine)","lang.note":"Zoznam je poľština a jazyky susedov. Rozhranie označené „(v angličtine)“ sa zobrazí po anglicky a fakty zostanú po poľsky, kým komunita nedoplní preklad. Tvoj jazyk tu nie je? Nahlás ho nižšie.","lang.req":"Nahlásiť chýbajúci jazyk","lang.reqDone":"Vďaka — zaznamenáme dopyt po: {lang}.","ida.docChip":"Kde k lekárovi?","ida.clinicAsk":"V akom si meste? Poviem ti adresu poradne liečiacej HIV najbližšie k tebe.","ida.clinicIntro":"Poradne liečiace HIV (ARV) v tejto oblasti:","ida.clinicNear":"V meste {city} nie je poradňa ARV. Najbližšie:","ida.clinicNearby":"Najbližšie k tebe:","ida.clinicGeo":"Najbližšie (použi polohu)","ida.clinicLocating":"Zisťujem polohu…","ida.clinicGeoNo":"Polohu sa nepodarilo zistiť. Zadaj mesto alebo vyber zo zoznamu:","ida.clinicKids":"deti","ida.clinicConfirm":"Zavolaj, než sa vydáš na cestu — hodiny a pravidlá objednávania bývajú rôzne. Liečba ARV je v Poľsku bezplatná, aj bez poistenia.","ida.clinicSrc":"Zdroj: Krajowe Centrum ds. AIDS (gov.pl)","ida.clinicMore":"Úplný zoznam a čísla (Pomoc)","ida.clinicNone":"Toto mesto nemám na zozname. Použi polohu, vyber najbližšie alebo pozri úplný zoznam v Pomoci:","w.h1":"Ahoj. Som Ida.","w.intro":"Sprevádzam ľudí žijúcich s HIV a ich blízkych. Pomôžem ti nájsť <b>overené informácie</b>, porozumieť výsledkom a byť v kontakte s ľuďmi, ktorí to poznajú.","w.canDo":"V Kręgu môžeš","w.b1":"Učiť sa o HIV jednoduchým jazykom","w.b2":"Viesť si súkromnú históriu vyšetrení","w.b3":"Mať prehľad o liečbe","w.b4":"Porozprávať sa s ľuďmi, ktorí si prechádzajú tým istým","w.b5":"Opýtať sa ma na čokoľvek","w.privacy":"Súkromie je tu predvolené, nie voľba na zapnutie. To, čo si zapíšeš o svojom zdraví, sa zašifruje na tvojom zariadení — a nikto v Kręgu to nevidí, ani my.","w.passkey":"Vstúpiť — Face ID alebo odtlačok","w.anon":"Vstúpiť","w.have":"Už mám účet","d.results":"Výsledky a vyšetrenia","d.trend":"Trajektória","d.addResult":"Pridať výsledok","d.cd4":"CD4 (bunky/µl)","d.vl":"Vírusová nálož (kópie/ml)","d.value":"Hodnota","d.date":"Dátum","d.meds":"Lieky","d.medName":"Názov lieku","d.medDose":"Dávka","d.medTime":"Čas","d.addMed":"Pridať liek","d.visits":"Návštevy","d.visitTitle":"Popis návštevy","d.addVisit":"Pridať návštevu","d.photos":"Fotky vyšetrení","d.addPhoto":"Nahrať fotku vyšetrenia","d.notes":"Poznámky","d.addNote":"Pridať poznámku","d.photoHint":"Nahraj fotku výsledku — Ida sa pokúsi prečítať hodnoty a zapísať ich nižšie do „Výsledky a vyšetrenia“. Skontroluj a oprav. Fotka zostáva v tomto telefóne.","d.scanResult":"Prečítať výsledok z fotky","d.ocrReading":"Čítam výsledok…","d.ocrPrefilled":"Prečítané — skontroluj hodnotu vyššie a ulož.","d.ocrNone":"Výsledok sa nepodarilo rozpoznať — zadaj ho ručne.","d.ocrOffline":"Čítanie z fotky funguje online. Výsledok môžeš zadať ručne.","d.cotests":"Ďalšie vyšetrenia a koinfekcie","d.cotestHint":"HIV nie je len HIV. Sleduj aj HCV, HBV, syfilis, CMV, HPV, tuberkulózu, očkovania a všeobecné vyšetrenia.","d.cotestName":"Čo sa vyšetrovalo","d.cotestResult":"Výsledok (napr. negatívny, zistené, očkovanie)","d.addCotest":"Pridať vyšetrenie","d.cotestChips":"HCV,HBV,Syfilis,CMV,HPV,Tuberkulóza,Lipidy,Obličky","d.demo":"Vyplniť demo dátami","d.del":"vymazať","d.none":"zatiaľ tu nič nie je","d.undetectable":"pod prahom","d.at":"o","d.saved":"Uložené.","d.ocrAdded":"Pridané do denníka: {list}. Skontroluj a oprav, ak treba."};
DICT.be = {"login.h1":"У мяне ўжо ёсць акаўнт","login.p":"Аднаві свой акаўнт на гэтай прыладзе — праз passkey (Face ID / адбітак пальца) або праз Klucz Kręgu. Усё расшыфроўваецца <b>тут</b>; сервер не бачыць ні аднаго, ні другога.","login.passkey":"Увайсці — Face ID або адбітак пальца","login.orKc":"або праз Klucz Kręgu","login.ph":"krag1:…  (устаў або адсканіруй)","login.do":"Увайсці і сінхранізаваць","kc.h1":"Твой Klucz Kręgu","kc.p":"Так ты ўвойдзеш у свой акаўнт з іншай прылады або адновіш яго. Захавай яго — скрыншот або менеджар пароляў. <b>Ніхто, нават Krąg, не зможа яго аднавіць.</b>","kc.copy":"Скапіраваць ключ","kc.ack":"Я захаваў(-ла) свой Klucz Kręgu ў бяспечным месцы","kc.enter":"Увайсці ў Krąg","kc.copied":"Klucz Kręgu скапіраваны.","ida.kicker":"Веды Krągа","ida.title":"Спытай Ida","ida.ph":"Спытай пра HIV, PrEP, лячэнне, вынікі…","ida.hello":"Прывітанне. Я Ida — я побач з табой у Krągu і адказваю з матэрыялаў, якія ў мяне ёсць. Калі чагосьці не маю, кажу пра гэта шчыра, а не выдумляю.","ida.s1":"Што значыць нявызначальны?","ida.s2":"Як дзейнічае PrEP?","ida.s3":"Што рабіць пасля рызыкі?","ida.s4":"Што значыць CD4?","ida.s5":"Ці абавязаны я казаць працадаўцу?","ida.unsure":"Не ўпэўнена, што правільна зразумела — вось найбліжэйшае, што ў мяне ёсць. Калі ты меў(-ла) на ўвазе іншае, выберы тэму ніжэй.","ida.bound":"Я не адкажу пра твой уласны вынік — і гэта наўмысна. Гэта размова з лекарам, а не з базай.","ida.negctx":"адказ для чалавека без HIV","ida.inThread":"у ветцы: ","ida.clock":"Гэта сітуацыя з гадзіннікам. Чытай адразу:","ida.gate":"Медыцынскі блок — перад публікацыяй патрабуе подпісу лекара. У гэтай версіі гэтага яшчэ ніхто не зацвердзіў.","ida.srcPl":"крыніца: польская","ida.baseUnverified":"База {ed} · яшчэ ніхто з людзей гэтага не праверыў","ida.noCover":"<b>Гэтага няма ў базе Krągа — і я не хачу выдумляць.</b><br><br>Я захоўваю тваё пытанне як прабел, каб хтосьці яго запоўніў. Па сапраўдныя нумары і ўстановы зазірні ў <b>Дапамогу</b>, а медыцынскія рашэнні абмяркуй з лекарам.<br><br><span style=\"color:var(--tx-3)\">Затое я магу распавесці пра:</span>","ida.gapTag":"па-за пакрыццём","ida.gapSaved":"захавана як прабел","ida.crisis":"Я спыняюся тут, бо прачытала ў гэтым нешта цяжкае. Я не тая, хто здолее гэта панесці — але я ведаю, хто здолее. Я застаюся. Ты можаш пісаць далей.","ida.crisisLine":"Псіхічны крызіс — 24/7","ida.notYourLang":"Гэтая лінія адказвае па-польску. Па нумары {eu} ты зможаш папрасіць перакладчыка.","ida.stopMeds":"Важна, што ты пра гэта кажаш — і гэта размова, якую варта правесці з лечачым лекарам, а не самастойна. Прычыны бываюць рознымі: пабочныя эфекты, стома ад штодзённасці, кошты, сорам. Пра кожную можна з кімсьці пагаварыць, і ў кожнай звычайна ёсць нейкі выхад.","trust.t3":"трэба праверыць","trust.t4":"супольнасць","app.loggedAs":"Уваход як","app.threads":"Размовы","app.start":"Пачаць размову","app.startHint":"Увядзі псеўданім чалавека, якога ты ведаеш з Krągа.","app.peerPh":"Спакойная Рака #C3D4","app.open":"Адкрыць размову","app.empty":"У цябе яшчэ няма размоў. Пагавары з тым, хто разумее — пачні ніжэй: знайдзі кагосьці або далучыся да пакоя.","app.newConvo":"Новая размова","app.discover":"Пагавары з людзьмі","app.discoverP":"Krąg злучае людзей, якія праходзяць праз гэта. Табе не трэба нікога ведаць — пачні з ваколіцы або тэмы.","app.findPeople":"Знайдзі людзей у ваколіцы або па тэме","app.joinRoom":"Далучыся да тэматычнага пакоя","app.knowAddr":"Ужо маеш чыйсьці адрас або спасылку?","diary.kicker":"Тваё здароўе","diary.title":"Дзённік","diary.p":"Твае вынікі, лекі, візіты і абследаванні ў адным месцы — а Ida чытае з іх тэндэнцыю і падказвае.","diary.priv":"🔒 Застаецца на гэтым тэлефоне.","diary.privLong":"Усё ў дзённіку застаецца на гэтым тэлефоне. Зрабі рэзервовую копію ў Профілі, перш чым ачысціць даныя браўзера.","diary.new":"Новы запіс","diary.notePh":"напр. CD4 268, вірусная нагрузка ніжэй парога","diary.save":"Захаваць у дзённіку","diary.empty":"Дзённік пусты. Нічога з яго не пакідае гэтую прыладу.","diary.device":"Тэхнічныя падрабязнасці","diary.rAcc":"Акаўнт (лакальны ключ)","diary.rAccV":"на прыладзе","diary.rDiary":"Дзённік здароўя (IndexedDB)","diary.rSw":"Афлайн-рэжым (service worker)","diary.rE2e":"Размовы 1:1 (E2E)","diary.rE2eV":"актыўна","diary.sample":"Дадаць прыклад запісу","diary.wipe":"Выдаліць усё з гэтай прылады","pf.kicker":"Твой профіль","pf.title":"Профіль","pf.p":"Гэта твой профіль. Імя і мову можаш змяніць у любы момант — яны захаваюцца бяспечна і з'явяцца на тваіх іншых прыладах.","pf.pseudo":"Імя, якое бачаць іншыя","pf.handle":"Твой адрас у Krągu (на яго табе пішуць)","pf.handleHint":"Ён утвараецца з твайго ключа і ніколі не мяняецца — быццам нумар, толькі без указання, хто ты.","pf.lang":"Мова","pf.role":"Хто ты ў Krągu","pf.gram":"Як мне да цябе звяртацца?","pf.save":"Захаваць і сінхранізаваць","pf.kcSummary":"Твой Klucz Kręgu","pf.kcP":"Спосаб увайсці ў свой акаўнт з іншай прылады або аднавіць яго. Захавай яго бяспечна. Ніхто, нават Krąg, не зможа яго аднавіць.","role.plhiv":"Я жыву з HIV","role.partner":"Я партнёр(-ка)","role.bliska":"Я блізкі чалавек","gram.n":"Нейтральна (безасабова)","gram.f":"У жаночай форме","gram.m":"У мужчынскай форме","sync.on":"✓ сінхранізавана","sync.syncing":"сінхранізую…","sync.off":"афлайн","th.lock":"🔒 Скразное шыфраванне. Сервер не чытае гэтыя паведамленні.","th.msgPh":"Напішы…","tab.ida":"Ida","tab.app":"Размовы","tab.diary":"Дзённік","tab.profile":"Профіль","toast.profM":"Ты захаваў профіль.","toast.profF":"Ты захавала профіль.","toast.profN":"Профіль захаваны.","toast.diaryM":"Ты захаваў запіс.","toast.diaryF":"Ты захавала запіс.","toast.diaryN":"Запіс захаваны.","coach.title":"Трэнер імунітэту","coach.cd4now":"Апошні CD4: {v}.","coach.trendUp":"З папярэдняга вымярэння: рост.","coach.trendDown":"З папярэдняга вымярэння: спад — ваганні здараюцца; калі паўтараецца, згадай пра гэта лекару.","coach.trendFlat":"З папярэдняга вымярэння: без значных зменаў.","coach.phases":"Аднаўленне CD4 мае фазы: хутчэй за ўсё ў першыя паўгода, потым павольней — на працягу гадоў. Больш павольны рост і ваганні — гэта нармальна і не твая віна.","coach.m200":"Для кантэксту: 200 — гэта парог, ніжэй якога расце рызыка апартуністычных інфекцый. Агульная інфармацыя, а не ацэнка твайго выніку.","coach.m500":"Для кантэксту: ваколіцы 500 і вышэй часам апісваюць як блізкія да тыповых. Агульная інфармацыя, а не ацэнка твайго выніку.","coach.uu":"Вірусная нагрузка ніжэй парога — U=U: нявызначальны = не перадае HIV палавым шляхам.","coach.adh":"Адзінае, што сапраўды аднаўляе імунітэт, — гэта рэгулярны прыём лекаў і паслядоўнае лячэнне — а гэта якраз найбольш у тваіх руках.","coach.wellbeing":"Рух, сон ці дабаўкі паляпшаюць самаадчуванне, але самі па сабе не павышаюць CD4 — і гэта нармальна. Табе не трэба „заслужыць\" лепшы вынік.","coach.mind":"Першыя месяцы пасля дыягназу бываюць самымі цяжкімі псіхічна. Цяжэйшы час — гэта нічога дзіўнага — і з гэтым можна нешта зрабіць.","coach.mindCta":"Пагавары з Ida","coach.note":"Гэта падтрымка, а не медыцынская парада. Трэнер паказвае твае даныя і агульныя веды — ён не ацэньвае вынікі і не прадказвае іх. Рашэнні — з лечачым лекарам.","ix.title":"Узаемадзеянні лекаў","ix.check":"Праверыць","ix.checkPh":"Правер лек, дабаўку, ежу…","ix.note":"Для інфармацыі — не замяняе кансультацыю. Заўсёды пацвярджай у лекара або фармацэўта. Поўная праверка: база Liverpool HIV Drug Interactions.","ix.none":"Я не ведаю пра ўзаемадзеянне гэтага з тваімі лекамі — гэта не значыць, што яго няма. Правер у базе Liverpool.","ix.addMeds":"Дадай свае лекі вышэй, каб правяраць узаемадзеянні.","ix.known":"Варта ведаць пры тваёй схеме лячэння:","cat.open":"Знайсці","cat.title":"Знайдзі каго-небудзь для размовы","cat.lead":"Размясці сваю аб'яву (па жаданні) і знайдзі людзей па ваколіцы або тэме.","cat.mine":"Твая аб'ява","cat.region":"Ваколіца (напр. Warszawa)","cat.tags":"Тэмы (напр. нядаўна пасля дыягназу, PrEP)","cat.bio":"Некалькі слоў пра сябе","cat.publish":"Апублікаваць","cat.remove":"Выдаліць аб'яву","cat.browse":"Праглядаць","cat.fRegion":"Ваколіца","cat.fTag":"Тэма","cat.search":"Шукаць","cat.none":"Ніхто яшчэ не апублікаваў аб'яву (або няма вынікаў).","cat.write":"Напісаць","cat.you":"(гэта ты)","cat.offline":"Каталог патрабуе злучэння — будзе даступны пасля падключэння бэкенда.","cat.note":"Аб'ява бачная іншым удзельнікам Krągа. Без GPS — толькі тое, што ты сам(-а) упішаш. Не паказвай даных, якія не хочаш раскрываць.","cat.mentorOffer":"Магу падтрымаць як buddy/ментар","cat.mentorFilter":"Толькі buddy/ментары","cat.mentorBadge":"buddy","th.buddyOn":"Пазначана як buddy/ментар.","th.buddyOff":"Пазнака buddy знята.","th.buddyTag":"buddy","login.scan":"Адсканіруй QR-код","scan.hint":"Накіруй камеру на QR-код Klucz Kręgu","scan.cancel":"Скасаваць","scan.deny":"Няма доступу да камеры — устаў ключ уручную.","lib.open":"Бібліятэка","lib.title":"Бібліятэка","lib.lead":"Веды пра HIV простай мовай — праглядай тэмы ў сваім тэмпе.","lib.facts":"факты","room.open2":"Пакоі","room.title":"Тэматычныя пакоі","room.lead":"Групы вакол тэмы. Паведамленні са скразным шыфраваннем — асобна да кожнага чалавека.","room.create":"Стварыць пакой","room.namePh":"напр. Нядаўна пасля дыягназу","room.createBtn":"Стварыць","room.searchPh":"Шукаць пакой","room.none":"Пакояў пакуль няма (або няма вынікаў). Ствары першы.","room.join":"Далучыцца","room.open":"Адкрыць","room.count":"{n} чалавек","room.one":"Пакой","room.tag":"група","room.needName":"Увядзі назву пакоя.","room.note":"Назва пакоя публічная (каб яго можна было знайсці). Змест размоў — не.","inv.summary":"Запрасі да размовы","inv.p":"Падзяліся спасылкай або QR-кодам. Чалавек адкрые праграму і адразу пачне размову з табой. Спасылка не змяшчае асабістых даных ці ключоў.","inv.share":"Падзяліцца спасылкай","inv.copied":"Спасылка-запрашэнне скапіравана.","inv.shareText":"Напішы мне ў Krągu:","inv.opened":"Размова з запрашэння адкрыта.","inv.notFound":"Не ўдалося знайсці гэтага чалавека (або ў яго яшчэ няма акаўнта).","conn.on":"Злучана з Krągам — размовы і сінхранізацыя працуюць.","conn.off":"Афлайн-рэжым: Krąg працуе і без сеткі. Ida, бібліятэка і дзённік даступныя, а твае даныя застаюцца бяспечна на гэтай прыладзе. Размовы дагоняць, калі злучэнне вернецца.","help.open":"Дапамога","help.title":"Дапамога","help.lead":"Калі патрэбна размова або дапамога проста цяпер — тут правераныя, у большасці бясплатныя нумары і месцы. Патэлефанаваць можна ананімна.","help.emergency":"Экстранны выпадак","help.crisis":"Псіхічны крызіс (24/7)","help.youth":"Дзеці і моладзь (24/7)","help.hiv":"Тэлефон даверу HIV/AIDS","help.hivHours":"пн–пт 9:00–21:00","help.free":"бясплатны","help.test":"Клінікі, якія лечаць HIV","help.testCta":"Знайсці ўстанову (aids.gov.pl)","help.pep":"Пасля рызыкоўнага кантакту (PEP)","help.pepD":"Чым хутчэй, тым лепш — на працягу 48–72 г. Звярніся ў прыёмны пакой або ў інфекцыйны шпіталь (без накіравання).","help.call":"Патэлефанаваць","ida.help1":"Дапамога і тэлефоны даверу","ida.help2":"Дзе зрабіць тэст на HIV?","bk.summary":"Рэзервовая копія (на выпадак страты даных)","bk.p":"Гэта не тое ж, што Klucz Kręgu: ключ пераносіць твой акаўнт, а гэтая копія — твой дзённік (які застаецца толькі на прыладзе). Калі ты ачысціш даныя браўзера, дзённік знікне — захавай зашыфраваную копію, ты адкрыеш яе сваім Klucz Kręgu.","bk.export":"Захаваць копію ў файл","bk.import":"Загрузіць копію з файла","bk.done":"Загружана запісаў: {n}.","bk.empty":"Копія не змяшчае нічога новага.","bk.badkey":"Гэты файл не адпавядае твайму Klucz Kręgu.","bk.badfile":"Гэта не падобна на рэзервовую копію Krągа.","bk.nokey":"На гэтай прыладзе патрэбны Klucz Kręgu.","bk.err":"Не ўдалося захаваць копію.","bk.warn":"🔒 Файл зашыфраваны — бескарысны без твайго ключа. Трымай яго ў бяспечным месцы.","emo.lonely":"Я цябе чую. Адзінота з HIV можа прыгнятаць — але тут ты сапраўды не абавязаны быць у гэтым адзін. У Krągu ёсць людзі, якія праходзяць праз тое самае; я магу дапамагчы табе кагосьці знайсці. Я застаюся.","emo.low":"Мне шкада, што табе цяпер так цяжка. Ты не абавязаны несці гэта адзін — можаш напісаць таму, хто разумее, або звярнуцца па падтрымку ў Дапамогу. Я тут.","emo.fear":"Тое, што ты адчуваеш, мае сэнс — страх і сорам часта прыходзяць разам з дыягназам, але яны не абавязаны застацца назаўсёды. Ты не адзін з гэтым; я магу дапамагчы знайсці падтрымку.","emo.meet":"Пагавары з людзьмі","emo.help":"Глядзі Дапамогу","pf.ai":"Ida Разумее (AI)","pf.aiHint":"Без гэтага Ida адказвае простым супастаўленнем слоў — і часам не разумее пытання. Уключана: разумее лепш і трымае нітку размовы (бесперапыннасць). У AI-мадэль (праз наш сервер) ідзе толькі тэкст пытання і некалькі апошніх рэплік — без псеўданіма, ключоў і дзённіка. Адказвае выключна з фактаў Krągа. Па змаўчанні выключана; працуе пасля разгортвання сервера.","ai.thinking":"Думаю…","ai.badge":"AI склаў гэта з фактаў Krągа","ida.hellos":"Добра, што бачу цябе. Пра што хочаш спытаць сёння?|Прывітанне! Добра, што ты тут. З чаго пачнём?|Я тут. Пра што хочаш пагаварыць?|Гэй. Задай пытанне — адкажу з таго, што маю, без здагадак.","demo.banner":"DEMO — прыклад даных, усё лакальна на гэтай прыладзе","lang.partial":"(інтэрфейс па-англійску)","lang.note":"Спіс — гэта польская і мовы суседзяў. Пазначаныя „(па-англійску)\" пакажуць інтэрфейс па-англійску, а факты застаюцца па-польску, пакуль супольнасць не дадасць пераклад. Тваёй мовы няма? Запытай яе ніжэй.","lang.req":"Запытаць мову, якой не хапае","lang.reqDone":"Дзякуй — мы адзначым патрэбу ў: {lang}.","ida.docChip":"Дзе да лекара?","ida.clinicAsk":"У якім ты горадзе? Падам адрас найбліжэйшай клінікі, якая лечыць HIV.","ida.clinicIntro":"Клінікі, якія лечаць HIV (ARV), у гэтай ваколіцы:","ida.clinicNear":"У {city} няма клінікі ARV. Найбліжэйшыя:","ida.clinicNearby":"Найбліжэйшыя да цябе:","ida.clinicGeo":"Найбліжэйшыя (выкарыстаць маё месцазнаходжанне)","ida.clinicLocating":"Правяраю месцазнаходжанне…","ida.clinicGeoNo":"Не ўдалося вызначыць месцазнаходжанне. Увядзі горад або выберы са спіса:","ida.clinicKids":"дзеці","ida.clinicConfirm":"Патэлефануй, перш чым ехаць — гадзіны працы і правілы запісу бываюць рознымі. Лячэнне ARV у Польшчы бясплатнае, таксама без страхоўкі.","ida.clinicSrc":"Крыніца: Krajowe Centrum ds. AIDS (gov.pl)","ida.clinicMore":"Поўны спіс і нумары (Дапамога)","ida.clinicNone":"У мяне няма гэтага горада ў спісе. Выкарыстай месцазнаходжанне, выберы найбліжэйшую або паглядзі поўны спіс у Дапамозе:","w.h1":"Прывітанне. Я Ida.","w.intro":"Я побач з людзьмі, якія жывуць з HIV, і іх блізкімі. Дапамагу табе знайсці <b>правераную інфармацыю</b>, зразумець вынікі і быць у кантакце з людзьмі, якія гэта ведаюць.","w.canDo":"У Krągu ты можаш","w.b1":"Вучыцца пра HIV простай мовай","w.b2":"Весці прыватную гісторыю абследаванняў","w.b3":"Сачыць за лячэннем","w.b4":"Пагаварыць з людзьмі, якія праходзяць праз тое самае","w.b5":"Спытаць у мяне пра ўсё","w.privacy":"Прыватнасць тут — гэта змаўчанне, а не опцыя, якую трэба ўключаць. Тое, што ты запісваеш пра сваё здароўе, шыфруецца на тваёй прыладзе — і ніхто ў Krągu гэтага не бачыць, у тым ліку мы.","w.passkey":"Увайсці — Face ID або адбітак пальца","w.anon":"Увайсці","w.have":"У мяне ўжо ёсць акаўнт","d.results":"Вынікі і абследаванні","d.trend":"Траекторыя","d.addResult":"Дадаць вынік","d.cd4":"CD4 (клеткі/µl)","d.vl":"Вірусная нагрузка (копіі/ml)","d.value":"Значэнне","d.date":"Дата","d.meds":"Лекі","d.medName":"Назва лека","d.medDose":"Доза","d.medTime":"Час","d.addMed":"Дадаць лек","d.visits":"Візіты","d.visitTitle":"Апісанне візіту","d.addVisit":"Дадаць візіт","d.photos":"Фота абследаванняў","d.addPhoto":"Загрузіць фота абследавання","d.notes":"Нататкі","d.addNote":"Дадаць нататку","d.photoHint":"Загрузі фота выніку — Ida паспрабуе счытаць значэнні і ўпісаць іх ніжэй у „Вынікі і абследаванні\". Правер і папраў. Фота застаецца на гэтым тэлефоне.","d.scanResult":"Счытаць вынік з фота","d.ocrReading":"Счытваю вынік…","d.ocrPrefilled":"Счытана — правер значэнне вышэй і захавай.","d.ocrNone":"Не ўдалося распазнаць вынік — упішы яго ўручную.","d.ocrOffline":"Счытванне з фота працуе анлайн. Ты можаш упісаць вынік уручную.","d.cotests":"Іншыя абследаванні і каінфекцыі","d.cotestHint":"HIV — гэта не толькі HIV. Сачы таксама за HCV, HBV, сіфілісам, CMV, HPV, туберкулёзам, прышчэпкамі і агульнымі абследаваннямі.","d.cotestName":"Што абследавалі","d.cotestResult":"Вынік (напр. адмоўны, выяўлена, прышчэпка)","d.addCotest":"Дадаць абследаванне","d.cotestChips":"HCV,HBV,Сіфіліс,CMV,HPV,Туберкулёз,Ліпіды,Ныркі","d.demo":"Запоўніць дэма-данымі","d.del":"выдаліць","d.none":"тут пакуль нічога няма","d.undetectable":"ніжэй парога","d.at":"а","d.saved":"Захавана.","d.ocrAdded":"Дададзена ў дзённік: {list}. Правер і папраў, калі трэба."};
DICT.lt = {"login.h1":"Jau turiu paskyrą","login.p":"Atkurk savo paskyrą šiame įrenginyje — su prieigos raktu (Face ID / pirštų atspaudu) arba Krąg raktu. Viskas iššifruojama <b>čia</b>; serveris nemato nė vieno iš jų.","login.passkey":"Prisijunk — Face ID arba pirštų atspaudu","login.orKc":"arba su savo Krąg raktu","login.ph":"krag1:…  (įklijuok arba nuskenuok)","login.do":"Prisijunk ir sinchronizuok","kc.h1":"Tavo Krąg raktas","kc.p":"Taip prisijungsi prie paskyros iš kito įrenginio arba ją atkursi. Išsaugok jį — ekrano nuotrauką ar slaptažodžių tvarkyklę. <b>Niekas, net Krąg, jo neatkurs.</b>","kc.copy":"Kopijuoti raktą","kc.ack":"Išsaugojau savo Krąg raktą saugioje vietoje","kc.enter":"Įeiti į Krąg","kc.copied":"Krąg raktas nukopijuotas.","ida.kicker":"Krąg žinios","ida.title":"Paklausk Idą","ida.ph":"Klausk apie HIV, PrEP, gydymą, rezultatus…","ida.hello":"Sveika. Aš esu Ida — palaikau tau kompaniją Krąg ir atsakau iš turimos medžiagos. Kai ko nors neturiu, pasakau tai atvirai, o ne spėlioju.","ida.s1":"Ką reiškia neaptinkamas?","ida.s2":"Kaip veikia PrEP?","ida.s3":"Ką daryti po rizikos?","ida.s4":"Ką reiškia CD4?","ida.s5":"Ar privalau pasakyti darbdaviui?","ida.unsure":"Nesu tikra, ar gerai supratau — štai artimiausia, ką turiu. Jei turėjai omenyje ką kita, pasirink temą žemiau.","ida.bound":"Neatsakysiu apie tavo paties rezultatą — ir tai sąmoninga. Tai pokalbis su gydytoju, o ne su duomenų baze.","ida.negctx":"atsakymas HIV neigiamam žmogui","ida.inThread":"gijoje: ","ida.clock":"Tai laiko atžvilgiu svarbu. Skaityk dabar:","ida.gate":"Medicininis blokas — prieš paskelbiant reikia gydytojo parašo. Kol kas niekas to nepatvirtino.","ida.srcPl":"šaltinis: lenkų k.","ida.baseUnverified":"Bazė {ed} · dar nepatikrinta žmogaus","ida.noCover":"<b>Neturiu to Krąg bazėje — ir nenoriu prasimanyti.</b><br><br>Išsaugau tavo klausimą kaip spragą, kad kas nors ją užpildytų. Tikrų numerių ir įstaigų ieškok skiltyje <b>Pagalba</b>, o medicininius sprendimus aptark su gydytoju.<br><br><span style=\"color:var(--tx-3)\">Užtat galiu papasakoti apie:</span>","ida.gapTag":"neapima","ida.gapSaved":"išsaugota kaip spraga","ida.crisis":"Sustoju čia, nes perskaičiau tai, kas sunku. Ne man tai nešti — bet žinau, kas gali. Lieku šalia. Gali rašyti toliau.","ida.crisisLine":"Psichologinė krizė — 24/7","ida.notYourLang":"Ši linija atsako lenkiškai. Numeriu {eu} gali paprašyti vertėjo.","ida.stopMeds":"Svarbu, kad apie tai kalbi — ir tai pokalbis, kurį verta turėti su savo gydytoju, o ne vienam. Priežastys būna įvairios: šalutinis poveikis, kasdienis nuovargis, išlaidos, gėda. Kiekvieną galima su kuo nors aptarti, ir kiekviena paprastai turi kokią nors išeitį.","trust.t3":"tikrinti","trust.t4":"bendruomenė","app.loggedAs":"Prisijungta kaip","app.threads":"Pokalbiai","app.start":"Pradėti pokalbį","app.startHint":"Įrašyk žmogaus, kurį pažįsti iš Krąg, slapyvardį.","app.peerPh":"Rami Upė #C3D4","app.open":"Atverti pokalbį","app.empty":"Kol kas pokalbių nėra. Pasikalbėk su tuo, kas supranta — pradėk žemiau: susirask ką nors arba prisijunk prie kambario.","app.newConvo":"Naujas pokalbis","app.discover":"Kalbėkis su žmonėmis","app.discoverP":"Krąg sujungia žmones, kurie tai išgyvena. Nebūtina nieko pažinti — pradėk nuo vietovės ar temos.","app.findPeople":"Susirask žmonių pagal vietovę ar temą","app.joinRoom":"Prisijunk prie teminio kambario","app.knowAddr":"Jau turi kieno nors adresą ar nuorodą?","diary.kicker":"Tavo sveikata","diary.title":"Dienoraštis","diary.p":"Tavo rezultatai, vaistai, vizitai ir tyrimai vienoje vietoje — o Ida iš jų perskaito tendenciją ir pataria.","diary.priv":"🔒 Lieka šiame telefone.","diary.privLong":"Viskas dienoraštyje lieka šiame telefone. Prieš išvalydamas naršyklės duomenis, pasidaryk kopiją Profilyje.","diary.new":"Naujas įrašas","diary.notePh":"pvz. CD4 268, viruso kiekis žemiau ribos","diary.save":"Išsaugoti dienoraštyje","diary.empty":"Dienoraštis tuščias. Niekas iš jo nepalieka šio įrenginio.","diary.device":"Techninės detalės","diary.rAcc":"Paskyra (vietinis raktas)","diary.rAccV":"įrenginyje","diary.rDiary":"Sveikatos dienoraštis (IndexedDB)","diary.rSw":"Neprisijungęs režimas (service worker)","diary.rE2e":"1:1 pokalbiai (E2E)","diary.rE2eV":"aktyvu","diary.sample":"Pridėti pavyzdinį įrašą","diary.wipe":"Ištrinti viską iš šio įrenginio","pf.kicker":"Tavo profilis","pf.title":"Profilis","pf.p":"Tai tavo profilis. Vardą ir kalbą pakeisi kada nori — jie saugiai išsisaugos ir atsiras kituose tavo įrenginiuose.","pf.pseudo":"Vardas, kurį mato kiti","pf.handle":"Tavo adresas Krąg (juo tau rašo)","pf.handleHint":"Jis susidaro iš tavo rakto ir niekada nesikeičia — tarsi numeris, tik nesakant, kas tu esi.","pf.lang":"Kalba","pf.role":"Kas tu esi Krąg","pf.gram":"Kaip į tave kreiptis?","pf.save":"Išsaugoti ir sinchronizuoti","pf.kcSummary":"Tavo Krąg raktas","pf.kcP":"Būdas prisijungti prie paskyros iš kito įrenginio arba ją atkurti. Išsaugok jį saugiai. Niekas, net Krąg, jo neatkurs.","role.plhiv":"Gyvenu su HIV","role.partner":"Esu partneris (-ė)","role.bliska":"Esu artimas žmogus","gram.n":"Neutraliai (beasmeniškai)","gram.f":"Moteriškąja gimine","gram.m":"Vyriškąja gimine","sync.on":"✓ sinchronizuota","sync.syncing":"sinchronizuojama…","sync.off":"neprisijungęs","th.lock":"🔒 Ištisai užšifruota. Serveris šių žinučių neskaito.","th.msgPh":"Rašyk…","tab.ida":"Ida","tab.app":"Pokalbiai","tab.diary":"Dienoraštis","tab.profile":"Profilis","toast.profM":"Profilis išsaugotas.","toast.profF":"Profilis išsaugotas.","toast.profN":"Profilis išsaugotas.","toast.diaryM":"Įrašas išsaugotas.","toast.diaryF":"Įrašas išsaugotas.","toast.diaryN":"Įrašas išsaugotas.","coach.title":"Imuniteto treneris","coach.cd4now":"Naujausias CD4: {v}.","coach.trendUp":"Nuo ankstesnio matavimo: aukštyn.","coach.trendDown":"Nuo ankstesnio matavimo: žemyn — svyravimai pasitaiko; jei kartojasi, paminėk tai gydytojui.","coach.trendFlat":"Nuo ankstesnio matavimo: beveik be pokyčių.","coach.phases":"CD4 atsistato etapais: greičiausiai per pirmuosius pusę metų, paskui lėčiau — metų metus. Lėtesnis augimas ir svyravimai yra normalu ir ne tavo kaltė.","coach.m200":"Kontekstui: 200 yra riba, žemiau kurios didėja oportunistinių infekcijų rizika. Bendra informacija, o ne tavo rezultato vertinimas.","coach.m500":"Kontekstui: apie 500 ir aukščiau kartais apibūdinama kaip artima įprastam. Bendra informacija, o ne tavo rezultato vertinimas.","coach.uu":"Viruso kiekis žemiau ribos — U=U: neaptinkamas = neperduoda HIV lytiniu keliu.","coach.adh":"Vienintelis dalykas, kuris tikrai atstato imunitetą, yra nuoseklus vaistų vartojimas ir ankstyvas gydymas — o būtent tai labiausiai tavo rankose.","coach.wellbeing":"Judėjimas, miegas ar papildai pagerina savijautą, bet patys savaime nekelia CD4 — ir tai gerai. Tau nereikia „užsitarnauti“ geresnio rezultato.","coach.mind":"Pirmieji mėnesiai po diagnozės psichologiškai būna sunkiausi. Sunkesnis laikotarpis nieko keisto — ir su tuo galima kažką padaryti.","coach.mindCta":"Pasikalbėk su Ida","coach.note":"Tai palaikymas, o ne medicininis patarimas. Treneris rodo tavo duomenis ir bendrą žinojimą — jis nevertina rezultatų ir jų neprognozuoja. Sprendimus — su savo gydytoju.","ix.title":"Vaistų sąveikos","ix.check":"Patikrinti","ix.checkPh":"Patikrink vaistą, papildą, maistą…","ix.note":"Informaciniais tikslais — nepakeičia konsultacijos. Visada patvirtink su gydytoju ar vaistininku. Pilnas patikrinimas: Liverpool HIV Drug Interactions bazė.","ix.none":"Nežinau sąveikos su tavo vaistais — tai nereiškia, kad jos nėra. Pasitikrink Liverpool bazėje.","ix.addMeds":"Pridėk savo vaistus viršuje, kad galėtum tikrinti sąveikas.","ix.known":"Verta žinoti prie tavo schemos:","cat.open":"Rasti","cat.title":"Rask, su kuo pasikalbėti","cat.lead":"Paskelbk apie save (neprivaloma) ir rask žmonių pagal vietovę ar temą.","cat.mine":"Tavo skelbimas","cat.region":"Vietovė (pvz. Varšuva)","cat.tags":"Temos (pvz. neseniai diagnozuota, PrEP)","cat.bio":"Keli žodžiai apie save","cat.publish":"Paskelbti apie save","cat.remove":"Pašalinti skelbimą","cat.browse":"Naršyti","cat.fRegion":"Vietovė","cat.fTag":"Tema","cat.search":"Ieškoti","cat.none":"Kol kas niekas nepaskelbė (arba nėra rezultatų).","cat.write":"Rašyti","cat.you":"(tai tu)","cat.offline":"Katalogui reikia ryšio — bus prieinamas prijungus serverį.","cat.note":"Skelbimą mato kiti Krąg nariai. Be GPS — tik tai, ką pats įrašai. Nenurodyk duomenų, kurių nenori atskleisti.","cat.mentorOffer":"Galiu palaikyti kaip buddy/mentorius","cat.mentorFilter":"Tik buddy/mentoriai","cat.mentorBadge":"buddy","th.buddyOn":"Pažymėta kaip buddy/mentorius.","th.buddyOff":"Buddy žymė pašalinta.","th.buddyTag":"buddy","login.scan":"Nuskenuok QR kodą","scan.hint":"Nukreipk kamerą į Krąg rakto QR kodą","scan.cancel":"Atšaukti","scan.deny":"Nėra prieigos prie kameros — įklijuok raktą ranka.","lib.open":"Biblioteka","lib.title":"Biblioteka","lib.lead":"Žinios apie HIV paprasta kalba — naršyk temas savo tempu.","lib.facts":"faktai","room.open2":"Kambariai","room.title":"Teminiai kambariai","room.lead":"Grupės apie temą. Žinutės ištisai užšifruotos — atskirai kiekvienam žmogui.","room.create":"Sukurti kambarį","room.namePh":"pvz. Neseniai diagnozuota","room.createBtn":"Sukurti","room.searchPh":"Ieškoti kambario","room.none":"Kol kas kambarių nėra (arba nėra rezultatų). Sukurk pirmą.","room.join":"Prisijungti","room.open":"Atverti","room.count":"{n} žmonių","room.one":"Kambarys","room.tag":"grupė","room.needName":"Įrašyk kambario pavadinimą.","room.note":"Kambario pavadinimas yra viešas (kad jį būtų galima rasti). Pokalbių turinys — ne.","inv.summary":"Pakviesti į pokalbį","inv.p":"Pasidalink nuoroda arba QR kodu. Žmogus atvers programą ir iškart pradės su tavimi pokalbį. Nuorodoje nėra asmens duomenų ar raktų.","inv.share":"Dalintis nuoroda","inv.copied":"Kvietimo nuoroda nukopijuota.","inv.shareText":"Parašyk man Krąg:","inv.opened":"Pokalbis iš kvietimo atvertas.","inv.notFound":"Šio žmogaus rasti nepavyko (arba jis dar neturi paskyros).","conn.on":"Prisijungta prie Krąg — pokalbiai ir sinchronizacija veikia.","conn.off":"Neprisijungęs režimas: Krąg veikia ir be tinklo. Ida, biblioteka ir dienoraštis prieinami, o tavo duomenys saugiai lieka šiame įrenginyje. Pokalbiai pasivys, kai vėl būsi prisijungęs.","help.open":"Pagalba","help.title":"Pagalba","help.lead":"Kai reikia pasikalbėti ar gauti pagalbą tučtuojau — štai patikimi, dažniausiai nemokami numeriai ir vietos. Skambinti gali anonimiškai.","help.emergency":"Skubi pagalba","help.crisis":"Psichologinė krizė (24/7)","help.youth":"Vaikai ir jaunimas (24/7)","help.hiv":"HIV/AIDS pasitikėjimo linija","help.hivHours":"pir–pen 9:00–21:00","help.free":"nemokamas","help.test":"Poliklinikos, gydančios HIV","help.testCta":"Rask įstaigą (aids.gov.pl)","help.pep":"Po rizikingo kontakto (PEP)","help.pepD":"Kuo greičiau, tuo geriau — per 48–72 val. Kreipkis į skubios pagalbos skyrių arba infekcinių ligų ligoninę (be siuntimo).","help.call":"Skambinti","ida.help1":"Pagalba ir pasitikėjimo linijos","ida.help2":"Kur pasitikrinti dėl HIV?","bk.summary":"Atsarginė kopija (jei prarastum duomenis)","bk.p":"Tai kas kita nei Krąg raktas: raktas perkelia tavo paskyrą, o ši kopija — tavo dienoraštį (kuris lieka tik įrenginyje). Jei išvalysi naršyklės duomenis, dienoraštis dings — išsaugok užšifruotą kopiją, ją atversi savo Krąg raktu.","bk.export":"Išsaugoti kopiją į failą","bk.import":"Įkelti kopiją iš failo","bk.done":"Įkelta įrašų: {n}.","bk.empty":"Kopijoje nėra nieko naujo.","bk.badkey":"Šis failas neatitinka tavo Krąg rakto.","bk.badfile":"Tai nepanašu į Krąg kopiją.","bk.nokey":"Šiame įrenginyje reikia Krąg rakto.","bk.err":"Kopijos išsaugoti nepavyko.","bk.warn":"🔒 Failas užšifruotas — bevertis be tavo rakto. Laikyk jį saugioje vietoje.","emo.lonely":"Girdžiu tave. Vienatvė su HIV gali slėgti — bet čia tikrai neprivalai būti su tuo vienas. Krąg yra žmonių, kurie išgyvena tą patį; galiu padėti tau ką nors rasti. Lieku šalia.","emo.low":"Apgailestauju, kad tau dabar taip sunku. Neprivalai to nešti vienas — gali parašyti tam, kas supranta, arba kreiptis pagalbos skiltyje Pagalba. Aš čia.","emo.fear":"Tai, ką jauti, yra suprantama — baimė ir gėda dažnai ateina su diagnoze, bet neprivalo likti amžiams. Nesi su tuo vienas; galiu padėti rasti palaikymą.","emo.meet":"Kalbėkis su žmonėmis","emo.help":"Žiūrėk Pagalbą","pf.ai":"Ida supranta (AI)","pf.aiHint":"Be to Ida atsako paprastu žodžių atitikimu — kartais nesupranta klausimo. Įjungta: ji supranta geriau ir prisimena pokalbio giją (tęstinumas). Į AI modelį (per mūsų serverį) keliauja tik klausimo tekstas ir kelios paskutinės eilutės — be slapyvardžio, raktų ir dienoraščio. Ji atsako tik iš Krąg faktų. Pagal nutylėjimą išjungta; veikia įdiegus serverį.","ai.thinking":"Galvoju…","ai.badge":"AI sudėliojo tai iš Krąg faktų","ida.hellos":"Gera tave matyti. Ko norėtum šiandien paklausti?|Sveika! Gerai, kad esi. Nuo ko pradedame?|Aš čia. Apie ką nori pasikalbėti?|Ei. Užduok klausimą — atsakysiu iš to, ką turiu, be spėliojimų.","demo.banner":"DEMO — pavyzdiniai duomenys, viskas vietiškai šiame įrenginyje","lang.partial":"(sąsaja anglų kalba)","lang.note":"Sąraše yra lenkų ir kaimyninės kalbos. Pažymėtos „(anglų k.)“ rodo sąsają angliškai, o faktai lieka lenkiški, kol bendruomenė nepridės vertimo. Tavo kalbos nėra? Pasiūlyk ją žemiau.","lang.req":"Pasiūlyti trūkstamą kalbą","lang.reqDone":"Ačiū — užfiksuosime poreikį kalbai: {lang}.","ida.docChip":"Kur kreiptis į gydytoją?","ida.clinicAsk":"Kokiame mieste esi? Pateiksiu artimiausios HIV gydymo poliklinikos adresą.","ida.clinicIntro":"HIV (ARV) gydymo poliklinikos šioje vietovėje:","ida.clinicNear":"{city} ARV poliklinikos nėra. Artimiausios:","ida.clinicNearby":"Arčiausiai tavęs:","ida.clinicGeo":"Artimiausios (naudoti vietovę)","ida.clinicLocating":"Tikrinu vietovę…","ida.clinicGeoNo":"Vietovės nustatyti nepavyko. Įrašyk miestą arba pasirink iš sąrašo:","ida.clinicKids":"vaikai","ida.clinicConfirm":"Paskambink prieš važiuodamas — darbo valandos ir registracijos taisyklės būna įvairios. ARV gydymas Lenkijoje yra nemokamas, taip pat ir be draudimo.","ida.clinicSrc":"Šaltinis: Krajowe Centrum ds. AIDS (gov.pl)","ida.clinicMore":"Pilnas sąrašas ir numeriai (Pagalba)","ida.clinicNone":"Šio miesto sąraše neturiu. Naudok vietovę, pasirink artimiausią arba peržiūrėk pilną sąrašą skiltyje Pagalba:","w.h1":"Sveika. Aš esu Ida.","w.intro":"Palaikau kompaniją žmonėms, gyvenantiems su HIV, ir jų artimiesiems. Padėsiu tau rasti <b>patikimą informaciją</b>, suprasti rezultatus ir palaikyti ryšį su žmonėmis, kurie tai supranta.","w.canDo":"Krąg tu gali","w.b1":"Mokytis apie HIV paprasta kalba","w.b2":"Vesti privačią savo rezultatų istoriją","w.b3":"Prižiūrėti gydymą","w.b4":"Kalbėtis su žmonėmis, kurie išgyvena tą patį","w.b5":"Manęs bet ko paklausti","w.privacy":"Privatumas čia yra nustatytas iš karto, o ne funkcija, kurią reikia įjungti. Tai, ką užsirašai apie savo sveikatą, užšifruojama tavo įrenginyje — ir niekas Krąg to nemato, net mes.","w.passkey":"Įeiti — Face ID arba pirštų atspaudu","w.anon":"Įeiti","w.have":"Jau turiu paskyrą","d.results":"Rezultatai ir tyrimai","d.trend":"Trajektorija","d.addResult":"Pridėti rezultatą","d.cd4":"CD4 (ląstelės/µl)","d.vl":"Viruso kiekis (kopijos/ml)","d.value":"Reikšmė","d.date":"Data","d.meds":"Vaistai","d.medName":"Vaisto pavadinimas","d.medDose":"Dozė","d.medTime":"Laikas","d.addMed":"Pridėti vaistą","d.visits":"Vizitai","d.visitTitle":"Vizitas","d.addVisit":"Pridėti vizitą","d.photos":"Tyrimų nuotraukos","d.addPhoto":"Įkelti tyrimo nuotrauką","d.notes":"Užrašai","d.addNote":"Pridėti užrašą","d.photoHint":"Įkelk savo rezultato nuotrauką — Ida pabandys nuskaityti reikšmes į „Rezultatai ir tyrimai“ žemiau. Patikrink ir pataisyk. Nuotrauka lieka šiame telefone.","d.scanResult":"Nuskaityti rezultatą iš nuotraukos","d.ocrReading":"Skaitau rezultatą…","d.ocrPrefilled":"Nuskaityta — patikrink reikšmę viršuje ir išsaugok.","d.ocrNone":"Rezultato atpažinti nepavyko — įrašyk jį ranka.","d.ocrOffline":"Skaitymas iš nuotraukos veikia prisijungus. Rezultatą gali įrašyti ranka.","d.cotests":"Kiti tyrimai ir koinfekcijos","d.cotestHint":"HIV yra ne tik HIV. Sek ir HCV, HBV, sifilį, CMV, HPV, tuberkuliozę, skiepus bei bendruosius tyrimus.","d.cotestName":"Kas tirta","d.cotestResult":"Rezultatas (pvz. neigiamas, aptikta, paskiepyta)","d.addCotest":"Pridėti tyrimą","d.cotestChips":"HCV,HBV,Sifilis,CMV,HPV,TB,Lipidai,Inkstai","d.demo":"Užpildyti demo duomenimis","d.del":"ištrinti","d.none":"čia dar nieko nėra","d.undetectable":"žemiau ribos","d.at":"val.","d.saved":"Išsaugota.","d.ocrAdded":"Pridėta į dienoraštį: {list}. Patikrink ir pataisyk, jei reikia."};

// Wszystkie języki z listy są już w pełni przetłumaczone → nota bez „fallbacku na angielski".
Object.assign(DICT.pl, {"lang.note":"Lista to polski i języki sąsiadów. Fakty medyczne zawsze zostają po polsku. Nie ma Twojego języka? Zgłoś go poniżej."});
Object.assign(DICT.en, {"lang.note":"The list is Polish and neighbouring languages. Medical facts always stay in Polish. Language not here? Request it below."});
Object.assign(DICT.uk, {"lang.note":"Список — це польська та мови сусідів. Медичні факти завжди залишаються польською. Немає твоєї мови? Повідом нижче."});
Object.assign(DICT.ru, {"lang.note":"В списке польский и языки соседей. Медицинские факты всегда остаются на польском. Нет твоего языка? Сообщи ниже."});
Object.assign(DICT.de, {"lang.note":"Die Liste umfasst Polnisch und Nachbarsprachen. Medizinische Fakten bleiben immer auf Polnisch. Deine Sprache fehlt? Melde sie unten."});
Object.assign(DICT.cs, {"lang.note":"Seznam obsahuje polštinu a jazyky sousedů. Lékařská fakta zůstávají vždy v polštině. Chybí tvůj jazyk? Nahlas ho níže."});
Object.assign(DICT.sk, {"lang.note":"Zoznam obsahuje poľštinu a jazyky susedov. Medicínske fakty zostávajú vždy v poľštine. Chýba tvoj jazyk? Nahlás ho nižšie."});
Object.assign(DICT.be, {"lang.note":"У спісе польская і мовы суседзяў. Медыцынскія факты заўсёды застаюцца па-польску. Няма тваёй мовы? Паведамі ніжэй."});
Object.assign(DICT.lt, {"lang.note":"Sąraše — lenkų ir kaimyninės kalbos. Medicininiai faktai visada lieka lenkų kalba. Nėra tavo kalbos? Pranešk žemiau."});

// Klucz bez namespace pominięty przy ekstrakcji — uzupełniony ręcznie.
Object.assign(DICT.de, {"back":"Zurück"});
Object.assign(DICT.cs, {"back":"Zpět"});
Object.assign(DICT.sk, {"back":"Späť"});
Object.assign(DICT.be, {"back":"Назад"});
Object.assign(DICT.lt, {"back":"Atgal"});

// #profil: widoczność/odnajdywalność (buddy/mentor + discover)
Object.assign(DICT.pl, {"pf.visTitle":"Widoczność","pf.discover":"Pozwól innym znaleźć mnie i napisać","pf.discoverHint":"Widoczne dla członków Kręgu, bez lokalizacji GPS. Okolicę i tematy dodasz w „Znajdź kogoś do rozmowy\". Działa po wdrożeniu serwera."});
Object.assign(DICT.en, {"pf.visTitle":"Visibility","pf.discover":"Let others find me and message me","pf.discoverHint":"Visible to Circle members, without GPS location. Add your area and topics in „Find someone to talk to\". Works once the server is deployed."});
Object.assign(DICT.uk, {"pf.visTitle":"Видимість","pf.discover":"Дозволь іншим знайти мене і написати","pf.discoverHint":"Видно членам Кола, без GPS-локації. Околицю й теми додаси в „Знайти когось для розмови\". Працює після розгортання сервера."});
Object.assign(DICT.ru, {"pf.visTitle":"Видимость","pf.discover":"Позволь другим найти меня и написать","pf.discoverHint":"Видно участникам Круга, без GPS-локации. Район и темы добавишь в „Найти собеседника\". Работает после развёртывания сервера."});
Object.assign(DICT.de, {"pf.visTitle":"Sichtbarkeit","pf.discover":"Anderen erlauben, mich zu finden und anzuschreiben","pf.discoverHint":"Für Kreis-Mitglieder sichtbar, ohne GPS-Standort. Gegend und Themen fügst du unter „Jemanden zum Reden finden\" hinzu. Funktioniert, sobald der Server bereitgestellt ist."});
Object.assign(DICT.cs, {"pf.visTitle":"Viditelnost","pf.discover":"Umožnit ostatním najít mě a napsat mi","pf.discoverHint":"Viditelné pro členy Kruhu, bez GPS polohy. Okolí a témata přidáš v „Najít někoho ke konverzaci\". Funguje po nasazení serveru."});
Object.assign(DICT.sk, {"pf.visTitle":"Viditeľnosť","pf.discover":"Umožniť ostatným nájsť ma a napísať mi","pf.discoverHint":"Viditeľné pre členov Kruhu, bez GPS polohy. Okolie a témy pridáš v „Nájsť niekoho na rozhovor\". Funguje po nasadení servera."});
Object.assign(DICT.be, {"pf.visTitle":"Бачнасць","pf.discover":"Дазволь іншым знайсці мяне і напісаць","pf.discoverHint":"Бачна членам Кола, без GPS-лакацыі. Ваколіцу і тэмы дадасі ў „Знайсці кагосьці для размовы\". Працуе пасля разгортвання сервера."});
Object.assign(DICT.lt, {"pf.visTitle":"Matomumas","pf.discover":"Leisti kitiems mane rasti ir parašyti","pf.discoverHint":"Matoma Rato nariams, be GPS vietos. Vietovę ir temas pridėsi „Rasti su kuo pasikalbėti\". Veikia įdiegus serverį."});

// P0-5: odznaka = źródło wiedzy (urzędowe/zweryfikowane/społeczność), bez „podpisu lekarza"
Object.assign(DICT.pl, {"trust.official":"urzędowe","trust.verified":"zweryfikowane","trust.community":"społeczność","ida.baseUnverified":"Baza wiedzy {ed}"});
Object.assign(DICT.en, {"trust.official":"official","trust.verified":"verified","trust.community":"community","ida.baseUnverified":"Knowledge base {ed}"});
Object.assign(DICT.uk, {"trust.official":"офіційне","trust.verified":"перевірене","trust.community":"спільнота","ida.baseUnverified":"База знань {ed}"});
Object.assign(DICT.ru, {"trust.official":"официальное","trust.verified":"проверенное","trust.community":"сообщество","ida.baseUnverified":"База знаний {ed}"});
Object.assign(DICT.de, {"trust.official":"amtlich","trust.verified":"geprüft","trust.community":"Community","ida.baseUnverified":"Wissensbasis {ed}"});
Object.assign(DICT.cs, {"trust.official":"úřední","trust.verified":"ověřené","trust.community":"komunita","ida.baseUnverified":"Znalostní báze {ed}"});
Object.assign(DICT.sk, {"trust.official":"úradné","trust.verified":"overené","trust.community":"komunita","ida.baseUnverified":"Znalostná báza {ed}"});
Object.assign(DICT.be, {"trust.official":"афіцыйнае","trust.verified":"правераное","trust.community":"супольнасць","ida.baseUnverified":"База ведаў {ed}"});
Object.assign(DICT.lt, {"trust.official":"oficialu","trust.verified":"patikrinta","trust.community":"bendruomenė","ida.baseUnverified":"Žinių bazė {ed}"});

// Teksty profilu/katalogu — jasny podział: „Twoja nazwa" (zmienna) vs stały „adres"
Object.assign(DICT.pl, {"pf.p":"Nazwę i język zmienisz, kiedy chcesz — zapisują się bezpiecznie i pojawiają na Twoich innych urządzeniach.","pf.pseudo":"Twoja nazwa","pf.handle":"Twój adres w Kręgu — po nim inni Cię znajdują","pf.handleHint":"Powstaje z Twojego klucza i nigdy się nie zmienia. Nazwę zmienisz, adres zostaje.","cat.lead":"Ogłoś się (opcjonalnie) i znajdź osoby z okolicy albo po temacie — bez podawania, kim jesteś."});
Object.assign(DICT.en, {"pf.p":"Change your name and language whenever you like — they save securely and appear on your other devices.","pf.pseudo":"Your name","pf.handle":"Your address in the Circle — how others find you","pf.handleHint":"It comes from your key and never changes. You can change your name; the address stays.","cat.lead":"List yourself (optional) and find people by area or topic — without saying who you are."});
Object.assign(DICT.uk, {"pf.p":"Змінюй імʼя та мову коли захочеш — вони зберігаються безпечно й зʼявляються на інших твоїх пристроях.","pf.pseudo":"Твоє імʼя","pf.handle":"Твоя адреса в Колі — за нею тебе знаходять","pf.handleHint":"Вона походить із твого ключа й ніколи не змінюється. Імʼя можеш змінити, адреса залишається.","cat.lead":"Заяви про себе (необовʼязково) і знайди людей поруч або за темою — не називаючи, хто ти."});
Object.assign(DICT.ru, {"pf.p":"Меняй имя и язык когда захочешь — они сохраняются безопасно и появляются на других твоих устройствах.","pf.pseudo":"Твоё имя","pf.handle":"Твой адрес в Круге — по нему тебя находят","pf.handleHint":"Он создаётся из твоего ключа и никогда не меняется. Имя можно изменить, адрес остаётся.","cat.lead":"Заяви о себе (необязательно) и найди людей рядом или по теме — не называя, кто ты."});
Object.assign(DICT.de, {"pf.p":"Ändere Name und Sprache, wann du willst — sie werden sicher gespeichert und erscheinen auf deinen anderen Geräten.","pf.pseudo":"Dein Name","pf.handle":"Deine Adresse im Kreis — so finden dich andere","pf.handleHint":"Sie entsteht aus deinem Schlüssel und ändert sich nie. Den Namen kannst du ändern, die Adresse bleibt.","cat.lead":"Trag dich ein (optional) und finde Menschen aus der Nähe oder zum Thema — ohne zu sagen, wer du bist."});
Object.assign(DICT.cs, {"pf.p":"Jméno a jazyk změníš, kdykoli chceš — uloží se bezpečně a objeví se na tvých dalších zařízeních.","pf.pseudo":"Tvé jméno","pf.handle":"Tvoje adresa v Kruhu — podle ní tě ostatní najdou","pf.handleHint":"Vzniká z tvého klíče a nikdy se nemění. Jméno změníš, adresa zůstává.","cat.lead":"Ohlas se (nepovinně) a najdi lidi z okolí nebo podle tématu — aniž bys řekl, kdo jsi."});
Object.assign(DICT.sk, {"pf.p":"Meno a jazyk zmeníš, kedykoľvek chceš — uložia sa bezpečne a objavia sa na tvojich ďalších zariadeniach.","pf.pseudo":"Tvoje meno","pf.handle":"Tvoja adresa v Kruhu — podľa nej ťa ostatní nájdu","pf.handleHint":"Vzniká z tvojho kľúča a nikdy sa nemení. Meno zmeníš, adresa zostáva.","cat.lead":"Ohlás sa (nepovinne) a nájdi ľudí z okolia alebo podľa témy — bez toho, aby si povedal, kto si."});
Object.assign(DICT.be, {"pf.p":"Змяняй імя і мову калі хочаш — яны захоўваюцца бяспечна і зʼяўляюцца на іншых тваіх прыладах.","pf.pseudo":"Тваё імя","pf.handle":"Твой адрас у Коле — па ім цябе знаходзяць","pf.handleHint":"Ствараецца з твайго ключа і ніколі не змяняецца. Імя зменіш, адрас застаецца.","cat.lead":"Абʼяві пра сябе (неабавязкова) і знайдзі людзей побач або па тэме — не называючы, хто ты."});
Object.assign(DICT.lt, {"pf.p":"Vardą ir kalbą keisk kada nori — jie saugiai išsaugomi ir atsiranda kituose tavo įrenginiuose.","pf.pseudo":"Tavo vardas","pf.handle":"Tavo adresas Rate — pagal jį tave randa kiti","pf.handleHint":"Jis sukuriamas iš tavo rakto ir niekada nesikeičia. Vardą gali keisti, adresas lieka.","cat.lead":"Prisistatyk (nebūtina) ir rask žmonių netoliese ar pagal temą — nesakydamas, kas esi."});

// #7: link do ulotki (RPL) rozpoznanego leku
Object.assign(DICT.pl, {"d.leaflet":"ulotka"});
Object.assign(DICT.en, {"d.leaflet":"leaflet"});
Object.assign(DICT.uk, {"d.leaflet":"інструкція"});
Object.assign(DICT.ru, {"d.leaflet":"инструкция"});
Object.assign(DICT.de, {"d.leaflet":"Beipackzettel"});
Object.assign(DICT.cs, {"d.leaflet":"příbalový leták"});
Object.assign(DICT.sk, {"d.leaflet":"príbalový leták"});
Object.assign(DICT.be, {"d.leaflet":"інструкцыя"});
Object.assign(DICT.lt, {"d.leaflet":"instrukcija"});

// #7 interakcje: rzetelne źródło (Liverpool) — bez „potwierdź z lekarzem", link do bazy
Object.assign(DICT.pl, {"ix.note":"Sprawdzam najczęstsze interakcje ARV. Pełną, aktualną bazę masz w <a href=\"https://www.hiv-druginteractions.org/\" target=\"_blank\" rel=\"noopener\" class=\"srclink\">Liverpool HIV Drug Interactions</a>.","ix.none":"Nie mam tego w mojej bazie — to nie znaczy, że interakcji nie ma.","ix.liverpool":"Sprawdź w Liverpool HIV Drug Interactions"});
Object.assign(DICT.en, {"ix.note":"I check the most common ARV interactions. The full, current database is at <a href=\"https://www.hiv-druginteractions.org/\" target=\"_blank\" rel=\"noopener\" class=\"srclink\">Liverpool HIV Drug Interactions</a>.","ix.none":"It is not in my base — that does not mean there is no interaction.","ix.liverpool":"Check in Liverpool HIV Drug Interactions"});
Object.assign(DICT.uk, {"ix.note":"Перевіряю найчастіші взаємодії АРТ. Повна, актуальна база — <a href=\"https://www.hiv-druginteractions.org/\" target=\"_blank\" rel=\"noopener\" class=\"srclink\">Liverpool HIV Drug Interactions</a>.","ix.none":"Цього немає в моїй базі — це не означає, що взаємодії немає.","ix.liverpool":"Перевір у Liverpool HIV Drug Interactions"});
Object.assign(DICT.ru, {"ix.note":"Проверяю самые частые взаимодействия АРТ. Полная, актуальная база — <a href=\"https://www.hiv-druginteractions.org/\" target=\"_blank\" rel=\"noopener\" class=\"srclink\">Liverpool HIV Drug Interactions</a>.","ix.none":"Этого нет в моей базе — это не значит, что взаимодействия нет.","ix.liverpool":"Проверь в Liverpool HIV Drug Interactions"});
Object.assign(DICT.de, {"ix.note":"Ich prüfe die häufigsten ARV-Wechselwirkungen. Die vollständige, aktuelle Datenbank: <a href=\"https://www.hiv-druginteractions.org/\" target=\"_blank\" rel=\"noopener\" class=\"srclink\">Liverpool HIV Drug Interactions</a>.","ix.none":"Ist nicht in meiner Basis — das heißt nicht, dass es keine Wechselwirkung gibt.","ix.liverpool":"In Liverpool HIV Drug Interactions prüfen"});
Object.assign(DICT.cs, {"ix.note":"Kontroluji nejčastější interakce ARV. Úplnou, aktuální databázi máš v <a href=\"https://www.hiv-druginteractions.org/\" target=\"_blank\" rel=\"noopener\" class=\"srclink\">Liverpool HIV Drug Interactions</a>.","ix.none":"Nemám to v databázi — neznamená to, že interakce neexistuje.","ix.liverpool":"Ověřit v Liverpool HIV Drug Interactions"});
Object.assign(DICT.sk, {"ix.note":"Kontrolujem najčastejšie interakcie ARV. Úplnú, aktuálnu databázu máš v <a href=\"https://www.hiv-druginteractions.org/\" target=\"_blank\" rel=\"noopener\" class=\"srclink\">Liverpool HIV Drug Interactions</a>.","ix.none":"Nemám to v databáze — neznamená to, že interakcia neexistuje.","ix.liverpool":"Overiť v Liverpool HIV Drug Interactions"});
Object.assign(DICT.be, {"ix.note":"Правяраю найчасцейшыя ўзаемадзеянні АРТ. Поўная, актуальная база — <a href=\"https://www.hiv-druginteractions.org/\" target=\"_blank\" rel=\"noopener\" class=\"srclink\">Liverpool HIV Drug Interactions</a>.","ix.none":"Гэтага няма ў маёй базе — гэта не значыць, што ўзаемадзеяння няма.","ix.liverpool":"Праверыць у Liverpool HIV Drug Interactions"});
Object.assign(DICT.lt, {"ix.note":"Tikrinu dažniausias ARV sąveikas. Pilna, atnaujinta bazė — <a href=\"https://www.hiv-druginteractions.org/\" target=\"_blank\" rel=\"noopener\" class=\"srclink\">Liverpool HIV Drug Interactions</a>.","ix.none":"To nėra mano bazėje — tai nereiškia, kad sąveikos nėra.","ix.liverpool":"Tikrinti Liverpool HIV Drug Interactions"});

let lang = 'pl';
export function setLang(l) { if (LANG_NAMES[l]) lang = l; }   // dopuszczamy też języki bez pełnego tłumaczenia
export function getLang() { return lang; }
export function t(key, vars) {
  // brak klucza w wybranym języku → angielski → polski (nie zostawiamy „gołego" PL dla de/fr/es)
  let s = (DICT[lang] && DICT[lang][key]) || (DICT.en && DICT.en[key]) || DICT.pl[key] || key;
  if (vars) for (const k in vars) s = s.replace('{' + k + '}', vars[k]);
  return s;
}
/** Autodetekcja z przeglądarki (gdy brak zapisanego profilu). */
export function detectLang() {
  try {
    const n = (navigator.language || 'pl').slice(0, 2).toLowerCase();
    return LANG_NAMES[n] ? n : 'pl';   // znany kod (nawet niepełny) → użyj; inaczej polski
  } catch { return 'pl'; }
}
/** Tłumaczy statyczny DOM: [data-i18n] → textContent, [data-i18n-html] → innerHTML, [data-i18n-ph] → placeholder. */
export function translateDOM(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.getAttribute('data-i18n')); });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
  root.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph'))); });
}
