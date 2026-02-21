# DSLM Layer B v5 - Skorygowany plan nano_skills

---

## KLUCZOWE KOREKTY vs v4

1. **Dwa nano_skills dla zadan otwartych** - Punkt 22 zmienia sie z "EXACTLY one nano_skill" na "one or two nano_skills". Drugi nano_skill pojawia sie w zadaniach gdzie student PISZE odpowiedz (reading, dialogue, discussion, describe-picture, answer-questions, answer-questions-picture, listening-comprehension, answer-questions-audio). Pierwszy nano_skill bada umiejetnosc odbiorcza (reading/listening/speaking), drugi bada writing. Speaking nano_skills dostaja NIZSZY confidence (0.35-0.45) bo student pisze a nie mowi.
2. **Matching = word-specific** - `ns.A2.vocabulary.definition_appetizer` zamiast `ns.A2.vocabulary.definition_matching`
3. **Error-correction = ta sama umiejetnosc co testowana** - `ns.A1.comparatives.irregular_better` zamiast `ns.A2.comparatives.double_comparative_error`
4. **Odd-one-out = konkretna czesc mowy** - `ns.A2.vocabulary.noun_recognition` zamiast `ns.A2.vocabulary.part_of_speech_recognition`
5. **Picture exercises = visual_comprehension** - nowa kategoria zamiast `reading`
6. **Paraphrasing = structural_paraphrase** - wszystkie, bo synonim jest juz podany
7. **Sentence-transformation** - poprawki uzytkownika (ns.B1.first_conditional.unless, ns.A2.superlatives.irregular_best, itd.)
8. Uwaga ja tu w planie po jego utworzeniu przez CIebie wprowdziłem tu ręcznie poprawki! nie rób z pamięci i zastosuj te zmiany!!!!!

---

## NOWY PUNKT 22 (core-instructions.ts)

```text
22. PEDAGOGICAL SKILL TAGGING (NANO_SKILL SYSTEM)
Each exercise item MUST include one or two nano_skill entries in the nano_skill array.
A nano_skill represents the smallest observable and testable unit of language ability.
A nano_skill MUST be verifiable from a single learner answer without external context.
A nano_skill MUST NOT describe broad grammar topics, lesson goals, exercise types, or teaching strategies.
Confidence values MUST be in range 0.00-1.00 and express certainty that the item genuinely tests the skill.
Reason MUST explain why this specific item tests the skill.
nano_skill tagging MUST be logically consistent with lesson topic, lesson focus and exercise type.

DUAL NANO_SKILL RULE:
For open-ended exercises where students WRITE their answers (reading questions, dialogue, discussion, describe-picture, answer-questions, answer-questions-picture, listening-comprehension, answer-questions-audio), include TWO nano_skills:
1. Primary skill (reading/listening/speaking/grammar) - the main ability being tested
2. Writing skill - the ability to construct a written response
For speaking-tagged nano_skills in written exercises, use LOWER confidence (0.55-0.65) because the student types rather than speaks, so speaking assessment is indirect.
Writing nano_skills should have normal confidence (0.85-0.95).

NANO_SKILL NAMING CONVENTION - CRITICAL:
Format: ns.[CEFR_level].[topic].[skill_name]
- CEFR_level: A1, A2, B1, B2, C1 or C2. Assign based on actual difficulty of the SPECIFIC ITEM, not the worksheet level. Consider word frequency, abstractness, and communicative usefulness per CEFR standards.
- topic: Use full English names (e.g. past_simple, comparatives, vocabulary, reading, passive_voice, visual_comprehension). Do NOT use abbreviations.
- skill_name: Describe the LINGUISTIC SKILL being tested, NOT the lesson context. Keep names REUSABLE. For irregular forms include the specific word (e.g. irregular_verb_go, irregular_better). For semantic domains add the domain (e.g. adjective_synonym.taste, word_family_food_grouping). For definition matching include the word (e.g. definition_appetizer).

See exercise templates below for golden examples of correct nano_skill naming per exercise type.
```

---

## WSZYSTKIE NANO_SKILLS (29 typow zadan)

### 1. READING (5 questions) - DUALNY: reading + writing

```text
Q1: "Why is there such a wide variety of food..."
  -> ns.A2.reading.main_idea_extraction  (conf: 0.95)
  -> ns.A2.writing.cause_effect_response  (conf: 0.90)

Q2: "What are some typical examples of appetizers..."
  -> ns.A2.reading.detail_extraction  (conf: 0.92)
  -> ns.A2.writing.listing_from_text  (conf: 0.88)

Q3: "What is special about New York-style pizza?"
  -> ns.A2.reading.detail_extraction  (conf: 0.92)
  -> ns.A2.writing.descriptive_response  (conf: 0.88)

Q4: "What are some of the most popular international cuisines..."
  -> ns.A2.reading.detail_extraction  (conf: 0.92)
  -> ns.A2.writing.listing_from_text  (conf: 0.88)

Q5: "What are some common complaints..."
  -> ns.A2.reading.detail_extraction  (conf: 0.92)
  -> ns.A2.writing.listing_from_text  (conf: 0.88)
```

### 2. TRUE-FALSE (10 statements) - POJEDYNCZY (zamkniete)

