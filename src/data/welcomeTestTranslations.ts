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

// Helper type for all profiling question IDs that need translation
type TranslationSet = Record<string, QuestionTranslation>;

// Common question IDs that need translation (non-skill profiling questions):
// wt_q1-q13, wt_q14-q15, wt_q16-q17 (descriptions only), wt_q36, wt_q40-q45

const POLISH: TranslationSet = {
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
    options: ['Mniej niż 1 rok', '1-3 lata', '3-5 lat', '5-10 lat', 'Więcej niż 10 lat'],
  },
  'wt_q10': {
    question: 'Gdzie głównie uczyłeś/uczyłaś się angielskiego do tej pory?',
    description: 'Zaznacz wszystkie pasujące odpowiedzi.',
    options: [
      'Szkoła (jako przedmiot)', 'Uniwersytet', 'Prywatne lekcje z nauczycielem',
      'Szkoła językowa/kurs', 'Samodzielna nauka (aplikacje, książki, YouTube)',
      'Mieszkanie/praca w anglojęzycznym kraju', 'Przez pracę (codzienne używanie angielskiego)',
    ],
  },
  'wt_q11': {
    question: 'Czy kiedykolwiek zdawałeś/zdawałaś oficjalny egzamin z angielskiego?',
    options: ['Nie, nigdy', 'Tak - egzamin szkolny/uniwersytecki', 'Tak - Cambridge (FCE/CAE/CPE)', 'Tak - IELTS', 'Tak - TOEFL', 'Tak - inny'],
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
  'wt_q16': { question: 'Musisz opisać problem z pokojem hotelowym w recepcji.', description: 'Napisz 2-3 zdania wyjaśniając, że klimatyzacja w Twoim pokoju nie działa i chciałbyś/chciałabyś, żeby to naprawili lub żeby zmienić pokój.' },
  'wt_q17': { question: 'Jesteś na rozmowie o pracę i pytają "Opowiedz o wyzwaniu, z którym spotkałeś/spotkałaś się w pracy." Jak odpowiesz?', description: 'Napisz 3-4 zdania tak, jakbyś naprawdę był/była na rozmowie.' },
  'wt_q36': { question: 'Jak grzecznie odmówiłbyś/odmówiłabyś zaproszenia na imprezę kolegi z pracy?', description: 'Napisz 1-2 zdania.' },
  'wt_q40': { question: 'Przeczytaj te dwie wersje. Która brzmi lepiej i dlaczego?', description: 'Która wersja brzmi dla Ciebie lepiej i dlaczego? Napisz 1 zdanie.' },
  'wt_q41': { question: 'Gdybyś mógł/mogła osiągnąć JEDNĄ rzecz w angielskim w ciągu najbliższych 3 miesięcy, co by to było?', description: 'Pisz swobodnie - nie ma złych odpowiedzi.' },
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
    options: ['Technologia i innowacje', 'Biznes i finanse', 'Podróże i kultura', 'Zdrowie i styl życia', 'Nauka i przyroda', 'Rozrywka i kultura popularna', 'Sport', 'Jedzenie i gotowanie', 'Psychologia i samorozwój', 'Polityka i bieżące wydarzenia', 'Sztuka i literatura', 'Historia'],
  },
  'wt_q44': { question: 'Jak oceniłbyś/oceniłabyś swoją pewność siebie w tych obszarach?', description: 'Oceń każdy obszar od 1 (brak pewności) do 5 (bardzo pewny/pewna).' },
  'wt_q45': { question: 'Czy jest coś jeszcze, co chciałbyś/chciałabyś, żeby Twój nauczyciel wiedział o Tobie lub Twojej nauce?', description: 'To jest opcjonalne - napisz cokolwiek, co uważasz za pomocne.' },
};

