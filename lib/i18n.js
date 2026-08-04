/* Krąg — i18n interfejsu i wypowiedzi Idy (PL/EN/UK/RU).
 * UWAGA: 223 fakty medyczne pozostają PO POLSKU — treść medyczna wychodzi tylko z podpisem
 * człowieka, więc nie tłumaczymy jej automatycznie. Przy języku innym niż polski Ida oznacza
 * odpowiedź etykietą „źródło: polski". Tłumaczymy tylko powłokę UI i wypowiedzi własne Idy.
 */
'use strict';

// Języki: „covered" = pełne tłumaczenie UI; reszta jest DOSTĘPNA, ale UI spada na angielski,
// a fakty medyczne i tak zostają po polsku (podpis człowieka). Model jak w ProjektKrag:
// społeczność dopisuje tłumaczenia, a użytkownik nie jest zmuszany do polskiego.
export const LANGS = [
  { code: 'pl', name: 'polski', covered: true },
  { code: 'en', name: 'English', covered: true },
  { code: 'uk', name: 'українська', covered: true },
  { code: 'ru', name: 'русский', covered: true },
  { code: 'de', name: 'Deutsch', covered: false },
  { code: 'cs', name: 'Čeština', covered: false },
  { code: 'sk', name: 'Slovenčina', covered: false },
  { code: 'be', name: 'Беларуская', covered: false },
  { code: 'lt', name: 'Lietuvių', covered: false },
  { code: 'fr', name: 'Français', covered: false },
  { code: 'es', name: 'Español', covered: false },
  { code: 'it', name: 'Italiano', covered: false },
];
export const LANG_NAMES = Object.fromEntries(LANGS.map((l) => [l.code, l.name]));
const COVERED = new Set(LANGS.filter((l) => l.covered).map((l) => l.code));
export function isCovered(code) { return COVERED.has(code); }

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
    'app.empty': 'Nie masz jeszcze rozmów. Porozmawiaj z kimś, kto rozumie — zacznij od katalogu albo pokoju.',
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
    'app.empty': 'No conversations yet. Talk to someone who gets it — start with the directory or a room.',
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
    'app.empty': 'Розмов ще немає. Поговори з кимось, хто розуміє — почни з каталогу або кімнати.',
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
    'app.empty': 'Разговоров пока нет. Поговори с тем, кто понимает — начни с каталога или комнаты.',
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
  'd.results': 'Wyniki', 'd.trend': 'Trajektoria', 'd.addResult': 'Dodaj wynik',
  'd.cd4': 'CD4 (komórki/µl)', 'd.vl': 'Wiremia (kopie/ml)', 'd.value': 'Wartość', 'd.date': 'Data',
  'd.meds': 'Leki', 'd.medName': 'Nazwa leku', 'd.medDose': 'Dawka', 'd.medTime': 'Godzina', 'd.addMed': 'Dodaj lek',
  'd.visits': 'Wizyty', 'd.visitTitle': 'Opis wizyty', 'd.addVisit': 'Dodaj wizytę',
  'd.photos': 'Zdjęcia badań', 'd.addPhoto': 'Wgraj zdjęcie badań', 'd.notes': 'Notatki', 'd.addNote': 'Dodaj notatkę',
  'd.photoHint': 'Wgraj zdjęcie wyniku — Ida spróbuje odczytać wartości do dziennika. Zdjęcie zostaje na tym telefonie.',
  'd.scanResult': 'Odczytaj wynik ze zdjęcia', 'd.ocrReading': 'Odczytuję wynik…',
  'd.ocrPrefilled': 'Odczytano — sprawdź wartość powyżej i zapisz.', 'd.ocrNone': 'Nie rozpoznałem wyniku — wpisz go ręcznie.',
  'd.ocrOffline': 'Odczyt ze zdjęcia działa online. Możesz wpisać wynik ręcznie.',
  'd.cotests': 'Koinfekcje i inne badania', 'd.cotestHint': 'HIV to nie tylko HIV. Śledź też HCV, HBV, kiłę, CMV, HPV, gruźlicę, szczepienia i badania ogólne.',
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
  'd.results': 'Results', 'd.trend': 'Trajectory', 'd.addResult': 'Add result',
  'd.cd4': 'CD4 (cells/µl)', 'd.vl': 'Viral load (copies/ml)', 'd.value': 'Value', 'd.date': 'Date',
  'd.meds': 'Medication', 'd.medName': 'Drug name', 'd.medDose': 'Dose', 'd.medTime': 'Time', 'd.addMed': 'Add drug',
  'd.visits': 'Appointments', 'd.visitTitle': 'Appointment', 'd.addVisit': 'Add appointment',
  'd.photos': 'Test photos', 'd.addPhoto': 'Upload a test photo', 'd.notes': 'Notes', 'd.addNote': 'Add note',
  'd.photoHint': 'Upload a photo of your result — Ida will try to read the values into the diary. The photo stays on this phone.',
  'd.scanResult': 'Read result from photo', 'd.ocrReading': 'Reading result…',
  'd.ocrPrefilled': 'Read — check the value above and save.', 'd.ocrNone': 'Could not recognize a result — enter it manually.',
  'd.ocrOffline': 'Reading from a photo works online. You can enter the result manually.',
  'd.cotests': 'Co-infections & other tests', 'd.cotestHint': 'HIV is not only HIV. Track HCV, HBV, syphilis, CMV, HPV, TB, vaccinations and general tests too.',
  'd.cotestName': 'What was tested', 'd.cotestResult': 'Result (e.g. negative, detected, vaccinated)', 'd.addCotest': 'Add test',
  'd.cotestChips': 'HCV,HBV,Syphilis,CMV,HPV,TB,Lipids,Kidney',
  'd.demo': 'Fill with demo data', 'd.del': 'delete', 'd.none': 'nothing here yet',
  'd.undetectable': 'below threshold', 'd.at': 'at', 'd.saved': 'Saved.',
});
Object.assign(DICT.uk, {
  'd.results': 'Результати', 'd.trend': 'Траєкторія', 'd.addResult': 'Додати результат',
  'd.cd4': 'CD4 (клітини/µl)', 'd.vl': 'Вірусне навантаження (копій/мл)', 'd.value': 'Значення', 'd.date': 'Дата',
  'd.meds': 'Ліки', 'd.medName': 'Назва ліків', 'd.medDose': 'Доза', 'd.medTime': 'Час', 'd.addMed': 'Додати ліки',
  'd.visits': 'Візити', 'd.visitTitle': 'Опис візиту', 'd.addVisit': 'Додати візит',
  'd.photos': 'Фото аналізів', 'd.addPhoto': 'Завантажити фото аналізу', 'd.notes': 'Нотатки', 'd.addNote': 'Додати нотатку',
  'd.photoHint': 'Завантаж фото результату — Іда спробує зчитати значення в щоденник. Фото залишається на цьому телефоні.',
  'd.scanResult': 'Зчитати результат із фото', 'd.ocrReading': 'Зчитую результат…',
  'd.ocrPrefilled': 'Зчитано — перевір значення вгорі та збережи.', 'd.ocrNone': 'Не вдалося розпізнати результат — впиши вручну.',
  'd.ocrOffline': 'Зчитування з фото працює онлайн. Можеш ввести результат вручну.',
  'd.cotests': 'Коінфекції та інші аналізи', 'd.cotestHint': 'ВІЛ — це не лише ВІЛ. Стеж також за HCV, HBV, сифілісом, CMV, HPV, туберкульозом, щепленнями та загальними аналізами.',
  'd.cotestName': 'Що досліджували', 'd.cotestResult': 'Результат (напр. негативний, виявлено, щеплення)', 'd.addCotest': 'Додати аналіз',
  'd.cotestChips': 'HCV,HBV,Сифіліс,CMV,HPV,Туберкульоз,Ліпіди,Нирки',
  'd.demo': 'Заповнити демоданими', 'd.del': 'видалити', 'd.none': 'тут поки нічого немає',
  'd.undetectable': 'нижче порога', 'd.at': 'о', 'd.saved': 'Збережено.',
});
Object.assign(DICT.ru, {
  'd.results': 'Результаты', 'd.trend': 'Траектория', 'd.addResult': 'Добавить результат',
  'd.cd4': 'CD4 (клетки/µl)', 'd.vl': 'Вирусная нагрузка (копий/мл)', 'd.value': 'Значение', 'd.date': 'Дата',
  'd.meds': 'Лекарства', 'd.medName': 'Название лекарства', 'd.medDose': 'Доза', 'd.medTime': 'Время', 'd.addMed': 'Добавить лекарство',
  'd.visits': 'Визиты', 'd.visitTitle': 'Описание визита', 'd.addVisit': 'Добавить визит',
  'd.photos': 'Фото анализов', 'd.addPhoto': 'Загрузить фото анализа', 'd.notes': 'Заметки', 'd.addNote': 'Добавить заметку',
  'd.photoHint': 'Загрузи фото результата — Ида попробует считать значения в дневник. Фото остаётся на этом телефоне.',
  'd.scanResult': 'Считать результат с фото', 'd.ocrReading': 'Считываю результат…',
  'd.ocrPrefilled': 'Считано — проверь значение выше и сохрани.', 'd.ocrNone': 'Не удалось распознать результат — впиши вручную.',
  'd.ocrOffline': 'Считывание с фото работает онлайн. Можешь ввести результат вручную.',
  'd.cotests': 'Коинфекции и другие анализы', 'd.cotestHint': 'ВИЧ — это не только ВИЧ. Отслеживай также HCV, HBV, сифилис, CMV, HPV, туберкулёз, прививки и общие анализы.',
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
  'cat.open': 'Znajdź', 'cat.title': 'Znajdź rozmowę', 'cat.lead': 'Ogłoś się (opcjonalnie) i znajdź osoby z okolicy albo po temacie.',
  'cat.mine': 'Twoje ogłoszenie', 'cat.region': 'Okolica (np. Warszawa)', 'cat.tags': 'Tematy (np. świeżo po diagnozie, PrEP)', 'cat.bio': 'Kilka słów o sobie',
  'cat.publish': 'Ogłoś się', 'cat.remove': 'Usuń ogłoszenie', 'cat.browse': 'Przeglądaj',
  'cat.fRegion': 'Okolica', 'cat.fTag': 'Temat', 'cat.search': 'Szukaj', 'cat.none': 'Nikt się jeszcze nie ogłosił (albo brak wyników).',
  'cat.write': 'Napisz', 'cat.you': '(to Ty)', 'cat.offline': 'Katalog wymaga połączenia — dostępny po wpięciu backendu.',
  'cat.note': 'Ogłoszenie jest widoczne dla innych członków Kręgu. Bez GPS — tylko to, co sam wpiszesz. Nie podawaj danych, których nie chcesz ujawnić.',
  'cat.mentorOffer': 'Mogę wspierać jako buddy/mentor', 'cat.mentorFilter': 'Tylko buddy/mentorzy', 'cat.mentorBadge': 'buddy',
  'th.buddyOn': 'Oznaczono jako buddy/mentor.', 'th.buddyOff': 'Zdjęto oznaczenie buddy.', 'th.buddyTag': 'buddy',
});
Object.assign(DICT.en, {
  'cat.open': 'Find', 'cat.title': 'Find a conversation', 'cat.lead': 'List yourself (optional) and find people by area or topic.',
  'cat.mine': 'Your listing', 'cat.region': 'Area (e.g. Warsaw)', 'cat.tags': 'Topics (e.g. newly diagnosed, PrEP)', 'cat.bio': 'A few words about you',
  'cat.publish': 'List me', 'cat.remove': 'Remove listing', 'cat.browse': 'Browse',
  'cat.fRegion': 'Area', 'cat.fTag': 'Topic', 'cat.search': 'Search', 'cat.none': 'No one has listed yet (or no results).',
  'cat.write': 'Message', 'cat.you': '(you)', 'cat.offline': 'The directory needs a connection — available once the backend is deployed.',
  'cat.note': 'Your listing is visible to other Circle members. No GPS — only what you type. Do not share what you would not want revealed.',
  'cat.mentorOffer': 'I can support as a buddy/mentor', 'cat.mentorFilter': 'Buddies/mentors only', 'cat.mentorBadge': 'buddy',
  'th.buddyOn': 'Marked as buddy/mentor.', 'th.buddyOff': 'Buddy mark removed.', 'th.buddyTag': 'buddy',
});
Object.assign(DICT.uk, {
  'cat.open': 'Знайти', 'cat.title': 'Знайти розмову', 'cat.lead': 'Заяви про себе (необов’язково) і знайди людей поруч або за темою.',
  'cat.mine': 'Твоє оголошення', 'cat.region': 'Околиця (напр. Варшава)', 'cat.tags': 'Теми (напр. щойно діагностовані, PrEP)', 'cat.bio': 'Кілька слів про себе',
  'cat.publish': 'Оголосити', 'cat.remove': 'Видалити оголошення', 'cat.browse': 'Переглядати',
  'cat.fRegion': 'Околиця', 'cat.fTag': 'Тема', 'cat.search': 'Пошук', 'cat.none': 'Ще ніхто не оголосився (або немає результатів).',
  'cat.write': 'Написати', 'cat.you': '(це ти)', 'cat.offline': 'Каталог потребує з’єднання — доступний після підключення бекенду.',
  'cat.note': 'Оголошення видно іншим членам Кола. Без GPS — лише те, що впишеш. Не вказуй те, чого не хочеш розкривати.',
  'cat.mentorOffer': 'Можу підтримати як buddy/ментор', 'cat.mentorFilter': 'Лише buddy/ментори', 'cat.mentorBadge': 'buddy',
  'th.buddyOn': 'Позначено як buddy/ментор.', 'th.buddyOff': 'Позначку buddy знято.', 'th.buddyTag': 'buddy',
});
Object.assign(DICT.ru, {
  'cat.open': 'Найти', 'cat.title': 'Найти разговор', 'cat.lead': 'Заяви о себе (необязательно) и найди людей рядом или по теме.',
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
  'help.call': 'Zadzwoń', 'help.note': 'Numery mogą się zmieniać. Źródło: Krajowe Centrum ds. AIDS (aids.gov.pl).',
  'ida.help1': 'Pomoc i numery zaufania', 'ida.help2': 'Gdzie zrobić test HIV?',
});
Object.assign(DICT.en, {
  'help.open': 'Help', 'help.title': 'Help', 'help.lead': 'When you need to talk or get help right now — here are trusted, mostly free numbers and places. You can call anonymously.',
  'help.emergency': 'Emergency', 'help.crisis': 'Mental-health crisis (24/7)', 'help.youth': 'Children & youth (24/7)',
  'help.hiv': 'HIV/AIDS trust line', 'help.hivHours': 'Mon–Fri 9:00–21:00', 'help.free': 'free',
  'help.test': 'Clinics that treat HIV', 'help.testCta': 'Find a clinic (aids.gov.pl)',
  'help.pep': 'After a risky exposure (PEP)', 'help.pepD': 'The sooner the better — within 48–72 h. Go to an ER or an infectious-diseases hospital (no referral needed).',
  'help.call': 'Call', 'help.note': 'Numbers may change. Source: National AIDS Centre, Poland (aids.gov.pl).',
  'ida.help1': 'Help and trust lines', 'ida.help2': 'Where can I test for HIV?',
});
Object.assign(DICT.uk, {
  'help.open': 'Допомога', 'help.title': 'Допомога', 'help.lead': 'Коли потрібна розмова чи допомога негайно — тут перевірені, здебільшого безкоштовні номери й місця. Подзвонити можна анонімно.',
  'help.emergency': 'Екстрений випадок', 'help.crisis': 'Психічна криза (24/7)', 'help.youth': 'Діти та молодь (24/7)',
  'help.hiv': 'Телефон довіри ВІЛ/СНІД', 'help.hivHours': 'пн–пт 9:00–21:00', 'help.free': 'безкоштовно',
  'help.test': 'Заклади, що лікують ВІЛ', 'help.testCta': 'Знайти заклад (aids.gov.pl)',
  'help.pep': 'Після ризикованого контакту (PEP)', 'help.pepD': 'Що швидше, то краще — до 48–72 год. Звернися до приймального відділення або інфекційної лікарні (без направлення).',
  'help.call': 'Подзвонити', 'help.note': 'Номери можуть змінюватися. Джерело: Національний центр із питань СНІДу, Польща (aids.gov.pl).',
  'ida.help1': 'Допомога й телефони довіри', 'ida.help2': 'Де здати тест на ВІЛ?',
});
Object.assign(DICT.ru, {
  'help.open': 'Помощь', 'help.title': 'Помощь', 'help.lead': 'Когда нужен разговор или помощь прямо сейчас — здесь проверенные, в основном бесплатные номера и места. Позвонить можно анонимно.',
  'help.emergency': 'Экстренный случай', 'help.crisis': 'Психический кризис (24/7)', 'help.youth': 'Дети и молодёжь (24/7)',
  'help.hiv': 'Телефон доверия ВИЧ/СПИД', 'help.hivHours': 'пн–пт 9:00–21:00', 'help.free': 'бесплатно',
  'help.test': 'Учреждения, лечащие ВИЧ', 'help.testCta': 'Найти учреждение (aids.gov.pl)',
  'help.pep': 'После рискованного контакта (PEP)', 'help.pepD': 'Чем раньше, тем лучше — в течение 48–72 ч. Обратись в приёмное отделение или инфекционную больницу (без направления).',
  'help.call': 'Позвонить', 'help.note': 'Номера могут меняться. Источник: Национальный центр по СПИДу, Польша (aids.gov.pl).',
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
  'pf.aiHint': 'Włącza lepsze rozumienie pytań. Twoje pytanie do Idy jest wtedy wysyłane przez nasz serwer do modelu AI — bez pseudonimu, kluczy i dziennika. Odpowiada tylko z faktów Kręgu. Domyślnie wyłączone.',
  'ai.thinking': 'Myślę…', 'ai.badge': 'AI ułożyło to z faktów Kręgu',
});
Object.assign(DICT.en, {
  'pf.ai': 'Ida Understands (AI)',
  'pf.aiHint': 'Turns on deeper understanding. Your question to Ida is then sent through our server to an AI model — without your pseudonym, keys or diary. It answers only from Circle facts. Off by default.',
  'ai.thinking': 'Thinking…', 'ai.badge': 'AI composed this from Circle facts',
});
Object.assign(DICT.uk, {
  'pf.ai': 'Іда Розуміє (AI)',
  'pf.aiHint': 'Вмикає краще розуміння запитань. Твоє питання до Іди тоді надсилається через наш сервер до моделі AI — без псевдоніма, ключів і щоденника. Відповідає лише з фактів Кола. Типово вимкнено.',
  'ai.thinking': 'Думаю…', 'ai.badge': 'AI склало це з фактів Кола',
});
Object.assign(DICT.ru, {
  'pf.ai': 'Ида Понимает (AI)',
  'pf.aiHint': 'Включает лучшее понимание вопросов. Твой вопрос к Иде тогда отправляется через наш сервер к AI-модели — без псевдонима, ключей и дневника. Отвечает только из фактов Круга. По умолчанию выключено.',
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
Object.assign(DICT.pl, { 'lang.partial': '(po angielsku — w tłumaczeniu)', 'lang.note': 'Nie ma w pełni Twojego języka? Wybierz go — UI pokaże się po angielsku, a fakty po polsku, dopóki społeczność nie dopisze tłumaczenia.' });
Object.assign(DICT.en, { 'lang.partial': '(English for now — being translated)', 'lang.note': 'Your language not fully here yet? Pick it — the UI shows in English and facts stay Polish until the community adds a translation.' });
Object.assign(DICT.uk, { 'lang.partial': '(поки англійською — у перекладі)', 'lang.note': 'Твоєї мови ще немає повністю? Обери її — інтерфейс буде англійською, а факти польською, доки спільнота не додасть переклад.' });
Object.assign(DICT.ru, { 'lang.partial': '(пока по-английски — в переводе)', 'lang.note': 'Твоего языка ещё нет полностью? Выбери его — интерфейс будет на английском, а факты на польском, пока сообщество не добавит перевод.' });

// OCR-all, zgłaszanie języka (#7/#8)
Object.assign(DICT.pl, { 'd.ocrAdded': 'Dodano do dziennika: {list}. Sprawdź i popraw, jeśli trzeba.', 'lang.req': 'Zgłoś brakujący język', 'lang.reqDone': 'Dzięki — zapiszemy zapotrzebowanie na: {lang}.' });
Object.assign(DICT.en, { 'd.ocrAdded': 'Added to the diary: {list}. Check and fix if needed.', 'lang.req': 'Request a missing language', 'lang.reqDone': "Thanks — we'll note the demand for: {lang}." });
Object.assign(DICT.uk, { 'd.ocrAdded': 'Додано до щоденника: {list}. Перевір і виправ, якщо треба.', 'lang.req': 'Повідомити про мову, якої бракує', 'lang.reqDone': 'Дякуємо — врахуємо потребу: {lang}.' });
Object.assign(DICT.ru, { 'd.ocrAdded': 'Добавлено в дневник: {list}. Проверь и поправь, если нужно.', 'lang.req': 'Сообщить о недостающем языке', 'lang.reqDone': 'Спасибо — учтём спрос на: {lang}.' });

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