```text
S1:  ns.A2.reading.paraphrase_recognition
S2:  ns.A2.reading.negation_detection
S3:  ns.A2.reading.detail_verification
S4:  ns.A2.reading.detail_verification
S5:  ns.A2.reading.detail_verification
S6:  ns.A2.reading.inference_validation
S7:  ns.A2.reading.detail_verification
S8:  ns.A2.reading.detail_verification
S9:  ns.A2.reading.paraphrase_recognition
S10: ns.A2.reading.negation_detection
```

Zweryfikowane - wszystko OK. Logika: paraphrase_recognition gdy zdanie jest parafraza tekstu (S1, S9), negation_detection gdy zdanie zawiera falszywa negacje (S2, S10), detail_verification dla prostego sprawdzenia faktu (S3-S5, S7-S8), inference_validation gdy wymaga wnioskowania (S6).

### 3. MATCHING (10 items) - word-specific

```text
Appetizer     -> ns.A2.vocabulary.definition_appetizer
Cuisine       -> ns.B1.vocabulary.definition_cuisine
Portion       -> ns.A2.vocabulary.definition_portion
Incorrect     -> ns.A2.vocabulary.definition_incorrect
Complaint     -> ns.A2.vocabulary.definition_complaint
Fine dining   -> ns.B1.vocabulary.definition_fine_dining
Reservation   -> ns.A2.vocabulary.definition_reservation
Signature dish -> ns.B1.vocabulary.definition_signature_dish
Undercooked   -> ns.A2.vocabulary.definition_undercooked
Customer service -> ns.A2.vocabulary.definition_customer_service
```

Uwaga: confidence niska (0.70-0.75) bo to dopasowanie a nie samodzielne tworzenie definicji.

### 4. FILL-IN-BLANKS (10 sentences) - POJEDYNCZY

```text
"NY is _____ for" -> famous
  -> ns.A2.collocations.adjective_preposition
Wyjasnienie: "famous for" to KOLOKACJA - przymiotnik + przyimek. To jest poprawne.

"many _____ cuisines" -> international
  -> ns.A2.vocabulary.contextual_word_choice

"bill is _____" -> incorrect
  -> ns.A2.vocabulary.contextual_word_choice

"_____ dishes" -> small
  -> ns.A2.vocabulary.contextual_word_choice

"most _____ foods" -> popular
  -> ns.A2.vocabulary.contextual_word_choice

"food arrives _____" -> cold
  -> ns.A2.vocabulary.contextual_word_choice

"many _____ cultures" -> different
  -> ns.A2.vocabulary.contextual_word_choice

"wide and _____ crust" -> thin
  -> ns.A2.vocabulary.contextual_word_choice

"very _____ but high-quality" -> expensive
  -> ns.A2.vocabulary.contextual_word_choice

"it is _____ to leave a tip" -> common
  -> ns.A2.collocations.adjective_infinitive
Wyjasnienie: "common to + verb" to KOLOKACJA (adjective + infinitive pattern).
```

Wiec pierwsze i ostatnie SA poprawnie oznaczone jako kolokacje, a reszta jako contextual_word_choice. Poprawka: ostatnie to `adjective_infinitive` nie `adjective_preposition`.

### 5. MULTIPLE-CHOICE (10 questions - comparatives/superlatives) - uwaga tu ręcznie poprawiłem więc zastosuj te zmiany!!!!!

```text
Q1:  "better" -> ns.A1.comparatives.irregular_better
Q2:  "most delicious" -> ns.A2.superlatives.regular
Q3:  "spicier" -> ns.A2.comparatives.short_adjective_spicier
Q4:  "most expensive" -> ns.A2.superlatives.regular
Q5:  "more slowly" -> ns.B1.comparatives.adverb_regular_more_slowly
Q6:  "tastier" -> ns.A2.comparatives.irregular_tastier
Q7:  "best" -> ns.A1.superlatives.irregular_best
Q8:  "more convenient" -> ns.A2.comparatives.regular
Q9:  "most popular" -> ns.A2.superlatives.regular
Q10: "warmer" -> ns.A2.comparatives.irregular_warmer
```

### 6. DIALOGUE (10 expressions) - DUALNY: speaking (niski conf) + writing

```text
"I'd like to order the..., please."
  -> ns.A2.speaking.polite_request  (conf: 0.40)
  -> ns.A2.writing.polite_request_structure  (conf: 0.90)

"Can I see the menu, please?"
  -> ns.A2.speaking.asking_for_information  (conf: 0.40)
  -> ns.A2.writing.question_formation  (conf: 0.90)

"Could you recommend something vegetarian?"
  -> ns.A2.speaking.asking_for_recommendation  (conf: 0.40)
  -> ns.A2.writing.polite_question_structure  (conf: 0.90)

"I think there's a mistake with my order."
  -> ns.A2.speaking.making_complaint  (conf: 0.40)
  -> ns.A2.writing.complaint_structure  (conf: 0.90)

"Excuse me, but this isn't what I asked for."
  -> ns.A2.speaking.making_complaint  (conf: 0.40)
  -> ns.A2.writing.complaint_structure  (conf: 0.90)

"Could I get the bill, please?"
  -> ns.A2.speaking.polite_request  (conf: 0.40)
  -> ns.A2.writing.polite_request_structure  (conf: 0.90)

"Can I have this to go?"
  -> ns.A2.speaking.polite_request  (conf: 0.40)
  -> ns.A2.writing.polite_request_structure  (conf: 0.90)

"The food was delicious, thank you!"
  -> ns.A2.speaking.expressing_gratitude  (conf: 0.40)
  -> ns.A2.writing.gratitude_expression  (conf: 0.90)

"I'm afraid my dish is cold."
  -> ns.B1.speaking.making_complaint  (conf: 0.4)
  -> ns.B1.writing.indirect_complaint_structure  (conf: 0.90)

"Can you bring us some more water, please?"
  -> ns.A2.speaking.polite_request  (conf: 0.40)
  -> ns.A2.writing.polite_request_structure  (conf: 0.90)
```