const SPANISH: TranslationSet = {
  'wt_q1': { question: '¿Cómo describirías tu inglés en este momento?', description: 'Elige la opción que mejor describa tu nivel actual.', options: ['Puedo manejar situaciones cotidianas básicas como pedir comida o preguntar direcciones', 'Puedo tener conversaciones simples sobre temas familiares pero me cuesta con ideas complejas', 'Puedo discutir la mayoría de los temas pero cometo errores gramaticales y a veces me falta vocabulario', 'Hablo con fluidez en la mayoría de situaciones pero quiero sonar más natural y preciso', 'Me siento cómodo en inglés pero quiero dominar el lenguaje avanzado/profesional'] },
  'wt_q2': { question: '¿Qué es lo que más te frustra al hablar inglés?', description: 'Selecciona todas las que apliquen.', options: ['Sé lo que quiero decir pero no encuentro las palabras', 'Cometo errores gramaticales que sé que están mal', 'No entiendo a los nativos cuando hablan rápido', 'Me pongo nervioso y olvido todo lo que sé', 'No puedo expresar ideas complejas - simplifico demasiado', 'Mi pronunciación hace que me pidan repetir'] },
  'wt_q3': { question: '¿Cuál es tu razón principal para aprender inglés?', options: ['Lo necesito para mi trabajo - reuniones, correos, presentaciones', 'Me estoy preparando para un examen (IELTS, Cambridge, etc.)', 'Quiero viajar y comunicarme libremente', 'Quiero ver películas/leer libros sin subtítulos', 'Quiero sentirme seguro hablando con angloparlantes', 'Avance profesional - necesito inglés para un ascenso', 'Me voy a mudar a un país de habla inglesa'] },
  'wt_q4': { question: '¿Cómo reaccionas cuando no entiendes algo en inglés?', options: ['Pido que repitan o expliquen', 'Finjo que entendí y espero lo mejor', 'Intento adivinar por el contexto', 'Me estreso y cambio a mi idioma', 'Lo busco inmediatamente en el teléfono'] },
  'wt_q5': { question: '¿Cuánto tiempo puedes dedicar al inglés por semana (fuera de las clases)?', options: ['Casi nada - solo tengo tiempo de clase', '15-30 minutos varias veces por semana', 'Aproximadamente 1 hora repartida en la semana', '2-3 horas - estoy comprometido/a', 'Más de 3 horas - el inglés es mi prioridad'] },
  'wt_q6': { question: '¿Qué actividades de aprendizaje disfrutas? Selecciona todas las que apliquen.', options: ['Ver videos/películas en inglés', 'Leer artículos o libros', 'Tener conversaciones', 'Hacer ejercicios de gramática', 'Aprender vocabulario nuevo con tarjetas', 'Escuchar podcasts', 'Escribir textos (correos, historias)', 'Juegos de idiomas/cuestionarios', 'Cantar canciones en inglés'] },
  'wt_q7': { question: '¿Cómo te sientes al cometer errores en inglés?', options: ['No me importa en absoluto - así es como se aprende', 'Prefiero no hacerlo, pero puedo manejarlo', 'Me siento avergonzado pero trato de seguir adelante', 'Evito hablar porque tengo miedo de los errores', 'Me frustro mucho conmigo mismo'] },
  'wt_q8': { question: '¿Qué te ayuda más a recordar una palabra nueva?', options: ['Verla escrita con una definición', 'Escucharla en una oración', 'Usarla en mi propia oración de inmediato', 'Conectarla con una imagen', 'Repetirla muchas veces', 'Entender las partes de la palabra (prefijo, raíz, sufijo)'] },
  'wt_q9': { question: '¿Cuánto tiempo llevas aprendiendo inglés?', options: ['Menos de 1 año', '1-3 años', '3-5 años', '5-10 años', 'Más de 10 años'] },
  'wt_q10': { question: '¿Dónde has aprendido inglés principalmente?', description: 'Selecciona todas las que apliquen.', options: ['Escuela (como asignatura)', 'Universidad', 'Clases privadas con profesor', 'Escuela de idiomas/curso', 'Autoaprendizaje (apps, libros, YouTube)', 'Vivir/trabajar en un país angloparlante', 'A través del trabajo (uso diario del inglés)'] },
  'wt_q11': { question: '¿Has hecho algún examen oficial de inglés?', options: ['No, nunca', 'Sí - examen escolar/universitario', 'Sí - Cambridge (FCE/CAE/CPE)', 'Sí - IELTS', 'Sí - TOEFL', 'Sí - otro'] },
  'wt_q12': { question: '¿Cuál es el mayor desafío que has enfrentado aprendiendo inglés?', description: 'En 1-2 oraciones describe tu mayor frustración.' },
  'wt_q13': { question: '¿Hay algo que tus profesores anteriores hacían que funcionaba muy bien?', description: 'Cuéntanos qué métodos te ayudaron más.' },
  'wt_q14': { question: 'Estás en una cafetería en el extranjero. El barista te pregunta algo que no entiendes bien. ¿Qué haces?', options: ['Digo "Perdona, ¿podrías repetirlo?" e intento de nuevo', 'Señalo el menú y sonrío', 'Uso Google Translate en mi teléfono', 'Respondo con lo que creo que preguntaron'] },
  'wt_q15': { question: 'Tu colega anglófono te envía un email largo sobre un proyecto. Algunas partes no están claras. ¿Qué haces?', options: ['Lo leo cuidadosamente, busco palabras desconocidas y respondo', 'Respondo pidiendo que aclaren las partes confusas', 'Entiendo la mayoría y adivino el resto por contexto', 'Me cuesta entenderlo y necesito traducir la mayor parte', 'No intento entender, uso ChatGPT'] },
  'wt_q16': { question: 'Necesitas describir un problema con tu habitación de hotel en recepción.', description: 'Escribe 2-3 oraciones explicando que el aire acondicionado no funciona.' },
  'wt_q17': { question: 'Estás en una entrevista de trabajo y te preguntan "Cuéntame sobre un desafío en el trabajo." ¿Cómo respondes?', description: 'Escribe 3-4 oraciones como si estuvieras en la entrevista.' },
  'wt_q36': { question: '¿Cómo rechazarías educadamente una invitación a una fiesta de un compañero?', description: 'Escribe 1-2 oraciones.' },
  'wt_q40': { question: 'Lee estas dos versiones. ¿Cuál suena mejor y por qué?', description: '¿Cuál te suena mejor y por qué? Escribe 1 oración.' },
  'wt_q41': { question: 'Si pudieras lograr UNA cosa en inglés en los próximos 3 meses, ¿qué sería?', description: 'Escribe libremente - no hay respuestas incorrectas.' },
  'wt_q42': { question: '¿Cómo prefieres recibir retroalimentación sobre tus errores?', options: ['Corrígeme inmediatamente, siempre', 'Anótalos y discutamos al final', 'Solo corrige errores grandes, ignora los pequeños', 'Escribe correcciones para que las revise después', 'Prefiero autocorregirme con pistas'] },
  'wt_q43': { question: '¿Qué temas te interesan más? Elige hasta 3.', options: ['Tecnología e innovación', 'Negocios y finanzas', 'Viajes y cultura', 'Salud y estilo de vida', 'Ciencia y naturaleza', 'Entretenimiento y cultura pop', 'Deporte', 'Comida y cocina', 'Psicología y desarrollo personal', 'Política y actualidad', 'Arte y literatura', 'Historia'] },
  'wt_q44': { question: '¿Cómo calificarías tu confianza en estas áreas?', description: 'Califica cada área del 1 (sin confianza) al 5 (muy seguro/a).' },
  'wt_q45': { question: '¿Hay algo más que quieras que tu profesor sepa sobre ti o tu aprendizaje?', description: 'Es opcional - escribe lo que consideres útil.' },
};

