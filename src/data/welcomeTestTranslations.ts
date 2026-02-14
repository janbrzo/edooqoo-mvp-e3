/**
 * Welcome Test Translations
 * Static translations for non-skill questions only (About You, Experience, Goals, Scenarios descriptions)
 * Grammar/vocabulary test items are NOT translated (they test English knowledge)
 * 
 * Top 10 languages: Polish, Spanish, German, French, Portuguese, Italian, Turkish, Russian, Czech, Ukrainian
 */

export interface QuestionTranslation {
  question: string;
  options?: string[];
  description?: string;
}

export const WELCOME_TEST_TRANSLATIONS: Record<string, Record<string, QuestionTranslation>> = {
  'Polish': {
    'wt_q1': {
      question: 'Jak opisałbyś/opisałabyś swój angielski w tej chwili?',
      description: 'Wybierz opcję, która najlepiej opisuje Twój obecny poziom.',
      options: [
        'Radzę sobie w podstawowych codziennych sytuacjach, np. zamawianie jedzenia czy pytanie o drogę',
        'Mogę prowadzić proste rozmowy na znane tematy, ale mam problemy ze złożonymi ideami',
        'Mogę dyskutować na większość tematów, ale popełniam błędy gramatyczne i czasem brakuje mi słownictwa',
        'Mówię płynnie w większości sytuacji, ale chcę brzmieć bardziej naturalnie i precyzyjnie',
        'Czuję się komfortowo po angielsku, ale chcę opanować zaawansowany/profesjonalny język',
      ],
    },
    'wt_q2': {
      question: 'Kiedy mówisz po angielsku, co frustruje Cię najbardziej?',
      description: 'Zaznacz wszystkie pasujące odpowiedzi.',
      options: [
        'Wiem, co chcę powiedzieć, ale nie mogę znaleźć odpowiednich słów',
        'Popełniam błędy gramatyczne, o których wiem, że są błędne',
        'Nie rozumiem native speakerów, gdy mówią szybko',
        'Denerwuję się i zapominam wszystko, co wiem',
        'Nie potrafię wyrazić złożonych idei - upraszczam za bardzo',
        'Moja wymowa sprawia, że ludzie proszą mnie o powtórzenie',
      ],
    },
    'wt_q3': {
      question: 'Jaki jest Twój główny powód nauki angielskiego?',
      options: [
        'Potrzebuję go do pracy - spotkania, maile, prezentacje',
        'Przygotowuję się do egzaminu (IELTS, Cambridge itp.)',
        'Chcę podróżować i swobodnie się komunikować',
        'Chcę oglądać filmy/czytać książki bez napisów',
        'Chcę czuć się pewnie rozmawiając z anglojęzycznymi osobami',
        'Awans zawodowy - potrzebuję angielskiego do awansu',
        'Przeprowadzam się do anglojęzycznego kraju',
      ],
    },
    'wt_q4': {
      question: 'Jak zwykle reagujesz, gdy nie rozumiesz czegoś po angielsku?',
      options: [
        'Proszę osobę o powtórzenie lub wyjaśnienie',
        'Udaję, że zrozumiałem/zrozumiałam i mam nadzieję na najlepsze',
        'Próbuję zgadnąć z kontekstu',
        'Stresuję się i przechodzę na swój język',
        'Od razu szukam na telefonie',
      ],
    },
    'wt_q5': {
      question: 'Ile czasu realistycznie możesz poświęcić na angielski tygodniowo (poza lekcjami)?',
      options: [
        'Prawie wcale - mam tylko czas na lekcje',
        '15-30 minut kilka razy w tygodniu',
        'Około 1 godziny rozłożonej na tydzień',
        '2-3 godziny - jestem zaangażowany/a',
        'Więcej niż 3 godziny - angielski jest moim priorytetem',
      ],
    },
    'wt_q6': {
      question: 'Które z tych aktywności do nauki lubisz? Zaznacz wszystkie pasujące.',
      options: [
        'Oglądanie filmów/wideo po angielsku',
        'Czytanie artykułów lub książek',
        'Prowadzenie rozmów',
        'Ćwiczenia gramatyczne',
        'Nauka nowego słownictwa z fiszkami',
        'Słuchanie podcastów',
        'Pisanie tekstów (maile, opowiadania)',
        'Gry językowe/quizy',
        'Śpiewanie piosenek po angielsku',
      ],
    },
    'wt_q7': {
      question: 'Jak się czujesz, robiąc błędy po angielsku?',
      options: [
        'Wcale mi to nie przeszkadza - tak się uczymy',
        'Wolę ich nie robić, ale dam sobie radę',
        'Czuję się zawstydzony/a, ale staram się przejść przez to',
        'Unikam mówienia, bo boję się błędów',
        'Bardzo się frustruję',
      ],
    },
    'wt_q8': {
      question: 'Kiedy uczysz się nowego słowa, co pomaga Ci je najlepiej zapamiętać?',
      options: [
        'Widzenie go zapisanego z definicją',
        'Słyszenie go w zdaniu',
        'Użycie go w swoim własnym zdaniu od razu',
        'Połączenie go z obrazkiem',
        'Powtarzanie wiele razy',
        'Zrozumienie części słowa (prefiks, rdzeń, sufiks)',
      ],
    },
    'wt_q9': {
      question: 'Jak długo uczysz się angielskiego?',
      options: [
        'Mniej niż 1 rok',
        '1-3 lata',
        '3-5 lat',
        '5-10 lat',
        'Więcej niż 10 lat',
      ],
    },
    'wt_q10': {
      question: 'Gdzie głównie uczyłeś/uczyłaś się angielskiego do tej pory?',
      description: 'Zaznacz wszystkie pasujące odpowiedzi.',
      options: [
        'Szkoła (jako przedmiot)',
        'Uniwersytet',
        'Prywatne lekcje z nauczycielem',
        'Szkoła językowa/kurs',
        'Samodzielna nauka (aplikacje, książki, YouTube)',
        'Mieszkanie/praca w anglojęzycznym kraju',
        'Przez pracę (codzienne używanie angielskiego)',
      ],
    },
    'wt_q11': {
      question: 'Czy kiedykolwiek zdawałeś/zdawałaś oficjalny egzamin z angielskiego?',
      options: [
        'Nie, nigdy',
        'Tak - egzamin szkolny/uniwersytecki',
        'Tak - Cambridge (FCE/CAE/CPE)',
        'Tak - IELTS',
        'Tak - TOEFL',
        'Tak - inny',
      ],
    },
    'wt_q12': {
      question: 'Jakie jest największe wyzwanie, z którym spotkałeś/spotkałaś się ucząc angielskiego?',
      description: 'W 1-2 zdaniach opisz swoją największą frustrację lub wyzwanie z angielskim.',
    },
    'wt_q13': {
      question: 'Czy jest coś konkretnego, co Twoi poprzedni nauczyciele robili, co naprawdę dobrze działało?',
      description: 'Powiedz nam, jakie metody lub podejścia pomogły Ci uczyć się najlepiej.',
    },
    'wt_q14': {
      question: 'Jesteś w kawiarni za granicą. Barista pyta Cię o coś, czego nie do końca rozumiesz. Co robisz?',
      options: [
        'Mówię "Przepraszam, czy mógłbyś/mogłabyś powtórzyć?" i próbuję ponownie',
        'Po prostu wskazuję na menu i uśmiecham się',
        'Używam Google Translate na telefonie',
        'Odpowiadam tym, co myślę, że zapytali',
      ],
    },
    'wt_q15': {
      question: 'Twój anglojęzyczny kolega wysyła Ci długiego maila o projekcie. Niektóre części są niejasne. Co robisz?',
      options: [
        'Czytam go uważnie, szukam nieznanych słów i odpowiadam',
        'Odpisuję prosząc o wyjaśnienie niejasnych części',
        'Rozumiem większość i zgaduję resztę z kontekstu',
        'Mam problem ze zrozumieniem i muszę przetłumaczyć większość',
        'Nie próbuję rozumieć, używam ChatGPT',
      ],
    },
    'wt_q16': {
      question: 'Musisz opisać problem z pokojem hotelowym w recepcji.',
      description: 'Napisz 2-3 zdania wyjaśniając, że klimatyzacja w Twoim pokoju nie działa i chciałbyś/chciałabyś, żeby to naprawili lub żeby zmienić pokój.',
    },
    'wt_q17': {
      question: 'Jesteś na rozmowie o pracę i pytają "Opowiedz o wyzwaniu, z którym spotkałeś/spotkałaś się w pracy." Jak odpowiesz?',
      description: 'Napisz 3-4 zdania tak, jakbyś naprawdę był/była na rozmowie.',
    },
    'wt_q36': {
      question: 'Jak grzecznie odmówiłbyś/odmówiłabyś zaproszenia na imprezę kolegi z pracy?',
      description: 'Napisz 1-2 zdania.',
    },
    'wt_q40': {
      question: 'Przeczytaj te dwie wersje. Która brzmi lepiej i dlaczego?',
      description: 'Która wersja brzmi dla Ciebie lepiej i dlaczego? Napisz 1 zdanie.',
    },
    'wt_q41': {
      question: 'Gdybyś mógł/mogła osiągnąć JEDNĄ rzecz w angielskim w ciągu najbliższych 3 miesięcy, co by to było?',
      description: 'Pisz swobodnie - nie ma złych odpowiedzi.',
    },
    'wt_q42': {
      question: 'Jak wolisz otrzymywać informację zwrotną o swoich błędach?',
      options: [
        'Poprawiaj mnie natychmiast, za każdym razem',
        'Zanotuj je i omówmy na koniec',
        'Poprawiaj tylko duże błędy, ignoruj małe',
        'Napisz korekty, żebym mógł/mogła je później przejrzeć',
        'Wolę sam/sama się poprawiać z podpowiedziami',
      ],
    },
    'wt_q43': {
      question: 'Jakie tematy interesują Cię najbardziej? Wybierz do 3.',
      options: [
        'Technologia i innowacje',
        'Biznes i finanse',
        'Podróże i kultura',
        'Zdrowie i styl życia',
        'Nauka i przyroda',
        'Rozrywka i kultura popularna',
        'Sport',
        'Jedzenie i gotowanie',
        'Psychologia i samorozwój',
        'Polityka i bieżące wydarzenia',
        'Sztuka i literatura',
        'Historia',
      ],
    },
    'wt_q44': {
      question: 'Jak oceniłbyś/oceniłabyś swoją pewność siebie w tych obszarach?',
      description: 'Oceń każdy obszar od 1 (brak pewności) do 5 (bardzo pewny/pewna).',
    },
    'wt_q45': {
      question: 'Czy jest coś jeszcze, co chciałbyś/chciałabyś, żeby Twój nauczyciel wiedział o Tobie lub Twojej nauce?',
      description: 'To jest opcjonalne - napisz cokolwiek, co uważasz za pomocne.',
    },
  },
  'Spanish': {
    'wt_q1': {
      question: '¿Cómo describirías tu inglés en este momento?',
      description: 'Elige la opción que mejor describa tu nivel actual.',
      options: [
        'Puedo manejar situaciones cotidianas básicas como pedir comida o preguntar direcciones',
        'Puedo tener conversaciones simples sobre temas familiares pero me cuesta con ideas complejas',
        'Puedo discutir la mayoría de los temas pero cometo errores gramaticales y a veces me falta vocabulario',
        'Hablo con fluidez en la mayoría de situaciones pero quiero sonar más natural y preciso',
        'Me siento cómodo en inglés pero quiero dominar el lenguaje avanzado/profesional',
      ],
    },
    'wt_q3': {
      question: '¿Cuál es tu razón principal para aprender inglés?',
      options: [
        'Lo necesito para mi trabajo - reuniones, correos, presentaciones',
        'Me estoy preparando para un examen (IELTS, Cambridge, etc.)',
        'Quiero viajar y comunicarme libremente',
        'Quiero ver películas/leer libros sin subtítulos',
        'Quiero sentirme seguro hablando con angloparlantes',
        'Avance profesional - necesito inglés para un ascenso',
        'Me voy a mudar a un país de habla inglesa',
      ],
    },
    'wt_q7': {
      question: '¿Cómo te sientes al cometer errores en inglés?',
      options: [
        'No me importa en absoluto - así es como se aprende',
        'Prefiero no hacerlo, pero puedo manejarlo',
        'Me siento avergonzado pero trato de seguir adelante',
        'Evito hablar porque tengo miedo de los errores',
        'Me frustro mucho conmigo mismo',
      ],
    },
    'wt_q41': {
      question: 'Si pudieras lograr UNA cosa en inglés en los próximos 3 meses, ¿qué sería?',
      description: 'Escribe libremente - no hay respuestas incorrectas.',
    },
  },
  'German': {
    'wt_q1': {
      question: 'Wie würden Sie Ihr Englisch jetzt beschreiben?',
      description: 'Wählen Sie die Option, die Ihr aktuelles Niveau am besten beschreibt.',
      options: [
        'Ich komme in einfachen Alltagssituationen zurecht, wie Essen bestellen oder nach dem Weg fragen',
        'Ich kann einfache Gespräche über vertraute Themen führen, habe aber Schwierigkeiten mit komplexen Ideen',
        'Ich kann die meisten Themen diskutieren, mache aber Grammatikfehler und mir fehlt manchmal Vokabular',
        'Ich spreche in den meisten Situationen fließend, möchte aber natürlicher und präziser klingen',
        'Ich fühle mich wohl auf Englisch, möchte aber fortgeschrittene/professionelle Sprache beherrschen',
      ],
    },
    'wt_q7': {
      question: 'Wie fühlen Sie sich, wenn Sie Fehler auf Englisch machen?',
      options: [
        'Es stört mich überhaupt nicht - so lernt man',
        'Ich mache lieber keine, aber ich komme damit zurecht',
        'Ich schäme mich, versuche aber weiterzumachen',
        'Ich vermeide das Sprechen, weil ich Angst vor Fehlern habe',
        'Ich bin sehr frustriert über mich selbst',
      ],
    },
  },
  'French': {
    'wt_q1': {
      question: 'Comment décririez-vous votre anglais en ce moment ?',
      description: 'Choisissez l\'option qui décrit le mieux votre niveau actuel.',
      options: [
        'Je peux gérer des situations quotidiennes simples comme commander à manger ou demander son chemin',
        'Je peux avoir des conversations simples sur des sujets familiers mais j\'ai du mal avec les idées complexes',
        'Je peux discuter de la plupart des sujets mais je fais des erreurs grammaticales et il me manque parfois du vocabulaire',
        'Je parle couramment dans la plupart des situations mais je veux paraître plus naturel et précis',
        'Je suis à l\'aise en anglais mais je veux maîtriser le langage avancé/professionnel',
      ],
    },
  },
  'Portuguese': {
    'wt_q1': {
      question: 'Como você descreveria seu inglês agora?',
      description: 'Escolha a opção que melhor descreve seu nível atual.',
      options: [
        'Consigo lidar com situações básicas do dia a dia como pedir comida ou pedir direções',
        'Consigo ter conversas simples sobre temas familiares mas tenho dificuldade com ideias complexas',
        'Consigo discutir a maioria dos assuntos mas cometo erros gramaticais e às vezes me falta vocabulário',
        'Falo fluentemente na maioria das situações mas quero soar mais natural e preciso',
        'Me sinto confortável em inglês mas quero dominar a linguagem avançada/profissional',
      ],
    },
  },
  'Italian': {
    'wt_q1': {
      question: 'Come descriveresti il tuo inglese in questo momento?',
      description: 'Scegli l\'opzione che descrive meglio il tuo livello attuale.',
      options: [
        'Riesco a gestire situazioni quotidiane di base come ordinare cibo o chiedere indicazioni',
        'Posso avere conversazioni semplici su argomenti familiari ma ho difficoltà con idee complesse',
        'Posso discutere la maggior parte degli argomenti ma faccio errori grammaticali e a volte mi manca il vocabolario',
        'Parlo fluentemente nella maggior parte delle situazioni ma voglio suonare più naturale e preciso',
        'Mi sento a mio agio in inglese ma voglio padroneggiare il linguaggio avanzato/professionale',
      ],
    },
  },
  'Turkish': {
    'wt_q1': {
      question: 'İngilizcenizi şu anda nasıl tanımlarsınız?',
      description: 'Mevcut seviyenizi en iyi tanımlayan seçeneği seçin.',
      options: [
        'Yemek sipariş etmek veya yol sormak gibi temel günlük durumları halledebiliyorum',
        'Tanıdık konularda basit konuşmalar yapabiliyorum ama karmaşık fikirlerle zorlanıyorum',
        'Çoğu konuyu tartışabiliyorum ama gramer hataları yapıyorum ve bazen kelime bilgim yetersiz kalıyor',
        'Çoğu durumda akıcı konuşuyorum ama daha doğal ve kesin olmak istiyorum',
        'İngilizce\'de rahatım ama ileri düzey/profesyonel dili ustalıkla kullanmak istiyorum',
      ],
    },
  },
  'Russian': {
    'wt_q1': {
      question: 'Как бы вы описали свой английский сейчас?',
      description: 'Выберите вариант, который лучше всего описывает ваш текущий уровень.',
      options: [
        'Я справляюсь с базовыми повседневными ситуациями, такими как заказ еды или вопрос о дороге',
        'Я могу вести простые разговоры на знакомые темы, но мне трудно со сложными идеями',
        'Я могу обсуждать большинство тем, но допускаю грамматические ошибки и иногда мне не хватает словарного запаса',
        'Я свободно говорю в большинстве ситуаций, но хочу звучать более естественно и точно',
        'Мне комфортно на английском, но я хочу освоить продвинутый/профессиональный язык',
      ],
    },
  },
  'Czech': {
    'wt_q1': {
      question: 'Jak byste popsali svou angličtinu právě teď?',
      description: 'Vyberte možnost, která nejlépe popisuje vaši současnou úroveň.',
      options: [
        'Zvládám základní každodenní situace jako objednání jídla nebo ptaní se na cestu',
        'Dokážu vést jednoduché rozhovory o známých tématech, ale mám potíže se složitými myšlenkami',
        'Dokážu diskutovat o většině témat, ale dělám gramatické chyby a někdy mi chybí slovní zásoba',
        'Mluvím plynule ve většině situací, ale chci znít přirozeněji a přesněji',
        'Cítím se pohodlně v angličtině, ale chci ovládnout pokročilý/profesionální jazyk',
      ],
    },
  },
  'Ukrainian': {
    'wt_q1': {
      question: 'Як би ви описали свою англійську зараз?',
      description: 'Виберіть варіант, який найкраще описує ваш поточний рівень.',
      options: [
        'Я справляюся з базовими повсякденними ситуаціями, такими як замовлення їжі або запитання про дорогу',
        'Я можу вести прості розмови на знайомі теми, але мені важко зі складними ідеями',
        'Я можу обговорювати більшість тем, але роблю граматичні помилки і іноді мені бракує словникового запасу',
        'Я вільно розмовляю в більшості ситуацій, але хочу звучати природніше і точніше',
        'Мені комфортно англійською, але я хочу опанувати просунуту/професійну мову',
      ],
    },
  },
};

/**
 * Get available translation languages
 */
export const TRANSLATION_LANGUAGES = Object.keys(WELCOME_TEST_TRANSLATIONS);

/**
 * Check if a question has translation in given language
 */
export function hasTranslation(questionId: string, language: string): boolean {
  return !!WELCOME_TEST_TRANSLATIONS[language]?.[questionId];
}

/**
 * Get translation for a question
 */
export function getTranslation(questionId: string, language: string): QuestionTranslation | null {
  return WELCOME_TEST_TRANSLATIONS[language]?.[questionId] || null;
}