### 7. DISCUSSION (10 questions) - DUALNY: speaking (niski conf) + writing - uwaga tu ręcznie poprawiłem więc zastosuj te zmiany!!!!!

```text
"What is your favorite type of restaurant and why?"
  -> ns.A2.speaking.opinion_expression  (conf: 0.60)
  -> ns.A2.writing.opinion_justification  (conf: 0.90)

"Have you ever had a bad experience..."
  -> ns.A2.speaking.narrating_past_experience  (conf: 0.60)
  -> ns.A2.writing.past_tense_narrative  (conf: 0.90)

"Do you prefer eating at home or dining out?"
  -> ns.A2.speaking.comparison_and_contrast  (conf: 0.60)
  -> ns.A2.writing.comparative_response  (conf: 0.90)

"What dish would you recommend..."
  -> ns.A2.speaking.giving_recommendation  (conf: 0.60)
  -> ns.A2.writing.recommendation_structure  (conf: 0.90)

"Which restaurant is the most popular?"
  -> ns.A2.speaking.justifying_preference  (conf: 0.60)
  -> ns.A2.writing.superlative_justification  (conf: 0.90)

"How do you react if order is wrong?"
  -> ns.B1.speaking.describing_reaction  (conf: 0.55)
  -> ns.B1.writing.conditional_response  (conf: 0.90)

"What is more important: food or service?"
  -> ns.B1.speaking.comparison_and_contrast  (conf: 0.55)
  -> ns.B1.writing.comparative_argument  (conf: 0.90)

"Describe the most expensive meal..."
  -> ns.B1.speaking.narrating_past_experience  (conf: 0.55)
  -> ns.B1.writing.descriptive_narrative  (conf: 0.90)

"What makes a restaurant better than others?"
  -> ns.B1.speaking.justifying_preference  (conf: 0.55)
  -> ns.B1.writing.comparative_argument  (conf: 0.90)

"Have you tried a dish better than expected?"
  -> ns.A2.speaking.narrating_past_experience  (conf: 0.60)
  -> ns.A2.writing.past_tense_narrative  (conf: 0.90)
```

### 8. ERROR-CORRECTION (10 sentences) - ta sama umiejetnosc co testowana - uwaga tu ręcznie poprawiłem więc zastosuj te zmiany!!!!!

```text
"more better" -> "better"
  -> ns.A1.comparatives.irregular_better

"most tallest" -> "tallest"
  -> ns.A2.superlatives.irregular_tallest

"more big" -> "bigger"
  -> ns.A2.comparatives.irregular_bigger

"most hottest" -> "hottest"
  -> ns.A2.superlatives.irregular_hottest

"more expensiveer" -> "more expensive"
  -> ns.A2.comparatives.regular

"He is smarter..." (correct)
  -> ns.A2.comparatives.irregular_smarter

"most funniest" -> "funniest"
  -> ns.A2.superlatives.irregular_funniest

"more faster" -> "faster"
  -> ns.A2.comparatives.irregular_faster

"Winter is colder..." (correct)
  -> ns.A2.comparatives.irregular_colder

"the more talented" -> "the most talented"
  -> ns.A2.superlatives.regular
```

### 9. ODD-ONE-OUT (10 questions) - konkretna czesc mowy

```text
[running, swimming, cycling, sport, dancing] -> sport
  -> ns.A2.vocabulary.noun_recognition
  (sport to noun wsrod gerundow)

[quickly, slowly, carefully, fast, quietly] -> fast
  -> ns.A2.vocabulary.adjective_recognition
  (fast to adjective wsrod adverbow -ly)

[delicious, tasty, eat, spicy, sweet] -> eat
  -> ns.A2.vocabulary.verb_recognition

[waiter, chef, serve, cook, bartender] -> serve
  -> ns.A2.vocabulary.verb_recognition

[reservation, booking, order, complain, menu] -> complain
  -> ns.A2.vocabulary.verb_recognition

[hot, cold, warmth, fresh, spicy] -> warmth
  -> ns.A2.vocabulary.noun_recognition
  (warmth to noun wsrod adjectives)

[eating, drinking, table, cooking, serving] -> table
  -> ns.A2.vocabulary.noun_recognition
  (table to noun wsrod gerundow)

[expensive, cheap, beautifully, fresh, delicious] -> beautifully
  -> ns.A2.vocabulary.adverb_recognition

[starter, dessert, appetizer, main, eat] -> eat
  -> ns.A2.vocabulary.verb_recognition

[restaurant, cafe, cooking, bistro, diner] -> cooking
  -> ns.A2.vocabulary.gerund_recognition
```

### 10. SYNONYMS (10 items) - OK bez zmian