const GERMAN: TranslationSet = {
  'wt_q1': { question: 'Wie würden Sie Ihr Englisch jetzt beschreiben?', description: 'Wählen Sie die Option, die Ihr aktuelles Niveau am besten beschreibt.', options: ['Ich komme in einfachen Alltagssituationen zurecht', 'Ich kann einfache Gespräche über vertraute Themen führen, habe aber Schwierigkeiten mit komplexen Ideen', 'Ich kann die meisten Themen diskutieren, mache aber Grammatikfehler und mir fehlt manchmal Vokabular', 'Ich spreche in den meisten Situationen fließend, möchte aber natürlicher klingen', 'Ich fühle mich wohl auf Englisch, möchte aber fortgeschrittene Sprache beherrschen'] },
  'wt_q2': { question: 'Was frustriert Sie am meisten beim Englischsprechen?', description: 'Wählen Sie alle zutreffenden aus.', options: ['Ich weiß, was ich sagen will, finde aber nicht die richtigen Worte', 'Ich mache Grammatikfehler, von denen ich weiß, dass sie falsch sind', 'Ich verstehe Muttersprachler nicht, wenn sie schnell sprechen', 'Ich werde nervös und vergesse alles', 'Ich kann komplexe Ideen nicht ausdrücken', 'Meine Aussprache lässt Leute mich bitten zu wiederholen'] },
  'wt_q3': { question: 'Was ist Ihr Hauptgrund Englisch zu lernen?', options: ['Ich brauche es für die Arbeit', 'Ich bereite mich auf eine Prüfung vor', 'Ich möchte reisen und frei kommunizieren', 'Ich möchte Filme/Bücher ohne Untertitel sehen', 'Ich möchte mich beim Sprechen sicher fühlen', 'Karriereförderung', 'Ich ziehe in ein englischsprachiges Land'] },
  'wt_q4': { question: 'Wie reagieren Sie, wenn Sie etwas auf Englisch nicht verstehen?', options: ['Ich bitte um Wiederholung oder Erklärung', 'Ich tue so, als hätte ich verstanden', 'Ich versuche aus dem Kontext zu erraten', 'Ich werde gestresst und wechsle zu meiner Sprache', 'Ich suche sofort auf dem Handy'] },
  'wt_q5': { question: 'Wie viel Zeit können Sie wöchentlich für Englisch aufwenden (außerhalb des Unterrichts)?', options: ['Fast keine - nur Unterrichtszeit', '15-30 Minuten mehrmals pro Woche', 'Etwa 1 Stunde verteilt auf die Woche', '2-3 Stunden - ich bin engagiert', 'Mehr als 3 Stunden - Englisch hat Priorität'] },
  'wt_q6': { question: 'Welche Lernaktivitäten gefallen Ihnen? Wählen Sie alle zutreffenden.', options: ['Videos/Filme auf Englisch schauen', 'Artikel oder Bücher lesen', 'Gespräche führen', 'Grammatikübungen', 'Neues Vokabular mit Karteikarten lernen', 'Podcasts hören', 'Texte schreiben (E-Mails, Geschichten)', 'Sprachspiele/Quiz', 'Englische Lieder singen'] },
  'wt_q7': { question: 'Wie fühlen Sie sich, wenn Sie Fehler auf Englisch machen?', options: ['Es stört mich überhaupt nicht - so lernt man', 'Ich mache lieber keine, aber ich komme damit zurecht', 'Ich schäme mich, versuche aber weiterzumachen', 'Ich vermeide das Sprechen aus Angst vor Fehlern', 'Ich bin sehr frustriert über mich selbst'] },
  'wt_q8': { question: 'Was hilft Ihnen am besten, ein neues Wort zu behalten?', options: ['Es aufgeschrieben mit Definition sehen', 'Es in einem Satz hören', 'Es sofort in einem eigenen Satz verwenden', 'Es mit einem Bild verbinden', 'Es oft wiederholen', 'Die Wortteile verstehen (Präfix, Stamm, Suffix)'] },
  'wt_q9': { question: 'Wie lange lernen Sie schon Englisch?', options: ['Weniger als 1 Jahr', '1-3 Jahre', '3-5 Jahre', '5-10 Jahre', 'Mehr als 10 Jahre'] },
  'wt_q10': { question: 'Wo haben Sie hauptsächlich Englisch gelernt?', options: ['Schule', 'Universität', 'Privatunterricht', 'Sprachschule/Kurs', 'Selbststudium (Apps, Bücher, YouTube)', 'Leben/Arbeiten im englischsprachigen Land', 'Durch die Arbeit'] },
  'wt_q11': { question: 'Haben Sie jemals eine offizielle Englischprüfung abgelegt?', options: ['Nein, nie', 'Ja - Schul-/Uniprüfung', 'Ja - Cambridge', 'Ja - IELTS', 'Ja - TOEFL', 'Ja - andere'] },
  'wt_q12': { question: 'Was ist die größte Herausforderung beim Englischlernen?', description: 'Beschreiben Sie in 1-2 Sätzen.' },
  'wt_q13': { question: 'Gab es etwas, das frühere Lehrer gut gemacht haben?', description: 'Welche Methoden haben Ihnen am besten geholfen?' },
  'wt_q14': { question: 'Sie sind in einem Café im Ausland. Der Barista fragt Sie etwas, das Sie nicht ganz verstehen. Was tun Sie?', options: ['Ich sage "Entschuldigung, könnten Sie das wiederholen?"', 'Ich zeige auf die Speisekarte und lächle', 'Ich benutze Google Translate', 'Ich antworte mit dem, was ich glaube gefragt wurde'] },
  'wt_q15': { question: 'Ihr englischsprachiger Kollege schickt eine lange E-Mail. Einige Teile sind unklar. Was tun Sie?', options: ['Ich lese sorgfältig, schlage Wörter nach und antworte', 'Ich bitte um Klärung der unklaren Teile', 'Ich verstehe das meiste und rate den Rest', 'Ich habe Schwierigkeiten und muss übersetzen', 'Ich benutze ChatGPT'] },
  'wt_q16': { question: 'Sie müssen ein Problem mit Ihrem Hotelzimmer an der Rezeption beschreiben.', description: 'Schreiben Sie 2-3 Sätze über die kaputte Klimaanlage.' },
  'wt_q17': { question: 'Im Vorstellungsgespräch: "Erzählen Sie von einer beruflichen Herausforderung."', description: 'Schreiben Sie 3-4 Sätze.' },
  'wt_q36': { question: 'Wie würden Sie höflich eine Einladung zur Büroparty ablehnen?', description: 'Schreiben Sie 1-2 Sätze.' },
  'wt_q41': { question: 'Wenn Sie in 3 Monaten EINE Sache auf Englisch erreichen könnten, was wäre das?', description: 'Schreiben Sie frei.' },
  'wt_q42': { question: 'Wie möchten Sie Feedback zu Ihren Fehlern erhalten?', options: ['Sofort korrigieren, jedes Mal', 'Notieren und am Ende besprechen', 'Nur große Fehler korrigieren', 'Korrekturen aufschreiben zum Nachschauen', 'Ich korrigiere mich lieber selbst mit Hinweisen'] },
  'wt_q43': { question: 'Welche Themen interessieren Sie am meisten? Wählen Sie bis zu 3.', options: ['Technologie & Innovation', 'Business & Finanzen', 'Reisen & Kultur', 'Gesundheit & Lebensstil', 'Wissenschaft & Natur', 'Unterhaltung & Popkultur', 'Sport', 'Essen & Kochen', 'Psychologie & Selbstentwicklung', 'Politik & Aktuelles', 'Kunst & Literatur', 'Geschichte'] },
  'wt_q44': { question: 'Wie bewerten Sie Ihr Selbstvertrauen in diesen Bereichen?', description: 'Bewerten Sie jeden Bereich von 1 (kein Vertrauen) bis 5 (sehr sicher).' },
  'wt_q45': { question: 'Gibt es noch etwas, das Ihr Lehrer über Sie wissen sollte?', description: 'Optional - schreiben Sie alles, was hilfreich sein könnte.' },
};

