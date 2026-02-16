/**
 * Welcome Test Translations
 * Static translations for non-skill questions only (About You, Experience, Goals, Scenarios descriptions)
 * Grammar/vocabulary test items are NOT translated (they test English knowledge)
 * 
 * Top 10 languages: Polish, Spanish, German, French, Portuguese, Italian, Turkish, Russian, Czech, Ukrainian
 * All languages have FULL coverage matching Polish.
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
  'wt_q4': { question: 'Jak zwykle reagujesz, gdy nie rozumiesz czegoś po angielsku?', options: ['Proszę osobę o powtórzenie lub wyjaśnienie', 'Udaję, że zrozumiałem/zrozumiałam i mam nadzieję na najlepsze', 'Próbuję zgadnąć z kontekstu', 'Stresuję się i przechodzę na swój język', 'Od razu szukam na telefonie'] },
  'wt_q5': { question: 'Ile czasu realistycznie możesz poświęcić na angielski tygodniowo (poza lekcjami)?', options: ['Prawie wcale - mam tylko czas na lekcje', '15-30 minut kilka razy w tygodniu', 'Około 1 godziny rozłożonej na tydzień', '2-3 godziny - jestem zaangażowany/a', 'Więcej niż 3 godziny - angielski jest moim priorytetem'] },
  'wt_q6': { question: 'Które z tych aktywności do nauki lubisz? Zaznacz wszystkie pasujące.', options: ['Oglądanie filmów/wideo po angielsku', 'Czytanie artykułów lub książek', 'Prowadzenie rozmów', 'Ćwiczenia gramatyczne', 'Nauka nowego słownictwa z fiszkami', 'Słuchanie podcastów', 'Pisanie tekstów (maile, opowiadania)', 'Gry językowe/quizy', 'Śpiewanie piosenek po angielsku'] },
  'wt_q7': { question: 'Jak się czujesz, robiąc błędy po angielsku?', options: ['Wcale mi to nie przeszkadza - tak się uczymy', 'Wolę ich nie robić, ale dam sobie radę', 'Czuję się zawstydzony/a, ale staram się przejść przez to', 'Unikam mówienia, bo boję się błędów', 'Bardzo się frustruję'] },
  'wt_q8': { question: 'Kiedy uczysz się nowego słowa, co pomaga Ci je najlepiej zapamiętać?', options: ['Widzenie go zapisanego z definicją', 'Słyszenie go w zdaniu', 'Użycie go w swoim własnym zdaniu od razu', 'Połączenie go z obrazkiem', 'Powtarzanie wiele razy', 'Zrozumienie części słowa (prefiks, rdzeń, sufiks)'] },
  'wt_q9': { question: 'Jak długo uczysz się angielskiego?', options: ['Mniej niż 1 rok', '1-3 lata', '3-5 lat', '5-10 lat', 'Więcej niż 10 lat'] },
  'wt_q10': { question: 'Gdzie głównie uczyłeś/uczyłaś się angielskiego do tej pory?', description: 'Zaznacz wszystkie pasujące odpowiedzi.', options: ['Szkoła (jako przedmiot)', 'Uniwersytet', 'Prywatne lekcje z nauczycielem', 'Szkoła językowa/kurs', 'Samodzielna nauka (aplikacje, książki, YouTube)', 'Mieszkanie/praca w anglojęzycznym kraju', 'Przez pracę (codzienne używanie angielskiego)'] },
  'wt_q11': { question: 'Czy kiedykolwiek zdawałeś/zdawałaś oficjalny egzamin z angielskiego?', options: ['Nie, nigdy', 'Tak - egzamin szkolny/uniwersytecki', 'Tak - Cambridge (FCE/CAE/CPE)', 'Tak - IELTS', 'Tak - TOEFL', 'Tak - inny'] },
  'wt_q12': { question: 'Jakie jest największe wyzwanie, z którym spotkałeś/spotkałaś się ucząc angielskiego?', description: 'W 1-2 zdaniach opisz swoją największą frustrację lub wyzwanie z angielskim.' },
  'wt_q13': { question: 'Czy jest coś konkretnego, co Twoi poprzedni nauczyciele robili, co naprawdę dobrze działało?', description: 'Powiedz nam, jakie metody lub podejścia pomogły Ci uczyć się najlepiej.' },
  'wt_q14': { question: 'Jesteś w kawiarni za granicą. Barista pyta Cię o coś, czego nie do końca rozumiesz. Co robisz?', options: ['Mówię "Przepraszam, czy mógłbyś/mogłabyś powtórzyć?" i próbuję ponownie', 'Po prostu wskazuję na menu i uśmiecham się', 'Używam Google Translate na telefonie', 'Odpowiadam tym, co myślę, że zapytali'] },
  'wt_q15': { question: 'Twój anglojęzyczny kolega wysyła Ci długiego maila o projekcie. Niektóre części są niejasne. Co robisz?', options: ['Czytam go uważnie, szukam nieznanych słów i odpowiadam', 'Odpisuję prosząc o wyjaśnienie niejasnych części', 'Rozumiem większość i zgaduję resztę z kontekstu', 'Mam problem ze zrozumieniem i muszę przetłumaczyć większość', 'Nie próbuję rozumieć, używam ChatGPT'] },
  'wt_q16': { question: 'Musisz opisać problem z pokojem hotelowym w recepcji.', description: 'Napisz 2-3 zdania wyjaśniając, że klimatyzacja w Twoim pokoju nie działa i chciałbyś/chciałabyś, żeby to naprawili lub żeby zmienić pokój.' },
  'wt_q17': { question: 'Jesteś na rozmowie o pracę i pytają "Opowiedz o wyzwaniu, z którym spotkałeś/spotkałaś się w pracy." Jak odpowiesz?', description: 'Napisz 3-4 zdania tak, jakbyś naprawdę był/była na rozmowie.' },
  'wt_q36': { question: 'Jak grzecznie odmówiłbyś/odmówiłabyś zaproszenia na imprezę kolegi z pracy?', description: 'Napisz 1-2 zdania.' },
  'wt_q40': { question: 'Przeczytaj te dwie wersje. Która brzmi lepiej i dlaczego?', description: 'Która wersja brzmi dla Ciebie lepiej i dlaczego? Napisz 1 zdanie.' },
  'wt_q41': { question: 'Gdybyś mógł/mogła osiągnąć JEDNĄ rzecz w angielskim w ciągu najbliższych 3 miesięcy, co by to było?', description: 'Pisz swobodnie - nie ma złych odpowiedzi.' },
  'wt_q42': { question: 'Jak wolisz otrzymywać informację zwrotną o swoich błędach?', options: ['Poprawiaj mnie natychmiast, za każdym razem', 'Zanotuj je i omówmy na koniec', 'Poprawiaj tylko duże błędy, ignoruj małe', 'Napisz korekty, żebym mógł/mogła je później przejrzeć', 'Wolę sam/sama się poprawiać z podpowiedziami'] },
  'wt_q43': { question: 'Jakie tematy interesują Cię najbardziej? Wybierz do 3.', options: ['Technologia i innowacje', 'Biznes i finanse', 'Podróże i kultura', 'Zdrowie i styl życia', 'Nauka i przyroda', 'Rozrywka i kultura popularna', 'Sport', 'Jedzenie i gotowanie', 'Psychologia i samorozwój', 'Polityka i bieżące wydarzenia', 'Sztuka i literatura', 'Historia'] },
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
  'wt_q3': { question: 'Was ist Ihr Hauptgrund Englisch zu lernen?', options: ['Ich brauche es für die Arbeit - Meetings, E-Mails, Präsentationen', 'Ich bereite mich auf eine Prüfung vor (IELTS, Cambridge usw.)', 'Ich möchte reisen und frei kommunizieren', 'Ich möchte Filme/Bücher ohne Untertitel sehen/lesen', 'Ich möchte mich beim Sprechen mit Englischsprachigen sicher fühlen', 'Karriereförderung - ich brauche Englisch für eine Beförderung', 'Ich ziehe in ein englischsprachiges Land'] },
  'wt_q4': { question: 'Wie reagieren Sie, wenn Sie etwas auf Englisch nicht verstehen?', options: ['Ich bitte um Wiederholung oder Erklärung', 'Ich tue so, als hätte ich verstanden', 'Ich versuche aus dem Kontext zu erraten', 'Ich werde gestresst und wechsle zu meiner Sprache', 'Ich suche sofort auf dem Handy'] },
  'wt_q5': { question: 'Wie viel Zeit können Sie wöchentlich für Englisch aufwenden (außerhalb des Unterrichts)?', options: ['Fast keine - nur Unterrichtszeit', '15-30 Minuten mehrmals pro Woche', 'Etwa 1 Stunde verteilt auf die Woche', '2-3 Stunden - ich bin engagiert', 'Mehr als 3 Stunden - Englisch hat Priorität'] },
  'wt_q6': { question: 'Welche Lernaktivitäten gefallen Ihnen? Wählen Sie alle zutreffenden.', options: ['Videos/Filme auf Englisch schauen', 'Artikel oder Bücher lesen', 'Gespräche führen', 'Grammatikübungen', 'Neues Vokabular mit Karteikarten lernen', 'Podcasts hören', 'Texte schreiben (E-Mails, Geschichten)', 'Sprachspiele/Quiz', 'Englische Lieder singen'] },
  'wt_q7': { question: 'Wie fühlen Sie sich, wenn Sie Fehler auf Englisch machen?', options: ['Es stört mich überhaupt nicht - so lernt man', 'Ich mache lieber keine, aber ich komme damit zurecht', 'Ich schäme mich, versuche aber weiterzumachen', 'Ich vermeide das Sprechen aus Angst vor Fehlern', 'Ich bin sehr frustriert über mich selbst'] },
  'wt_q8': { question: 'Was hilft Ihnen am besten, ein neues Wort zu behalten?', options: ['Es aufgeschrieben mit Definition sehen', 'Es in einem Satz hören', 'Es sofort in einem eigenen Satz verwenden', 'Es mit einem Bild verbinden', 'Es oft wiederholen', 'Die Wortteile verstehen (Präfix, Stamm, Suffix)'] },
  'wt_q9': { question: 'Wie lange lernen Sie schon Englisch?', options: ['Weniger als 1 Jahr', '1-3 Jahre', '3-5 Jahre', '5-10 Jahre', 'Mehr als 10 Jahre'] },
  'wt_q10': { question: 'Wo haben Sie hauptsächlich Englisch gelernt?', description: 'Wählen Sie alle zutreffenden.', options: ['Schule (als Fach)', 'Universität', 'Privatunterricht mit Lehrer', 'Sprachschule/Kurs', 'Selbststudium (Apps, Bücher, YouTube)', 'Leben/Arbeiten im englischsprachigen Land', 'Durch die Arbeit (täglicher Gebrauch)'] },
  'wt_q11': { question: 'Haben Sie jemals eine offizielle Englischprüfung abgelegt?', options: ['Nein, nie', 'Ja - Schul-/Uniprüfung', 'Ja - Cambridge (FCE/CAE/CPE)', 'Ja - IELTS', 'Ja - TOEFL', 'Ja - andere'] },
  'wt_q12': { question: 'Was ist die größte Herausforderung beim Englischlernen?', description: 'Beschreiben Sie in 1-2 Sätzen Ihre größte Frustration.' },
  'wt_q13': { question: 'Gab es etwas, das frühere Lehrer besonders gut gemacht haben?', description: 'Welche Methoden haben Ihnen am besten geholfen?' },
  'wt_q14': { question: 'Sie sind in einem Café im Ausland. Der Barista fragt Sie etwas, das Sie nicht ganz verstehen. Was tun Sie?', options: ['Ich sage "Entschuldigung, könnten Sie das wiederholen?" und versuche es erneut', 'Ich zeige auf die Speisekarte und lächle', 'Ich benutze Google Translate auf meinem Handy', 'Ich antworte mit dem, was ich glaube, dass gefragt wurde'] },
  'wt_q15': { question: 'Ihr englischsprachiger Kollege schickt eine lange E-Mail über ein Projekt. Einige Teile sind unklar. Was tun Sie?', options: ['Ich lese sorgfältig, schlage Wörter nach und antworte', 'Ich bitte um Klärung der unklaren Teile', 'Ich verstehe das meiste und rate den Rest aus dem Kontext', 'Ich habe Schwierigkeiten und muss das meiste übersetzen', 'Ich versuche es nicht zu verstehen, ich benutze ChatGPT'] },
  'wt_q16': { question: 'Sie müssen ein Problem mit Ihrem Hotelzimmer an der Rezeption beschreiben.', description: 'Schreiben Sie 2-3 Sätze, in denen Sie erklären, dass die Klimaanlage nicht funktioniert.' },
  'wt_q17': { question: 'Im Vorstellungsgespräch werden Sie gefragt: "Erzählen Sie von einer beruflichen Herausforderung." Wie antworten Sie?', description: 'Schreiben Sie 3-4 Sätze, als wären Sie wirklich im Gespräch.' },
  'wt_q36': { question: 'Wie würden Sie höflich eine Einladung zur Party eines Kollegen ablehnen?', description: 'Schreiben Sie 1-2 Sätze.' },
  'wt_q40': { question: 'Lesen Sie diese zwei Versionen. Welche klingt besser und warum?', description: 'Welche Version klingt für Sie besser und warum? Schreiben Sie 1 Satz.' },
  'wt_q41': { question: 'Wenn Sie in 3 Monaten EINE Sache auf Englisch erreichen könnten, was wäre das?', description: 'Schreiben Sie frei - es gibt keine falschen Antworten.' },
  'wt_q42': { question: 'Wie möchten Sie Feedback zu Ihren Fehlern erhalten?', options: ['Sofort korrigieren, jedes Mal', 'Notieren und am Ende besprechen', 'Nur große Fehler korrigieren, kleine ignorieren', 'Korrekturen aufschreiben zum späteren Nachschauen', 'Ich korrigiere mich lieber selbst mit Hinweisen'] },
  'wt_q43': { question: 'Welche Themen interessieren Sie am meisten? Wählen Sie bis zu 3.', options: ['Technologie & Innovation', 'Business & Finanzen', 'Reisen & Kultur', 'Gesundheit & Lebensstil', 'Wissenschaft & Natur', 'Unterhaltung & Popkultur', 'Sport', 'Essen & Kochen', 'Psychologie & Selbstentwicklung', 'Politik & Aktuelles', 'Kunst & Literatur', 'Geschichte'] },
  'wt_q44': { question: 'Wie bewerten Sie Ihr Selbstvertrauen in diesen Bereichen?', description: 'Bewerten Sie jeden Bereich von 1 (kein Vertrauen) bis 5 (sehr sicher).' },
  'wt_q45': { question: 'Gibt es noch etwas, das Ihr Lehrer über Sie oder Ihr Lernen wissen sollte?', description: 'Optional - schreiben Sie alles, was hilfreich sein könnte.' },
};

const FRENCH: TranslationSet = {
  'wt_q1': { question: 'Comment décririez-vous votre anglais en ce moment ?', description: "Choisissez l'option qui décrit le mieux votre niveau actuel.", options: ['Je gère les situations quotidiennes simples comme commander ou demander mon chemin', 'Je peux avoir des conversations simples mais j\'ai du mal avec les idées complexes', 'Je peux discuter de la plupart des sujets mais je fais des erreurs grammaticales', 'Je parle couramment dans la plupart des situations mais je veux paraître plus naturel', 'Je suis à l\'aise en anglais mais je veux maîtriser le langage avancé/professionnel'] },
  'wt_q2': { question: 'Qu\'est-ce qui vous frustre le plus quand vous parlez anglais ?', description: 'Sélectionnez tout ce qui s\'applique.', options: ['Je sais ce que je veux dire mais je ne trouve pas les mots', 'Je fais des erreurs de grammaire que je sais incorrectes', 'Je ne comprends pas les natifs quand ils parlent vite', 'Je deviens nerveux et j\'oublie tout ce que je sais', 'Je ne peux pas exprimer des idées complexes - je simplifie trop', 'Ma prononciation fait qu\'on me demande de répéter'] },
  'wt_q3': { question: 'Quelle est votre raison principale d\'apprendre l\'anglais ?', options: ['J\'en ai besoin pour le travail - réunions, e-mails, présentations', 'Je prépare un examen (IELTS, Cambridge, etc.)', 'Je veux voyager et communiquer librement', 'Je veux regarder des films/lire des livres sans sous-titres', 'Je veux me sentir confiant en parlant avec des anglophones', 'Avancement de carrière - j\'ai besoin de l\'anglais pour une promotion', 'Je déménage dans un pays anglophone'] },
  'wt_q4': { question: 'Comment réagissez-vous quand vous ne comprenez pas quelque chose en anglais ?', options: ['Je demande de répéter ou d\'expliquer', 'Je fais semblant d\'avoir compris et j\'espère le meilleur', 'J\'essaie de deviner par le contexte', 'Je stresse et passe à ma langue', 'Je cherche immédiatement sur mon téléphone'] },
  'wt_q5': { question: 'Combien de temps pouvez-vous consacrer à l\'anglais par semaine (hors cours) ?', options: ['Presque rien - juste le temps des cours', '15-30 minutes plusieurs fois par semaine', 'Environ 1 heure répartie sur la semaine', '2-3 heures - je suis motivé(e)', 'Plus de 3 heures - l\'anglais est ma priorité'] },
  'wt_q6': { question: 'Quelles activités d\'apprentissage aimez-vous ? Sélectionnez toutes celles qui s\'appliquent.', options: ['Regarder des vidéos/films en anglais', 'Lire des articles ou des livres', 'Avoir des conversations', 'Faire des exercices de grammaire', 'Apprendre du vocabulaire avec des flashcards', 'Écouter des podcasts', 'Écrire des textes (e-mails, histoires)', 'Jeux de langue/quiz', 'Chanter des chansons en anglais'] },
  'wt_q7': { question: 'Comment vous sentez-vous en faisant des erreurs en anglais ?', options: ['Ça ne me dérange pas du tout - c\'est comme ça qu\'on apprend', 'Je préfère ne pas en faire, mais je gère', 'Je suis gêné(e) mais j\'essaie de continuer', 'J\'évite de parler par peur des erreurs', 'Je suis très frustré(e) par moi-même'] },
  'wt_q8': { question: 'Qu\'est-ce qui vous aide le mieux à retenir un mot nouveau ?', options: ['Le voir écrit avec une définition', 'L\'entendre dans une phrase', 'L\'utiliser dans ma propre phrase immédiatement', 'Le relier à une image', 'Le répéter plusieurs fois', 'Comprendre les parties du mot (préfixe, racine, suffixe)'] },
  'wt_q9': { question: 'Depuis combien de temps apprenez-vous l\'anglais ?', options: ['Moins d\'1 an', '1-3 ans', '3-5 ans', '5-10 ans', 'Plus de 10 ans'] },
  'wt_q10': { question: 'Où avez-vous principalement appris l\'anglais ?', description: 'Sélectionnez tout ce qui s\'applique.', options: ['École (comme matière)', 'Université', 'Cours privés avec un professeur', 'École de langue/cours', 'Auto-apprentissage (applis, livres, YouTube)', 'Vivre/travailler dans un pays anglophone', 'Par le travail (utilisation quotidienne)'] },
  'wt_q11': { question: 'Avez-vous déjà passé un examen officiel d\'anglais ?', options: ['Non, jamais', 'Oui - examen scolaire/universitaire', 'Oui - Cambridge (FCE/CAE/CPE)', 'Oui - IELTS', 'Oui - TOEFL', 'Oui - autre'] },
  'wt_q12': { question: 'Quel est le plus grand défi que vous avez rencontré en apprenant l\'anglais ?', description: 'Décrivez en 1-2 phrases votre plus grande frustration.' },
  'wt_q13': { question: 'Y a-t-il quelque chose que vos professeurs précédents faisaient particulièrement bien ?', description: 'Quelles méthodes vous ont le mieux aidé ?' },
  'wt_q14': { question: 'Vous êtes dans un café à l\'étranger. Le barista vous pose une question que vous ne comprenez pas bien. Que faites-vous ?', options: ['Je dis "Pardon, pourriez-vous répéter ?" et j\'essaie à nouveau', 'Je montre le menu et je souris', 'J\'utilise Google Translate sur mon téléphone', 'Je réponds avec ce que je pense qu\'ils ont demandé'] },
  'wt_q15': { question: 'Votre collègue anglophone vous envoie un long e-mail sur un projet. Certaines parties ne sont pas claires. Que faites-vous ?', options: ['Je le lis attentivement, je cherche les mots inconnus et je réponds', 'Je réponds en demandant de clarifier les parties confuses', 'Je comprends la majorité et devine le reste par le contexte', 'J\'ai du mal à comprendre et je dois traduire la plupart', 'Je n\'essaie pas de comprendre, j\'utilise ChatGPT'] },
  'wt_q16': { question: 'Vous devez décrire un problème avec votre chambre d\'hôtel à la réception.', description: 'Écrivez 2-3 phrases expliquant que la climatisation ne fonctionne pas.' },
  'wt_q17': { question: 'Vous êtes en entretien d\'embauche et on vous demande : "Parlez-nous d\'un défi au travail." Comment répondez-vous ?', description: 'Écrivez 3-4 phrases comme si vous étiez vraiment en entretien.' },
  'wt_q36': { question: 'Comment refuseriez-vous poliment une invitation à la fête d\'un collègue ?', description: 'Écrivez 1-2 phrases.' },
  'wt_q40': { question: 'Lisez ces deux versions. Laquelle sonne mieux et pourquoi ?', description: 'Laquelle vous semble meilleure et pourquoi ? Écrivez 1 phrase.' },
  'wt_q41': { question: 'Si vous pouviez accomplir UNE chose en anglais dans les 3 prochains mois, ce serait quoi ?', description: 'Écrivez librement - il n\'y a pas de mauvaises réponses.' },
  'wt_q42': { question: 'Comment préférez-vous recevoir des retours sur vos erreurs ?', options: ['Corrigez-moi immédiatement, à chaque fois', 'Notez-les et discutons à la fin', 'Ne corrigez que les erreurs importantes, ignorez les petites', 'Écrivez les corrections pour que je les relise plus tard', 'Je préfère me corriger moi-même avec des indices'] },
  'wt_q43': { question: 'Quels sujets vous intéressent le plus ? Choisissez jusqu\'à 3.', options: ['Technologie et innovation', 'Business et finance', 'Voyages et culture', 'Santé et mode de vie', 'Science et nature', 'Divertissement et pop culture', 'Sport', 'Cuisine et gastronomie', 'Psychologie et développement personnel', 'Politique et actualités', 'Art et littérature', 'Histoire'] },
  'wt_q44': { question: 'Comment évaluez-vous votre confiance dans ces domaines ?', description: 'Notez chaque domaine de 1 (pas confiant) à 5 (très confiant).' },
  'wt_q45': { question: 'Y a-t-il autre chose que votre professeur devrait savoir sur vous ou votre apprentissage ?', description: 'Optionnel - écrivez ce qui vous semble utile.' },
};

const PORTUGUESE: TranslationSet = {
  'wt_q1': { question: 'Como você descreveria seu inglês agora?', description: 'Escolha a opção que melhor descreve seu nível atual.', options: ['Consigo lidar com situações básicas do dia a dia como pedir comida ou pedir direções', 'Consigo ter conversas simples sobre temas familiares mas tenho dificuldade com ideias complexas', 'Consigo discutir a maioria dos assuntos mas cometo erros gramaticais e às vezes falta vocabulário', 'Falo fluentemente na maioria das situações mas quero soar mais natural e preciso', 'Me sinto confortável em inglês mas quero dominar a linguagem avançada/profissional'] },
  'wt_q2': { question: 'O que mais te frustra ao falar inglês?', description: 'Selecione todas que se aplicam.', options: ['Sei o que quero dizer mas não encontro as palavras certas', 'Cometo erros gramaticais que sei que estão errados', 'Não entendo nativos quando falam rápido', 'Fico nervoso e esqueço tudo que sei', 'Não consigo expressar ideias complexas - simplifico demais', 'Minha pronúncia faz as pessoas pedirem para repetir'] },
  'wt_q3': { question: 'Qual é sua razão principal para aprender inglês?', options: ['Preciso para o trabalho - reuniões, e-mails, apresentações', 'Estou me preparando para um exame (IELTS, Cambridge, etc.)', 'Quero viajar e me comunicar livremente', 'Quero assistir filmes/ler livros sem legendas', 'Quero me sentir confiante falando com anglófonos', 'Avanço na carreira - preciso de inglês para promoção', 'Vou me mudar para um país anglófono'] },
  'wt_q4': { question: 'Como você reage quando não entende algo em inglês?', options: ['Peço para repetir ou explicar', 'Finjo que entendi e espero o melhor', 'Tento adivinhar pelo contexto', 'Fico estressado e mudo para minha língua', 'Procuro imediatamente no celular'] },
  'wt_q5': { question: 'Quanto tempo você pode dedicar ao inglês por semana (fora das aulas)?', options: ['Quase nada - só tenho tempo de aula', '15-30 minutos várias vezes por semana', 'Cerca de 1 hora espalhada pela semana', '2-3 horas - estou comprometido/a', 'Mais de 3 horas - inglês é minha prioridade'] },
  'wt_q6': { question: 'Quais atividades de aprendizado você gosta? Selecione todas que se aplicam.', options: ['Assistir vídeos/filmes em inglês', 'Ler artigos ou livros', 'Ter conversas', 'Fazer exercícios de gramática', 'Aprender vocabulário novo com flashcards', 'Ouvir podcasts', 'Escrever textos (e-mails, histórias)', 'Jogos de idiomas/quizzes', 'Cantar músicas em inglês'] },
  'wt_q7': { question: 'Como você se sente ao cometer erros em inglês?', options: ['Não me importo - é assim que se aprende', 'Prefiro não cometer, mas consigo lidar', 'Me sinto envergonhado mas tento continuar', 'Evito falar por medo de erros', 'Fico muito frustrado comigo mesmo'] },
  'wt_q8': { question: 'O que te ajuda mais a lembrar uma palavra nova?', options: ['Ver ela escrita com definição', 'Ouvir em uma frase', 'Usar em minha própria frase imediatamente', 'Conectar com uma imagem', 'Repetir muitas vezes', 'Entender as partes da palavra (prefixo, raiz, sufixo)'] },
  'wt_q9': { question: 'Há quanto tempo você aprende inglês?', options: ['Menos de 1 ano', '1-3 anos', '3-5 anos', '5-10 anos', 'Mais de 10 anos'] },
  'wt_q10': { question: 'Onde você aprendeu inglês principalmente?', description: 'Selecione todas que se aplicam.', options: ['Escola (como matéria)', 'Universidade', 'Aulas particulares com professor', 'Escola de idiomas/curso', 'Autoestudo (apps, livros, YouTube)', 'Morar/trabalhar em país anglófono', 'Pelo trabalho (uso diário)'] },
  'wt_q11': { question: 'Já fez algum exame oficial de inglês?', options: ['Não, nunca', 'Sim - exame escolar/universitário', 'Sim - Cambridge (FCE/CAE/CPE)', 'Sim - IELTS', 'Sim - TOEFL', 'Sim - outro'] },
  'wt_q12': { question: 'Qual é o maior desafio que você enfrentou aprendendo inglês?', description: 'Em 1-2 frases descreva sua maior frustração.' },
  'wt_q13': { question: 'Há algo que seus professores anteriores faziam que funcionava muito bem?', description: 'Conte quais métodos te ajudaram mais.' },
  'wt_q14': { question: 'Você está em um café no exterior. O barista pergunta algo que você não entende bem. O que faz?', options: ['Digo "Desculpe, poderia repetir?" e tento de novo', 'Aponto para o menu e sorrio', 'Uso Google Translate no celular', 'Respondo com o que acho que perguntaram'] },
  'wt_q15': { question: 'Seu colega anglófono envia um e-mail longo sobre um projeto. Algumas partes não estão claras. O que faz?', options: ['Leio com cuidado, procuro palavras desconhecidas e respondo', 'Respondo pedindo que esclareçam as partes confusas', 'Entendo a maioria e adivinho o resto pelo contexto', 'Tenho dificuldade e preciso traduzir a maior parte', 'Não tento entender, uso ChatGPT'] },
  'wt_q16': { question: 'Você precisa descrever um problema com seu quarto de hotel na recepção.', description: 'Escreva 2-3 frases explicando que o ar condicionado não funciona.' },
  'wt_q17': { question: 'Você está em uma entrevista de emprego e perguntam "Conte sobre um desafio no trabalho." Como responde?', description: 'Escreva 3-4 frases como se estivesse realmente na entrevista.' },
  'wt_q36': { question: 'Como você recusaria educadamente um convite para a festa de um colega?', description: 'Escreva 1-2 frases.' },
  'wt_q40': { question: 'Leia estas duas versões. Qual soa melhor e por quê?', description: 'Qual versão soa melhor para você e por quê? Escreva 1 frase.' },
  'wt_q41': { question: 'Se pudesse alcançar UMA coisa em inglês nos próximos 3 meses, o que seria?', description: 'Escreva livremente - não há respostas erradas.' },
  'wt_q42': { question: 'Como prefere receber feedback sobre seus erros?', options: ['Corrija-me imediatamente, sempre', 'Anote e vamos discutir no final', 'Corrija apenas erros grandes, ignore os pequenos', 'Escreva correções para eu revisar depois', 'Prefiro me autocorrigir com dicas'] },
  'wt_q43': { question: 'Quais temas mais te interessam? Escolha até 3.', options: ['Tecnologia e inovação', 'Negócios e finanças', 'Viagens e cultura', 'Saúde e estilo de vida', 'Ciência e natureza', 'Entretenimento e cultura pop', 'Esporte', 'Comida e culinária', 'Psicologia e desenvolvimento pessoal', 'Política e atualidades', 'Arte e literatura', 'História'] },
  'wt_q44': { question: 'Como você avaliaria sua confiança nessas áreas?', description: 'Avalie cada área de 1 (sem confiança) a 5 (muito confiante).' },
  'wt_q45': { question: 'Há algo mais que gostaria que seu professor soubesse sobre você ou seu aprendizado?', description: 'Opcional - escreva o que achar útil.' },
};

const ITALIAN: TranslationSet = {
  'wt_q1': { question: 'Come descriveresti il tuo inglese in questo momento?', description: "Scegli l'opzione che descrive meglio il tuo livello attuale.", options: ['Riesco a gestire situazioni quotidiane di base come ordinare cibo o chiedere indicazioni', 'Posso avere conversazioni semplici su argomenti familiari ma ho difficoltà con idee complesse', 'Posso discutere la maggior parte degli argomenti ma faccio errori grammaticali e a volte mi manca il vocabolario', 'Parlo fluentemente nella maggior parte delle situazioni ma voglio suonare più naturale e preciso', 'Mi sento a mio agio in inglese ma voglio padroneggiare il linguaggio avanzato/professionale'] },
  'wt_q2': { question: 'Cosa ti frustra di più quando parli inglese?', description: 'Seleziona tutte quelle che si applicano.', options: ['So cosa voglio dire ma non trovo le parole giuste', 'Faccio errori grammaticali che so essere sbagliati', 'Non capisco i madrelingua quando parlano veloce', 'Mi agito e dimentico tutto quello che so', 'Non riesco ad esprimere idee complesse - semplifico troppo', 'La mia pronuncia fa sì che mi chiedano di ripetere'] },
  'wt_q3': { question: 'Qual è il motivo principale per cui studi inglese?', options: ['Ne ho bisogno per lavoro - riunioni, email, presentazioni', 'Mi sto preparando per un esame (IELTS, Cambridge, ecc.)', 'Voglio viaggiare e comunicare liberamente', 'Voglio guardare film/leggere libri senza sottotitoli', 'Voglio sentirmi sicuro parlando con anglofoni', 'Avanzamento di carriera - ho bisogno dell\'inglese per una promozione', 'Mi trasferisco in un paese anglofono'] },
  'wt_q4': { question: 'Come reagisci quando non capisci qualcosa in inglese?', options: ['Chiedo di ripetere o spiegare', 'Fingo di aver capito e spero per il meglio', 'Cerco di indovinare dal contesto', 'Mi stresso e passo alla mia lingua', 'Lo cerco subito sul telefono'] },
  'wt_q5': { question: 'Quanto tempo puoi dedicare all\'inglese a settimana (fuori dalle lezioni)?', options: ['Quasi niente - ho solo il tempo delle lezioni', '15-30 minuti alcune volte a settimana', 'Circa 1 ora distribuita nella settimana', '2-3 ore - sono impegnato/a', 'Più di 3 ore - l\'inglese è la mia priorità'] },
  'wt_q6': { question: 'Quali attività di apprendimento ti piacciono? Seleziona tutte quelle che si applicano.', options: ['Guardare video/film in inglese', 'Leggere articoli o libri', 'Fare conversazioni', 'Esercizi di grammatica', 'Imparare vocabolario nuovo con flashcard', 'Ascoltare podcast', 'Scrivere testi (email, storie)', 'Giochi linguistici/quiz', 'Cantare canzoni in inglese'] },
  'wt_q7': { question: 'Come ti senti quando fai errori in inglese?', options: ['Non mi importa per niente - si impara così', 'Preferisco non farli, ma ci convivo', 'Mi vergogno ma cerco di andare avanti', 'Evito di parlare per paura degli errori', 'Mi frustro molto con me stesso'] },
  'wt_q8': { question: 'Cosa ti aiuta di più a ricordare una parola nuova?', options: ['Vederla scritta con una definizione', 'Sentirla in una frase', 'Usarla in una mia frase subito', 'Collegarla a un\'immagine', 'Ripeterla molte volte', 'Capire le parti della parola (prefisso, radice, suffisso)'] },
  'wt_q9': { question: 'Da quanto tempo studi inglese?', options: ['Meno di 1 anno', '1-3 anni', '3-5 anni', '5-10 anni', 'Più di 10 anni'] },
  'wt_q10': { question: 'Dove hai imparato inglese principalmente?', description: 'Seleziona tutte quelle che si applicano.', options: ['Scuola (come materia)', 'Università', 'Lezioni private con insegnante', 'Scuola di lingue/corso', 'Studio autonomo (app, libri, YouTube)', 'Vivere/lavorare in un paese anglofono', 'Attraverso il lavoro (uso quotidiano)'] },
  'wt_q11': { question: 'Hai mai fatto un esame ufficiale di inglese?', options: ['No, mai', 'Sì - esame scolastico/universitario', 'Sì - Cambridge (FCE/CAE/CPE)', 'Sì - IELTS', 'Sì - TOEFL', 'Sì - altro'] },
  'wt_q12': { question: 'Qual è la sfida più grande che hai affrontato imparando l\'inglese?', description: 'Descrivi in 1-2 frasi la tua più grande frustrazione.' },
  'wt_q13': { question: 'C\'è qualcosa che i tuoi insegnanti precedenti facevano particolarmente bene?', description: 'Quali metodi ti hanno aiutato di più?' },
  'wt_q14': { question: 'Sei in un bar all\'estero. Il barista ti chiede qualcosa che non capisci bene. Cosa fai?', options: ['Dico "Scusa, potresti ripetere?" e riprovo', 'Indico il menù e sorrido', 'Uso Google Translate sul telefono', 'Rispondo con quello che penso abbiano chiesto'] },
  'wt_q15': { question: 'Il tuo collega anglofono ti manda una lunga email su un progetto. Alcune parti non sono chiare. Cosa fai?', options: ['La leggo attentamente, cerco le parole sconosciute e rispondo', 'Rispondo chiedendo di chiarire le parti confuse', 'Capisco la maggior parte e indovino il resto dal contesto', 'Faccio fatica a capire e devo tradurre la maggior parte', 'Non provo a capire, uso ChatGPT'] },
  'wt_q16': { question: 'Devi descrivere un problema con la tua camera d\'albergo alla reception.', description: 'Scrivi 2-3 frasi spiegando che l\'aria condizionata non funziona.' },
  'wt_q17': { question: 'Sei a un colloquio di lavoro e ti chiedono: "Parlami di una sfida sul lavoro." Come rispondi?', description: 'Scrivi 3-4 frasi come se fossi davvero al colloquio.' },
  'wt_q36': { question: 'Come rifiuteresti educatamente un invito alla festa di un collega?', description: 'Scrivi 1-2 frasi.' },
  'wt_q40': { question: 'Leggi queste due versioni. Quale suona meglio e perché?', description: 'Quale versione ti suona meglio e perché? Scrivi 1 frase.' },
  'wt_q41': { question: 'Se potessi raggiungere UNA cosa in inglese nei prossimi 3 mesi, cosa sarebbe?', description: 'Scrivi liberamente - non ci sono risposte sbagliate.' },
  'wt_q42': { question: 'Come preferisci ricevere feedback sui tuoi errori?', options: ['Correggimi subito, ogni volta', 'Annotali e discutiamone alla fine', 'Correggi solo gli errori grandi, ignora i piccoli', 'Scrivi le correzioni per rivederle dopo', 'Preferisco autocorreggermi con suggerimenti'] },
  'wt_q43': { question: 'Quali argomenti ti interessano di più? Scegli fino a 3.', options: ['Tecnologia e innovazione', 'Business e finanza', 'Viaggi e cultura', 'Salute e stile di vita', 'Scienza e natura', 'Intrattenimento e cultura pop', 'Sport', 'Cibo e cucina', 'Psicologia e crescita personale', 'Politica e attualità', 'Arte e letteratura', 'Storia'] },
  'wt_q44': { question: 'Come valuteresti la tua sicurezza in queste aree?', description: 'Valuta ogni area da 1 (non sicuro) a 5 (molto sicuro).' },
  'wt_q45': { question: "C'è qualcos'altro che vorresti che il tuo insegnante sapesse su di te o sul tuo apprendimento?", description: 'Opzionale - scrivi ciò che ritieni utile.' },
};

const TURKISH: TranslationSet = {
  'wt_q1': { question: 'İngilizcenizi şu anda nasıl tanımlarsınız?', description: 'Mevcut seviyenizi en iyi tanımlayan seçeneği seçin.', options: ['Yemek sipariş etme veya yol sorma gibi temel günlük durumları halledebiliyorum', 'Tanıdık konularda basit konuşmalar yapabiliyorum ama karmaşık fikirlerle zorlanıyorum', 'Çoğu konuyu tartışabiliyorum ama gramer hataları yapıyorum ve bazen kelime dağarcığım yetersiz', 'Çoğu durumda akıcı konuşuyorum ama daha doğal ve kesin olmak istiyorum', "İngilizce'de rahatım ama ileri düzey/profesyonel dili ustalıkla kullanmak istiyorum"] },
  'wt_q2': { question: 'İngilizce konuşurken sizi en çok ne hayal kırıklığına uğratıyor?', description: 'Geçerli olan tümünü seçin.', options: ['Ne söylemek istediğimi biliyorum ama doğru kelimeleri bulamıyorum', 'Yanlış olduğunu bildiğim gramer hataları yapıyorum', 'Anadili İngilizce olanları hızlı konuştuklarında anlayamıyorum', 'Gerginleşiyorum ve bildiğim her şeyi unutuyorum', 'Karmaşık fikirleri ifade edemiyorum - çok basitleştiriyorum', 'Telaffuzum insanların tekrar etmemi istemesine neden oluyor'] },
  'wt_q3': { question: 'İngilizce öğrenmenizin ana nedeni nedir?', options: ['İş için ihtiyacım var - toplantılar, e-postalar, sunumlar', 'Bir sınava hazırlanıyorum (IELTS, Cambridge vb.)', 'Seyahat etmek ve özgürce iletişim kurmak istiyorum', 'Film izlemek/kitap okumak istiyorum (altyazısız)', 'İngilizce konuşanlarla konuşurken kendimi güvende hissetmek istiyorum', 'Kariyer gelişimi - terfi için İngilizce gerekiyor', 'İngilizce konuşulan bir ülkeye taşınıyorum'] },
  'wt_q4': { question: 'İngilizce bir şeyi anlamadığınızda nasıl tepki verirsiniz?', options: ['Tekrar etmesini veya açıklamasını isterim', 'Anlamış gibi yapıp en iyisini umarım', 'Bağlamdan tahmin etmeye çalışırım', 'Strese girerim ve kendi dilime geçerim', 'Hemen telefonumda ararım'] },
  'wt_q5': { question: 'Haftada İngilizce\'ye ne kadar zaman ayırabilirsiniz (dersler dışında)?', options: ['Neredeyse hiç - sadece ders zamanım var', 'Haftada birkaç kez 15-30 dakika', 'Haftaya yayılmış yaklaşık 1 saat', '2-3 saat - kararlıyım', '3 saatten fazla - İngilizce önceliğim'] },
  'wt_q6': { question: 'Hangi öğrenme aktivitelerinden hoşlanırsınız? Geçerli olan tümünü seçin.', options: ['İngilizce video/film izlemek', 'Makale veya kitap okumak', 'Sohbet etmek', 'Gramer alıştırmaları yapmak', 'Flashcard ile yeni kelime öğrenmek', 'Podcast dinlemek', 'Metin yazmak (e-posta, hikaye)', 'Dil oyunları/quiz', 'İngilizce şarkı söylemek'] },
  'wt_q7': { question: 'İngilizce hata yaptığınızda nasıl hissedersiniz?', options: ['Hiç umursamıyorum - böyle öğrenilir', 'Yapmamayı tercih ederim ama başa çıkabilirim', 'Utanıyorum ama devam etmeye çalışıyorum', 'Hata korkusuyla konuşmaktan kaçınıyorum', 'Kendime çok kızıyorum'] },
  'wt_q8': { question: 'Yeni bir kelime öğrenirken onu en iyi hatırlamanızı ne sağlar?', options: ['Tanımıyla birlikte yazılı görmek', 'Bir cümlede duymak', 'Hemen kendi cümlemde kullanmak', 'Bir resimle ilişkilendirmek', 'Çok kez tekrarlamak', 'Kelime parçalarını anlamak (önek, kök, sonek)'] },
  'wt_q9': { question: 'Ne kadar süredir İngilizce öğreniyorsunuz?', options: ['1 yıldan az', '1-3 yıl', '3-5 yıl', '5-10 yıl', '10 yıldan fazla'] },
  'wt_q10': { question: 'İngilizce\'yi esas olarak nerede öğrendiniz?', description: 'Geçerli olan tümünü seçin.', options: ['Okul (ders olarak)', 'Üniversite', 'Öğretmenle özel dersler', 'Dil okulu/kurs', 'Kendi kendine öğrenme (uygulamalar, kitaplar, YouTube)', 'İngilizce konuşulan ülkede yaşama/çalışma', 'İş yoluyla (günlük kullanım)'] },
  'wt_q11': { question: 'Hiç resmi bir İngilizce sınavına girdiniz mi?', options: ['Hayır, hiç', 'Evet - okul/üniversite sınavı', 'Evet - Cambridge (FCE/CAE/CPE)', 'Evet - IELTS', 'Evet - TOEFL', 'Evet - diğer'] },
  'wt_q12': { question: 'İngilizce öğrenirken karşılaştığınız en büyük zorluk nedir?', description: '1-2 cümleyle en büyük hayal kırıklığınızı anlatın.' },
  'wt_q13': { question: 'Önceki öğretmenlerinizin iyi yaptığı bir şey var mıydı?', description: 'Hangi yöntemler size en çok yardımcı oldu?' },
  'wt_q14': { question: 'Yurt dışında bir kafede siniz. Barista size tam anlamadığınız bir şey soruyor. Ne yaparsınız?', options: ['"Özür dilerim, tekrar edebilir misiniz?" derim ve tekrar denerim', 'Menüyü gösterir ve gülümserim', 'Telefonumda Google Translate kullanırım', 'Sorduklarını sandığım şeye cevap veririm'] },
  'wt_q15': { question: 'İngilizce konuşan iş arkadaşınız bir proje hakkında uzun bir e-posta gönderir. Bazı kısımlar net değil. Ne yaparsınız?', options: ['Dikkatlice okur, bilinmeyen kelimeleri arar ve yanıtlarım', 'Kafa karıştıran kısımları açıklamalarını isteyerek yanıtlarım', 'Çoğunu anlar ve gerisini bağlamdan tahmin ederim', 'Anlamakta zorlanır ve çoğunu çevirmem gerekir', 'Anlamaya çalışmam, ChatGPT kullanırım'] },
  'wt_q16': { question: 'Otel odanızdaki bir sorunu resepsiyonda anlatmanız gerekiyor.', description: 'Klimanın çalışmadığını açıklayan 2-3 cümle yazın.' },
  'wt_q17': { question: 'İş görüşmesindesiniz ve size "İşte karşılaştığınız bir zorluğu anlatın" deniyor. Nasıl yanıtlarsınız?', description: 'Gerçekten görüşmedeymiş gibi 3-4 cümle yazın.' },
  'wt_q36': { question: 'Bir iş arkadaşınızın parti davetini nazikçe nasıl reddedersiniz?', description: '1-2 cümle yazın.' },
  'wt_q40': { question: 'Bu iki versiyonu okuyun. Hangisi daha iyi duyuluyor ve neden?', description: 'Hangi versiyon size daha iyi geliyor ve neden? 1 cümle yazın.' },
  'wt_q41': { question: 'Önümüzdeki 3 ayda İngilizce\'de BİR şey başarabilseydiniz, ne olurdu?', description: 'Özgürce yazın - yanlış cevap yok.' },
  'wt_q42': { question: 'Hatalarınız hakkında geri bildirim almayı nasıl tercih edersiniz?', options: ['Her seferinde hemen düzeltin', 'Not alın ve sonunda tartışalım', 'Sadece büyük hataları düzeltin, küçükleri görmezden gelin', 'Düzeltmeleri yazın, sonra gözden geçireyim', 'İpuçlarıyla kendim düzeltmeyi tercih ederim'] },
  'wt_q43': { question: 'Hangi konular sizi en çok ilgilendiriyor? 3 taneye kadar seçin.', options: ['Teknoloji ve inovasyon', 'İş ve finans', 'Seyahat ve kültür', 'Sağlık ve yaşam tarzı', 'Bilim ve doğa', 'Eğlence ve popüler kültür', 'Spor', 'Yemek ve mutfak', 'Psikoloji ve kişisel gelişim', 'Politika ve güncel olaylar', 'Sanat ve edebiyat', 'Tarih'] },
  'wt_q44': { question: 'Bu alanlarda kendinize güveninizi nasıl değerlendirirsiniz?', description: 'Her alanı 1 (güven yok) ile 5 (çok güvenli) arasında değerlendirin.' },
  'wt_q45': { question: 'Öğretmeninizin siz veya öğrenmeniz hakkında bilmesini istediğiniz başka bir şey var mı?', description: 'İsteğe bağlı - yardımcı olacağını düşündüğünüz her şeyi yazın.' },
};

const RUSSIAN: TranslationSet = {
  'wt_q1': { question: 'Как бы вы описали свой английский сейчас?', description: 'Выберите вариант, который лучше всего описывает ваш текущий уровень.', options: ['Я справляюсь с базовыми повседневными ситуациями, например, заказ еды или вопрос о дороге', 'Я могу вести простые разговоры на знакомые темы, но мне трудно со сложными идеями', 'Я могу обсуждать большинство тем, но допускаю грамматические ошибки и иногда не хватает словарного запаса', 'Я свободно говорю в большинстве ситуаций, но хочу звучать более естественно и точно', 'Мне комфортно на английском, но я хочу освоить продвинутый/профессиональный язык'] },
  'wt_q2': { question: 'Что вас больше всего расстраивает, когда вы говорите по-английски?', description: 'Выберите все подходящие.', options: ['Я знаю, что хочу сказать, но не могу найти нужные слова', 'Я делаю грамматические ошибки, которые знаю, что неправильные', 'Я не понимаю носителей языка, когда они говорят быстро', 'Я нервничаю и забываю всё, что знаю', 'Я не могу выразить сложные идеи - упрощаю слишком сильно', 'Моё произношение заставляет людей просить повторить'] },
  'wt_q3': { question: 'Какова ваша основная причина изучения английского?', options: ['Мне нужен для работы - встречи, письма, презентации', 'Готовлюсь к экзамену (IELTS, Cambridge и др.)', 'Хочу путешествовать и свободно общаться', 'Хочу смотреть фильмы/читать книги без субтитров', 'Хочу чувствовать себя уверенно, общаясь с англоговорящими', 'Карьерный рост - нужен английский для повышения', 'Переезжаю в англоязычную страну'] },
  'wt_q4': { question: 'Как вы обычно реагируете, когда не понимаете что-то по-английски?', options: ['Прошу повторить или объяснить', 'Делаю вид, что понял, и надеюсь на лучшее', 'Пытаюсь угадать из контекста', 'Нервничаю и перехожу на свой язык', 'Сразу ищу на телефоне'] },
  'wt_q5': { question: 'Сколько времени вы реально можете уделять английскому в неделю (помимо уроков)?', options: ['Почти нисколько - только время урока', '15-30 минут несколько раз в неделю', 'Около 1 часа в течение недели', '2-3 часа - я целеустремлён(а)', 'Больше 3 часов - английский мой приоритет'] },
  'wt_q6': { question: 'Какие учебные занятия вам нравятся? Выберите все подходящие.', options: ['Просмотр видео/фильмов на английском', 'Чтение статей или книг', 'Разговоры', 'Грамматические упражнения', 'Изучение новых слов с карточками', 'Прослушивание подкастов', 'Написание текстов (письма, рассказы)', 'Языковые игры/викторины', 'Пение песен на английском'] },
  'wt_q7': { question: 'Как вы себя чувствуете, делая ошибки на английском?', options: ['Меня это совсем не беспокоит - так учатся', 'Предпочитаю не делать, но справляюсь', 'Мне неловко, но я стараюсь продолжать', 'Избегаю говорить из-за страха ошибок', 'Очень расстраиваюсь из-за себя'] },
  'wt_q8': { question: 'Что лучше всего помогает вам запомнить новое слово?', options: ['Видеть его написанным с определением', 'Слышать его в предложении', 'Использовать в своём предложении сразу', 'Связать его с картинкой', 'Повторять много раз', 'Понимать части слова (приставка, корень, суффикс)'] },
  'wt_q9': { question: 'Как давно вы учите английский?', options: ['Менее 1 года', '1-3 года', '3-5 лет', '5-10 лет', 'Более 10 лет'] },
  'wt_q10': { question: 'Где вы в основном учили английский?', description: 'Выберите все подходящие.', options: ['Школа (как предмет)', 'Университет', 'Частные уроки с преподавателем', 'Языковая школа/курсы', 'Самообучение (приложения, книги, YouTube)', 'Жизнь/работа в англоязычной стране', 'Через работу (ежедневное использование)'] },
  'wt_q11': { question: 'Сдавали ли вы когда-нибудь официальный экзамен по английскому?', options: ['Нет, никогда', 'Да - школьный/университетский экзамен', 'Да - Cambridge (FCE/CAE/CPE)', 'Да - IELTS', 'Да - TOEFL', 'Да - другой'] },
  'wt_q12': { question: 'Какая самая большая трудность, с которой вы столкнулись при изучении английского?', description: 'Опишите в 1-2 предложениях вашу главную проблему.' },
  'wt_q13': { question: 'Есть ли что-то, что ваши предыдущие преподаватели делали особенно хорошо?', description: 'Какие методы помогли вам больше всего?' },
  'wt_q14': { question: 'Вы в кафе за границей. Бариста спрашивает что-то, что вы не совсем понимаете. Что делаете?', options: ['Говорю "Извините, не могли бы вы повторить?" и пробую снова', 'Просто указываю на меню и улыбаюсь', 'Использую Google Translate на телефоне', 'Отвечаю тем, что, по-моему, спросили'] },
  'wt_q15': { question: 'Ваш англоговорящий коллега присылает длинное письмо о проекте. Некоторые части неясны. Что делаете?', options: ['Внимательно читаю, ищу незнакомые слова и отвечаю', 'Отвечаю с просьбой пояснить непонятные части', 'Понимаю большую часть и угадываю остальное по контексту', 'Мне трудно понять, нужно переводить большую часть', 'Не пытаюсь понять, использую ChatGPT'] },
  'wt_q16': { question: 'Вам нужно описать проблему с номером в отеле на ресепшн.', description: 'Напишите 2-3 предложения, объясняя, что кондиционер не работает.' },
  'wt_q17': { question: 'Вы на собеседовании, и вас спрашивают: "Расскажите о трудности на работе." Как ответите?', description: 'Напишите 3-4 предложения, как будто вы на реальном собеседовании.' },
  'wt_q36': { question: 'Как бы вы вежливо отклонили приглашение на вечеринку коллеги?', description: 'Напишите 1-2 предложения.' },
  'wt_q40': { question: 'Прочитайте эти две версии. Какая звучит лучше и почему?', description: 'Какая версия звучит лучше для вас и почему? Напишите 1 предложение.' },
  'wt_q41': { question: 'Если бы вы могли достичь ОДНОГО в английском за 3 месяца, что бы это было?', description: 'Пишите свободно - нет неправильных ответов.' },
  'wt_q42': { question: 'Как вы предпочитаете получать обратную связь об ошибках?', options: ['Исправляйте сразу, каждый раз', 'Запишите и обсудим в конце', 'Исправляйте только серьёзные ошибки, игнорируйте мелкие', 'Напишите исправления для позднего просмотра', 'Предпочитаю самокоррекцию с подсказками'] },
  'wt_q43': { question: 'Какие темы вас интересуют больше всего? Выберите до 3.', options: ['Технологии и инновации', 'Бизнес и финансы', 'Путешествия и культура', 'Здоровье и образ жизни', 'Наука и природа', 'Развлечения и поп-культура', 'Спорт', 'Еда и кулинария', 'Психология и саморазвитие', 'Политика и текущие события', 'Искусство и литература', 'История'] },
  'wt_q44': { question: 'Как бы вы оценили свою уверенность в этих областях?', description: 'Оцените каждую область от 1 (нет уверенности) до 5 (очень уверен).' },
  'wt_q45': { question: 'Есть ли что-то ещё, что вы хотели бы сообщить преподавателю о себе или своём обучении?', description: 'Необязательно - напишите всё, что считаете полезным.' },
};

const CZECH: TranslationSet = {
  'wt_q1': { question: 'Jak byste popsali svou angličtinu právě teď?', description: 'Vyberte možnost, která nejlépe popisuje vaši současnou úroveň.', options: ['Zvládám základní každodenní situace jako objednání jídla nebo dotaz na cestu', 'Dokážu vést jednoduché rozhovory o známých tématech, ale mám potíže se složitými myšlenkami', 'Dokážu diskutovat o většině témat, ale dělám gramatické chyby a někdy mi chybí slovní zásoba', 'Mluvím plynule ve většině situací, ale chci znít přirozeněji a přesněji', 'Cítím se pohodlně v angličtině, ale chci ovládnout pokročilý/profesionální jazyk'] },
  'wt_q2': { question: 'Co vás nejvíce frustruje, když mluvíte anglicky?', description: 'Vyberte vše, co platí.', options: ['Vím, co chci říct, ale nemůžu najít správná slova', 'Dělám gramatické chyby, o kterých vím, že jsou špatně', 'Nerozumím rodilým mluvčím, když mluví rychle', 'Znervózním a zapomenu všechno, co umím', 'Nedokážu vyjádřit složité myšlenky - příliš zjednodušuji', 'Moje výslovnost způsobuje, že mě žádají o opakování'] },
  'wt_q3': { question: 'Jaký je váš hlavní důvod pro učení angličtiny?', options: ['Potřebuji ji pro práci - schůzky, e-maily, prezentace', 'Připravuji se na zkoušku (IELTS, Cambridge atd.)', 'Chci cestovat a volně komunikovat', 'Chci sledovat filmy/číst knihy bez titulků', 'Chci se cítit sebejistě při mluvení s anglofonními', 'Kariérní postup - potřebuji angličtinu pro povýšení', 'Stěhuji se do anglicky mluvící země'] },
  'wt_q4': { question: 'Jak obvykle reagujete, když něčemu v angličtině nerozumíte?', options: ['Požádám o zopakování nebo vysvětlení', 'Tvářím se, že jsem rozuměl/a a doufám v nejlepší', 'Zkouším odhadnout z kontextu', 'Stresuju se a přecházím na svůj jazyk', 'Hned to hledám na telefonu'] },
  'wt_q5': { question: 'Kolik času můžete reálně věnovat angličtině týdně (mimo hodiny)?', options: ['Téměř žádný - mám jen čas hodiny', '15-30 minut několikrát týdně', 'Asi 1 hodinu rozloženou na týden', '2-3 hodiny - jsem odhodlaný/á', 'Více než 3 hodiny - angličtina je moje priorita'] },
  'wt_q6': { question: 'Které vzdělávací aktivity vás baví? Vyberte vše, co platí.', options: ['Sledování videí/filmů v angličtině', 'Čtení článků nebo knih', 'Vedení konverzací', 'Gramatická cvičení', 'Učení nové slovní zásoby s kartičkami', 'Poslech podcastů', 'Psaní textů (e-maily, příběhy)', 'Jazykové hry/kvízy', 'Zpívání písní v angličtině'] },
  'wt_q7': { question: 'Jak se cítíte, když děláte chyby v angličtině?', options: ['Vůbec mi to nevadí - tak se učíme', 'Raději bych je nedělal/a, ale zvládnu to', 'Stydím se, ale snažím se pokračovat', 'Vyhýbám se mluvení kvůli strachu z chyb', 'Hodně se na sebe zlobím'] },
  'wt_q8': { question: 'Co vám nejvíce pomáhá zapamatovat si nové slovo?', options: ['Vidět ho napsané s definicí', 'Slyšet ho ve větě', 'Hned ho použít ve vlastní větě', 'Spojit ho s obrázkem', 'Opakovat mnohokrát', 'Porozumět částem slova (předpona, kořen, přípona)'] },
  'wt_q9': { question: 'Jak dlouho se učíte angličtinu?', options: ['Méně než 1 rok', '1-3 roky', '3-5 let', '5-10 let', 'Více než 10 let'] },
  'wt_q10': { question: 'Kde jste se hlavně učili angličtinu?', description: 'Vyberte vše, co platí.', options: ['Škola (jako předmět)', 'Univerzita', 'Soukromé hodiny s učitelem', 'Jazyková škola/kurz', 'Samostudium (aplikace, knihy, YouTube)', 'Život/práce v anglicky mluvící zemi', 'Přes práci (každodenní používání)'] },
  'wt_q11': { question: 'Skládali jste někdy oficiální zkoušku z angličtiny?', options: ['Ne, nikdy', 'Ano - školní/univerzitní zkouška', 'Ano - Cambridge (FCE/CAE/CPE)', 'Ano - IELTS', 'Ano - TOEFL', 'Ano - jiná'] },
  'wt_q12': { question: 'Jaká je největší výzva, které jste čelili při učení angličtiny?', description: 'V 1-2 větách popište svou největší frustraci.' },
  'wt_q13': { question: 'Je něco, co vaši předchozí učitelé dělali obzvláště dobře?', description: 'Jaké metody vám nejvíce pomohly?' },
  'wt_q14': { question: 'Jste v kavárně v zahraničí. Barista se vás ptá na něco, čemu úplně nerozumíte. Co uděláte?', options: ['Řeknu "Promiňte, mohl/a byste to zopakovat?" a zkusím to znovu', 'Jen ukážu na menu a usměju se', 'Použiji Google Translate na telefonu', 'Odpovím tím, co si myslím, že se ptali'] },
  'wt_q15': { question: 'Váš anglicky mluvící kolega vám pošle dlouhý e-mail o projektu. Některé části nejsou jasné. Co uděláte?', options: ['Přečtu pozorně, vyhledám neznámá slova a odpovím', 'Odpovím s žádostí o objasnění nejasných částí', 'Většinu chápu a zbytek odhaduji z kontextu', 'Mám problém s porozuměním a musím většinu přeložit', 'Nesnažím se rozumět, použiji ChatGPT'] },
  'wt_q16': { question: 'Potřebujete popsat problém s hotelovým pokojem na recepci.', description: 'Napište 2-3 věty vysvětlující, že klimatizace nefunguje.' },
  'wt_q17': { question: 'Jste na pracovním pohovoru a ptají se "Řekněte nám o výzvě v práci." Jak odpovíte?', description: 'Napište 3-4 věty, jako byste byli skutečně na pohovoru.' },
  'wt_q36': { question: 'Jak byste zdvořile odmítli pozvánku na párty kolegy?', description: 'Napište 1-2 věty.' },
  'wt_q40': { question: 'Přečtěte si tyto dvě verze. Která zní lépe a proč?', description: 'Která verze zní lépe a proč? Napište 1 větu.' },
  'wt_q41': { question: 'Kdybyste mohli dosáhnout JEDNÉ věci v angličtině za 3 měsíce, co by to bylo?', description: 'Pište svobodně - žádné špatné odpovědi.' },
  'wt_q42': { question: 'Jak preferujete dostávat zpětnou vazbu na své chyby?', options: ['Opravte mě okamžitě, pokaždé', 'Zapište si je a probereme na konci', 'Opravujte jen velké chyby, malé ignorujte', 'Napište opravy, abych si je přečetl/a později', 'Raději se opravuji sám/sama s nápovědami'] },
  'wt_q43': { question: 'Jaká témata vás zajímají nejvíce? Vyberte až 3.', options: ['Technologie a inovace', 'Business a finance', 'Cestování a kultura', 'Zdraví a životní styl', 'Věda a příroda', 'Zábava a popkultura', 'Sport', 'Jídlo a vaření', 'Psychologie a osobní rozvoj', 'Politika a aktuální dění', 'Umění a literatura', 'Historie'] },
  'wt_q44': { question: 'Jak byste ohodnotili svou sebedůvěru v těchto oblastech?', description: 'Ohodnoťte každou oblast od 1 (žádná důvěra) do 5 (velmi sebejistý).' },
  'wt_q45': { question: 'Je ještě něco, co byste chtěli, aby váš učitel o vás věděl?', description: 'Volitelné - napište cokoli, co považujete za užitečné.' },
};

const UKRAINIAN: TranslationSet = {
  'wt_q1': { question: 'Як би ви описали свою англійську зараз?', description: 'Виберіть варіант, який найкраще описує ваш поточний рівень.', options: ['Я справляюся з базовими повсякденними ситуаціями, як замовлення їжі чи запитання про дорогу', 'Я можу вести прості розмови на знайомі теми, але мені складно зі складними ідеями', 'Я можу обговорювати більшість тем, але роблю граматичні помилки і іноді бракує словникового запасу', 'Я вільно розмовляю у більшості ситуацій, але хочу звучати природніше та точніше', 'Мені комфортно англійською, але я хочу опанувати просунуту/професійну мову'] },
  'wt_q2': { question: 'Що вас найбільше засмучує, коли ви говорите англійською?', description: 'Виберіть усі, що підходять.', options: ['Я знаю, що хочу сказати, але не можу знайти потрібних слів', 'Я роблю граматичні помилки, які знаю, що неправильні', 'Я не розумію носіїв мови, коли вони говорять швидко', 'Я нервуюся і забуваю все, що знаю', 'Не можу виразити складні ідеї - спрощую надто', 'Моя вимова змушує людей просити повторити'] },
  'wt_q3': { question: 'Яка ваша основна причина вивчення англійської?', options: ['Потрібна для роботи - зустрічі, листи, презентації', 'Готуюся до іспиту (IELTS, Cambridge тощо)', 'Хочу подорожувати і вільно спілкуватися', 'Хочу дивитися фільми/читати книги без субтитрів', 'Хочу почуватися впевнено, спілкуючись з англомовними', 'Кар\'єрне зростання - потрібна англійська для підвищення', 'Переїжджаю до англомовної країни'] },
  'wt_q4': { question: 'Як ви зазвичай реагуєте, коли не розумієте щось англійською?', options: ['Прошу повторити або пояснити', 'Вдаю, що зрозумів/ла і сподіваюся на краще', 'Намагаюся вгадати з контексту', 'Нервуюся і переходжу на свою мову', 'Одразу шукаю на телефоні'] },
  'wt_q5': { question: 'Скільки часу ви реально можете приділяти англійській на тиждень (окрім уроків)?', options: ['Майже нічого - тільки час уроку', '15-30 хвилин кілька разів на тиждень', 'Близько 1 години протягом тижня', '2-3 години - я цілеспрямований/а', 'Більше 3 годин - англійська мій пріоритет'] },
  'wt_q6': { question: 'Які навчальні активності вам подобаються? Виберіть усі, що підходять.', options: ['Перегляд відео/фільмів англійською', 'Читання статей або книг', 'Ведення розмов', 'Граматичні вправи', 'Вивчення нових слів з картками', 'Прослуховування подкастів', 'Написання текстів (листи, оповідання)', 'Мовні ігри/вікторини', 'Спів пісень англійською'] },
  'wt_q7': { question: 'Як ви почуваєтеся, коли робите помилки англійською?', options: ['Мене це зовсім не турбує - так навчаються', 'Краще б не робив/ла, але справляюся', 'Мені ніяково, але я намагаюся продовжувати', 'Уникаю розмов через страх помилок', 'Дуже засмучуюся через себе'] },
  'wt_q8': { question: 'Що найкраще допомагає вам запам\'ятати нове слово?', options: ['Бачити його написаним з визначенням', 'Чути його в реченні', 'Відразу використати у власному реченні', 'Пов\'язати його з картинкою', 'Повторювати багато разів', 'Зрозуміти частини слова (префікс, корінь, суфікс)'] },
  'wt_q9': { question: 'Як довго ви вивчаєте англійську?', options: ['Менше 1 року', '1-3 роки', '3-5 років', '5-10 років', 'Більше 10 років'] },
  'wt_q10': { question: 'Де ви переважно вивчали англійську?', description: 'Виберіть усі, що підходять.', options: ['Школа (як предмет)', 'Університет', 'Приватні уроки з викладачем', 'Мовна школа/курси', 'Самонавчання (додатки, книги, YouTube)', 'Життя/робота в англомовній країні', 'Через роботу (щоденне використання)'] },
  'wt_q11': { question: 'Чи складали ви коли-небудь офіційний іспит з англійської?', options: ['Ні, ніколи', 'Так - шкільний/університетський іспит', 'Так - Cambridge (FCE/CAE/CPE)', 'Так - IELTS', 'Так - TOEFL', 'Так - інший'] },
  'wt_q12': { question: 'Яка найбільша складність, з якою ви зіткнулися при вивченні англійської?', description: 'В 1-2 реченнях опишіть свою найбільшу проблему.' },
  'wt_q13': { question: 'Чи є щось, що ваші попередні викладачі робили особливо добре?', description: 'Які методи допомогли вам найбільше?' },
  'wt_q14': { question: 'Ви в кав\'ярні за кордоном. Бариста запитує щось, що ви не зовсім розумієте. Що робите?', options: ['Кажу "Вибачте, чи можете повторити?" і пробую знову', 'Просто вказую на меню і посміхаюся', 'Використовую Google Translate на телефоні', 'Відповідаю тим, що, на мою думку, запитали'] },
  'wt_q15': { question: 'Ваш англомовний колега надсилає довгий лист про проект. Деякі частини нечіткі. Що робите?', options: ['Уважно читаю, шукаю незнайомі слова і відповідаю', 'Відповідаю з проханням пояснити незрозумілі частини', 'Розумію більшу частину і вгадую решту з контексту', 'Мені важко зрозуміти, потрібно перекладати більшість', 'Не намагаюся зрозуміти, використовую ChatGPT'] },
  'wt_q16': { question: 'Вам потрібно описати проблему з готельним номером на ресепшені.', description: 'Напишіть 2-3 речення, пояснюючи, що кондиціонер не працює.' },
  'wt_q17': { question: 'Ви на співбесіді, і вас запитують: "Розкажіть про складність на роботі." Як відповісте?', description: 'Напишіть 3-4 речення, ніби ви справді на співбесіді.' },
  'wt_q36': { question: 'Як би ви ввічливо відхилили запрошення на вечірку колеги?', description: 'Напишіть 1-2 речення.' },
  'wt_q40': { question: 'Прочитайте ці дві версії. Яка звучить краще і чому?', description: 'Яка версія звучить для вас краще і чому? Напишіть 1 речення.' },
  'wt_q41': { question: 'Якби ви могли досягти ОДНОГО в англійській за 3 місяці, що б це було?', description: 'Пишіть вільно - немає неправильних відповідей.' },
  'wt_q42': { question: 'Як ви віддаєте перевагу отримувати зворотний зв\'язок про помилки?', options: ['Виправляйте одразу, кожного разу', 'Запишіть і обговоримо наприкінці', 'Виправляйте лише серйозні помилки, дрібні ігноруйте', 'Напишіть виправлення для пізнішого перегляду', 'Волію самокорекцію з підказками'] },
  'wt_q43': { question: 'Які теми вас цікавлять найбільше? Виберіть до 3.', options: ['Технології та інновації', 'Бізнес і фінанси', 'Подорожі та культура', "Здоров'я та спосіб життя", 'Наука та природа', 'Розваги та поп-культура', 'Спорт', 'Їжа та кулінарія', 'Психологія та саморозвиток', 'Політика та поточні події', 'Мистецтво та література', 'Історія'] },
  'wt_q44': { question: 'Як би ви оцінили свою впевненість у цих сферах?', description: 'Оцініть кожну сферу від 1 (немає впевненості) до 5 (дуже впевнений).' },
  'wt_q45': { question: 'Чи є щось ще, що ви хотіли б, щоб ваш викладач знав про вас або ваше навчання?', description: 'Необов\'язково - напишіть все, що вважаєте корисним.' },
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