```text
delicious->tasty:      ns.A2.synonyms.adjective_synonym.taste
expensive->costly:     ns.A2.synonyms.adjective_synonym.price
recommend->suggest:    ns.A2.synonyms.verb_synonym.recommendation
popular->well-liked:   ns.A2.synonyms.adjective_synonym.popularity
affordable->reasonable: ns.A2.synonyms.adjective_synonym.price
authentic->genuine:    ns.B1.synonyms.adjective_synonym.authenticity
amazing->wonderful:    ns.A2.synonyms.adjective_synonym.quality
cozy->comfortable:    ns.A2.synonyms.adjective_synonym.comfort
busy->crowded:        ns.A2.synonyms.adjective_synonym.density
excellent->outstanding: ns.B1.synonyms.adjective_synonym.quality
```

### 11. ANTONYMS (10 items) - OK bez zmian

```text
expensive->cheap:     ns.A2.antonyms.adjective_antonym.price
delicious->tasteless: ns.A2.antonyms.adjective_antonym.taste
spicy->mild:         ns.A2.antonyms.adjective_antonym.spiciness
fresh->stale:        ns.A2.antonyms.adjective_antonym.freshness
hot->cold:           ns.A1.antonyms.adjective_antonym.temperature
crowded->empty:      ns.A2.antonyms.adjective_antonym.density
fast->slow:          ns.A1.antonyms.adjective_antonym.speed
polite->rude:        ns.A2.antonyms.adjective_antonym.manners
clean->dirty:        ns.A1.antonyms.adjective_antonym.cleanliness
quiet->noisy:        ns.A2.antonyms.adjective_antonym.volume
```

### 12. SYNONYMS-ANTONYMS LEGACY (10 items) - OK bez zmian

```text
delicious->tasty(syn):    ns.A2.synonyms.adjective_synonym.taste
expensive->cheap(ant):    ns.A2.antonyms.adjective_antonym.price
popular->famous(syn):     ns.A2.synonyms.adjective_synonym.popularity
fresh->new(syn):          ns.A2.synonyms.adjective_synonym.freshness
hot->cold(ant):           ns.A1.antonyms.adjective_antonym.temperature
busy->quiet(ant):         ns.A2.antonyms.adjective_antonym.volume
polite->rude(ant):        ns.A2.antonyms.adjective_antonym.manners
satisfied->disappointed:  ns.B1.antonyms.adjective_antonym.satisfaction
complaint->criticism(syn): ns.B1.synonyms.noun_synonym.complaint
quick->fast(syn):         ns.A1.synonyms.adjective_synonym.speed
```

### 13. SENTENCE-TRANSFORMATION (10 sentences) - poprawki uzytkownika

```text
"The chef prepares..." -> passive
  -> ns.B1.passive_voice.active_to_passive.present_simple

"more expensive than..." -> not as...as
  -> ns.A2.comparatives.not_as_as_structure

"never eaten such delicious pizza" -> superlative
  -> ns.A2.superlatives.superlative_transformation

"The waiter said..." -> reported speech
  -> ns.B1.reported_speech.direct_to_indirect

"We ordered dessert after..." -> having + past participle
  -> ns.B2.present_perfect.participial_clause

"so spicy that I couldn't eat" -> too...to
  -> ns.B1.writing.structural_too_to

"If you don't make reservation" -> unless
  -> ns.B1.first_conditional.unless

"serves better food than..." -> superlative
  -> ns.A2.superlatives.irregular_best

"I suggest you try..." -> modal verb
  -> ns.A2.modal_verbs.you_should

"so slow that we left" -> too...to
  -> ns.B1.writing.structural_too_to
```

### 14. WORD-ORDER (10 sentences) - OK bez zmian

```text
"This restaurant serves..." -> ns.A2.word_order.subject_verb_object
"We always leave..." -> ns.A2.word_order.adverb_frequency_position
"The menu has..." -> ns.A2.word_order.subject_verb_object
"The customer complained..." -> ns.A2.word_order.subject_verb_object
"You should book..." -> ns.A2.word_order.modal_verb_position
"New York is famous..." -> ns.A2.word_order.subject_verb_object
"I prefer eating out..." -> ns.B1.word_order.gerund_comparison_structure
"Have you been..." -> ns.A2.word_order.question_inversion
"The waiter recommended..." -> ns.A2.word_order.subject_verb_object
"It was the most..." -> ns.A2.word_order.superlative_sentence_structure
```

### 15. GAP-TEXT (10 sentences) - OK bez zmian

```text
went:                ns.A2.past_simple.irregular_verb_go
was:                 ns.A2.past_simple.irregular_verb_be
been working:        ns.B1.present_perfect_continuous.continuous_form
were:                ns.B1.second_conditional.subjunctive_were
spicy:               ns.A2.word_formation.adjective_from_noun
recommend:           ns.A2.modal_verbs.base_form_after_modal
forward:             ns.A2.phrasal_verbs.phrasal_verb_look_forward
opens:               ns.A2.present_simple.third_person_s
will have been serving: ns.C1.future_continuous.future_perfect_continuous
waited:              ns.A2.past_simple.regular_verb_form
```

### 16. NEGATIVE-PREFIXES (10 words) - uproszczone suffiksy

```text
dissatisfied:   ns.A2.negative_prefixes.prefix_dis
uncooked:       ns.A2.negative_prefixes.prefix_un
impolite:       ns.A2.negative_prefixes.prefix_im
incorrect:      ns.A2.negative_prefixes.prefix_in
unfresh:        ns.A2.negative_prefixes.prefix_un
inexpensive:    ns.A2.negative_prefixes.prefix_in
uncomfortable:  ns.A2.negative_prefixes.prefix_un
dishonest:      ns.A2.negative_prefixes.prefix_dis
impossible:     ns.A2.negative_prefixes.prefix_im
unpopular:      ns.A2.negative_prefixes.prefix_un
```