const FRENCH: TranslationSet = {
  'wt_q1': { question: 'Comment décririez-vous votre anglais en ce moment ?', description: "Choisissez l'option qui décrit le mieux votre niveau actuel.", options: ['Je gère les situations quotidiennes simples', 'Je peux avoir des conversations simples mais j\'ai du mal avec les idées complexes', 'Je peux discuter de la plupart des sujets mais je fais des erreurs', 'Je parle couramment mais je veux paraître plus naturel', 'Je suis à l\'aise mais je veux maîtriser le langage avancé'] },
  'wt_q2': { question: 'Qu\'est-ce qui vous frustre le plus en anglais ?', description: 'Sélectionnez tout ce qui s\'applique.', options: ['Je sais ce que je veux dire mais je ne trouve pas les mots', 'Je fais des erreurs de grammaire que je sais incorrectes', 'Je ne comprends pas les natifs quand ils parlent vite', 'Je deviens nerveux et j\'oublie tout', 'Je ne peux pas exprimer des idées complexes', 'Ma prononciation fait qu\'on me demande de répéter'] },
  'wt_q3': { question: 'Quelle est votre raison principale d\'apprendre l\'anglais ?', options: ['J\'en ai besoin pour le travail', 'Je prépare un examen', 'Je veux voyager et communiquer librement', 'Je veux regarder des films/lire sans sous-titres', 'Je veux me sentir confiant en parlant', 'Avancement de carrière', 'Je déménage dans un pays anglophone'] },
  'wt_q4': { question: 'Comment réagissez-vous quand vous ne comprenez pas quelque chose ?', options: ['Je demande de répéter ou expliquer', 'Je fais semblant d\'avoir compris', 'J\'essaie de deviner par le contexte', 'Je stresse et passe à ma langue', 'Je cherche immédiatement sur mon téléphone'] },
  'wt_q5': { question: 'Combien de temps pouvez-vous consacrer à l\'anglais par semaine ?', options: ['Presque rien - juste les cours', '15-30 minutes plusieurs fois par semaine', 'Environ 1 heure répartie sur la semaine', '2-3 heures - je suis motivé(e)', 'Plus de 3 heures - c\'est ma priorité'] },
  'wt_q6': { question: 'Quelles activités d\'apprentissage aimez-vous ?', options: ['Regarder des vidéos/films en anglais', 'Lire des articles ou livres', 'Avoir des conversations', 'Exercices de grammaire', 'Apprendre du vocabulaire avec des flashcards', 'Écouter des podcasts', 'Écrire des textes', 'Jeux de langue/quiz', 'Chanter des chansons en anglais'] },
  'wt_q7': { question: 'Comment vous sentez-vous en faisant des erreurs en anglais ?', options: ['Ça ne me dérange pas du tout', 'Je préfère ne pas en faire, mais ça va', 'Je suis gêné(e) mais j\'essaie de continuer', 'J\'évite de parler par peur des erreurs', 'Je suis très frustré(e)'] },
  'wt_q8': { question: 'Qu\'est-ce qui vous aide le mieux à retenir un mot nouveau ?', options: ['Le voir écrit avec une définition', 'L\'entendre dans une phrase', 'L\'utiliser dans ma propre phrase', 'Le relier à une image', 'Le répéter plusieurs fois', 'Comprendre les parties du mot'] },
  'wt_q9': { question: 'Depuis combien de temps apprenez-vous l\'anglais ?', options: ['Moins d\'1 an', '1-3 ans', '3-5 ans', '5-10 ans', 'Plus de 10 ans'] },
  'wt_q12': { question: 'Quel est le plus grand défi que vous avez rencontré ?', description: 'Décrivez en 1-2 phrases.' },
  'wt_q13': { question: 'Y a-t-il quelque chose que vos professeurs précédents faisaient bien ?', description: 'Quelles méthodes vous ont le mieux aidé ?' },
  'wt_q14': { question: 'Vous êtes dans un café à l\'étranger. Le barista vous demande quelque chose que vous ne comprenez pas. Que faites-vous ?', options: ['Je dis "Pardon, pourriez-vous répéter ?"', 'Je montre le menu et souris', 'J\'utilise Google Translate', 'Je réponds avec ce que je pense qu\'ils ont demandé'] },
  'wt_q41': { question: 'Si vous pouviez accomplir UNE chose en anglais dans les 3 prochains mois, ce serait quoi ?', description: 'Écrivez librement.' },
  'wt_q42': { question: 'Comment préférez-vous recevoir des retours sur vos erreurs ?', options: ['Corrigez-moi immédiatement, à chaque fois', 'Notez-les et discutons à la fin', 'Ne corrigez que les erreurs importantes', 'Écrivez les corrections pour que je les relise', 'Je préfère me corriger moi-même avec des indices'] },
  'wt_q43': { question: 'Quels sujets vous intéressent le plus ? Choisissez jusqu\'à 3.', options: ['Technologie et innovation', 'Business et finance', 'Voyages et culture', 'Santé et mode de vie', 'Science et nature', 'Divertissement et pop culture', 'Sport', 'Cuisine', 'Psychologie et développement personnel', 'Politique et actualités', 'Art et littérature', 'Histoire'] },
  'wt_q44': { question: 'Comment évaluez-vous votre confiance dans ces domaines ?', description: 'Notez chaque domaine de 1 (pas confiant) à 5 (très confiant).' },
  'wt_q45': { question: 'Y a-t-il autre chose que votre professeur devrait savoir ?', description: 'Optionnel - écrivez ce qui vous semble utile.' },
};