### 17. CATEGORIZE - OK bez zmian

Items dostaja nano_skill swojej kategorii:

```text
pizza:    ns.A1.vocabulary.word_family_food_grouping
waiter:   ns.A1.vocabulary.word_family_people_grouping
spoon:    ns.A1.vocabulary.word_family_utensils_grouping
breakfast: ns.A1.vocabulary.word_family_time_grouping
(itd. - 16 items, kazdy z nano_skill swojej kategorii)

Categories:
Food Items:       ns.A1.vocabulary.word_family_food_grouping
Restaurant Staff: ns.A2.vocabulary.word_family_people_grouping
Eating Utensils:  ns.A1.vocabulary.word_family_utensils_grouping
Meal Times:       ns.A1.vocabulary.word_family_time_grouping
```

### 18. PARAPHRASING (6 sentences) - WSZYSTKIE structural_paraphrase

```text
"delicious" -> "tasty"
  -> ns.B1.writing.structural_paraphrase
  (synonim jest JUZ PODANY w nawiasie, wiec student nie musi go znac
   - testujemy zdolnosc przebudowy zdania z uzyciem podanego slowa)

"wait a long time" -> "ages"
  -> ns.B1.writing.structural_paraphrase

"crowded" -> "busy"
  -> ns.B1.writing.structural_paraphrase

"complained about cold soup" -> "temperature"
  -> ns.B1.writing.structural_paraphrase

"serves the best coffee" -> "finest"
  -> ns.B1.writing.structural_paraphrase

"bill was much higher" -> "expensive"
  -> ns.B1.writing.structural_paraphrase
```

### 19. COMPLETE-WORD (10 words) - OK bez zmian

Wszystkie: `ns.A2.vocabulary.spelling_vowel_pattern`

### 20. MATCHING-HALVES (10 sentence pairs) - OK bez zmian

```text
1: ns.A2.reading.clause_connection.purpose
2: ns.A2.reading.clause_connection.cause
3: ns.A2.reading.clause_connection.addition
4: ns.A2.reading.clause_connection.contrast
5: ns.A2.reading.clause_connection.purpose
6: ns.B1.reading.clause_connection.condition
7: ns.B1.reading.clause_connection.result
8: ns.B1.reading.clause_connection.relative
9: ns.A2.reading.clause_connection.cause
10: ns.A2.reading.clause_connection.time
```

### 21. DESCRIBE-PICTURE (10 prompts) - DUALNY: speaking (niski conf) + writing - uwaga tu ręcznie poprawiłem więc zastosuj te zmiany!!!!!

```text
"Describe the overall scene and atmosphere"
  -> ns.A2.speaking.scene_description  (conf: 0.40)
  -> ns.A2.writing.descriptive_response  (conf: 0.90)

"What specific objects, people, or elements?"
  -> ns.A2.speaking.object_identification  (conf: 0.40)
  -> ns.A2.writing.listing_from_observation  (conf: 0.90)

"What colors, textures, visual details?"
  -> ns.A2.speaking.visual_detail_description  (conf: 0.40)
  -> ns.A2.writing.adjective_usage  (conf: 0.90)

"What activity or situation is taking place?"
  -> ns.A2.speaking.activity_description  (conf: 0.40)
  -> ns.A2.writing.present_continuous_description  (conf: 0.90)

"How would you describe the mood?"
  -> ns.B1.speaking.emotion_expression  (conf: 0.35)
  -> ns.B1.writing.mood_description  (conf: 0.90)

"What details are most interesting?"
  -> ns.B1.speaking.observation_analysis  (conf: 0.35)
  -> ns.B1.writing.analytical_response  (conf: 0.90)

"If you were in this scene..."
  -> ns.B1.speaking.hypothetical_reasoning  (conf: 0.35)
  -> ns.B1.writing.conditional_response  (conf: 0.90)

"What story could you tell?"
  -> ns.B1.speaking.narrative_construction  (conf: 0.35)
  -> ns.B1.writing.narrative_construction  (conf: 0.90)

"What questions would you ask?"
  -> ns.A2.speaking.question_formation  (conf: 0.40)
  -> ns.A2.writing.question_formation  (conf: 0.90)

"Compare this scene to your experience."
  -> ns.B1.speaking.comparison_and_contrast  (conf: 0.35)
  -> ns.B1.writing.comparative_response  (conf: 0.90)
```

### 22. ANSWER-QUESTIONS (8 questions) - DUALNY: primary + writing - uwaga tu ręcznie poprawiłem więc zastosuj te zmiany!!!!!

```text
"What's your favorite restaurant... better than others?"
  -> ns.A2.comparatives.irregular_better  (conf: 0.90)
  -> ns.A2.writing.comparative_response  (conf: 0.90)

"Describe the worst restaurant experience"
  -> ns.A2.superlatives.irregular_worst  (conf: 0.90)
  -> ns.A2.writing.past_tense_narrative  (conf: 0.90)

"If you could open your own restaurant..."
  -> ns.B1.second_conditional.hypothetical_situation  (conf: 0.90)
  -> ns.B1.writing.conditional_response  (conf: 0.90)

"How do you usually react when poor service?"
  -> ns.A2.speaking.describing_reaction  (conf: 0.40)
  -> ns.A2.writing.habitual_action_description  (conf: 0.90)

"What's the most expensive meal..."
  -> ns.A2.superlatives.long_adjective_most_expensive  (conf: 0.90)
  -> ns.A2.writing.superlative_narrative  (conf: 0.90)

"Do you prefer eating at home or dining out?"
  -> ns.A2.speaking.comparison_and_contrast  (conf: 0.40)
  -> ns.A2.writing.comparative_response  (conf: 0.90)

"What advice would you give?"
  -> ns.B1.modal_verbs.giving_advice  (conf: 0.90)
  -> ns.B1.writing.advice_structure  (conf: 0.90)

"How has your taste changed..."
  -> ns.B1.present_perfect.change_over_time  (conf: 0.90)
  -> ns.B1.writing.present_perfect_narrative  (conf: 0.90)
```

### 23. MULTIPLE-CHOICE-PICTURE (10 questions) - visual_comprehension

```text
"What is the main focus?"
  -> ns.A2.visual_comprehension.main_focus_identification

"How would you describe the atmosphere?"
  -> ns.A2.vocabulary.definition_atmosphere

"What type of food can you see?"
  -> ns.A2.vocabulary.food_identification

"How many people are visible?"
  -> ns.A2.visual_comprehension.detail_observation

"What can you infer about the service style?"
  -> ns.B1.visual_comprehension.inference_from_visual

"Which best describes the restaurant's style?"
  -> ns.A2.vocabulary.contextual_meaning

"What time of day does this picture suggest?"
  -> ns.B1.visual_comprehension.inference_from_visual

"What emotion do the customers seem to be showing?"
  -> ns.B1.visual_comprehension.emotion_inference

"Based on the image, which statement is most accurate?"
  -> ns.B1.visual_comprehension.inference_validation

"What can you see on the tables?"
  -> ns.A2.visual_comprehension.detail_observation
```

### 24. TRUE-FALSE-PICTURE (10 statements) - visual_comprehension

```text
S1: "appears to be busy" (true)
  -> ns.A2.visual_comprehension.visual_evidence_evaluation
S2: "no food visible" (false)
  -> ns.A2.visual_comprehension.negative_statement_verification
S3: "see staff members" (true)
  -> ns.A2.visual_comprehension.visual_evidence_evaluation
S4: "completely empty" (false)
  -> ns.A2.visual_comprehension.negative_statement_verification
S5: "multiple tables with customers" (true)
  -> ns.A2.visual_comprehension.visual_evidence_evaluation
S6: "shows only the kitchen" (false)
  -> ns.A2.visual_comprehension.detail_verification
S7: "enjoying their meals" (true)
  -> ns.A2.visual_comprehension.inference_validation
S8: "appears to be closed" (false)
  -> ns.A2.visual_comprehension.negative_statement_verification
S9: "different types of dishes" (true)
  -> ns.A2.visual_comprehension.visual_evidence_evaluation
S10: "fine dining restaurant" (false)
  -> ns.B1.visual_comprehension.inference_validation
```

### 25. ANSWER-QUESTIONS-PICTURE (10 questions) - DUALNY: speaking (niski) + writing- uwaga tu ręcznie poprawiłem więc zastosuj te zmiany!!!!!

```text
"Describe the atmosphere. Use at least 3 adjectives."
  -> ns.A2.speaking.scene_description  (conf: 0.40)
  -> ns.A2.writing.adjective_usage  (conf: 0.90)

"What types of food can you identify?"
  -> ns.A2.vocabulary.food_identification  (conf: 0.90)
  -> ns.A2.writing.listing_from_observation  (conf: 0.90)

"How many people? What are they doing?"
  -> ns.A2.speaking.scene_description  (conf: 0.60)
  -> ns.A2.writing.present_continuous_description  (conf: 0.90)

"Would you like to eat here? Why or why not?"
  -> ns.A2.speaking.opinion_expression  (conf: 0.40)
  -> ns.A2.writing.opinion_justification  (conf: 0.90)

"Compare this restaurant to your favorite."
  -> ns.A2.speaking.comparison  (conf: 0.40)
  -> ns.A2.writing.comparative_response  (conf: 0.90)

"What can you say about the service style?"
  -> ns.B1.speaking.observation_analysis  (conf: 0.35)
  -> ns.B1.writing.analytical_response  (conf: 0.90)

"What would you order and why?"
  -> ns.A2.speaking.expressing_preference  (conf: 0.40)
  -> ns.A2.writing.preference_justification  (conf: 0.90)

"What time of day? What details make you think that?"
  -> ns.B1.speaking.evidence_based_reasoning  (conf: 0.35)
  -> ns.B1.writing.evidence_based_response  (conf: 0.90)

"How does this compare to restaurants in your country?"
  -> ns.B1.speaking.comparison  (conf: 0.35)
  -> ns.B1.writing.comparison  (conf: 0.90)

"If you were the manager, what would you improve?"
  -> ns.B2.second_conditional.hypothetical_situation  (conf: 0.90)
  -> ns.B2.writing.conditional_response  (conf: 0.90)
```

### 26. LISTENING-COMPREHENSION (10 questions) - DUALNY: listening + writing 