const PORTUGUESE: TranslationSet = {
  'wt_q1': { question: 'Como você descreveria seu inglês agora?', description: 'Escolha a opção que melhor descreve seu nível atual.', options: ['Consigo lidar com situações básicas do dia a dia', 'Consigo ter conversas simples mas tenho dificuldade com ideias complexas', 'Consigo discutir a maioria dos assuntos mas cometo erros gramaticais', 'Falo fluentemente na maioria das situações mas quero soar mais natural', 'Me sinto confortável mas quero dominar a linguagem avançada'] },
  'wt_q2': { question: 'O que mais te frustra ao falar inglês?', options: ['Sei o que quero dizer mas não encontro as palavras', 'Cometo erros gramaticais que sei que estão errados', 'Não entendo nativos quando falam rápido', 'Fico nervoso e esqueço tudo', 'Não consigo expressar ideias complexas', 'Minha pronúncia faz as pessoas pedirem para repetir'] },
  'wt_q3': { question: 'Qual é sua razão principal para aprender inglês?', options: ['Preciso para o trabalho', 'Estou me preparando para um exame', 'Quero viajar e me comunicar livremente', 'Quero assistir filmes/ler livros sem legendas', 'Quero me sentir confiante falando', 'Avanço na carreira', 'Vou me mudar para um país anglófono'] },
  'wt_q7': { question: 'Como você se sente ao cometer erros em inglês?', options: ['Não me importo - é assim que se aprende', 'Prefiro não cometer, mas consigo lidar', 'Me sinto envergonhado mas tento continuar', 'Evito falar por medo de erros', 'Fico muito frustrado comigo mesmo'] },
  'wt_q41': { question: 'Se pudesse alcançar UMA coisa em inglês nos próximos 3 meses, o que seria?', description: 'Escreva livremente.' },
  'wt_q42': { question: 'Como prefere receber feedback sobre seus erros?', options: ['Corrija-me imediatamente, sempre', 'Anote e vamos discutir no final', 'Corrija apenas erros grandes', 'Escreva correções para eu revisar depois', 'Prefiro me autocorrigir com dicas'] },
  'wt_q43': { question: 'Quais temas mais te interessam? Escolha até 3.', options: ['Tecnologia e inovação', 'Negócios e finanças', 'Viagens e cultura', 'Saúde e estilo de vida', 'Ciência e natureza', 'Entretenimento e cultura pop', 'Esporte', 'Comida e culinária', 'Psicologia e desenvolvimento pessoal', 'Política e atualidades', 'Arte e literatura', 'História'] },
  'wt_q44': { question: 'Como você avaliaria sua confiança nessas áreas?', description: 'Avalie cada área de 1 (sem confiança) a 5 (muito confiante).' },
  'wt_q45': { question: 'Há algo mais que gostaria que seu professor soubesse?', description: 'Opcional - escreva o que achar útil.' },
};

const ITALIAN: TranslationSet = {
  'wt_q1': { question: 'Come descriveresti il tuo inglese in questo momento?', description: "Scegli l'opzione che descrive meglio il tuo livello attuale.", options: ['Riesco a gestire situazioni quotidiane di base', 'Posso avere conversazioni semplici ma ho difficoltà con idee complesse', 'Posso discutere la maggior parte degli argomenti ma faccio errori grammaticali', 'Parlo fluentemente ma voglio suonare più naturale', 'Mi sento a mio agio ma voglio padroneggiare il linguaggio avanzato'] },
  'wt_q2': { question: 'Cosa ti frustra di più quando parli inglese?', options: ['So cosa voglio dire ma non trovo le parole', 'Faccio errori grammaticali che so essere sbagliati', 'Non capisco i madrelingua quando parlano veloce', 'Mi agito e dimentico tutto', 'Non riesco ad esprimere idee complesse', 'La mia pronuncia fa sì che mi chiedano di ripetere'] },
  'wt_q3': { question: 'Qual è il motivo principale per cui studi inglese?', options: ['Ne ho bisogno per lavoro', 'Mi sto preparando per un esame', 'Voglio viaggiare e comunicare liberamente', 'Voglio guardare film/leggere libri senza sottotitoli', 'Voglio sentirmi sicuro parlando', 'Avanzamento di carriera', 'Mi trasferisco in un paese anglofono'] },
  'wt_q7': { question: 'Come ti senti quando fai errori in inglese?', options: ['Non mi importa per niente - si impara così', 'Preferisco non farli, ma ci convivo', 'Mi vergogno ma cerco di andare avanti', 'Evito di parlare per paura degli errori', 'Mi frustro molto'] },
  'wt_q41': { question: 'Se potessi raggiungere UNA cosa in inglese nei prossimi 3 mesi, cosa sarebbe?', description: 'Scrivi liberamente.' },
  'wt_q42': { question: 'Come preferisci ricevere feedback sui tuoi errori?', options: ['Correggimi subito, ogni volta', 'Annotali e discutiamone alla fine', 'Correggi solo gli errori grandi', 'Scrivi le correzioni per rivederle dopo', 'Preferisco autocorreggermi con suggerimenti'] },
  'wt_q43': { question: 'Quali argomenti ti interessano di più? Scegli fino a 3.', options: ['Tecnologia e innovazione', 'Business e finanza', 'Viaggi e cultura', 'Salute e stile di vita', 'Scienza e natura', 'Intrattenimento e cultura pop', 'Sport', 'Cibo e cucina', 'Psicologia e crescita personale', 'Politica e attualità', 'Arte e letteratura', 'Storia'] },
  'wt_q45': { question: "C'è qualcos'altro che vorresti che il tuo insegnante sapesse?", description: 'Opzionale - scrivi ciò che ritieni utile.' },
};