```text
"What is the main topic or situation?"
  -> ns.B1.listening.main_idea_identification  (conf: 0.95)
  -> ns.B1.writing.summary_response  (conf: 0.90)

"Who are the speakers?"
  -> ns.B1.listening.speaker_identification  (conf: 0.95)
  -> ns.B1.writing.descriptive_response  (conf: 0.88)

"What specific details or facts?"
  -> ns.B1.listening.detail_extraction  (conf: 0.95)
  -> ns.B1.writing.listing_from_audio  (conf: 0.88)

"What problem is discussed?"
  -> ns.B1.listening.cause_effect_identification  (conf: 0.95)
  -> ns.B1.writing.cause_effect_response  (conf: 0.90)

"What is the tone or mood?"
  -> ns.B1.listening.tone_analysis  (conf: 0.95)
  -> ns.B1.writing.mood_description  (conf: 0.88)

"What happens at beginning, middle, end?"
  -> ns.B1.listening.sequence_of_events  (conf: 0.95)
  -> ns.B1.writing.narrative_sequence  (conf: 0.90)

"What opinions or suggestions?"
  -> ns.B1.listening.opinion_identification  (conf: 0.95)
  -> ns.B1.writing.opinion_summary  (conf: 0.88)

"What cultural information can you infer?"
  -> ns.B2.listening.cultural_inference  (conf: 0.95)
  -> ns.B2.writing.cultural_analysis  (conf: 0.88)

"What emotions do the speakers express?"
  -> ns.B1.listening.emotion_inference  (conf: 0.95)
  -> ns.B1.writing.emotion_description  (conf: 0.88)

"What is the outcome or conclusion?"
  -> ns.B1.listening.main_idea_identification  (conf: 0.95)
  -> ns.B1.writing.conclusion_summary  (conf: 0.88)
```

### 27. MULTIPLE-CHOICE-AUDIO (10 questions) - OK bez zmian (zamkniete)

```text
ns.B1.listening.main_idea_identification
ns.A2.listening.detail_extraction
ns.A2.listening.detail_extraction
ns.B1.listening.emotion_inference
ns.A2.listening.detail_extraction
ns.B1.listening.inference_from_context
ns.B1.listening.tone_analysis
ns.A2.listening.detail_extraction
ns.A2.listening.speaker_identification
ns.B1.listening.speaker_identification
```

### 28. TRUE-FALSE-AUDIO (10 statements) - OK bez zmian (zamkniete)

```text
ns.A2.listening.detail_extraction
ns.B1.listening.inference_validation
ns.B1.listening.emotion_inference
ns.A2.listening.detail_extraction
ns.B1.listening.inference_validation
ns.A2.listening.detail_extraction
ns.B1.listening.tone_analysis
ns.A2.listening.detail_extraction
ns.B1.listening.inference_validation
ns.B1.listening.sequence_of_events
```

### 29. FILL-IN-BLANKS-AUDIO (10 sentences) - OK bez zmian (zamkniete)

```text
ns.A2.listening.proper_noun_recognition
ns.A2.listening.detail_extraction
ns.A2.listening.keyword_extraction
ns.A2.listening.adjective_recognition
ns.A2.listening.verb_recognition
ns.B1.listening.adjective_recognition
ns.A2.listening.adverb_recognition
ns.A2.listening.keyword_extraction
ns.A2.listening.keyword_extraction
ns.A2.listening.adjective_recognition
```

### 30. ANSWER-QUESTIONS-AUDIO (10 questions) - DUALNY: listening/speaking + writing - uwaga tu ręcznie poprawiłem więc zastosuj te zmiany!!!!!

```text
"Describe the main situation you hear"
  -> ns.B1.listening.main_idea_identification  (conf: 0.95)
  -> ns.B1.writing.summary_response  (conf: 0.90)

"What emotions do you hear?"
  -> ns.B1.listening.emotion_inference  (conf: 0.95)
  -> ns.B1.writing.emotion_description  (conf: 0.88)

"What specific words or phrases stood out?"
  -> ns.B1.listening.detail_extraction  (conf: 0.95)
  -> ns.B1.writing.detail_response  (conf: 0.88)

"If you were in this situation..."
  -> ns.B1.speaking.hypothetical_reasoning  (conf: 0.35)
  -> ns.B1.writing.conditional_response  (conf: 0.90)

"Compare to a similar experience..."
  -> ns.B1.speaking.comparison_and_contrast  (conf: 0.35)
  -> ns.B1.writing.comparative_response  (conf: 0.90)

"What cultural insights?"
  -> ns.B2.speaking.comparison  (conf: 0.35)
  -> ns.B2.writing.cultural_analysis  (conf: 0.88)

"What happens after the audio ends?"
  -> ns.B1.speaking.narrative_construction  (conf: 0.35)
  -> ns.B1.writing.prediction_response  (conf: 0.90)

"What advice would you give?"
  -> ns.B1.modal_verbs.giving_advice  (conf: 0.90)
  -> ns.B1.writing.advice_structure  (conf: 0.90)

"What is the most important information?"
  -> ns.B1.listening.main_idea_identification  (conf: 0.95)
  -> ns.B1.writing.priority_identification  (conf: 0.88)

"How would you describe the relationship?"
  -> ns.B1.listening.speaker_identification  (conf: 0.95)
  -> ns.B1.writing.relationship_description  (conf: 0.88)
```

---

## ZMIANY TECHNICZNE

### 1. core-instructions.ts (linie 152-197)

Zastapienie obecnego punktu 22 nowym (krotszym, z regula dual nano_skill, bez listy prefiksow, bez golden examples). Okolo 25 linii zamiast obecnych 45.