const TURKISH: TranslationSet = {
  'wt_q1': { question: 'İngilizcenizi şu anda nasıl tanımlarsınız?', description: 'Mevcut seviyenizi en iyi tanımlayan seçeneği seçin.', options: ['Temel günlük durumları halledebiliyorum', 'Tanıdık konularda basit konuşmalar yapabiliyorum ama karmaşık fikirlerle zorlanıyorum', 'Çoğu konuyu tartışabiliyorum ama gramer hataları yapıyorum', 'Çoğu durumda akıcı konuşuyorum ama daha doğal olmak istiyorum', "İngilizce'de rahatım ama ileri düzey dili ustalıkla kullanmak istiyorum"] },
  'wt_q3': { question: 'İngilizce öğrenmenizin ana nedeni nedir?', options: ['İş için ihtiyacım var', 'Bir sınava hazırlanıyorum', 'Seyahat etmek ve özgürce iletişim kurmak istiyorum', 'Film izlemek/kitap okumak istiyorum', 'Konuşurken kendimi güvende hissetmek istiyorum', 'Kariyer gelişimi', 'İngilizce konuşulan bir ülkeye taşınıyorum'] },
  'wt_q7': { question: 'İngilizce hata yaptığınızda nasıl hissedersiniz?', options: ['Hiç umursamıyorum - böyle öğrenilir', 'Yapmamayı tercih ederim ama başa çıkabilirim', 'Utanıyorum ama devam etmeye çalışıyorum', 'Hata korkusuyla konuşmaktan kaçınıyorum', 'Kendime çok kızıyorum'] },
  'wt_q41': { question: 'Önümüzdeki 3 ayda İngilizce\'de BİR şey başarabilseydiniz, ne olurdu?', description: 'Özgürce yazın.' },
  'wt_q42': { question: 'Hatalarınız hakkında geri bildirim almayı nasıl tercih edersiniz?', options: ['Her seferinde hemen düzeltin', 'Not alın ve sonunda tartışalım', 'Sadece büyük hataları düzeltin', 'Düzeltmeleri yazın, sonra gözden geçireyim', 'İpuçlarıyla kendim düzeltmeyi tercih ederim'] },
  'wt_q43': { question: 'Hangi konular sizi en çok ilgilendiriyor? 3 taneye kadar seçin.', options: ['Teknoloji ve inovasyon', 'İş ve finans', 'Seyahat ve kültür', 'Sağlık ve yaşam tarzı', 'Bilim ve doğa', 'Eğlence ve popüler kültür', 'Spor', 'Yemek ve mutfak', 'Psikoloji ve kişisel gelişim', 'Politika ve güncel olaylar', 'Sanat ve edebiyat', 'Tarih'] },
  'wt_q45': { question: 'Öğretmeninizin bilmesini istediğiniz başka bir şey var mı?', description: 'İsteğe bağlı - yardımcı olacağını düşündüğünüz her şeyi yazın.' },
};

const RUSSIAN: TranslationSet = {
  'wt_q1': { question: 'Как бы вы описали свой английский сейчас?', description: 'Выберите вариант, который лучше всего описывает ваш текущий уровень.', options: ['Я справляюсь с базовыми повседневными ситуациями', 'Я могу вести простые разговоры, но мне трудно со сложными идеями', 'Я могу обсуждать большинство тем, но допускаю грамматические ошибки', 'Я свободно говорю, но хочу звучать более естественно', 'Мне комфортно, но я хочу освоить продвинутый язык'] },
  'wt_q3': { question: 'Какова ваша основная причина изучения английского?', options: ['Мне нужен для работы', 'Готовлюсь к экзамену', 'Хочу путешествовать и свободно общаться', 'Хочу смотреть фильмы/читать без субтитров', 'Хочу чувствовать себя уверенно', 'Карьерный рост', 'Переезжаю в англоязычную страну'] },
  'wt_q7': { question: 'Как вы себя чувствуете, делая ошибки на английском?', options: ['Меня это совсем не беспокоит - так учатся', 'Предпочитаю не делать, но справляюсь', 'Мне неловко, но я стараюсь продолжать', 'Избегаю говорить из-за страха ошибок', 'Очень расстраиваюсь'] },
  'wt_q41': { question: 'Если бы вы могли достичь ОДНОГО в английском за 3 месяца, что бы это было?', description: 'Пишите свободно.' },
  'wt_q42': { question: 'Как вы предпочитаете получать обратную связь об ошибках?', options: ['Исправляйте сразу, каждый раз', 'Запишите и обсудим в конце', 'Исправляйте только серьёзные ошибки', 'Напишите исправления для просмотра', 'Предпочитаю самокоррекцию с подсказками'] },
  'wt_q43': { question: 'Какие темы вас интересуют больше всего? Выберите до 3.', options: ['Технологии и инновации', 'Бизнес и финансы', 'Путешествия и культура', 'Здоровье и образ жизни', 'Наука и природа', 'Развлечения и поп-культура', 'Спорт', 'Еда и кулинария', 'Психология и саморазвитие', 'Политика и текущие события', 'Искусство и литература', 'История'] },
  'wt_q45': { question: 'Есть ли что-то ещё, что вы хотели бы сообщить преподавателю?', description: 'Необязательно - напишите всё, что считаете полезным.' },
};