### 2. individual-exercises.ts (caly plik)

Aktualizacja WSZYSTKICH nano_skill nazw we wszystkich 29 templateach JSON. Kluczowe zmiany:

- Dodanie CEFR levelu (ns.A2.xxx zamiast ns.xxx)
- Pelne nazwy (past_simple zamiast ps)
- Dual nano_skills dla 8 typow otwartych (reading, dialogue, discussion, describe-picture, answer-questions, answer-questions-picture, listening-comprehension, answer-questions-audio)
- Word-specific matching (definition_appetizer)
- Specific irregular forms (irregular_better, irregular_best)
- visual_comprehension dla picture exercises
- Konkretne czesci mowy w odd-one-out (noun_recognition, verb_recognition)

### 3. SQL migracja - extract_micro_skill()

Nowe mapowania dla formatu ns.CEFR.full_topic:

```text
ns.[ABC][12].past_simple.%          -> past_simple
ns.[ABC][12].comparatives.%         -> comparatives
ns.[ABC][12].superlatives.%         -> superlatives
ns.[ABC][12].vocabulary.%           -> vocabulary
ns.[ABC][12].synonyms.%             -> synonyms
ns.[ABC][12].antonyms.%             -> antonyms
ns.[ABC][12].reading.%              -> reading
ns.[ABC][12].speaking.%             -> speaking
ns.[ABC][12].writing.%              -> writing
ns.[ABC][12].listening.%            -> listening
ns.[ABC][12].visual_comprehension.% -> visual_comprehension
ns.[ABC][12].collocations.%         -> collocations
ns.[ABC][12].passive_voice.%        -> passive_voice
ns.[ABC][12].first_conditional.%    -> first_conditional
ns.[ABC][12].second_conditional.%   -> second_conditional
ns.[ABC][12].modal_verbs.%          -> modal_verbs
ns.[ABC][12].word_order.%           -> word_order
ns.[ABC][12].word_formation.%       -> word_formation
ns.[ABC][12].negative_prefixes.%    -> negative_prefixes
ns.[ABC][12].phrasal_verbs.%        -> phrasal_verbs
ns.[ABC][12].reported_speech.%      -> reported_speech
ns.[ABC][12].present_perfect.%      -> present_perfect
ns.[ABC][12].present_perfect_continuous.% -> present_perfect_continuous
ns.[ABC][12].present_simple.%       -> present_simple
ns.[ABC][12].future_continuous.%    -> future_continuous
(+ backward compatibility dla starych skrotow i legacy formatu)
```

### 4. SQL migracja - extract_skill_category()

Nowe mapowania:

```text
ns.[ABC][12].(past_simple|comparatives|superlatives|...|word_formation). -> grammar
ns.[ABC][12].(vocabulary|collocations|synonyms|antonyms|idioms).        -> vocabulary
ns.[ABC][12].reading.                                                   -> reading
ns.[ABC][12].speaking.                                                  -> speaking
ns.[ABC][12].writing.                                                   -> writing
ns.[ABC][12].listening.                                                 -> listening
ns.[ABC][12].visual_comprehension.                                      -> visual_comprehension
(+ backward compatibility)
```

### 5. Frontend - masteryCalculator.ts

Zmiana `buildItemEvaluations()`:

- Obecne: `safeGetNanoSkill(item)` bierze `ns[0]`
- Nowe: iteracja po WSZYSTKICH elementach `nano_skill` array, tworzenie evaluation dla kazdego
- Confidence z nano_skill wprost wplywa na wage mastery tego skill w agregacji

### 6. Frontend - textObjectFixer.ts

Dodanie `safeGetAllNanoSkills(item)` zwracajacego tablice WSZYSTKICH nano_skills (nie tylko pierwszego).

### 7. Frontend - NanoSkillBadge

Aktualizacja aby wyswietlac oba nano_skills (primary + secondary writing badge).

---

## PODSUMOWANIE ZMIAN


| Plik                    | Zmiana                                                                            |
| ----------------------- | --------------------------------------------------------------------------------- |
| core-instructions.ts    | Uproszczony punkt 22 z regula dual nano_skill                                     |
| individual-exercises.ts | WSZYSTKIE nano_skills zmienione (CEFR, pelne nazwy, dual, visual_comprehension)   |
| SQL migracja            | Nowy extract_micro_skill() i extract_skill_category() z formatem CEFR+pelne nazwy |
| masteryCalculator.ts    | buildItemEvaluations obsluguje wiele nano_skills per item                         |
| textObjectFixer.ts      | Nowa funkcja safeGetAllNanoSkills                                                 |
| NanoSkillBadge.tsx      | Wyswietlanie dual badges                                                          |
| 6 plikow dokumentacji   | Aktualizacja                                                                      |


### Czego NIE zmieniamy:

- Layer A (student_events) - dane nietkniete
- Triggery worksheet/homework/flashcard - bez zmian
- SkillsOverviewPanel / MasterySparkline / useSkillMetrics - bez zmian
- Format JSON nano_skill (nadal array of objects z name/confidence/reason)

### Kolejnosc implementacji:

1. Prompt: punkt 22 w core-instructions.ts
2. Templates: WSZYSTKIE nano_skills w individual-exercises.ts
3. Frontend: masteryCalculator + textObjectFixer + NanoSkillBadge (dual support)
4. SQL: extract_micro_skill + extract_skill_category + backfill
5. Dokumentacja