const CZECH: TranslationSet = {
  'wt_q1': { question: 'Jak byste popsali svou angličtinu právě teď?', description: 'Vyberte možnost, která nejlépe popisuje vaši současnou úroveň.', options: ['Zvládám základní každodenní situace', 'Dokážu vést jednoduché rozhovory, ale mám potíže se složitými myšlenkami', 'Dokážu diskutovat o většině témat, ale dělám gramatické chyby', 'Mluvím plynule, ale chci znít přirozeněji', 'Cítím se pohodlně, ale chci ovládnout pokročilý jazyk'] },
  'wt_q7': { question: 'Jak se cítíte, když děláte chyby v angličtině?', options: ['Vůbec mi to nevadí - tak se učíme', 'Raději bych je nedělal/a, ale zvládnu to', 'Stydím se, ale snažím se pokračovat', 'Vyhýbám se mluvení kvůli strachu z chyb', 'Hodně se na sebe zlobím'] },
  'wt_q41': { question: 'Kdybyste mohli dosáhnout JEDNÉ věci v angličtině za 3 měsíce, co by to bylo?', description: 'Pište svobodně.' },
  'wt_q42': { question: 'Jak preferujete dostávat zpětnou vazbu na své chyby?', options: ['Opravte mě okamžitě, pokaždé', 'Zapište si je a probereme na konci', 'Opravujte jen velké chyby', 'Napište opravy, abych si je přečetl/a', 'Raději se opravuji sám/sama s nápovědami'] },
  'wt_q43': { question: 'Jaká témata vás zajímají nejvíce? Vyberte až 3.', options: ['Technologie a inovace', 'Business a finance', 'Cestování a kultura', 'Zdraví a životní styl', 'Věda a příroda', 'Zábava a popkultura', 'Sport', 'Jídlo a vaření', 'Psychologie a osobní rozvoj', 'Politika a aktuální dění', 'Umění a literatura', 'Historie'] },
  'wt_q45': { question: 'Je ještě něco, co byste chtěli, aby váš učitel věděl?', description: 'Volitelné - napište cokoli, co považujete za užitečné.' },
};

const UKRAINIAN: TranslationSet = {
  'wt_q1': { question: 'Як би ви описали свою англійську зараз?', description: 'Виберіть варіант, який найкраще описує ваш поточний рівень.', options: ['Я справляюся з базовими повсякденними ситуаціями', 'Я можу вести прості розмови, але мені складно зі складними ідеями', 'Я можу обговорювати більшість тем, але роблю граматичні помилки', 'Я вільно розмовляю, але хочу звучати природніше', 'Мені комфортно, але я хочу опанувати просунуту мову'] },
  'wt_q7': { question: 'Як ви почуваєтеся, коли робите помилки англійською?', options: ['Мене це зовсім не турбує - так навчаються', 'Краще б не робив/ла, але справляюся', 'Мені ніяково, але я намагаюся продовжувати', 'Уникаю розмов через страх помилок', 'Дуже засмучуюся'] },
  'wt_q41': { question: 'Якби ви могли досягти ОДНОГО в англійській за 3 місяці, що б це було?', description: 'Пишіть вільно.' },
  'wt_q42': { question: 'Як ви віддаєте перевагу отримувати зворотний зв\'язок про помилки?', options: ['Виправляйте одразу, кожного разу', 'Запишіть і обговоримо наприкінці', 'Виправляйте лише серйозні помилки', 'Напишіть виправлення для перегляду', 'Волію самокорекцію з підказками'] },
  'wt_q43': { question: 'Які теми вас цікавлять найбільше? Виберіть до 3.', options: ['Технології та інновації', 'Бізнес і фінанси', 'Подорожі та культура', "Здоров'я та спосіб життя", 'Наука та природа', 'Розваги та поп-культура', 'Спорт', 'Їжа та кулінарія', 'Психологія та саморозвиток', 'Політика та поточні події', 'Мистецтво та література', 'Історія'] },
  'wt_q45': { question: 'Чи є щось ще, що ви хотіли б, щоб ваш викладач знав?', description: 'Необов\'язково - напишіть все, що вважаєте корисним.' },
};

export const WELCOME_TEST_TRANSLATIONS: Record<string, TranslationSet> = {
  'Polish': POLISH,
  'Spanish': SPANISH,
  'German': GERMAN,
  'French': FRENCH,
  'Portuguese': PORTUGUESE,
  'Italian': ITALIAN,
  'Turkish': TURKISH,
  'Russian': RUSSIAN,
  'Czech': CZECH,
  'Ukrainian': UKRAINIAN,
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
