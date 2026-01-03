/**
 * Individual exercise functions - each returns its specific exercise JSON fragment
 * EXACT content from original prompt - no changes to text content!
 */

export const getReadingExercise = () => `    {
      "type": "reading",
      "title": "Exercise 1: Reading Comprehension",
      "icon": "fa-book-open",
      "time": 9,
      "instructions": "Read the following text and answer the questions below.",
      "content": "New York City is famous for its restaurants. People from all over the world live there, so the city offers many different types of food. You can find Italian, Chinese, Mexican, Japanese, Greek, Thai, Indian, and many more international cuisines. American-style diners and fast food restaurants are also very popular.\\nMost restaurants in New York have menus that include appetizers, main dishes, and desserts. Appetizers are small dishes that people eat before the main meal, such as soups, salads, or garlic bread. Main dishes are usually bigger and include meat, fish, or vegetarian options, often served with rice, potatoes, or pasta. Desserts like cheesecake, brownies, or ice cream are very common.\\nSome of the most popular types of food in New York include pizza, burgers, sushi, and pasta. People also enjoy trying food from food trucks, especially for lunch. One of the most famous dishes in the United States, and especially in New York, is the New York-style pizza. It's a thin, wide slice of pizza, usually eaten with your hands.\\nOf course, not every restaurant visit is perfect. Some common complaints that people make in New York restaurants include:\\n\\"The food is cold.\\"\\n\\"This is not what I ordered.\\"\\n\\"The portion is too small.\\"\\n\\"I waited too long for my food.\\"\\n\\"The bill is incorrect.\\"\\nLearning how to order food and make polite complaints in English is very useful if you ever visit New York or work in customer service.",
      "questions": [
        {"text": "Why is there such a wide variety of food in New York City restaurants?", "answer": "Because people from all over the world live in New York, so the city offers many different types of international cuisine.", "nano_skill": [{"name": "ns.reading.main_idea_extraction", "confidence": 0.95, "reason": "Requires identifying the main cause-effect relationship from the text"}, {"name": "ns.reading.explicit_detail_location", "confidence": 0.90, "reason": "Answer is directly stated in the first paragraph"}], "micro_skill": [{"name": "ms.reading.comprehension", "confidence": 0.95, "reason": "Tests understanding of text content and main ideas"}]},
        {"text": "What are some typical examples of appetizers, main dishes, and desserts mentioned in the text?", "answer": "Appetizers: soups, salads, garlic bread; Main dishes: meat, fish, or vegetarian options with rice, potatoes, or pasta; Desserts: cheesecake, brownies, ice cream.", "nano_skill": [{"name": "ns.reading.categorization_from_text", "confidence": 0.92, "reason": "Requires grouping information into given categories"}, {"name": "ns.reading.multiple_detail_extraction", "confidence": 0.90, "reason": "Requires finding multiple specific details from text"}], "micro_skill": [{"name": "ms.reading.detail_comprehension", "confidence": 0.92, "reason": "Tests ability to locate and organize specific information"}]},
        {"text": "What is special about New York-style pizza?", "answer": "It is a thin, wide slice of pizza, usually eaten with your hands.", "nano_skill": [...], "micro_skill": [...]},
        {"text": "What are some of the most popular international cuisines in New York?", "answer": "Italian, Chinese, Mexican, Japanese, Greek, Thai, and Indian cuisines.", "nano_skill": [...], "micro_skill": [...]},
        {"text": "What are some common complaints that customers make in New York restaurants?", "answer": "The food is cold, This is not what I ordered, The portion is too small, I waited too long for my food, and The bill is incorrect.", "nano_skill": [...], "micro_skill": [...]}
      ],
      "teacher_tip": "Use the comprehension questions as a starting point to ask more personal questions related to your student's life and experiences. Encourage them to share their opinions on the topics and situations mentioned in the text."
    }`;

export const getTrueFalseExercise = () => `    {
      "type": "true-false",
      "title": "Exercise 2: True or False",
      "icon": "fa-balance-scale",
      "time": 5,
      "instructions": "Read each statement about the text and decide if it is true or false.",
      "statements": [
        {"text": "New York City offers many international cuisines because people from all over the world live there.", "isTrue": true, "nano_skill": [{"name": "ns.reading.cause_effect_verification", "confidence": 0.94, "reason": "Verifies understanding of causal relationship from text"}, {"name": "ns.reading.paraphrase_recognition", "confidence": 0.88, "reason": "Statement paraphrases original text"}], "micro_skill": [{"name": "ms.reading.text_verification", "confidence": 0.94, "reason": "Tests ability to verify statements against source text"}]},
        {"text": "American-style diners are not popular in New York.", "isTrue": false, "nano_skill": [{"name": "ns.reading.negation_detection", "confidence": 0.92, "reason": "Requires detecting false negation of stated fact"}, {"name": "ns.reading.explicit_contradiction", "confidence": 0.90, "reason": "Statement contradicts explicit information in text"}], "micro_skill": [{"name": "ms.reading.text_verification", "confidence": 0.92, "reason": "Tests recognition of false statements"}]},
        {"text": "Appetizers are usually bigger than main dishes.", "isTrue": false, "nano_skill": [...], "micro_skill": [...]},
        {"text": "New York-style pizza is thick and eaten with a fork and knife.", "isTrue": false, "nano_skill": [...], "micro_skill": [...]},
        {"text": "Food trucks are especially popular for lunch in New York.", "isTrue": true, "nano_skill": [...], "micro_skill": [...]},
        {"text": "All restaurant visits in New York are perfect according to the text.", "isTrue": false, "nano_skill": [...], "micro_skill": [...]},
        {"text": "One common complaint is that the food arrives cold.", "isTrue": true, "nano_skill": [...], "micro_skill": [...]},
        {"text": "Desserts like cheesecake and brownies are common in New York restaurants.", "isTrue": true, "nano_skill": [...], "micro_skill": [...]},
        {"text": "The text mentions that learning to complain politely is useful for customer service work.", "isTrue": true, "nano_skill": [...], "micro_skill": [...]},
        {"text": "Main dishes in New York restaurants never include vegetarian options.", "isTrue": false, "nano_skill": [...], "micro_skill": [...]}
      ],
      "teacher_tip": "Use this exercise to check reading comprehension and ensure students understood the key details from the text."
    }`;

export const getMatchingExercise = () => `    {
      "type": "matching",
      "title": "Exercise 3: Vocabulary Matching",
      "icon": "fa-link",
      "time": 7,
      "instructions": "Match each term with its correct definition.",
      "items": [
        {"term": "Appetizer", "definition": "A small dish served before the main course to stimulate the appetite.", "nano_skill": [{"name": "ns.vocab.restaurant_terminology", "confidence": 0.95, "reason": "Tests knowledge of meal course vocabulary"}, {"name": "ns.vocab.definition_matching", "confidence": 0.90, "reason": "Requires matching term to its definition"}], "micro_skill": [{"name": "ms.vocab.term_definition_pairing", "confidence": 0.95, "reason": "Tests vocabulary comprehension through matching"}]},
        {"term": "Cuisine", "definition": "A style or method of cooking, especially as characteristic of a particular country or region.", "nano_skill": [{"name": "ns.vocab.food_culture_terms", "confidence": 0.93, "reason": "Tests understanding of culinary terminology"}, {"name": "ns.vocab.abstract_noun_meaning", "confidence": 0.88, "reason": "Requires understanding abstract concept definition"}], "micro_skill": [{"name": "ms.vocab.term_definition_pairing", "confidence": 0.93, "reason": "Tests matching abstract vocabulary to definition"}]},
        {"term": "Portion", "definition": "The amount of food served to one person at a meal.", "nano_skill": [...], "micro_skill": [...]},
        {"term": "Incorrect", "definition": "Not accurate or wrong; used especially in the context of errors with orders or bills.", "nano_skill": [...], "micro_skill": [...]},
        {"term": "Complaint", "definition": "A statement that something is wrong or not satisfactory, especially in service or quality.", "nano_skill": [...], "micro_skill": [...]},
        {"term": "Fine dining", "definition": "A high-end, expensive restaurant experience offering exceptional food, service, and atmosphere.", "nano_skill": [...], "micro_skill": [...]},
        {"term": "Reservation", "definition": "An arrangement made in advance to secure a table at a restaurant.", "nano_skill": [...], "micro_skill": [...]},
        {"term": "Signature dish", "definition": "A unique or famous meal that represents a restaurant or chef's style.", "nano_skill": [...], "micro_skill": [...]},
        {"term": "Undercooked", "definition": "Food that has not been cooked long enough and may be unsafe or unpleasant to eat.", "nano_skill": [...], "micro_skill": [...]},
        {"term": "Customer service", "definition": "The assistance and advice provided by a restaurant or business to people who use its services.", "nano_skill": [...], "micro_skill": [...]}
      ],
      "teacher_tip": "Before the matching activity, introduce and pronounce each term to ensure students feel confident recognizing and understanding them. If needed, translate the most difficult or abstract vocabulary terms into the student's native language. After the exercise, assign students a follow-up task to write 10 original sentences using the new vocabulary."
    }`;

export const getFillInBlanksExercise = () => `    {
      "type": "fill-in-blanks",
      "title": "Exercise 4: Fill in the Blanks",
      "icon": "fa-pencil-alt",
      "time": 8,
      "instructions": "Complete each sentence with the correct word from the box.",
      "word_bank": ["famous", "international", "incorrect", "small", "popular", "cold", "different", "thin", "expensive", "common"],
      "sentences": [
        {"text": "New York is _____ for its wide variety of restaurants and street food.", "answer": "famous", "nano_skill": [{"name": "ns.vocab.adjective_collocation_for", "confidence": 0.94, "reason": "Tests 'famous for' collocation"}, {"name": "ns.vocab.descriptive_adjective_selection", "confidence": 0.90, "reason": "Requires selecting appropriate descriptive adjective"}], "micro_skill": [{"name": "ms.vocab.contextual_word_choice", "confidence": 0.94, "reason": "Tests vocabulary selection in context"}]},
        {"text": "The city offers many _____ cuisines, like Thai, Italian, and Indian.", "answer": "international", "nano_skill": [{"name": "ns.vocab.nationality_category_adjective", "confidence": 0.93, "reason": "Tests adjective describing origin/nationality scope"}, {"name": "ns.vocab.cuisine_collocations", "confidence": 0.88, "reason": "Tests common cuisine modifier"}], "micro_skill": [{"name": "ms.vocab.contextual_word_choice", "confidence": 0.93, "reason": "Tests appropriate modifier selection"}]},
        {"text": "Customers often complain when their bill is _____.", "answer": "incorrect", "nano_skill": [...], "micro_skill": [...]},
        {"text": "Appetizers are usually _____ dishes served before the main course.", "answer": "small", "nano_skill": [...], "micro_skill": [...]},
        {"text": "Pizza is one of the most _____ foods in New York.", "answer": "popular", "nano_skill": [...], "micro_skill": [...]},
        {"text": "One common complaint is that the food arrives _____.", "answer": "cold", "nano_skill": [...], "micro_skill": [...]},
        {"text": "You can try food from many _____ cultures in New York.", "answer": "different", "nano_skill": [...], "micro_skill": [...]},
        {"text": "New York-style pizza is known for its wide and _____ crust.", "answer": "thin", "nano_skill": [...], "micro_skill": [...]},
        {"text": "Some restaurants are very _____, but they offer high-quality service.", "answer": "expensive", "nano_skill": [...], "micro_skill": [...]},
        {"text": "It is _____ to leave a tip in American restaurants.", "answer": "common", "nano_skill": [...], "micro_skill": [...]}
      ],
      "teacher_tip": "You can use this exercise in the next class as a sentence translation activity—provide the sentences in the student's native language and ask them to translate them into English to practice the new vocabulary."
    }`;

export const getMultipleChoiceExercise = () => `    {
      "type": "multiple-choice",
      "title": "Exercise 5: Multiple Choice",
      "icon": "fa-check-square",
      "time": 8,
      "instructions": "Choose the best option to complete each sentence.",
      "questions": [
        {
          "text": "This restaurant is ______ than the one we went to last week.",
          "options": [
            {"label": "A", "text": "good", "correct": false},
            {"label": "B", "text": "better", "correct": true},
            {"label": "C", "text": "best", "correct": false},
            {"label": "D", "text": "the better", "correct": false}
          ],
          "nano_skill": [{"name": "ns.grammar.comparative_irregular_good", "confidence": 0.95, "reason": "Tests irregular comparative form of 'good'"}, {"name": "ns.grammar.comparative_than_construction", "confidence": 0.90, "reason": "Tests comparative + than structure"}],
          "micro_skill": [{"name": "ms.grammar.comparative_forms", "confidence": 0.95, "reason": "Tests selection of correct comparative form"}]
        },
        {
          "text": "That was the ______ meal I've ever had!",
          "options": [
            {"label": "A", "text": "most delicious", "correct": true},
            {"label": "B", "text": "more delicious", "correct": false},
            {"label": "C", "text": "deliciouser", "correct": false},
            {"label": "D", "text": "deliciousest", "correct": false}
          ],
          "nano_skill": [{"name": "ns.grammar.superlative_long_adjective", "confidence": 0.94, "reason": "Tests 'most + adjective' superlative form"}, {"name": "ns.grammar.superlative_the_construction", "confidence": 0.90, "reason": "Tests 'the + superlative' structure"}],
          "micro_skill": [{"name": "ms.grammar.superlative_forms", "confidence": 0.94, "reason": "Tests correct superlative formation"}]
        },
        {
          "text": "Chinese food is usually ______ than British food.",
          "options": [
            {"label": "A", "text": "spicy", "correct": false},
            {"label": "B", "text": "the spiciest", "correct": false},
            {"label": "C", "text": "spicier", "correct": true},
            {"label": "D", "text": "most spicy", "correct": false}
          ],
          "nano_skill": [...],
          "micro_skill": [...]
        },
        {
          "text": "That's the ______ restaurant in our neighborhood.",
          "options": [
            {"label": "A", "text": "expensiver", "correct": false},
            {"label": "B", "text": "most expensive", "correct": true},
            {"label": "C", "text": "more expensive", "correct": false},
            {"label": "D", "text": "expensivest", "correct": false}
          ],
          "nano_skill": [...],
          "micro_skill": [...]
        },
        {
          "text": "John eats ______ than his brother.",
          "options": [
            {"label": "A", "text": "most slowly", "correct": false},
            {"label": "B", "text": "the slowest", "correct": false},
            {"label": "C", "text": "slow", "correct": false},
            {"label": "D", "text": "more slowly", "correct": true}
          ],
          "nano_skill": [...],
          "micro_skill": [...]
        },
        {
          "text": "This soup is ______ than the one I made yesterday.",
          "options": [
            {"label": "A", "text": "tastier", "correct": true},
            {"label": "B", "text": "the tastiest", "correct": false},
            {"label": "C", "text": "tasty", "correct": false},
            {"label": "D", "text": "more tastiest", "correct": false}
          ],
          "nano_skill": [...],
          "micro_skill": [...]
        },
        {
          "text": "Of all the dishes on the menu, the lasagna is the ______.",
          "options": [
            {"label": "A", "text": "good", "correct": false},
            {"label": "B", "text": "better", "correct": false},
            {"label": "C", "text": "best", "correct": true},
            {"label": "D", "text": "more better", "correct": false}
          ],
          "nano_skill": [...],
          "micro_skill": [...]
        },
        {
          "text": "Pizza is ______ than soup for a quick lunch.",
          "options": [
            {"label": "A", "text": "the convenient", "correct": false},
            {"label": "B", "text": "more convenient", "correct": true},
            {"label": "C", "text": "convenientest", "correct": false},
            {"label": "D", "text": "most convenient", "correct": false}
          ],
          "nano_skill": [...],
          "micro_skill": [...]
        },
        {
          "text": "This is the ______ café in town. Everyone loves it!",
          "options": [
            {"label": "A", "text": "more popular", "correct": false},
            {"label": "B", "text": "popular", "correct": false},
            {"label": "C", "text": "popularest", "correct": false},
            {"label": "D", "text": "most popular", "correct": true}
          ],
          "nano_skill": [...],
          "micro_skill": [...]
        },
        {
          "text": "The weather today is much ______ than it was yesterday.",
          "options": [
            {"label": "A", "text": "warmer", "correct": true},
            {"label": "B", "text": "the warmest", "correct": false},
            {"label": "C", "text": "warm", "correct": false},
            {"label": "D", "text": "most warm", "correct": false}
          ],
          "nano_skill": [...],
          "micro_skill": [...]
        }
      ],
      "teacher_tip": "After choosing an answer, ask students to explain why they picked it. This encourages deeper thinking and grammar awareness. Show tricky or commonly confused forms (more better, the most nicest) and explain why they are incorrect."
    }`;

export const getDialogueExercise = () => `    {
      "type": "dialogue",
      "title": "Exercise 6: Dialogue Practice",
      "icon": "fa-comments",
      "time": 8,
      "instructions": "Read the dialogue and practice with a partner.",
      "dialogue": [
        {"speaker": "Waiter", "text": "Good evening! Can I take your order?"},
        {"speaker": "Customer", "text": "Yes, I'd like the grilled salmon with vegetables, please."},
        {"speaker": "Waiter", "text": "Of course. Would you like anything to drink?"},
        {"speaker": "Customer", "text": "A glass of sparkling water, please."},
        {"speaker": "Waiter", "text": "Great. Your order will be ready shortly."},
        {"speaker": "Waiter", "text": "Here is your grilled salmon. Enjoy your meal!"},
        {"speaker": "Customer", "text": "Thank you."},
        {"speaker": "Customer", "text": "Excuse me, I'm sorry but this isn't what I ordered. I asked for grilled salmon, but this is fried."},
        {"speaker": "Waiter", "text": "Oh, I'm really sorry about that. Let me fix it right away."},
        {"speaker": "Customer", "text": "Thank you, I'd appreciate that."},
        {"speaker": "Waiter", "text": "Please accept our apologies. I'll bring the correct dish in just a few minutes."},
        {"speaker": "Customer", "text": "No problem. Thank you for your help."}
      ],
      "expressions": [
        "I'd like to order the ……, please.",
        "Can I see the menu, please?",
        "Could you recommend something vegetarian?",
        "I think there's a mistake with my order.",
        "Excuse me, but this isn't what I asked for.",
        "Could I get the bill, please?",
        "Can I have this to go?",
        "The food was delicious, thank you!",
        "I'm afraid my dish is cold.",
        "Can you bring us some more water, please?"
      ],
      "expression_instruction": "Practice using these expressions in your own dialogues and real-life situations.",
      "teacher_tip": "Include unexpected issues (e.g., the order is cold, the waiter forgets the drink) to keep the role-play dynamic and spontaneous. Assign students to write a restaurant review or a list of useful expressions they used or learned."
    }`;

export const getDiscussionExercise = () => `    {
      "type": "discussion",
      "title": "Exercise 7: Discussion Questions",
      "icon": "fa-users",
      "time": 8,
      "instructions": "Discuss these questions with your teacher or partner.",
      "questions": [
        {"text": "What is your favorite type of restaurant and why?"},
        {"text": "Have you ever had a bad experience in a restaurant? What happened?"},
        {"text": "Do you prefer eating at home or dining out? Give reasons using comparatives."},
        {"text": "What dish would you recommend to someone visiting your country for the first time?"},
        {"text": "Which restaurant in your city is the most popular? Why do you think it's the best?"},
        {"text": "How do you usually react if your order is wrong or the food isn't good?"},
        {"text": "What is more important to you: good food or good service? Why?"},
        {"text": "Can you describe the most expensive meal you've ever had? Was it worth it?"},
        {"text": "What makes a restaurant better than others in your opinion?"},
        {"text": "Have you ever tried a dish that was better than you expected? What was it?"}
      ],
      "teacher_tip": "Encourage deeper thinking by asking students to explain, justify, or give examples for their answers.Focus on major errors or repeated mistakes after the discussion, not during."
    }`;

export const getErrorCorrectionExercise = () => `    {
      "type": "error-correction",
      "title": "Exercise 8: Error Correction",
      "icon": "fa-exclamation-triangle",
      "time": 7,
      "instructions": "Find and correct the errors in these sentences.",
      "sentences": [
        {"text": "This pizza is more better than the one I had yesterday.", "correction": "This pizza is better than the one I had yesterday.", "nano_skill": [{"name": "ns.grammar.double_comparative_error", "confidence": 0.96, "reason": "Tests recognition of redundant 'more' with irregular comparative"}, {"name": "ns.grammar.comparative_irregular_good", "confidence": 0.92, "reason": "Tests knowledge that 'good' becomes 'better' not 'more better'"}], "micro_skill": [{"name": "ms.grammar.comparative_error_correction", "confidence": 0.96, "reason": "Tests ability to identify and fix comparative errors"}]},
        {"text": "She is the most tallest girl in the class.", "correction": "She is the tallest girl in the class.", "nano_skill": [{"name": "ns.grammar.double_superlative_error", "confidence": 0.95, "reason": "Tests recognition of redundant 'most' with -est ending"}, {"name": "ns.grammar.superlative_short_adjective_est", "confidence": 0.90, "reason": "Tests knowledge that short adjectives use -est only"}], "micro_skill": [{"name": "ms.grammar.superlative_error_correction", "confidence": 0.95, "reason": "Tests fixing double superlative errors"}]},
        {"text": "My house is more big than yours.", "correction": "My house is bigger than yours.", "nano_skill": [{"name": "ns.grammar.comparative_short_adjective_er", "confidence": 0.94, "reason": "Tests that short adjectives use -er not 'more'"}, {"name": "ns.grammar.comparative_spelling_double_consonant", "confidence": 0.88, "reason": "Tests doubling consonant before -er in 'bigger'"}], "micro_skill": [{"name": "ms.grammar.comparative_error_correction", "confidence": 0.94, "reason": "Tests correcting wrong comparative form"}]},
        {"text": "Today is the most hottest day of the year.", "correction": "Today is the hottest day of the year.", "nano_skill": [{"name": "ns.grammar.double_superlative_error", "confidence": 0.95, "reason": "Tests recognition of redundant 'most' with -est"}, {"name": "ns.grammar.superlative_spelling_double_consonant", "confidence": 0.88, "reason": "Tests correct spelling of 'hottest'"}], "micro_skill": [{"name": "ms.grammar.superlative_error_correction", "confidence": 0.95, "reason": "Tests fixing double superlative formation"}]},
        {"text": "This restaurant is more expensiveer than the other one.", "correction": "This restaurant is more expensive than the other one.", "nano_skill": [{"name": "ns.grammar.comparative_long_adjective_more", "confidence": 0.94, "reason": "Tests that long adjectives use 'more' without -er"}, {"name": "ns.grammar.double_marking_error", "confidence": 0.90, "reason": "Tests avoiding both 'more' and -er simultaneously"}], "micro_skill": [{"name": "ms.grammar.comparative_error_correction", "confidence": 0.94, "reason": "Tests correcting double marking in comparatives"}]},
        {"text": "He is smarter than his brother.", "correction": "He is smarter than his brother.", "nano_skill": [{"name": "ns.grammar.correct_sentence_recognition", "confidence": 0.92, "reason": "Tests ability to recognize grammatically correct sentences"}, {"name": "ns.grammar.comparative_short_adjective_er", "confidence": 0.88, "reason": "Tests recognition of correct comparative form"}], "micro_skill": [{"name": "ms.grammar.comparative_validation", "confidence": 0.92, "reason": "Tests identifying correct vs incorrect comparatives"}]},
        {"text": "That movie was the most funniest I have ever seen.", "correction": "That movie was the funniest I have ever seen.", "nano_skill": [{"name": "ns.grammar.double_superlative_error", "confidence": 0.95, "reason": "Tests recognition of redundant 'most' with -est"}, {"name": "ns.grammar.superlative_y_to_iest", "confidence": 0.90, "reason": "Tests -y to -iest superlative transformation"}], "micro_skill": [{"name": "ms.grammar.superlative_error_correction", "confidence": 0.95, "reason": "Tests fixing superlative double marking"}]},
        {"text": "My car is more faster now after the repair.", "correction": "My car is faster now after the repair.", "nano_skill": [{"name": "ns.grammar.double_comparative_error", "confidence": 0.94, "reason": "Tests recognition of redundant 'more' with -er ending"}, {"name": "ns.grammar.comparative_short_adjective_er", "confidence": 0.90, "reason": "Tests that 'fast' uses -er not 'more'"}], "micro_skill": [{"name": "ms.grammar.comparative_error_correction", "confidence": 0.94, "reason": "Tests fixing double comparative formation"}]},
        {"text": "Winter is colder than summer.", "correction": "Winter is colder than summer.", "nano_skill": [{"name": "ns.grammar.correct_sentence_recognition", "confidence": 0.92, "reason": "Tests ability to recognize grammatically correct sentences"}, {"name": "ns.grammar.comparative_than_construction", "confidence": 0.88, "reason": "Tests recognition of correct comparative structure"}], "micro_skill": [{"name": "ms.grammar.comparative_validation", "confidence": 0.92, "reason": "Tests identifying correct comparative usage"}]},
        {"text": "She is the more talented singer in our group.", "correction": "She is the most talented singer in our group.", "nano_skill": [{"name": "ns.grammar.superlative_vs_comparative_context", "confidence": 0.94, "reason": "Tests using superlative (not comparative) for 'in group' context"}, {"name": "ns.grammar.superlative_long_adjective_most", "confidence": 0.90, "reason": "Tests 'most + adjective' for long adjectives in superlatives"}], "micro_skill": [{"name": "ms.grammar.superlative_error_correction", "confidence": 0.94, "reason": "Tests correcting comparative used instead of superlative"}]}
      ],
      "teacher_tip": "Highlight frequent errors with comparatives and superlatives, like double comparatives (e.g., more better) or incorrect superlative forms.Ask students to explain why a sentence is incorrect to deepen comprehension."
    }`;

// =============== 12 NEW EXERCISES - PHASE 1 (6 exercises) ===============

export const getOddOneOutExercise = () => `    {
      "type": "odd-one-out",
      "title": "Exercise 9: Odd One Out",
      "icon": "fa-search",
      "time": 6,
      "instructions": "In each group, find the word that is grammatically different from the others (different part of speech).",
      "questions": [
        {"options": ["running", "swimming", "cycling", "sport", "dancing"], "correct_answer": "sport", "nano_skill": [{"name": "ns.vocab.gerund_recognition", "confidence": 0.94, "reason": "Tests identifying gerunds (-ing forms) as a group"}, {"name": "ns.vocab.noun_vs_gerund_distinction", "confidence": 0.90, "reason": "Tests distinguishing simple noun from gerund forms"}], "micro_skill": [{"name": "ms.vocab.part_of_speech_categorization", "confidence": 0.94, "reason": "Tests ability to categorize words by grammatical function"}]},
        {"options": ["quickly", "slowly", "carefully", "fast", "quietly"], "correct_answer": "fast", "nano_skill": [{"name": "ns.vocab.adverb_ly_pattern", "confidence": 0.93, "reason": "Tests recognition of -ly adverb pattern"}, {"name": "ns.vocab.flat_adverb_recognition", "confidence": 0.90, "reason": "Tests identifying 'fast' as flat adverb without -ly"}], "micro_skill": [{"name": "ms.vocab.part_of_speech_categorization", "confidence": 0.93, "reason": "Tests adverb form recognition"}]},
        {"options": ["delicious", "tasty", "eat", "spicy", "sweet"], "correct_answer": "eat", "nano_skill": [{"name": "ns.vocab.adjective_recognition", "confidence": 0.95, "reason": "Tests identifying adjectives describing food"}, {"name": "ns.vocab.verb_vs_adjective_distinction", "confidence": 0.92, "reason": "Tests distinguishing verb from adjective group"}], "micro_skill": [{"name": "ms.vocab.part_of_speech_categorization", "confidence": 0.95, "reason": "Tests verb vs adjective differentiation"}]},
        {"options": ["waiter", "chef", "serve", "cook", "bartender"], "correct_answer": "serve", "nano_skill": [{"name": "ns.vocab.occupation_noun_recognition", "confidence": 0.94, "reason": "Tests identifying job/role nouns"}, {"name": "ns.vocab.verb_vs_noun_distinction", "confidence": 0.90, "reason": "Tests distinguishing verb from noun group"}], "micro_skill": [{"name": "ms.vocab.part_of_speech_categorization", "confidence": 0.94, "reason": "Tests categorizing profession vocabulary"}]},
        {"options": ["reservation", "booking", "order", "complain", "menu"], "correct_answer": "complain", "nano_skill": [{"name": "ns.vocab.noun_recognition", "confidence": 0.93, "reason": "Tests identifying restaurant-related nouns"}, {"name": "ns.vocab.verb_vs_noun_distinction", "confidence": 0.90, "reason": "Tests recognizing 'complain' as verb among nouns"}], "micro_skill": [{"name": "ms.vocab.part_of_speech_categorization", "confidence": 0.93, "reason": "Tests distinguishing verbs from nouns"}]},
        {"options": ["hot", "cold", "warmth", "fresh", "spicy"], "correct_answer": "warmth", "nano_skill": [{"name": "ns.vocab.adjective_recognition", "confidence": 0.94, "reason": "Tests identifying temperature/quality adjectives"}, {"name": "ns.vocab.noun_vs_adjective_distinction", "confidence": 0.90, "reason": "Tests recognizing abstract noun among adjectives"}], "micro_skill": [{"name": "ms.vocab.part_of_speech_categorization", "confidence": 0.94, "reason": "Tests noun vs adjective differentiation"}]},
        {"options": ["eating", "drinking", "table", "cooking", "serving"], "correct_answer": "table", "nano_skill": [{"name": "ns.vocab.gerund_recognition", "confidence": 0.93, "reason": "Tests identifying -ing verb forms as group"}, {"name": "ns.vocab.concrete_noun_vs_gerund", "confidence": 0.90, "reason": "Tests distinguishing concrete noun from gerunds"}], "micro_skill": [{"name": "ms.vocab.part_of_speech_categorization", "confidence": 0.93, "reason": "Tests gerund vs noun categorization"}]},
        {"options": ["expensive", "cheap", "beautifully", "fresh", "delicious"], "correct_answer": "beautifully", "nano_skill": [{"name": "ns.vocab.adjective_recognition", "confidence": 0.94, "reason": "Tests identifying descriptive adjectives"}, {"name": "ns.vocab.adverb_vs_adjective_distinction", "confidence": 0.92, "reason": "Tests recognizing -ly adverb among adjectives"}], "micro_skill": [{"name": "ms.vocab.part_of_speech_categorization", "confidence": 0.94, "reason": "Tests adverb vs adjective differentiation"}]},
        {"options": ["starter", "dessert", "appetizer", "main", "eat"], "correct_answer": "eat", "nano_skill": [{"name": "ns.vocab.meal_course_noun_recognition", "confidence": 0.93, "reason": "Tests identifying meal course vocabulary"}, {"name": "ns.vocab.verb_vs_noun_distinction", "confidence": 0.90, "reason": "Tests distinguishing verb from course nouns"}], "micro_skill": [{"name": "ms.vocab.part_of_speech_categorization", "confidence": 0.93, "reason": "Tests food service vocabulary categorization"}]},
        {"options": ["restaurant", "cafe", "cooking", "bistro", "diner"], "correct_answer": "cooking", "nano_skill": [{"name": "ns.vocab.place_noun_recognition", "confidence": 0.94, "reason": "Tests identifying place/establishment nouns"}, {"name": "ns.vocab.gerund_vs_place_noun", "confidence": 0.90, "reason": "Tests distinguishing gerund from place nouns"}], "micro_skill": [{"name": "ms.vocab.part_of_speech_categorization", "confidence": 0.94, "reason": "Tests venue vocabulary categorization"}]}
      ],
      "teacher_tip": "After students identify the odd word, ask them to explain their reasoning. This develops critical thinking and vocabulary categorization skills."
    }`;

// NEW: Separate Synonyms Exercise
export const getSynonymsExercise = () => `    {
      "type": "synonyms",
      "title": "Exercise 10: Synonyms Matching",
      "icon": "fa-equals",
      "time": 5,
      "instructions": "Match each word on the left with its synonym (word with similar meaning) on the right.",
      "items": [
        { "term": "delicious", "definition": "tasty", "letter": "A", "nano_skill": [{"name": "ns.vocab.synonym_food_adjective", "confidence": 0.95, "reason": "Tests knowledge of synonyms for taste description"}, {"name": "ns.vocab.semantic_similarity_recognition", "confidence": 0.90, "reason": "Tests understanding words with similar meanings"}], "micro_skill": [{"name": "ms.vocab.synonym_matching", "confidence": 0.95, "reason": "Tests ability to match synonymous vocabulary"}] },
        { "term": "expensive", "definition": "costly", "letter": "B", "nano_skill": [{"name": "ns.vocab.synonym_price_adjective", "confidence": 0.94, "reason": "Tests knowledge of synonyms for high cost"}, {"name": "ns.vocab.formal_informal_register", "confidence": 0.88, "reason": "Tests awareness of slightly different register levels"}], "micro_skill": [{"name": "ms.vocab.synonym_matching", "confidence": 0.94, "reason": "Tests price vocabulary synonyms"}] },
        { "term": "recommend", "definition": "suggest", "letter": "C", "nano_skill": [{"name": "ns.vocab.synonym_verb_advice", "confidence": 0.93, "reason": "Tests knowledge of advice-giving verb synonyms"}, {"name": "ns.vocab.semantic_similarity_recognition", "confidence": 0.88, "reason": "Tests matching verbs with similar meanings"}], "micro_skill": [{"name": "ms.vocab.synonym_matching", "confidence": 0.93, "reason": "Tests verb synonym recognition"}] },
        { "term": "popular", "definition": "well-liked", "letter": "D", "nano_skill": [{"name": "ns.vocab.synonym_popularity_adjective", "confidence": 0.94, "reason": "Tests knowledge of synonyms for popularity"}, {"name": "ns.vocab.compound_adjective_meaning", "confidence": 0.88, "reason": "Tests understanding hyphenated compound adjective"}], "micro_skill": [{"name": "ms.vocab.synonym_matching", "confidence": 0.94, "reason": "Tests popularity vocabulary synonyms"}] },
        { "term": "affordable", "definition": "reasonably priced", "letter": "E", "nano_skill": [{"name": "ns.vocab.synonym_price_adjective", "confidence": 0.93, "reason": "Tests knowledge of synonyms for low cost"}, {"name": "ns.vocab.phrase_vs_single_word_synonym", "confidence": 0.88, "reason": "Tests matching word to phrase synonym"}], "micro_skill": [{"name": "ms.vocab.synonym_matching", "confidence": 0.93, "reason": "Tests affordability vocabulary synonyms"}] },
        { "term": "authentic", "definition": "genuine", "letter": "F", "nano_skill": [{"name": "ns.vocab.synonym_quality_adjective", "confidence": 0.94, "reason": "Tests knowledge of authenticity synonyms"}, {"name": "ns.vocab.abstract_adjective_meaning", "confidence": 0.88, "reason": "Tests understanding abstract quality descriptors"}], "micro_skill": [{"name": "ms.vocab.synonym_matching", "confidence": 0.94, "reason": "Tests quality description synonyms"}] },
        { "term": "amazing", "definition": "wonderful", "letter": "G", "nano_skill": [{"name": "ns.vocab.synonym_positive_evaluation", "confidence": 0.95, "reason": "Tests knowledge of positive evaluation synonyms"}, {"name": "ns.vocab.intensity_level_matching", "confidence": 0.90, "reason": "Tests matching similar intensity adjectives"}], "micro_skill": [{"name": "ms.vocab.synonym_matching", "confidence": 0.95, "reason": "Tests positive adjective synonyms"}] },
        { "term": "cozy", "definition": "comfortable", "letter": "H", "nano_skill": [{"name": "ns.vocab.synonym_atmosphere_adjective", "confidence": 0.93, "reason": "Tests knowledge of comfort/atmosphere synonyms"}, {"name": "ns.vocab.connotation_matching", "confidence": 0.88, "reason": "Tests matching words with similar connotations"}], "micro_skill": [{"name": "ms.vocab.synonym_matching", "confidence": 0.93, "reason": "Tests atmosphere vocabulary synonyms"}] },
        { "term": "busy", "definition": "crowded", "letter": "I", "nano_skill": [{"name": "ns.vocab.synonym_activity_adjective", "confidence": 0.92, "reason": "Tests knowledge of activity level synonyms"}, {"name": "ns.vocab.context_specific_synonym", "confidence": 0.88, "reason": "Tests synonyms in restaurant context"}], "micro_skill": [{"name": "ms.vocab.synonym_matching", "confidence": 0.92, "reason": "Tests activity description synonyms"}] },
        { "term": "excellent", "definition": "outstanding", "letter": "J", "nano_skill": [{"name": "ns.vocab.synonym_quality_superlative", "confidence": 0.94, "reason": "Tests knowledge of high-quality synonyms"}, {"name": "ns.vocab.formal_register_synonym", "confidence": 0.88, "reason": "Tests matching formal quality adjectives"}], "micro_skill": [{"name": "ms.vocab.synonym_matching", "confidence": 0.94, "reason": "Tests quality evaluation synonyms"}] }
      ],
      "teacher_tip": "After completing the exercise, have students create sentences using both words from 2-3 pairs to demonstrate they understand the synonyms have similar meanings in context."
    }`;

// NEW: Separate Antonyms Exercise
export const getAntonymsExercise = () => `    {
      "type": "antonyms",
      "title": "Exercise 11: Antonyms Matching",
      "icon": "fa-not-equal",
      "time": 5,
      "instructions": "Match each word on the left with its antonym (word with opposite meaning) on the right.",
      "items": [
        { "term": "expensive", "definition": "cheap", "letter": "A", "nano_skill": [{"name": "ns.vocab.antonym_price_adjective", "confidence": 0.95, "reason": "Tests knowledge of opposite price descriptors"}, {"name": "ns.vocab.semantic_opposition_recognition", "confidence": 0.90, "reason": "Tests understanding of opposite meanings"}], "micro_skill": [{"name": "ms.vocab.antonym_matching", "confidence": 0.95, "reason": "Tests ability to match antonymous vocabulary"}] },
        { "term": "delicious", "definition": "tasteless", "letter": "B", "nano_skill": [{"name": "ns.vocab.antonym_taste_adjective", "confidence": 0.94, "reason": "Tests knowledge of opposite taste descriptions"}, {"name": "ns.vocab.suffix_less_meaning", "confidence": 0.88, "reason": "Tests understanding -less suffix creates opposite"}], "micro_skill": [{"name": "ms.vocab.antonym_matching", "confidence": 0.94, "reason": "Tests taste vocabulary antonyms"}] },
        { "term": "spicy", "definition": "mild", "letter": "C", "nano_skill": [{"name": "ns.vocab.antonym_flavor_adjective", "confidence": 0.93, "reason": "Tests knowledge of opposite flavor intensities"}, {"name": "ns.vocab.gradable_adjective_opposition", "confidence": 0.88, "reason": "Tests understanding gradable adjective opposites"}], "micro_skill": [{"name": "ms.vocab.antonym_matching", "confidence": 0.93, "reason": "Tests flavor vocabulary antonyms"}] },
        { "term": "fresh", "definition": "stale", "letter": "D", "nano_skill": [{"name": "ns.vocab.antonym_food_quality", "confidence": 0.94, "reason": "Tests knowledge of opposite food freshness"}, {"name": "ns.vocab.food_condition_vocabulary", "confidence": 0.88, "reason": "Tests food quality description vocabulary"}], "micro_skill": [{"name": "ms.vocab.antonym_matching", "confidence": 0.94, "reason": "Tests freshness vocabulary antonyms"}] },
        { "term": "hot", "definition": "cold", "letter": "E", "nano_skill": [{"name": "ns.vocab.antonym_temperature", "confidence": 0.96, "reason": "Tests knowledge of opposite temperature words"}, {"name": "ns.vocab.basic_antonym_pair", "confidence": 0.92, "reason": "Tests fundamental opposite pair recognition"}], "micro_skill": [{"name": "ms.vocab.antonym_matching", "confidence": 0.96, "reason": "Tests temperature vocabulary antonyms"}] },
        { "term": "crowded", "definition": "empty", "letter": "F", "nano_skill": [{"name": "ns.vocab.antonym_occupancy", "confidence": 0.93, "reason": "Tests knowledge of opposite occupancy states"}, {"name": "ns.vocab.place_description_opposition", "confidence": 0.88, "reason": "Tests place/venue description antonyms"}], "micro_skill": [{"name": "ms.vocab.antonym_matching", "confidence": 0.93, "reason": "Tests occupancy vocabulary antonyms"}] },
        { "term": "fast", "definition": "slow", "letter": "G", "nano_skill": [{"name": "ns.vocab.antonym_speed", "confidence": 0.95, "reason": "Tests knowledge of opposite speed descriptions"}, {"name": "ns.vocab.basic_antonym_pair", "confidence": 0.90, "reason": "Tests fundamental opposite pair recognition"}], "micro_skill": [{"name": "ms.vocab.antonym_matching", "confidence": 0.95, "reason": "Tests speed vocabulary antonyms"}] },
        { "term": "polite", "definition": "rude", "letter": "H", "nano_skill": [{"name": "ns.vocab.antonym_behavior_adjective", "confidence": 0.94, "reason": "Tests knowledge of opposite behavior descriptions"}, {"name": "ns.vocab.social_behavior_vocabulary", "confidence": 0.88, "reason": "Tests service/behavior vocabulary opposites"}], "micro_skill": [{"name": "ms.vocab.antonym_matching", "confidence": 0.94, "reason": "Tests behavior vocabulary antonyms"}] },
        { "term": "clean", "definition": "dirty", "letter": "I", "nano_skill": [{"name": "ns.vocab.antonym_cleanliness", "confidence": 0.95, "reason": "Tests knowledge of opposite cleanliness states"}, {"name": "ns.vocab.basic_antonym_pair", "confidence": 0.90, "reason": "Tests fundamental opposite pair recognition"}], "micro_skill": [{"name": "ms.vocab.antonym_matching", "confidence": 0.95, "reason": "Tests cleanliness vocabulary antonyms"}] },
        { "term": "quiet", "definition": "noisy", "letter": "J", "nano_skill": [{"name": "ns.vocab.antonym_sound_level", "confidence": 0.94, "reason": "Tests knowledge of opposite sound descriptions"}, {"name": "ns.vocab.atmosphere_description_opposition", "confidence": 0.88, "reason": "Tests atmosphere vocabulary opposites"}], "micro_skill": [{"name": "ms.vocab.antonym_matching", "confidence": 0.94, "reason": "Tests sound vocabulary antonyms"}] }
      ],
      "teacher_tip": "After completing the exercise, have students create pairs of contrasting sentences (e.g., 'The restaurant was expensive' vs 'The restaurant was cheap') to reinforce understanding of opposites."
    }`;

// LEGACY: Keep old combined exercise for backward compatibility
export const getSynonymsAntonymsExercise = () => `    {
      "type": "synonyms-antonyms",
      "title": "Exercise 10: Synonyms & Antonyms Matching",
      "icon": "fa-exchange-alt",
      "time": 7,
      "instructions": "Match each word with its synonym or antonym from the options provided.",
      "items": [
        { "term": "delicious", "definition": "tasty", "letter": "A", "nano_skill": [{"name": "ns.vocab.synonym_food_adjective", "confidence": 0.95, "reason": "Tests knowledge of taste description synonyms"}, {"name": "ns.vocab.semantic_similarity_recognition", "confidence": 0.90, "reason": "Tests matching words with similar meanings"}], "micro_skill": [{"name": "ms.vocab.synonym_antonym_matching", "confidence": 0.95, "reason": "Tests synonym identification"}] },
        { "term": "expensive", "definition": "cheap", "letter": "B", "nano_skill": [{"name": "ns.vocab.antonym_price_adjective", "confidence": 0.94, "reason": "Tests knowledge of opposite price descriptors"}, {"name": "ns.vocab.semantic_opposition_recognition", "confidence": 0.90, "reason": "Tests matching words with opposite meanings"}], "micro_skill": [{"name": "ms.vocab.synonym_antonym_matching", "confidence": 0.94, "reason": "Tests antonym identification"}] },
        { "term": "popular", "definition": "famous", "letter": "C", "nano_skill": [{"name": "ns.vocab.synonym_popularity_adjective", "confidence": 0.93, "reason": "Tests knowledge of popularity synonyms"}, {"name": "ns.vocab.semantic_similarity_recognition", "confidence": 0.88, "reason": "Tests near-synonym recognition"}], "micro_skill": [{"name": "ms.vocab.synonym_antonym_matching", "confidence": 0.93, "reason": "Tests synonym identification"}] },
        { "term": "fresh", "definition": "new", "letter": "D", "nano_skill": [{"name": "ns.vocab.synonym_quality_adjective", "confidence": 0.92, "reason": "Tests knowledge of freshness synonyms"}, {"name": "ns.vocab.context_dependent_synonym", "confidence": 0.88, "reason": "Tests synonym that works in food context"}], "micro_skill": [{"name": "ms.vocab.synonym_antonym_matching", "confidence": 0.92, "reason": "Tests synonym identification"}] },
        { "term": "hot", "definition": "cold", "letter": "E", "nano_skill": [{"name": "ns.vocab.antonym_temperature", "confidence": 0.96, "reason": "Tests knowledge of temperature opposites"}, {"name": "ns.vocab.basic_antonym_pair", "confidence": 0.92, "reason": "Tests fundamental opposite pair"}], "micro_skill": [{"name": "ms.vocab.synonym_antonym_matching", "confidence": 0.96, "reason": "Tests antonym identification"}] },
        { "term": "busy", "definition": "quiet", "letter": "F", "nano_skill": [{"name": "ns.vocab.antonym_activity_level", "confidence": 0.93, "reason": "Tests knowledge of activity opposites"}, {"name": "ns.vocab.place_atmosphere_opposition", "confidence": 0.88, "reason": "Tests atmosphere description antonyms"}], "micro_skill": [{"name": "ms.vocab.synonym_antonym_matching", "confidence": 0.93, "reason": "Tests antonym identification"}] },
        { "term": "polite", "definition": "rude", "letter": "G", "nano_skill": [{"name": "ns.vocab.antonym_behavior_adjective", "confidence": 0.94, "reason": "Tests knowledge of behavior opposites"}, {"name": "ns.vocab.service_vocabulary_opposition", "confidence": 0.88, "reason": "Tests service behavior antonyms"}], "micro_skill": [{"name": "ms.vocab.synonym_antonym_matching", "confidence": 0.94, "reason": "Tests antonym identification"}] },
        { "term": "satisfied", "definition": "disappointed", "letter": "H", "nano_skill": [{"name": "ns.vocab.antonym_satisfaction", "confidence": 0.93, "reason": "Tests knowledge of satisfaction opposites"}, {"name": "ns.vocab.customer_feeling_opposition", "confidence": 0.88, "reason": "Tests customer experience antonyms"}], "micro_skill": [{"name": "ms.vocab.synonym_antonym_matching", "confidence": 0.93, "reason": "Tests antonym identification"}] },
        { "term": "complaint", "definition": "criticism", "letter": "I", "nano_skill": [{"name": "ns.vocab.synonym_negative_feedback", "confidence": 0.92, "reason": "Tests knowledge of complaint synonyms"}, {"name": "ns.vocab.noun_semantic_similarity", "confidence": 0.88, "reason": "Tests near-synonym noun matching"}], "micro_skill": [{"name": "ms.vocab.synonym_antonym_matching", "confidence": 0.92, "reason": "Tests synonym identification"}] },
        { "term": "quick", "definition": "fast", "letter": "J", "nano_skill": [{"name": "ns.vocab.synonym_speed_adjective", "confidence": 0.95, "reason": "Tests knowledge of speed synonyms"}, {"name": "ns.vocab.exact_synonym_recognition", "confidence": 0.92, "reason": "Tests very close synonym matching"}], "micro_skill": [{"name": "ms.vocab.synonym_antonym_matching", "confidence": 0.95, "reason": "Tests synonym identification"}] }
      ],
      "teacher_tip": "Use these word pairs to create role-play scenarios where students practice using both positive and negative restaurant vocabulary in context."
    }`;

export const getSentenceTransformationExercise = () => `    {
      "type": "sentence-transformation",
      "title": "Exercise 11: Sentence Transformation",
      "icon": "fa-sync-alt",
      "time": 8,
      "instructions": "Transform these sentences as instructed, keeping the same meaning.",
      "sentences": [
        {"original": "The chef prepares the meals every morning.", "instruction": "Change to passive voice", "transformed": "The meals are prepared by the chef every morning.", "nano_skill": [{"name": "ns.grammar.passive_present_simple", "confidence": 0.95, "reason": "Tests transformation to present simple passive"}, {"name": "ns.grammar.agent_by_phrase", "confidence": 0.90, "reason": "Tests correct use of 'by + agent' in passive"}], "micro_skill": [{"name": "ms.grammar.sentence_transformation", "confidence": 0.95, "reason": "Tests ability to transform active to passive voice"}]},
        {"original": "The restaurant is more expensive than the café.", "instruction": "Use 'not as... as'", "transformed": "The café is not as expensive as the restaurant.", "nano_skill": [{"name": "ns.grammar.not_as_as_comparison", "confidence": 0.94, "reason": "Tests 'not as... as' structure formation"}, {"name": "ns.grammar.comparison_subject_reversal", "confidence": 0.88, "reason": "Tests reversing subjects when changing comparison type"}], "micro_skill": [{"name": "ms.grammar.sentence_transformation", "confidence": 0.94, "reason": "Tests comparative structure transformation"}]},
        {"original": "I have never eaten such delicious pizza.", "instruction": "Use superlative", "transformed": "This is the most delicious pizza I have ever eaten.", "nano_skill": [{"name": "ns.grammar.superlative_ever_construction", "confidence": 0.93, "reason": "Tests 'the most + ever' superlative pattern"}, {"name": "ns.grammar.present_perfect_experience", "confidence": 0.88, "reason": "Tests present perfect with 'ever' for experience"}], "micro_skill": [{"name": "ms.grammar.sentence_transformation", "confidence": 0.93, "reason": "Tests superlative structure transformation"}]},
        {"original": "The waiter said, 'Your table is ready.'", "instruction": "Change to reported speech", "transformed": "The waiter said that our table was ready.", "nano_skill": [{"name": "ns.grammar.reported_speech_tense_backshift", "confidence": 0.94, "reason": "Tests tense backshift in reported speech"}, {"name": "ns.grammar.reported_speech_pronoun_change", "confidence": 0.90, "reason": "Tests pronoun change from 'your' to 'our'"}], "micro_skill": [{"name": "ms.grammar.sentence_transformation", "confidence": 0.94, "reason": "Tests direct to reported speech transformation"}]},
        {"original": "We ordered dessert after we finished the main course.", "instruction": "Use 'having + past participle'", "transformed": "Having finished the main course, we ordered dessert.", "nano_skill": [{"name": "ns.grammar.perfect_participle_clause", "confidence": 0.92, "reason": "Tests 'having + past participle' construction"}, {"name": "ns.grammar.clause_reduction", "confidence": 0.88, "reason": "Tests reducing adverbial clause to participle"}], "micro_skill": [{"name": "ms.grammar.sentence_transformation", "confidence": 0.92, "reason": "Tests participle clause transformation"}]},
        {"original": "The food was so spicy that I couldn't eat it.", "instruction": "Use 'too... to'", "transformed": "The food was too spicy for me to eat.", "nano_skill": [{"name": "ns.grammar.too_to_structure", "confidence": 0.94, "reason": "Tests 'too + adjective + to' construction"}, {"name": "ns.grammar.so_that_to_too_to_conversion", "confidence": 0.90, "reason": "Tests converting 'so... that' to 'too... to'"}], "micro_skill": [{"name": "ms.grammar.sentence_transformation", "confidence": 0.94, "reason": "Tests result clause transformation"}]},
        {"original": "If you don't make a reservation, you won't get a table.", "instruction": "Use 'unless'", "transformed": "Unless you make a reservation, you won't get a table.", "nano_skill": [{"name": "ns.grammar.unless_if_not_equivalence", "confidence": 0.95, "reason": "Tests 'unless' as replacement for 'if... not'"}, {"name": "ns.grammar.conditional_negative_removal", "confidence": 0.90, "reason": "Tests removing negation when using 'unless'"}], "micro_skill": [{"name": "ms.grammar.sentence_transformation", "confidence": 0.95, "reason": "Tests conditional transformation with unless"}]},
        {"original": "This restaurant serves better food than that one.", "instruction": "Use superlative", "transformed": "This restaurant serves the best food in the area.", "nano_skill": [{"name": "ns.grammar.comparative_to_superlative", "confidence": 0.92, "reason": "Tests changing comparative to superlative"}, {"name": "ns.grammar.superlative_in_phrase", "confidence": 0.88, "reason": "Tests adding 'in the area' for superlative context"}], "micro_skill": [{"name": "ms.grammar.sentence_transformation", "confidence": 0.92, "reason": "Tests degree comparison transformation"}]},
        {"original": "I suggest you try the fish today.", "instruction": "Use modal verb", "transformed": "You should try the fish today.", "nano_skill": [{"name": "ns.grammar.modal_should_advice", "confidence": 0.94, "reason": "Tests 'should' for suggestions/advice"}, {"name": "ns.grammar.suggest_to_modal_conversion", "confidence": 0.88, "reason": "Tests converting suggestion verb to modal"}], "micro_skill": [{"name": "ms.grammar.sentence_transformation", "confidence": 0.94, "reason": "Tests modal verb transformation"}]},
        {"original": "The service was so slow that we left early.", "instruction": "Use 'too... to'", "transformed": "The service was too slow for us to stay.", "nano_skill": [{"name": "ns.grammar.too_to_structure", "confidence": 0.93, "reason": "Tests 'too + adjective + to' construction"}, {"name": "ns.grammar.meaning_preservation_transformation", "confidence": 0.88, "reason": "Tests keeping same meaning with different structure"}], "micro_skill": [{"name": "ms.grammar.sentence_transformation", "confidence": 0.93, "reason": "Tests result clause transformation"}]}
      ],
      "teacher_tip": "Focus on one transformation type at a time if students struggle. Practice with additional examples before moving to the next transformation pattern."
    }`;

export const getWordOrderExercise = () => `    {
      "type": "word-order",
      "title": "Exercise 12: Word Order",
      "icon": "fa-sort",
      "time": 6,
      "instructions": "Put the words in the correct order to make meaningful sentences about restaurants.",
      "sentences": [
        {"scrambled_words": "this / restaurant / the / in / food / neighborhood / best / serves", "correct_order": "This restaurant serves the best food in the neighborhood.", "nano_skill": [{"name": "ns.grammar.word_order_svo", "confidence": 0.94, "reason": "Tests Subject-Verb-Object word order"}, {"name": "ns.grammar.superlative_position", "confidence": 0.90, "reason": "Tests placing superlative before noun"}], "micro_skill": [{"name": "ms.grammar.word_order_construction", "confidence": 0.94, "reason": "Tests ability to arrange words into grammatical sentence"}]},
        {"scrambled_words": "always / we / tip / good / service / for / leave / a", "correct_order": "We always leave a tip for good service.", "nano_skill": [{"name": "ns.grammar.adverb_frequency_position", "confidence": 0.93, "reason": "Tests placing 'always' between subject and verb"}, {"name": "ns.grammar.prepositional_phrase_position", "confidence": 0.88, "reason": "Tests 'for + noun phrase' placement at end"}], "micro_skill": [{"name": "ms.grammar.word_order_construction", "confidence": 0.93, "reason": "Tests adverb and phrase positioning"}]},
        {"scrambled_words": "menu / has / the / variety / wide / of / dishes / a", "correct_order": "The menu has a wide variety of dishes.", "nano_skill": [{"name": "ns.grammar.article_adjective_noun_order", "confidence": 0.94, "reason": "Tests 'a + adjective + noun' order"}, {"name": "ns.grammar.of_phrase_position", "confidence": 0.88, "reason": "Tests 'of + noun' phrase placement"}], "micro_skill": [{"name": "ms.grammar.word_order_construction", "confidence": 0.94, "reason": "Tests noun phrase construction"}]},
        {"scrambled_words": "complained / customer / the / about / cold / the / food", "correct_order": "The customer complained about the cold food.", "nano_skill": [{"name": "ns.grammar.verb_preposition_collocation", "confidence": 0.93, "reason": "Tests 'complained about' collocation"}, {"name": "ns.grammar.adjective_noun_order", "confidence": 0.88, "reason": "Tests 'adjective + noun' in object position"}], "micro_skill": [{"name": "ms.grammar.word_order_construction", "confidence": 0.93, "reason": "Tests prepositional verb construction"}]},
        {"scrambled_words": "book / should / you / advance / table / in / a", "correct_order": "You should book a table in advance.", "nano_skill": [{"name": "ns.grammar.modal_verb_position", "confidence": 0.94, "reason": "Tests 'subject + modal + verb' order"}, {"name": "ns.grammar.adverbial_phrase_position", "confidence": 0.88, "reason": "Tests 'in advance' placement at end"}], "micro_skill": [{"name": "ms.grammar.word_order_construction", "confidence": 0.94, "reason": "Tests modal verb sentence construction"}]},
        {"scrambled_words": "pizza / New York / famous / is / style / for / its", "correct_order": "New York is famous for its pizza style.", "nano_skill": [{"name": "ns.grammar.adjective_preposition_collocation", "confidence": 0.93, "reason": "Tests 'famous for' collocation"}, {"name": "ns.grammar.possessive_adjective_position", "confidence": 0.88, "reason": "Tests 'its + noun' possessive placement"}], "micro_skill": [{"name": "ms.grammar.word_order_construction", "confidence": 0.93, "reason": "Tests adjective complement construction"}]},
        {"scrambled_words": "eating / prefer / out / to / cooking / I / home / at", "correct_order": "I prefer eating out to cooking at home.", "nano_skill": [{"name": "ns.grammar.prefer_gerund_to_gerund", "confidence": 0.94, "reason": "Tests 'prefer + gerund + to + gerund' structure"}, {"name": "ns.grammar.phrasal_verb_position", "confidence": 0.88, "reason": "Tests 'eating out' phrasal verb in correct position"}], "micro_skill": [{"name": "ms.grammar.word_order_construction", "confidence": 0.94, "reason": "Tests preference expression construction"}]},
        {"scrambled_words": "been / have / to / you / restaurant / this / before", "correct_order": "Have you been to this restaurant before?", "nano_skill": [{"name": "ns.grammar.question_inversion_present_perfect", "confidence": 0.95, "reason": "Tests 'Have + subject' question inversion"}, {"name": "ns.grammar.adverb_before_position", "confidence": 0.88, "reason": "Tests 'before' placement at sentence end"}], "micro_skill": [{"name": "ms.grammar.word_order_construction", "confidence": 0.95, "reason": "Tests question formation word order"}]},
        {"scrambled_words": "waiter / recommended / the / special / chef's / today's", "correct_order": "The waiter recommended today's chef's special.", "nano_skill": [{"name": "ns.grammar.possessive_noun_chain", "confidence": 0.92, "reason": "Tests multiple possessives in correct order"}, {"name": "ns.grammar.word_order_svo", "confidence": 0.88, "reason": "Tests basic sentence structure with complex object"}], "micro_skill": [{"name": "ms.grammar.word_order_construction", "confidence": 0.92, "reason": "Tests possessive noun phrase construction"}]},
        {"scrambled_words": "delicious / was / most / the / I've / meal / ever / had", "correct_order": "It was the most delicious meal I've ever had.", "nano_skill": [{"name": "ns.grammar.superlative_relative_clause", "confidence": 0.93, "reason": "Tests superlative + relative clause structure"}, {"name": "ns.grammar.dummy_subject_it", "confidence": 0.88, "reason": "Tests using 'it' as dummy subject"}], "micro_skill": [{"name": "ms.grammar.word_order_construction", "confidence": 0.93, "reason": "Tests complex superlative sentence construction"}]}
      ],
      "teacher_tip": "Start with shorter sentences and gradually increase complexity. Encourage students to read their sentences aloud to check if they sound natural."
    }`;

export const getGapTextExercise = () => `    {
      "type": "gap-text",
      "title": "Exercise 13: Gap Text",
      "icon": "fa-puzzle-piece",
      "time": 8,
      "instructions": "Fill in the gaps with the correct form of the verbs in brackets. The word in parentheses after each gap is the incorrect-word that needs transformation:",
      "sentences": [
        {"text": "Yesterday I _____ (go) to the restaurant to meet my friend.", "answer": "went", "verb": "go", "nano_skill": [{"name": "ns.grammar.past_simple_irregular_go", "confidence": 0.95, "reason": "Tests irregular past form 'go' → 'went'"}, {"name": "ns.grammar.past_time_marker_yesterday", "confidence": 0.88, "reason": "Tests recognizing 'yesterday' requires past tense"}], "micro_skill": [{"name": "ms.grammar.verb_form_transformation", "confidence": 0.95, "reason": "Tests verb conjugation in context"}]},
        {"text": "The waiter _____ (be) very polite and helpful throughout the meal.", "answer": "was", "verb": "be", "nano_skill": [{"name": "ns.grammar.past_simple_be_singular", "confidence": 0.94, "reason": "Tests 'was' for singular subject in past"}, {"name": "ns.grammar.subject_verb_agreement_past", "confidence": 0.90, "reason": "Tests matching 'waiter' with 'was'"}], "micro_skill": [{"name": "ms.grammar.verb_form_transformation", "confidence": 0.94, "reason": "Tests 'be' verb conjugation"}]},
        {"text": "She has _____ (work) as a chef in this restaurant for five years now.", "answer": "been working", "verb": "work", "nano_skill": [{"name": "ns.grammar.present_perfect_continuous_form", "confidence": 0.93, "reason": "Tests 'has been + -ing' construction"}, {"name": "ns.grammar.duration_for_with_continuous", "confidence": 0.88, "reason": "Tests 'for + time' requiring continuous aspect"}], "micro_skill": [{"name": "ms.grammar.verb_form_transformation", "confidence": 0.93, "reason": "Tests complex tense formation"}]},
        {"text": "If I _____ (be) you, I would try the seafood special today.", "answer": "were", "verb": "be", "nano_skill": [{"name": "ns.grammar.second_conditional_were", "confidence": 0.94, "reason": "Tests subjunctive 'were' in conditional"}, {"name": "ns.grammar.hypothetical_past_form", "confidence": 0.90, "reason": "Tests unreal condition verb form"}], "micro_skill": [{"name": "ms.grammar.verb_form_transformation", "confidence": 0.94, "reason": "Tests conditional verb form"}]},
        {"text": "The food was so _____ (spice) that I had to drink three glasses of water.", "answer": "spicy", "verb": "spice", "nano_skill": [{"name": "ns.grammar.noun_to_adjective_y", "confidence": 0.92, "reason": "Tests 'spice' → 'spicy' word formation"}, {"name": "ns.grammar.adjective_after_so", "confidence": 0.88, "reason": "Tests adjective required after 'so'"}], "micro_skill": [{"name": "ms.grammar.word_form_transformation", "confidence": 0.92, "reason": "Tests word class transformation"}]},
        {"text": "Can you _____ (recommend) a good wine to go with this dish?", "answer": "recommend", "verb": "recommend", "nano_skill": [{"name": "ns.grammar.base_form_after_modal", "confidence": 0.95, "reason": "Tests bare infinitive after 'can'"}, {"name": "ns.grammar.modal_verb_structure", "confidence": 0.88, "reason": "Tests verb form after modal auxiliary"}], "micro_skill": [{"name": "ms.grammar.verb_form_transformation", "confidence": 0.95, "reason": "Tests modal verb complement"}]},
        {"text": "I'm looking _____ (forward) to trying their famous dessert menu.", "answer": "forward", "verb": "forward", "nano_skill": [{"name": "ns.grammar.phrasal_verb_look_forward_to", "confidence": 0.93, "reason": "Tests 'look forward to' fixed expression"}, {"name": "ns.grammar.gerund_after_to_exception", "confidence": 0.88, "reason": "Tests gerund after 'to' in this phrase"}], "micro_skill": [{"name": "ms.grammar.phrasal_verb_completion", "confidence": 0.93, "reason": "Tests phrasal verb knowledge"}]},
        {"text": "The restaurant _____ (open) at 6 PM according to their website.", "answer": "opens", "verb": "open", "nano_skill": [{"name": "ns.grammar.present_simple_third_person_s", "confidence": 0.94, "reason": "Tests -s ending for third person singular"}, {"name": "ns.grammar.present_simple_for_schedules", "confidence": 0.88, "reason": "Tests present simple for timetabled events"}], "micro_skill": [{"name": "ms.grammar.verb_form_transformation", "confidence": 0.94, "reason": "Tests present simple conjugation"}]},
        {"text": "By next month, they _____ (serve) customers for ten years.", "answer": "will have been serving", "verb": "serve", "nano_skill": [{"name": "ns.grammar.future_perfect_continuous", "confidence": 0.90, "reason": "Tests 'will have been + -ing' formation"}, {"name": "ns.grammar.by_time_marker_future_perfect", "confidence": 0.85, "reason": "Tests 'by + future time' requiring perfect"}], "micro_skill": [{"name": "ms.grammar.verb_form_transformation", "confidence": 0.90, "reason": "Tests complex future tense formation"}]},
        {"text": "We _____ (wait) for our table for nearly an hour yesterday.", "answer": "waited", "verb": "wait", "nano_skill": [{"name": "ns.grammar.past_simple_regular_ed", "confidence": 0.94, "reason": "Tests regular -ed past tense formation"}, {"name": "ns.grammar.past_time_marker_yesterday", "confidence": 0.88, "reason": "Tests 'yesterday' requiring past simple"}], "micro_skill": [{"name": "ms.grammar.verb_form_transformation", "confidence": 0.94, "reason": "Tests regular past tense conjugation"}]}
      ],
      "teacher_tip": "Before students fill the gaps, discuss the topic to help them understand the context and make better choices."
    }`;

export const getNegativePrefixesExercise = () => `    {
      "type": "negative-prefixes",
      "title": "Exercise 14: Negative Prefixes",
      "icon": "fa-minus-circle",
      "time": 6,
      "instructions": "Add the correct negative prefix (un-, in-, im-, dis-) to create the opposite meaning.",
      "words": [
        {"word": "satisfied", "answer": "dissatisfied", "nano_skill": [{"name": "ns.vocab.prefix_dis_meaning", "confidence": 0.95, "reason": "Tests 'dis-' prefix for negation"}, {"name": "ns.vocab.prefix_word_combination", "confidence": 0.90, "reason": "Tests which prefix combines with 'satisfied'"}], "micro_skill": [{"name": "ms.vocab.negative_prefix_formation", "confidence": 0.95, "reason": "Tests negative prefix selection"}]},
        {"word": "cooked", "answer": "uncooked", "nano_skill": [{"name": "ns.vocab.prefix_un_meaning", "confidence": 0.94, "reason": "Tests 'un-' prefix for negation"}, {"name": "ns.vocab.prefix_with_past_participle", "confidence": 0.88, "reason": "Tests 'un-' combining with past participle"}], "micro_skill": [{"name": "ms.vocab.negative_prefix_formation", "confidence": 0.94, "reason": "Tests negative prefix selection"}]},
        {"word": "polite", "answer": "impolite", "nano_skill": [{"name": "ns.vocab.prefix_im_before_p", "confidence": 0.95, "reason": "Tests 'im-' before words starting with 'p'"}, {"name": "ns.vocab.prefix_phonetic_rule", "confidence": 0.90, "reason": "Tests phonetic prefix selection rule"}], "micro_skill": [{"name": "ms.vocab.negative_prefix_formation", "confidence": 0.95, "reason": "Tests phonetically-conditioned prefix"}]},
        {"word": "correct", "answer": "incorrect", "nano_skill": [{"name": "ns.vocab.prefix_in_meaning", "confidence": 0.94, "reason": "Tests 'in-' prefix for negation"}, {"name": "ns.vocab.prefix_word_combination", "confidence": 0.88, "reason": "Tests 'in-' combining with 'correct'"}], "micro_skill": [{"name": "ms.vocab.negative_prefix_formation", "confidence": 0.94, "reason": "Tests negative prefix selection"}]},
        {"word": "fresh", "answer": "unfresh", "nano_skill": [{"name": "ns.vocab.prefix_un_meaning", "confidence": 0.93, "reason": "Tests 'un-' prefix for negation"}, {"name": "ns.vocab.prefix_with_adjective", "confidence": 0.88, "reason": "Tests 'un-' combining with adjective"}], "micro_skill": [{"name": "ms.vocab.negative_prefix_formation", "confidence": 0.93, "reason": "Tests negative prefix selection"}]},
        {"word": "expensive", "answer": "inexpensive", "nano_skill": [{"name": "ns.vocab.prefix_in_meaning", "confidence": 0.94, "reason": "Tests 'in-' prefix for negation"}, {"name": "ns.vocab.prefix_before_vowel", "confidence": 0.88, "reason": "Tests 'in-' before vowel remains 'in-'"}], "micro_skill": [{"name": "ms.vocab.negative_prefix_formation", "confidence": 0.94, "reason": "Tests prefix selection before vowel"}]},
        {"word": "comfortable", "answer": "uncomfortable", "nano_skill": [{"name": "ns.vocab.prefix_un_meaning", "confidence": 0.94, "reason": "Tests 'un-' prefix for negation"}, {"name": "ns.vocab.prefix_word_combination", "confidence": 0.88, "reason": "Tests 'un-' combining with 'comfortable'"}], "micro_skill": [{"name": "ms.vocab.negative_prefix_formation", "confidence": 0.94, "reason": "Tests common 'un-' combination"}]},
        {"word": "honest", "answer": "dishonest", "nano_skill": [{"name": "ns.vocab.prefix_dis_meaning", "confidence": 0.93, "reason": "Tests 'dis-' prefix for negation"}, {"name": "ns.vocab.prefix_word_combination", "confidence": 0.88, "reason": "Tests 'dis-' combining with 'honest'"}], "micro_skill": [{"name": "ms.vocab.negative_prefix_formation", "confidence": 0.93, "reason": "Tests negative prefix selection"}]},
        {"word": "possible", "answer": "impossible", "nano_skill": [{"name": "ns.vocab.prefix_im_before_p", "confidence": 0.95, "reason": "Tests 'im-' before words starting with 'p'"}, {"name": "ns.vocab.prefix_phonetic_rule", "confidence": 0.90, "reason": "Tests phonetic assimilation rule"}], "micro_skill": [{"name": "ms.vocab.negative_prefix_formation", "confidence": 0.95, "reason": "Tests phonetically-conditioned prefix"}]},
        {"word": "popular", "answer": "unpopular", "nano_skill": [{"name": "ns.vocab.prefix_un_meaning", "confidence": 0.93, "reason": "Tests 'un-' prefix for negation"}, {"name": "ns.vocab.prefix_exception_to_rule", "confidence": 0.88, "reason": "Tests 'un-' despite 'p' start (not 'im-')"}], "micro_skill": [{"name": "ms.vocab.negative_prefix_formation", "confidence": 0.93, "reason": "Tests prefix exception knowledge"}]}
      ],
      "teacher_tip": "After completing the exercise, have students create sentences using both the positive and negative forms to reinforce understanding of meaning changes."
    }`;

// =============== 12 NEW EXERCISES - PHASE 2 (4 exercises) ===============

export const getCategorizeExercise = () => `    {
      "type": "categorize",
      "title": "Exercise 15: Categorize",
      "icon": "fa-layer-group",
      "time": 7,
      "instructions": "Sort these food and restaurant-related items into the correct categories.",
      "items": [
        {"word": "pizza", "nano_skill": [{"name": "ns.vocab.semantic_category_food", "confidence": 0.95, "reason": "Tests categorization of 'pizza' as food item"}, {"name": "ns.vocab.lexical_set_restaurant", "confidence": 0.90, "reason": "Tests restaurant-related vocabulary recognition"}], "micro_skill": [{"name": "ms.vocab.semantic_categorization", "confidence": 0.95, "reason": "Tests ability to classify vocabulary by meaning"}]},
        {"word": "waiter", "nano_skill": [{"name": "ns.vocab.semantic_category_occupation", "confidence": 0.95, "reason": "Tests categorization of 'waiter' as staff"}, {"name": "ns.vocab.lexical_set_restaurant", "confidence": 0.90, "reason": "Tests restaurant staff vocabulary"}], "micro_skill": [{"name": "ms.vocab.semantic_categorization", "confidence": 0.95, "reason": "Tests ability to classify vocabulary by meaning"}]},
        {"word": "spoon", "nano_skill": [{"name": "ns.vocab.semantic_category_utensil", "confidence": 0.95, "reason": "Tests categorization of 'spoon' as utensil"}, {"name": "ns.vocab.concrete_noun_recognition", "confidence": 0.88, "reason": "Tests concrete noun identification"}], "micro_skill": [{"name": "ms.vocab.semantic_categorization", "confidence": 0.95, "reason": "Tests ability to classify vocabulary by meaning"}]},
        {"word": "breakfast", "nano_skill": [{"name": "ns.vocab.semantic_category_time", "confidence": 0.94, "reason": "Tests categorization of 'breakfast' as meal time"}, {"name": "ns.vocab.daily_routine_vocabulary", "confidence": 0.88, "reason": "Tests daily routine vocabulary"}], "micro_skill": [{"name": "ms.vocab.semantic_categorization", "confidence": 0.94, "reason": "Tests ability to classify vocabulary by meaning"}]},
        {"word": "sushi", "nano_skill": [{"name": "ns.vocab.semantic_category_food", "confidence": 0.95, "reason": "Tests categorization of 'sushi' as food item"}, {"name": "ns.vocab.international_food_vocabulary", "confidence": 0.88, "reason": "Tests international cuisine vocabulary"}], "micro_skill": [{"name": "ms.vocab.semantic_categorization", "confidence": 0.95, "reason": "Tests ability to classify vocabulary by meaning"}]},
        {"word": "chef", "nano_skill": [{"name": "ns.vocab.semantic_category_occupation", "confidence": 0.95, "reason": "Tests categorization of 'chef' as staff"}, {"name": "ns.vocab.lexical_set_restaurant", "confidence": 0.90, "reason": "Tests restaurant staff vocabulary"}], "micro_skill": [{"name": "ms.vocab.semantic_categorization", "confidence": 0.95, "reason": "Tests ability to classify vocabulary by meaning"}]},
        {"word": "fork", "nano_skill": [{"name": "ns.vocab.semantic_category_utensil", "confidence": 0.95, "reason": "Tests categorization of 'fork' as utensil"}, {"name": "ns.vocab.concrete_noun_recognition", "confidence": 0.88, "reason": "Tests concrete noun identification"}], "micro_skill": [{"name": "ms.vocab.semantic_categorization", "confidence": 0.95, "reason": "Tests ability to classify vocabulary by meaning"}]},
        {"word": "lunch", "nano_skill": [{"name": "ns.vocab.semantic_category_time", "confidence": 0.94, "reason": "Tests categorization of 'lunch' as meal time"}, {"name": "ns.vocab.daily_routine_vocabulary", "confidence": 0.88, "reason": "Tests daily routine vocabulary"}], "micro_skill": [{"name": "ms.vocab.semantic_categorization", "confidence": 0.94, "reason": "Tests ability to classify vocabulary by meaning"}]},
        {"word": "pasta", "nano_skill": [{"name": "ns.vocab.semantic_category_food", "confidence": 0.95, "reason": "Tests categorization of 'pasta' as food item"}, {"name": "ns.vocab.international_food_vocabulary", "confidence": 0.88, "reason": "Tests international cuisine vocabulary"}], "micro_skill": [{"name": "ms.vocab.semantic_categorization", "confidence": 0.95, "reason": "Tests ability to classify vocabulary by meaning"}]},
        {"word": "customer", "nano_skill": [{"name": "ns.vocab.semantic_category_person", "confidence": 0.94, "reason": "Tests categorization of 'customer' as restaurant-related person"}, {"name": "ns.vocab.service_industry_vocabulary", "confidence": 0.88, "reason": "Tests service industry vocabulary"}], "micro_skill": [{"name": "ms.vocab.semantic_categorization", "confidence": 0.94, "reason": "Tests ability to classify vocabulary by meaning"}]},
        {"word": "knife", "nano_skill": [{"name": "ns.vocab.semantic_category_utensil", "confidence": 0.95, "reason": "Tests categorization of 'knife' as utensil"}, {"name": "ns.vocab.concrete_noun_recognition", "confidence": 0.88, "reason": "Tests concrete noun identification"}], "micro_skill": [{"name": "ms.vocab.semantic_categorization", "confidence": 0.95, "reason": "Tests ability to classify vocabulary by meaning"}]},
        {"word": "dinner", "nano_skill": [{"name": "ns.vocab.semantic_category_time", "confidence": 0.94, "reason": "Tests categorization of 'dinner' as meal time"}, {"name": "ns.vocab.daily_routine_vocabulary", "confidence": 0.88, "reason": "Tests daily routine vocabulary"}], "micro_skill": [{"name": "ms.vocab.semantic_categorization", "confidence": 0.94, "reason": "Tests ability to classify vocabulary by meaning"}]},
        {"word": "burger", "nano_skill": [{"name": "ns.vocab.semantic_category_food", "confidence": 0.95, "reason": "Tests categorization of 'burger' as food item"}, {"name": "ns.vocab.fast_food_vocabulary", "confidence": 0.88, "reason": "Tests fast food vocabulary"}], "micro_skill": [{"name": "ms.vocab.semantic_categorization", "confidence": 0.95, "reason": "Tests ability to classify vocabulary by meaning"}]},
        {"word": "manager", "nano_skill": [{"name": "ns.vocab.semantic_category_occupation", "confidence": 0.94, "reason": "Tests categorization of 'manager' as staff"}, {"name": "ns.vocab.workplace_hierarchy_vocabulary", "confidence": 0.88, "reason": "Tests workplace hierarchy vocabulary"}], "micro_skill": [{"name": "ms.vocab.semantic_categorization", "confidence": 0.94, "reason": "Tests ability to classify vocabulary by meaning"}]},
        {"word": "plate", "nano_skill": [{"name": "ns.vocab.semantic_category_utensil", "confidence": 0.94, "reason": "Tests categorization of 'plate' as tableware"}, {"name": "ns.vocab.concrete_noun_recognition", "confidence": 0.88, "reason": "Tests concrete noun identification"}], "micro_skill": [{"name": "ms.vocab.semantic_categorization", "confidence": 0.94, "reason": "Tests ability to classify vocabulary by meaning"}]},
        {"word": "snack", "nano_skill": [{"name": "ns.vocab.semantic_category_time", "confidence": 0.93, "reason": "Tests categorization of 'snack' as meal time"}, {"name": "ns.vocab.eating_habits_vocabulary", "confidence": 0.88, "reason": "Tests eating habits vocabulary"}], "micro_skill": [{"name": "ms.vocab.semantic_categorization", "confidence": 0.93, "reason": "Tests ability to classify vocabulary by meaning"}]}
      ],
      "categories": [
        {"name": "Food Items", "correct_items": ["pizza", "sushi", "pasta", "burger"]},
        {"name": "Restaurant Staff", "correct_items": ["waiter", "chef", "manager", "customer"]},
        {"name": "Eating Utensils", "correct_items": ["spoon", "fork", "knife", "plate"]},
        {"name": "Meal Times", "correct_items": ["breakfast", "lunch", "dinner", "snack"]}
      ],
      "teacher_tip": "After categorizing, ask students to add two more items to each category to expand their vocabulary and test their understanding of the categories."
    }`;

export const getParaphrasingExercise = () => `    {
      "type": "paraphrasing",
      "title": "Exercise 16: Paraphrasing",
      "icon": "fa-quote-left",
      "time": 8,
      "instructions": "Rewrite these sentences about restaurant experiences using different words but keeping the same meaning.",
      "sentences": [
        {"original": "The food was absolutely delicious.", "paraphrase": "The meal was extremely tasty.", "alternatives": ["The dish was incredibly flavorful.", "The cuisine was wonderfully appetizing."], "nano_skill": [{"name": "ns.vocab.synonym_selection_delicious", "confidence": 0.95, "reason": "Tests ability to find synonyms for 'delicious'"}, {"name": "ns.vocab.intensifier_alternatives", "confidence": 0.90, "reason": "Tests replacing 'absolutely' with other intensifiers"}], "micro_skill": [{"name": "ms.writing.paraphrasing_technique", "confidence": 0.95, "reason": "Tests sentence-level paraphrasing ability"}]},
        {"original": "We had to wait a long time for our order.", "paraphrase": "Our food took ages to arrive.", "alternatives": ["The service was very slow.", "We waited forever for our meal."], "nano_skill": [{"name": "ns.vocab.time_expression_alternatives", "confidence": 0.94, "reason": "Tests expressing duration with different phrases"}, {"name": "ns.grammar.sentence_structure_variation", "confidence": 0.88, "reason": "Tests restructuring subject-verb relationships"}], "micro_skill": [{"name": "ms.writing.paraphrasing_technique", "confidence": 0.94, "reason": "Tests sentence-level paraphrasing ability"}]},
        {"original": "The restaurant is always crowded on weekends.", "paraphrase": "The place gets really busy on Saturdays and Sundays.", "alternatives": ["It's packed with customers during weekends.", "Weekend dining there is always hectic."], "nano_skill": [{"name": "ns.vocab.synonym_selection_crowded", "confidence": 0.94, "reason": "Tests finding synonyms for 'crowded'"}, {"name": "ns.vocab.time_expression_specificity", "confidence": 0.88, "reason": "Tests replacing 'weekends' with specific days"}], "micro_skill": [{"name": "ms.writing.paraphrasing_technique", "confidence": 0.94, "reason": "Tests sentence-level paraphrasing ability"}]},
        {"original": "I complained about the cold soup.", "paraphrase": "I told the waiter that my soup wasn't hot enough.", "alternatives": ["I expressed dissatisfaction with the soup's temperature.", "I mentioned that the soup needed reheating."], "nano_skill": [{"name": "ns.vocab.complaint_vocabulary_expansion", "confidence": 0.93, "reason": "Tests expressing complaints with different vocabulary"}, {"name": "ns.grammar.indirect_speech_transformation", "confidence": 0.88, "reason": "Tests converting direct statement to indirect"}], "micro_skill": [{"name": "ms.writing.paraphrasing_technique", "confidence": 0.93, "reason": "Tests sentence-level paraphrasing ability"}]},
        {"original": "This café serves the best coffee in town.", "paraphrase": "You can't find better coffee anywhere else in the city.", "alternatives": ["This place has the finest coffee around.", "No other café makes coffee this good."], "nano_skill": [{"name": "ns.grammar.superlative_to_comparative", "confidence": 0.94, "reason": "Tests converting superlative to comparative structure"}, {"name": "ns.vocab.synonym_selection_best", "confidence": 0.88, "reason": "Tests finding alternatives for 'best'"}], "micro_skill": [{"name": "ms.writing.paraphrasing_technique", "confidence": 0.94, "reason": "Tests sentence-level paraphrasing ability"}]},
        {"original": "The bill was much higher than expected.", "paraphrase": "We were surprised by how expensive the meal was.", "alternatives": ["The cost exceeded our expectations.", "The price was shockingly steep."], "nano_skill": [{"name": "ns.vocab.price_vocabulary_alternatives", "confidence": 0.93, "reason": "Tests expressing cost with different vocabulary"}, {"name": "ns.grammar.passive_to_active_transformation", "confidence": 0.88, "reason": "Tests restructuring sentence voice"}], "micro_skill": [{"name": "ms.writing.paraphrasing_technique", "confidence": 0.93, "reason": "Tests sentence-level paraphrasing ability"}]}
      ],
      "teacher_tip": "Encourage students to use synonyms and different sentence structures. Discuss how paraphrasing is useful for avoiding repetition in writing and speaking."
    }`;

export const getCompleteWordExercise = () => `    {
      "type": "complete-word",
      "title": "Exercise 17: Complete the Word",
      "icon": "fa-spell-check",
      "time": 6,
      "instructions": "Complete these restaurant and food-related words by filling in the missing letters.",
      "words": [
        {"partial": "rest_urant", "complete": "restaurant", "clue": "A place where people go to eat meals", "nano_skill": [{"name": "ns.spelling.vowel_placement_a", "confidence": 0.95, "reason": "Tests correct placement of vowel 'a' in 'restaurant'"}, {"name": "ns.vocab.word_recognition_restaurant", "confidence": 0.90, "reason": "Tests recognition of common restaurant vocabulary"}], "micro_skill": [{"name": "ms.spelling.word_completion", "confidence": 0.95, "reason": "Tests spelling completion ability"}]},
        {"partial": "del_cious", "complete": "delicious", "clue": "Having a very pleasant taste", "nano_skill": [{"name": "ns.spelling.vowel_placement_i", "confidence": 0.94, "reason": "Tests correct placement of vowel 'i' in 'delicious'"}, {"name": "ns.spelling.suffix_icious", "confidence": 0.88, "reason": "Tests knowledge of '-icious' suffix pattern"}], "micro_skill": [{"name": "ms.spelling.word_completion", "confidence": 0.94, "reason": "Tests spelling completion ability"}]},
        {"partial": "_ppetizer", "complete": "appetizer", "clue": "A small dish served before the main course", "nano_skill": [{"name": "ns.spelling.initial_vowel_a", "confidence": 0.94, "reason": "Tests correct initial vowel 'a' in 'appetizer'"}, {"name": "ns.vocab.course_sequence_vocabulary", "confidence": 0.88, "reason": "Tests meal course vocabulary"}], "micro_skill": [{"name": "ms.spelling.word_completion", "confidence": 0.94, "reason": "Tests spelling completion ability"}]},
        {"partial": "reserv_tion", "complete": "reservation", "clue": "Booking a table in advance", "nano_skill": [{"name": "ns.spelling.vowel_placement_a", "confidence": 0.94, "reason": "Tests correct vowel 'a' in '-ation' suffix"}, {"name": "ns.spelling.suffix_ation", "confidence": 0.90, "reason": "Tests knowledge of '-ation' noun suffix"}], "micro_skill": [{"name": "ms.spelling.word_completion", "confidence": 0.94, "reason": "Tests spelling completion ability"}]},
        {"partial": "cust_mer", "complete": "customer", "clue": "A person who buys food or service", "nano_skill": [{"name": "ns.spelling.vowel_placement_o", "confidence": 0.94, "reason": "Tests correct vowel 'o' in 'customer'"}, {"name": "ns.vocab.service_industry_vocabulary", "confidence": 0.88, "reason": "Tests service industry vocabulary"}], "micro_skill": [{"name": "ms.spelling.word_completion", "confidence": 0.94, "reason": "Tests spelling completion ability"}]},
        {"partial": "veget_rian", "complete": "vegetarian", "clue": "Someone who doesn't eat meat", "nano_skill": [{"name": "ns.spelling.vowel_placement_a", "confidence": 0.93, "reason": "Tests correct vowel 'a' in 'vegetarian'"}, {"name": "ns.spelling.suffix_arian", "confidence": 0.88, "reason": "Tests knowledge of '-arian' suffix"}], "micro_skill": [{"name": "ms.spelling.word_completion", "confidence": 0.93, "reason": "Tests spelling completion ability"}]},
        {"partial": "w_iter", "complete": "waiter", "clue": "A person who serves food in a restaurant", "nano_skill": [{"name": "ns.spelling.vowel_placement_a", "confidence": 0.95, "reason": "Tests correct vowel 'a' in 'waiter'"}, {"name": "ns.spelling.diphthong_ai", "confidence": 0.90, "reason": "Tests 'ai' diphthong spelling"}], "micro_skill": [{"name": "ms.spelling.word_completion", "confidence": 0.95, "reason": "Tests spelling completion ability"}]},
        {"partial": "men_", "complete": "menu", "clue": "A list of food and drinks available", "nano_skill": [{"name": "ns.spelling.final_vowel_u", "confidence": 0.94, "reason": "Tests correct final vowel 'u' in 'menu'"}, {"name": "ns.vocab.restaurant_vocabulary_basic", "confidence": 0.90, "reason": "Tests basic restaurant vocabulary"}], "micro_skill": [{"name": "ms.spelling.word_completion", "confidence": 0.94, "reason": "Tests spelling completion ability"}]},
        {"partial": "_xpensive", "complete": "expensive", "clue": "Costing a lot of money", "nano_skill": [{"name": "ns.spelling.initial_vowel_e", "confidence": 0.94, "reason": "Tests correct initial vowel 'e' in 'expensive'"}, {"name": "ns.vocab.price_adjectives", "confidence": 0.88, "reason": "Tests price-related adjectives"}], "micro_skill": [{"name": "ms.spelling.word_completion", "confidence": 0.94, "reason": "Tests spelling completion ability"}]},
        {"partial": "compl_int", "complete": "complaint", "clue": "An expression of dissatisfaction", "nano_skill": [{"name": "ns.spelling.vowel_placement_a", "confidence": 0.93, "reason": "Tests correct vowel 'a' in 'complaint'"}, {"name": "ns.spelling.diphthong_ai", "confidence": 0.88, "reason": "Tests 'ai' diphthong spelling"}], "micro_skill": [{"name": "ms.spelling.word_completion", "confidence": 0.93, "reason": "Tests spelling completion ability"}]}
      ],
      "teacher_tip": "After completing the words, ask students to use each word in a sentence about their own restaurant experiences to reinforce meaning and usage."
    }`;

export const getMatchingHalvesExercise = () => `    {
      "type": "matching-halves",
      "title": "Exercise 18: Matching Halves",
      "icon": "fa-puzzle-piece",
      "time": 7,
      "instructions": "Match the first half of each sentence with the correct second half.",
      "sentence_halves": [
        {"first_half": "I'd like to make a reservation", "second_half": "for four people at 7:30 PM this Friday.", "id": 1, "nano_skill": [{"name": "ns.grammar.would_like_pattern", "confidence": 0.95, "reason": "Tests understanding of 'I'd like to' polite request pattern"}, {"name": "ns.pragmatics.reservation_language", "confidence": 0.90, "reason": "Tests restaurant reservation vocabulary"}], "micro_skill": [{"name": "ms.grammar.sentence_coherence", "confidence": 0.95, "reason": "Tests ability to match coherent sentence halves"}]},
        {"first_half": "The waiter recommended the grilled salmon", "second_half": "because it's the chef's specialty this week.", "id": 2, "nano_skill": [{"name": "ns.grammar.past_simple_recommend", "confidence": 0.94, "reason": "Tests understanding of recommendation context"}, {"name": "ns.grammar.because_clause_connection", "confidence": 0.90, "reason": "Tests cause-effect clause connection"}], "micro_skill": [{"name": "ms.grammar.sentence_coherence", "confidence": 0.94, "reason": "Tests ability to match coherent sentence halves"}]},
        {"first_half": "Could you bring us two glasses of sparkling water", "second_half": "and the dessert menu, please?", "id": 3, "nano_skill": [{"name": "ns.grammar.could_polite_request", "confidence": 0.94, "reason": "Tests polite request with 'could'"}, {"name": "ns.grammar.compound_object_coordination", "confidence": 0.88, "reason": "Tests coordination with 'and'"}], "micro_skill": [{"name": "ms.grammar.sentence_coherence", "confidence": 0.94, "reason": "Tests ability to match coherent sentence halves"}]},
        {"first_half": "I ordered the vegetarian pasta", "second_half": "but they brought me a seafood dish instead.", "id": 4, "nano_skill": [{"name": "ns.grammar.contrast_with_but", "confidence": 0.95, "reason": "Tests contrast connector 'but'"}, {"name": "ns.vocab.complaint_situation_vocabulary", "confidence": 0.88, "reason": "Tests complaint situation understanding"}], "micro_skill": [{"name": "ms.grammar.sentence_coherence", "confidence": 0.95, "reason": "Tests ability to match coherent sentence halves"}]},
        {"first_half": "This Italian restaurant is famous", "second_half": "for serving the most authentic pizza in town.", "id": 5, "nano_skill": [{"name": "ns.grammar.famous_for_collocation", "confidence": 0.95, "reason": "Tests 'famous for' collocation pattern"}, {"name": "ns.grammar.superlative_usage", "confidence": 0.88, "reason": "Tests superlative 'most authentic'"}], "micro_skill": [{"name": "ms.grammar.sentence_coherence", "confidence": 0.95, "reason": "Tests ability to match coherent sentence halves"}]},
        {"first_half": "We always leave a generous tip", "second_half": "when the service exceeds our expectations.", "id": 6, "nano_skill": [{"name": "ns.grammar.when_time_clause", "confidence": 0.94, "reason": "Tests 'when' temporal clause connection"}, {"name": "ns.vocab.tipping_culture_vocabulary", "confidence": 0.88, "reason": "Tests tipping vocabulary"}], "micro_skill": [{"name": "ms.grammar.sentence_coherence", "confidence": 0.94, "reason": "Tests ability to match coherent sentence halves"}]},
        {"first_half": "The curry was so incredibly spicy", "second_half": "that I had to order a glass of milk.", "id": 7, "nano_skill": [{"name": "ns.grammar.so_that_result_clause", "confidence": 0.95, "reason": "Tests 'so...that' result clause pattern"}, {"name": "ns.grammar.had_to_necessity", "confidence": 0.88, "reason": "Tests 'had to' for past necessity"}], "micro_skill": [{"name": "ms.grammar.sentence_coherence", "confidence": 0.95, "reason": "Tests ability to match coherent sentence halves"}]},
        {"first_half": "Would you like to try the chocolate lava cake", "second_half": "which our pastry chef made fresh today?", "id": 8, "nano_skill": [{"name": "ns.grammar.relative_clause_which", "confidence": 0.94, "reason": "Tests 'which' relative clause for things"}, {"name": "ns.grammar.would_like_offer", "confidence": 0.88, "reason": "Tests 'would you like' offer pattern"}], "micro_skill": [{"name": "ms.grammar.sentence_coherence", "confidence": 0.94, "reason": "Tests ability to match coherent sentence halves"}]},
        {"first_half": "The restaurant refused to serve us", "second_half": "because we arrived after their closing time.", "id": 9, "nano_skill": [{"name": "ns.grammar.refused_to_infinitive", "confidence": 0.93, "reason": "Tests 'refused to' + infinitive pattern"}, {"name": "ns.grammar.because_reason_clause", "confidence": 0.88, "reason": "Tests 'because' reason clause"}], "micro_skill": [{"name": "ms.grammar.sentence_coherence", "confidence": 0.93, "reason": "Tests ability to match coherent sentence halves"}]},
        {"first_half": "My grandmother taught me how to cook", "second_half": "traditional French dishes when I was young.", "id": 10, "nano_skill": [{"name": "ns.grammar.how_to_infinitive", "confidence": 0.94, "reason": "Tests 'how to' + infinitive pattern"}, {"name": "ns.grammar.when_past_time_clause", "confidence": 0.88, "reason": "Tests 'when' past time clause"}], "micro_skill": [{"name": "ms.grammar.sentence_coherence", "confidence": 0.94, "reason": "Tests ability to match coherent sentence halves"}]}
      ],
      "teacher_tip": "After matching, have students read the complete sentences aloud to practice pronunciation and natural sentence rhythm."
    }`;

// =============== 12 NEW EXERCISES - PHASE 3 (2 exercises) ===============

export const getDescribePictureExercise = () => `    {
      "type": "describe-picture",
      "title": "Exercise 19: Describe the Picture",
      "icon": "fa-image",
      "time": 10,
      "instructions": "Look at the image and describe what you see using the vocabulary from this lesson.",
      "image_description": "Based on the provided image, create a detailed description of what is visible in the scene.",
      "prompts": [
        {"text": "Describe the overall scene and atmosphere you observe in the image.", "nano_skill": [{"name": "ns.speaking.scene_description", "confidence": 0.95, "reason": "Tests ability to describe visual scenes"}, {"name": "ns.vocab.atmosphere_adjectives", "confidence": 0.90, "reason": "Tests atmosphere-related vocabulary"}], "micro_skill": [{"name": "ms.speaking.picture_description", "confidence": 0.95, "reason": "Tests visual description ability"}]},
        {"text": "What specific objects, people, or elements can you identify?", "nano_skill": [{"name": "ns.speaking.object_identification", "confidence": 0.94, "reason": "Tests ability to identify and name visual elements"}, {"name": "ns.vocab.concrete_noun_usage", "confidence": 0.88, "reason": "Tests concrete noun vocabulary"}], "micro_skill": [{"name": "ms.speaking.picture_description", "confidence": 0.94, "reason": "Tests visual description ability"}]},
        {"text": "What colors, textures, or visual details stand out to you?", "nano_skill": [{"name": "ns.vocab.color_vocabulary", "confidence": 0.94, "reason": "Tests color-related vocabulary"}, {"name": "ns.vocab.texture_adjectives", "confidence": 0.88, "reason": "Tests texture description vocabulary"}], "micro_skill": [{"name": "ms.speaking.picture_description", "confidence": 0.94, "reason": "Tests visual description ability"}]},
        {"text": "What activity or situation is taking place in this image?", "nano_skill": [{"name": "ns.grammar.present_continuous_description", "confidence": 0.95, "reason": "Tests present continuous for ongoing actions"}, {"name": "ns.speaking.action_description", "confidence": 0.90, "reason": "Tests describing activities"}], "micro_skill": [{"name": "ms.speaking.picture_description", "confidence": 0.95, "reason": "Tests visual description ability"}]},
        {"text": "How would you describe the mood or feeling this image conveys?", "nano_skill": [{"name": "ns.vocab.mood_vocabulary", "confidence": 0.93, "reason": "Tests mood and emotion vocabulary"}, {"name": "ns.speaking.inference_expression", "confidence": 0.88, "reason": "Tests expressing inferences"}], "micro_skill": [{"name": "ms.speaking.picture_description", "confidence": 0.93, "reason": "Tests visual description ability"}]},
        {"text": "What details in the image are most interesting or unusual?", "nano_skill": [{"name": "ns.vocab.superlative_interesting", "confidence": 0.93, "reason": "Tests superlative usage for emphasis"}, {"name": "ns.speaking.detail_observation", "confidence": 0.88, "reason": "Tests observational skills"}], "micro_skill": [{"name": "ms.speaking.picture_description", "confidence": 0.93, "reason": "Tests visual description ability"}]},
        {"text": "If you were in this scene, what would you notice first?", "nano_skill": [{"name": "ns.grammar.second_conditional_if", "confidence": 0.94, "reason": "Tests hypothetical 'if' clause"}, {"name": "ns.grammar.would_hypothetical", "confidence": 0.88, "reason": "Tests 'would' for hypothetical situations"}], "micro_skill": [{"name": "ms.speaking.picture_description", "confidence": 0.94, "reason": "Tests visual description ability"}]},
        {"text": "What story could you tell based on what you see in the image?", "nano_skill": [{"name": "ns.speaking.narrative_creation", "confidence": 0.93, "reason": "Tests narrative construction ability"}, {"name": "ns.grammar.modal_could_possibility", "confidence": 0.88, "reason": "Tests 'could' for possibility"}], "micro_skill": [{"name": "ms.speaking.picture_description", "confidence": 0.93, "reason": "Tests visual description ability"}]},
        {"text": "What questions would you ask about what's happening in the picture?", "nano_skill": [{"name": "ns.grammar.question_formation_wh", "confidence": 0.94, "reason": "Tests wh-question formation"}, {"name": "ns.speaking.curiosity_expression", "confidence": 0.88, "reason": "Tests expressing curiosity"}], "micro_skill": [{"name": "ms.speaking.picture_description", "confidence": 0.94, "reason": "Tests visual description ability"}]},
        {"text": "Compare this scene to a similar one from your own experience.", "nano_skill": [{"name": "ns.grammar.comparative_structures", "confidence": 0.94, "reason": "Tests comparative language for comparisons"}, {"name": "ns.speaking.personal_connection", "confidence": 0.88, "reason": "Tests relating content to personal experience"}], "micro_skill": [{"name": "ms.speaking.picture_description", "confidence": 0.94, "reason": "Tests visual description ability"}]}
      ],
      "useful_vocabulary": ["visible", "prominent", "background", "foreground", "detailed", "noticeable", "apparent", "striking", "distinctive", "characteristic"],
      "teacher_tip": "Encourage students to use descriptive adjectives and specific details from the image. Ask follow-up questions to extend their descriptions and practice new vocabulary. NOTE: If an image URL is provided in the exercise data, reference that specific image in your instructions and prompts."
    }`;

export const getAnswerQuestionsExercise = () => `    {
      "type": "answer-questions",
      "title": "Exercise 20: Answer Questions",
      "icon": "fa-question-circle",
      "time": 8,
      "instructions": "Answer these questions about your personal food preferences and restaurant experiences.",
      "questions": [
        {"question": "What's your favorite restaurant in your city, and why do you think it's better than others?", "focus": "Comparatives and personal preferences", "nano_skill": [{"name": "ns.grammar.comparative_better_than", "confidence": 0.95, "reason": "Tests comparative 'better than' structure"}, {"name": "ns.speaking.preference_expression", "confidence": 0.90, "reason": "Tests expressing preferences with reasons"}], "micro_skill": [{"name": "ms.speaking.extended_response", "confidence": 0.95, "reason": "Tests ability to give full extended answers"}]},
        {"question": "Describe the worst restaurant experience you've ever had. What went wrong?", "focus": "Past tense and complaint language", "nano_skill": [{"name": "ns.grammar.superlative_worst", "confidence": 0.94, "reason": "Tests superlative 'worst'"}, {"name": "ns.grammar.present_perfect_experience", "confidence": 0.90, "reason": "Tests present perfect for life experiences"}], "micro_skill": [{"name": "ms.speaking.extended_response", "confidence": 0.94, "reason": "Tests ability to give full extended answers"}]},
        {"question": "If you could open your own restaurant, what type of cuisine would you serve and why?", "focus": "Conditional and future plans", "nano_skill": [{"name": "ns.grammar.second_conditional_could", "confidence": 0.95, "reason": "Tests second conditional 'if you could'"}, {"name": "ns.grammar.would_hypothetical_plan", "confidence": 0.90, "reason": "Tests 'would' for hypothetical plans"}], "micro_skill": [{"name": "ms.speaking.extended_response", "confidence": 0.95, "reason": "Tests ability to give full extended answers"}]},
        {"question": "How do you usually react when you receive poor service in a restaurant?", "focus": "Present habits and complaint strategies", "nano_skill": [{"name": "ns.grammar.present_simple_habits", "confidence": 0.94, "reason": "Tests present simple for habitual actions"}, {"name": "ns.vocab.complaint_strategy_vocabulary", "confidence": 0.88, "reason": "Tests complaint-related vocabulary"}], "micro_skill": [{"name": "ms.speaking.extended_response", "confidence": 0.94, "reason": "Tests ability to give full extended answers"}]},
        {"question": "What's the most expensive meal you've ever eaten? Was it worth the price?", "focus": "Superlatives and past experiences", "nano_skill": [{"name": "ns.grammar.superlative_most_expensive", "confidence": 0.95, "reason": "Tests superlative 'most expensive'"}, {"name": "ns.grammar.present_perfect_experience", "confidence": 0.90, "reason": "Tests present perfect for experiences"}], "micro_skill": [{"name": "ms.speaking.extended_response", "confidence": 0.95, "reason": "Tests ability to give full extended answers"}]},
        {"question": "Do you prefer eating at home or dining out? Give three reasons for your preference.", "focus": "Comparisons and justification", "nano_skill": [{"name": "ns.grammar.prefer_gerund_pattern", "confidence": 0.94, "reason": "Tests 'prefer + gerund' pattern"}, {"name": "ns.speaking.justification_giving", "confidence": 0.90, "reason": "Tests giving reasons and justifications"}], "micro_skill": [{"name": "ms.speaking.extended_response", "confidence": 0.94, "reason": "Tests ability to give full extended answers"}]},
        {"question": "What advice would you give to someone visiting a restaurant in your country for the first time?", "focus": "Modal verbs and cultural advice", "nano_skill": [{"name": "ns.grammar.would_give_advice", "confidence": 0.94, "reason": "Tests 'would give' for hypothetical advice"}, {"name": "ns.grammar.modal_should_advice", "confidence": 0.88, "reason": "Tests 'should' for recommendations"}], "micro_skill": [{"name": "ms.speaking.extended_response", "confidence": 0.94, "reason": "Tests ability to give full extended answers"}]},
        {"question": "How has your taste in food changed as you've gotten older?", "focus": "Present perfect and personal development", "nano_skill": [{"name": "ns.grammar.present_perfect_change", "confidence": 0.95, "reason": "Tests present perfect for change over time"}, {"name": "ns.grammar.as_time_clause", "confidence": 0.88, "reason": "Tests 'as' temporal clause"}], "micro_skill": [{"name": "ms.speaking.extended_response", "confidence": 0.95, "reason": "Tests ability to give full extended answers"}]}
      ],
      "teacher_tip": "Focus on encouraging full answers rather than just yes/no responses. Ask follow-up questions to help students elaborate and use more complex sentence structures."
    }`;

// =============== PICTURE-BASED EXERCISE VERSIONS (for Phase 2 - after image selection) ===============

export const getMultipleChoicePictureExercise = () => `    {
      "type": "multiple-choice-picture",
      "title": "Exercise X: Multiple Choice - Picture Analysis",
      "icon": "fa-check-square",
      "time": 8,
      "instructions": "Look at the image carefully and choose the best answer to each question.",
      "questions": [
        {
          "text": "What is the main focus of this picture?",
          "options": [
            {"label": "A", "text": "A person eating alone", "correct": false},
            {"label": "B", "text": "A busy restaurant scene", "correct": true},
            {"label": "C", "text": "A kitchen interior", "correct": false},
            {"label": "D", "text": "A food delivery", "correct": false}
          ],
          "nano_skill": [{"name": "ns.reading.main_idea_identification", "confidence": 0.95, "reason": "Tests ability to identify main focus of visual"}, {"name": "ns.vocab.scene_description_vocabulary", "confidence": 0.88, "reason": "Tests scene description vocabulary"}],
          "micro_skill": [{"name": "ms.reading.visual_comprehension", "confidence": 0.95, "reason": "Tests visual comprehension ability"}]
        },
        {
          "text": "How would you describe the atmosphere in this image?",
          "options": [
            {"label": "A", "text": "Quiet and empty", "correct": false},
            {"label": "B", "text": "Crowded and lively", "correct": true},
            {"label": "C", "text": "Formal and elegant", "correct": false},
            {"label": "D", "text": "Dark and gloomy", "correct": false}
          ],
          "nano_skill": [{"name": "ns.vocab.atmosphere_adjectives", "confidence": 0.94, "reason": "Tests atmosphere description adjectives"}, {"name": "ns.reading.inference_from_visual", "confidence": 0.88, "reason": "Tests inferring mood from visual cues"}],
          "micro_skill": [{"name": "ms.reading.visual_comprehension", "confidence": 0.94, "reason": "Tests visual comprehension ability"}]
        },
        {
          "text": "What type of food can you see in the picture?",
          "options": [
            {"label": "A", "text": "Only desserts", "correct": false},
            {"label": "B", "text": "Various international dishes", "correct": true},
            {"label": "C", "text": "Only breakfast items", "correct": false},
            {"label": "D", "text": "Only beverages", "correct": false}
          ],
          "nano_skill": [{"name": "ns.vocab.food_category_vocabulary", "confidence": 0.94, "reason": "Tests food category vocabulary"}, {"name": "ns.reading.detail_identification", "confidence": 0.88, "reason": "Tests identifying specific details in image"}],
          "micro_skill": [{"name": "ms.reading.visual_comprehension", "confidence": 0.94, "reason": "Tests visual comprehension ability"}]
        },
        {
          "text": "How many people are visible in this restaurant scene?",
          "options": [
            {"label": "A", "text": "None", "correct": false},
            {"label": "B", "text": "One or two", "correct": false},
            {"label": "C", "text": "Several people", "correct": true},
            {"label": "D", "text": "Only staff members", "correct": false}
          ],
          "nano_skill": [{"name": "ns.vocab.quantifier_several", "confidence": 0.93, "reason": "Tests quantifier vocabulary 'several'"}, {"name": "ns.reading.counting_in_visual", "confidence": 0.88, "reason": "Tests counting elements in image"}],
          "micro_skill": [{"name": "ms.reading.visual_comprehension", "confidence": 0.93, "reason": "Tests visual comprehension ability"}]
        },
        {
          "text": "What can you infer about the service style from the image?",
          "options": [
            {"label": "A", "text": "Self-service only", "correct": false},
            {"label": "B", "text": "Table service by waiters", "correct": true},
            {"label": "C", "text": "Takeaway only", "correct": false},
            {"label": "D", "text": "Food truck style", "correct": false}
          ],
          "nano_skill": [{"name": "ns.reading.inference_making", "confidence": 0.94, "reason": "Tests making inferences from visual evidence"}, {"name": "ns.vocab.service_style_vocabulary", "confidence": 0.88, "reason": "Tests service style vocabulary"}],
          "micro_skill": [{"name": "ms.reading.visual_comprehension", "confidence": 0.94, "reason": "Tests visual comprehension ability"}]
        },
        {
          "text": "Which best describes the restaurant's style?",
          "options": [
            {"label": "A", "text": "Fast food chain", "correct": false},
            {"label": "B", "text": "Casual dining establishment", "correct": true},
            {"label": "C", "text": "Fine dining restaurant", "correct": false},
            {"label": "D", "text": "Street food vendor", "correct": false}
          ],
          "nano_skill": [{"name": "ns.vocab.restaurant_type_vocabulary", "confidence": 0.94, "reason": "Tests restaurant type vocabulary"}, {"name": "ns.reading.categorization_from_visual", "confidence": 0.88, "reason": "Tests categorizing based on visual cues"}],
          "micro_skill": [{"name": "ms.reading.visual_comprehension", "confidence": 0.94, "reason": "Tests visual comprehension ability"}]
        },
        {
          "text": "What time of day does this picture suggest?",
          "options": [
            {"label": "A", "text": "Early morning", "correct": false},
            {"label": "B", "text": "Lunch or dinner time", "correct": true},
            {"label": "C", "text": "Late night", "correct": false},
            {"label": "D", "text": "Breakfast time", "correct": false}
          ],
          "nano_skill": [{"name": "ns.vocab.time_of_day_vocabulary", "confidence": 0.93, "reason": "Tests time of day vocabulary"}, {"name": "ns.reading.contextual_inference", "confidence": 0.88, "reason": "Tests inferring time from context"}],
          "micro_skill": [{"name": "ms.reading.visual_comprehension", "confidence": 0.93, "reason": "Tests visual comprehension ability"}]
        },
        {
          "text": "What emotion do the customers seem to be showing?",
          "options": [
            {"label": "A", "text": "Anger and frustration", "correct": false},
            {"label": "B", "text": "Enjoyment and satisfaction", "correct": true},
            {"label": "C", "text": "Boredom and disinterest", "correct": false},
            {"label": "D", "text": "Confusion and worry", "correct": false}
          ],
          "nano_skill": [{"name": "ns.vocab.emotion_vocabulary", "confidence": 0.94, "reason": "Tests emotion vocabulary"}, {"name": "ns.reading.emotion_inference", "confidence": 0.88, "reason": "Tests inferring emotions from body language"}],
          "micro_skill": [{"name": "ms.reading.visual_comprehension", "confidence": 0.94, "reason": "Tests visual comprehension ability"}]
        },
        {
          "text": "Based on the image, which statement is most accurate?",
          "options": [
            {"label": "A", "text": "The restaurant appears to be closing", "correct": false},
            {"label": "B", "text": "The restaurant is popular and busy", "correct": true},
            {"label": "C", "text": "The restaurant has poor service", "correct": false},
            {"label": "D", "text": "The restaurant serves only one type of cuisine", "correct": false}
          ],
          "nano_skill": [{"name": "ns.reading.evidence_based_conclusion", "confidence": 0.94, "reason": "Tests drawing conclusions from visual evidence"}, {"name": "ns.vocab.descriptive_statement_vocabulary", "confidence": 0.88, "reason": "Tests understanding descriptive statements"}],
          "micro_skill": [{"name": "ms.reading.visual_comprehension", "confidence": 0.94, "reason": "Tests visual comprehension ability"}]
        },
        {
          "text": "What can you see on the tables in this picture?",
          "options": [
            {"label": "A", "text": "Only empty plates", "correct": false},
            {"label": "B", "text": "Food dishes and beverages", "correct": true},
            {"label": "C", "text": "Only menus", "correct": false},
            {"label": "D", "text": "Nothing at all", "correct": false}
          ],
          "nano_skill": [{"name": "ns.reading.detail_observation", "confidence": 0.94, "reason": "Tests observing specific details in image"}, {"name": "ns.vocab.tableware_vocabulary", "confidence": 0.88, "reason": "Tests tableware and dining vocabulary"}],
          "micro_skill": [{"name": "ms.reading.visual_comprehension", "confidence": 0.94, "reason": "Tests visual comprehension ability"}]
        }
      ],
      "teacher_tip": "After choosing answers, ask students to explain WHY they selected each answer by referencing specific details they can see in the image. This develops critical thinking and descriptive language skills."
    }`;

export const getTrueFalsePictureExercise = () => `    {
      "type": "true-false-picture",
      "title": "Exercise X: True or False - Picture Analysis",
      "icon": "fa-balance-scale",
      "time": 5,
      "instructions": "Look at the image carefully and decide if each statement is true or false based on what you can see.",
      "statements": [
        {"text": "The restaurant in the picture appears to be busy with customers.", "isTrue": true, "nano_skill": [{"name": "ns.reading.visual_evidence_evaluation", "confidence": 0.95, "reason": "Tests evaluating 'busy' claim against visual"}, {"name": "ns.vocab.crowding_vocabulary", "confidence": 0.88, "reason": "Tests understanding 'busy with customers'"}], "micro_skill": [{"name": "ms.reading.visual_true_false_evaluation", "confidence": 0.95, "reason": "Tests true/false evaluation from image"}]},
        {"text": "There is no food visible on any of the tables.", "isTrue": false, "nano_skill": [{"name": "ns.reading.negative_statement_verification", "confidence": 0.94, "reason": "Tests verifying negative statement 'no food'"}, {"name": "ns.grammar.negative_quantifier_no", "confidence": 0.88, "reason": "Tests understanding of 'no' as absolute negation"}], "micro_skill": [{"name": "ms.reading.visual_true_false_evaluation", "confidence": 0.94, "reason": "Tests true/false evaluation from image"}]},
        {"text": "You can see staff members working in this restaurant.", "isTrue": true, "nano_skill": [{"name": "ns.reading.person_role_identification", "confidence": 0.93, "reason": "Tests identifying staff vs customers"}, {"name": "ns.vocab.restaurant_staff_vocabulary", "confidence": 0.88, "reason": "Tests staff-related vocabulary"}], "micro_skill": [{"name": "ms.reading.visual_true_false_evaluation", "confidence": 0.93, "reason": "Tests true/false evaluation from image"}]},
        {"text": "The restaurant looks completely empty with no people.", "isTrue": false, "nano_skill": [{"name": "ns.reading.absolute_statement_verification", "confidence": 0.94, "reason": "Tests verifying absolute 'completely empty'"}, {"name": "ns.vocab.absolute_adverb_completely", "confidence": 0.88, "reason": "Tests understanding of 'completely' as absolute"}], "micro_skill": [{"name": "ms.reading.visual_true_false_evaluation", "confidence": 0.94, "reason": "Tests true/false evaluation from image"}]},
        {"text": "There are multiple tables with customers in the image.", "isTrue": true, "nano_skill": [{"name": "ns.vocab.quantifier_multiple", "confidence": 0.94, "reason": "Tests understanding of 'multiple'"}, {"name": "ns.reading.counting_verification", "confidence": 0.88, "reason": "Tests verifying quantity claims"}], "micro_skill": [{"name": "ms.reading.visual_true_false_evaluation", "confidence": 0.94, "reason": "Tests true/false evaluation from image"}]},
        {"text": "The picture shows only the kitchen area of a restaurant.", "isTrue": false, "nano_skill": [{"name": "ns.reading.scope_limitation_only", "confidence": 0.93, "reason": "Tests recognizing false scope limitation 'only'"}, {"name": "ns.vocab.restaurant_area_vocabulary", "confidence": 0.88, "reason": "Tests kitchen vs dining area vocabulary"}], "micro_skill": [{"name": "ms.reading.visual_true_false_evaluation", "confidence": 0.93, "reason": "Tests true/false evaluation from image"}]},
        {"text": "People in the image appear to be enjoying their meals.", "isTrue": true, "nano_skill": [{"name": "ns.reading.emotion_inference_appear", "confidence": 0.93, "reason": "Tests inferring enjoyment from appearance"}, {"name": "ns.grammar.appear_to_be_pattern", "confidence": 0.88, "reason": "Tests 'appear to be' inference pattern"}], "micro_skill": [{"name": "ms.reading.visual_true_false_evaluation", "confidence": 0.93, "reason": "Tests true/false evaluation from image"}]},
        {"text": "The restaurant appears to be closed and dark.", "isTrue": false, "nano_skill": [{"name": "ns.reading.lighting_inference", "confidence": 0.93, "reason": "Tests inferring open/closed from lighting"}, {"name": "ns.vocab.lighting_adjectives", "confidence": 0.88, "reason": "Tests lighting description vocabulary"}], "micro_skill": [{"name": "ms.reading.visual_true_false_evaluation", "confidence": 0.93, "reason": "Tests true/false evaluation from image"}]},
        {"text": "You can see different types of dishes on the tables.", "isTrue": true, "nano_skill": [{"name": "ns.reading.variety_identification", "confidence": 0.93, "reason": "Tests identifying variety 'different types'"}, {"name": "ns.vocab.dish_variety_vocabulary", "confidence": 0.88, "reason": "Tests food variety vocabulary"}], "micro_skill": [{"name": "ms.reading.visual_true_false_evaluation", "confidence": 0.93, "reason": "Tests true/false evaluation from image"}]},
        {"text": "The image shows a very formal, expensive fine dining restaurant.", "isTrue": false, "nano_skill": [{"name": "ns.reading.formality_level_inference", "confidence": 0.93, "reason": "Tests distinguishing formal vs casual"}, {"name": "ns.vocab.restaurant_formality_vocabulary", "confidence": 0.88, "reason": "Tests fine dining vocabulary"}], "micro_skill": [{"name": "ms.reading.visual_true_false_evaluation", "confidence": 0.93, "reason": "Tests true/false evaluation from image"}]}
      ],
      "teacher_tip": "After completing the exercise, ask students to provide evidence from the image to support their true/false answers. This helps them practice giving detailed descriptions and justifications."
    }`;

export const getAnswerQuestionsPictureExercise = () => `    {
      "type": "answer-questions-picture",
      "title": "Exercise X: Answer Questions About the Picture",
      "icon": "fa-question-circle",
      "time": 8,
      "instructions": "Look at the image and answer these questions based on what you can see and your personal opinions.",
      "questions": [
        {"question": "Describe the atmosphere of the restaurant you see in the picture. Use at least 3 adjectives.", "focus": "Descriptive vocabulary and observation", "nano_skill": [{"name": "ns.vocab.atmosphere_adjectives", "confidence": 0.95, "reason": "Tests using multiple atmosphere adjectives"}, {"name": "ns.speaking.detailed_description", "confidence": 0.90, "reason": "Tests giving detailed descriptions"}], "micro_skill": [{"name": "ms.speaking.picture_based_response", "confidence": 0.95, "reason": "Tests responding to picture-based questions"}]},
        {"question": "What types of food can you identify in the image? Compare them to food you enjoy eating.", "focus": "Food vocabulary and comparisons", "nano_skill": [{"name": "ns.vocab.food_identification", "confidence": 0.94, "reason": "Tests identifying food types"}, {"name": "ns.grammar.comparative_structures", "confidence": 0.88, "reason": "Tests comparative language for food"}], "micro_skill": [{"name": "ms.speaking.picture_based_response", "confidence": 0.94, "reason": "Tests responding to picture-based questions"}]},
        {"question": "How many people can you see in the restaurant? What do you think they are doing?", "focus": "Present continuous and speculation", "nano_skill": [{"name": "ns.grammar.present_continuous_action", "confidence": 0.94, "reason": "Tests present continuous for ongoing actions"}, {"name": "ns.grammar.think_speculation", "confidence": 0.88, "reason": "Tests 'I think' for speculation"}], "micro_skill": [{"name": "ms.speaking.picture_based_response", "confidence": 0.94, "reason": "Tests responding to picture-based questions"}]},
        {"question": "Would you like to eat at this restaurant? Why or why not? Give specific reasons.", "focus": "Expressing preferences and justification", "nano_skill": [{"name": "ns.grammar.would_like_preference", "confidence": 0.94, "reason": "Tests 'would like' for preferences"}, {"name": "ns.speaking.reason_giving", "confidence": 0.88, "reason": "Tests giving reasons for opinions"}], "micro_skill": [{"name": "ms.speaking.picture_based_response", "confidence": 0.94, "reason": "Tests responding to picture-based questions"}]},
        {"question": "Compare this restaurant to your favorite restaurant. What's similar and what's different?", "focus": "Comparatives and contrasts", "nano_skill": [{"name": "ns.grammar.comparative_similar_different", "confidence": 0.94, "reason": "Tests 'similar to' and 'different from'"}, {"name": "ns.speaking.comparison_structure", "confidence": 0.88, "reason": "Tests structured comparison"}], "micro_skill": [{"name": "ms.speaking.picture_based_response", "confidence": 0.94, "reason": "Tests responding to picture-based questions"}]},
        {"question": "What can you say about the service style based on what you see in the picture?", "focus": "Inference and deduction", "nano_skill": [{"name": "ns.reading.visual_inference", "confidence": 0.93, "reason": "Tests making inferences from image"}, {"name": "ns.vocab.service_style_vocabulary", "confidence": 0.88, "reason": "Tests service style vocabulary"}], "micro_skill": [{"name": "ms.speaking.picture_based_response", "confidence": 0.93, "reason": "Tests responding to picture-based questions"}]},
        {"question": "Imagine you are eating at this restaurant. What would you order and why?", "focus": "Hypothetical situations and food vocabulary", "nano_skill": [{"name": "ns.grammar.second_conditional_imagine", "confidence": 0.94, "reason": "Tests hypothetical with 'imagine'"}, {"name": "ns.grammar.would_hypothetical", "confidence": 0.88, "reason": "Tests 'would' for hypothetical actions"}], "micro_skill": [{"name": "ms.speaking.picture_based_response", "confidence": 0.94, "reason": "Tests responding to picture-based questions"}]},
        {"question": "What time of day do you think this picture was taken? What details make you think that?", "focus": "Evidence-based reasoning", "nano_skill": [{"name": "ns.reading.evidence_based_reasoning", "confidence": 0.93, "reason": "Tests supporting opinion with evidence"}, {"name": "ns.grammar.make_you_think_pattern", "confidence": 0.88, "reason": "Tests 'make you think' causative pattern"}], "micro_skill": [{"name": "ms.speaking.picture_based_response", "confidence": 0.93, "reason": "Tests responding to picture-based questions"}]},
        {"question": "How does the restaurant in the picture compare to typical restaurants in your country?", "focus": "Cultural comparison and description", "nano_skill": [{"name": "ns.grammar.comparative_structures", "confidence": 0.93, "reason": "Tests comparative for cultural comparison"}, {"name": "ns.speaking.cultural_comparison", "confidence": 0.88, "reason": "Tests cultural comparison skills"}], "micro_skill": [{"name": "ms.speaking.picture_based_response", "confidence": 0.93, "reason": "Tests responding to picture-based questions"}]},
        {"question": "If you were the manager of this restaurant, what would you improve and what would you keep the same?", "focus": "Conditional and critical thinking", "nano_skill": [{"name": "ns.grammar.second_conditional_if_were", "confidence": 0.94, "reason": "Tests second conditional 'if you were'"}, {"name": "ns.speaking.suggestion_giving", "confidence": 0.88, "reason": "Tests giving improvement suggestions"}], "micro_skill": [{"name": "ms.speaking.picture_based_response", "confidence": 0.94, "reason": "Tests responding to picture-based questions"}]}
      ],
      "teacher_tip": "Encourage students to refer directly to specific visual details in the picture when answering. This develops their ability to provide evidence and detailed descriptions in English."
    }`;

export const getVocabularySheet = () => `  "vocabulary_sheet": [
    {"term": "Appetizer", "meaning": "A small dish served before the main meal to stimulate the appetite."},
    {"term": "Main course", "meaning": "The primary or largest dish in a meal."},
    {"term": "Dessert", "meaning": "A sweet course served at the end of a meal."},
    {"term": "Beverage", "meaning": "A drink, especially one other than water."},
    {"term": "Reservation", "meaning": "An arrangement to have a table kept for you at a restaurant."},
    {"term": "Waiter / Waitress", "meaning": "A person who serves customers in a restaurant."},
    {"term": "Menu", "meaning": "A list of dishes available at a restaurant."},
    {"term": "Order", "meaning": "A request for food or drink in a restaurant."},
    {"term": "Complaint", "meaning": "An expression of dissatisfaction about food or service."},
    {"term": "Wrong order", "meaning": "When the dish served is not what the customer requested."},
    {"term": "Overcooked", "meaning": "Food that has been cooked for too long and is ruined."},
    {"term": "Undercooked", "meaning": "Food that has not been cooked enough."},
    {"term": "Allergy", "meaning": "A harmful reaction to certain foods or ingredients."},
    {"term": "Bill / Check", "meaning": "A statement of the money owed for the meal."},
    {"term": "Tip", "meaning": "An extra amount of money given to the waiter as a thank you for good service."}
  ]`;

// =============== AUDIO-BASED EXERCISE VERSIONS ===============

export const getListeningComprehensionExercise = () => `    {
      "type": "listening-comprehension",
      "title": "Exercise X: Listening Comprehension",
      "icon": "fa-headphones",
      "time": 12,
      "instructions": "Listen to the audio carefully and answer the following questions based on what you hear.",
      "audio_url": null,
      "questions": [
        {"text": "What is the main topic or situation in the audio?", "answer": "The audio discusses [specific topic], where [main situation/event].", "nano_skill": [{"name": "ns.listening.main_idea_identification", "confidence": 0.96, "reason": "Tests identifying main topic from audio"}, {"name": "ns.listening.gist_comprehension", "confidence": 0.90, "reason": "Tests grasping overall situation"}], "micro_skill": [{"name": "ms.listening.audio_comprehension", "confidence": 0.96, "reason": "Tests audio comprehension ability"}]},
        {"text": "Who are the speakers in the audio? What are their roles or relationships?", "answer": "The speakers are [description of speakers and their relationship].", "nano_skill": [{"name": "ns.listening.speaker_identification", "confidence": 0.95, "reason": "Tests identifying who is speaking"}, {"name": "ns.listening.relationship_inference", "confidence": 0.88, "reason": "Tests inferring speaker relationships"}], "micro_skill": [{"name": "ms.listening.audio_comprehension", "confidence": 0.95, "reason": "Tests audio comprehension ability"}]},
        {"text": "What specific details or facts are mentioned in the audio?", "answer": "[Specific details from audio: numbers, names, places, times].", "nano_skill": [{"name": "ns.listening.specific_detail_extraction", "confidence": 0.95, "reason": "Tests extracting specific facts"}, {"name": "ns.listening.number_name_recognition", "confidence": 0.88, "reason": "Tests recognizing numbers, names, places"}], "micro_skill": [{"name": "ms.listening.audio_comprehension", "confidence": 0.95, "reason": "Tests audio comprehension ability"}]},
        {"text": "What problem or challenge is discussed, and how is it addressed?", "answer": "The problem is [description], and it is addressed by [solution/approach].", "nano_skill": [{"name": "ns.listening.problem_identification", "confidence": 0.94, "reason": "Tests identifying problems discussed"}, {"name": "ns.listening.solution_recognition", "confidence": 0.88, "reason": "Tests recognizing proposed solutions"}], "micro_skill": [{"name": "ms.listening.audio_comprehension", "confidence": 0.94, "reason": "Tests audio comprehension ability"}]},
        {"text": "What is the tone or mood of the audio? (formal/informal, serious/casual, etc.)", "answer": "The tone is [description of tone/mood].", "nano_skill": [{"name": "ns.listening.tone_recognition", "confidence": 0.93, "reason": "Tests recognizing formal vs informal tone"}, {"name": "ns.listening.mood_inference", "confidence": 0.88, "reason": "Tests inferring speaker mood"}], "micro_skill": [{"name": "ms.listening.audio_comprehension", "confidence": 0.93, "reason": "Tests audio comprehension ability"}]},
        {"text": "What happens at the beginning, middle, and end of the audio?", "answer": "Beginning: [description]. Middle: [description]. End: [description].", "nano_skill": [{"name": "ns.listening.sequence_tracking", "confidence": 0.94, "reason": "Tests following event sequence"}, {"name": "ns.listening.narrative_structure", "confidence": 0.88, "reason": "Tests understanding beginning/middle/end"}], "micro_skill": [{"name": "ms.listening.audio_comprehension", "confidence": 0.94, "reason": "Tests audio comprehension ability"}]},
        {"text": "What opinions or suggestions are given by the speakers?", "answer": "[Opinions/suggestions mentioned in audio].", "nano_skill": [{"name": "ns.listening.opinion_recognition", "confidence": 0.93, "reason": "Tests distinguishing opinion from fact"}, {"name": "ns.listening.suggestion_identification", "confidence": 0.88, "reason": "Tests identifying suggestions"}], "micro_skill": [{"name": "ms.listening.audio_comprehension", "confidence": 0.93, "reason": "Tests audio comprehension ability"}]},
        {"text": "What cultural or contextual information can you infer from the audio?", "answer": "[Cultural/contextual details that can be inferred].", "nano_skill": [{"name": "ns.listening.cultural_inference", "confidence": 0.92, "reason": "Tests inferring cultural context"}, {"name": "ns.listening.contextual_clue_recognition", "confidence": 0.88, "reason": "Tests recognizing contextual clues"}], "micro_skill": [{"name": "ms.listening.audio_comprehension", "confidence": 0.92, "reason": "Tests audio comprehension ability"}]},
        {"text": "What emotions do the speakers express during the conversation?", "answer": "[Emotions and feelings expressed by speakers].", "nano_skill": [{"name": "ns.listening.emotion_recognition", "confidence": 0.93, "reason": "Tests recognizing emotions in speech"}, {"name": "ns.listening.intonation_interpretation", "confidence": 0.88, "reason": "Tests interpreting emotional intonation"}], "micro_skill": [{"name": "ms.listening.audio_comprehension", "confidence": 0.93, "reason": "Tests audio comprehension ability"}]},
        {"text": "What is the outcome or conclusion of the audio scenario?", "answer": "[Final outcome or resolution mentioned in audio].", "nano_skill": [{"name": "ns.listening.conclusion_identification", "confidence": 0.94, "reason": "Tests identifying final outcome"}, {"name": "ns.listening.resolution_recognition", "confidence": 0.88, "reason": "Tests recognizing resolution"}], "micro_skill": [{"name": "ms.listening.audio_comprehension", "confidence": 0.94, "reason": "Tests audio comprehension ability"}]}
      ],
      "teacher_tip": "Play the audio 2-3 times. First time: general understanding. Second time: focus on details. Third time: verification of answers. Encourage students to take notes while listening."
    }`;

export const getMultipleChoiceAudioExercise = () => `    {
      "type": "multiple-choice-audio",
      "title": "Exercise X: Multiple Choice - Audio Analysis",
      "icon": "fa-check-square",
      "time": 10,
      "instructions": "Listen to the audio and choose the best answer to each question.",
      "audio_url": null,
      "questions": [
        {
          "text": "What is the main purpose of this audio?",
          "options": [
            {"label": "A", "text": "To give information", "correct": true},
            {"label": "B", "text": "To entertain", "correct": false},
            {"label": "C", "text": "To complain", "correct": false},
            {"label": "D", "text": "To persuade", "correct": false}
          ],
          "nano_skill": [{"name": "ns.listening.purpose_identification", "confidence": 0.96, "reason": "Tests identifying speaker's main purpose"}, {"name": "ns.listening.communicative_function", "confidence": 0.90, "reason": "Tests distinguishing inform vs entertain vs persuade"}],
          "micro_skill": [{"name": "ms.listening.audio_multiple_choice", "confidence": 0.96, "reason": "Tests audio-based multiple choice ability"}]
        },
        {
          "text": "Where does this conversation most likely take place?",
          "options": [
            {"label": "A", "text": "At home", "correct": false},
            {"label": "B", "text": "At a restaurant", "correct": true},
            {"label": "C", "text": "At a school", "correct": false},
            {"label": "D", "text": "At an office", "correct": false}
          ],
          "nano_skill": [{"name": "ns.listening.setting_inference", "confidence": 0.95, "reason": "Tests inferring location from audio cues"}, {"name": "ns.listening.contextual_vocabulary", "confidence": 0.88, "reason": "Tests recognizing location-specific vocabulary"}],
          "micro_skill": [{"name": "ms.listening.audio_multiple_choice", "confidence": 0.95, "reason": "Tests audio-based multiple choice ability"}]
        },
        {
          "text": "What time is mentioned in the audio?",
          "options": [
            {"label": "A", "text": "Morning", "correct": false},
            {"label": "B", "text": "Afternoon", "correct": true},
            {"label": "C", "text": "Evening", "correct": false},
            {"label": "D", "text": "Night", "correct": false}
          ],
          "nano_skill": [{"name": "ns.listening.time_reference_extraction", "confidence": 0.95, "reason": "Tests extracting time references from audio"}, {"name": "ns.vocab.time_of_day_vocabulary", "confidence": 0.88, "reason": "Tests time-related vocabulary recognition"}],
          "micro_skill": [{"name": "ms.listening.audio_multiple_choice", "confidence": 0.95, "reason": "Tests audio-based multiple choice ability"}]
        },
        {
          "text": "How does the speaker feel about the situation?",
          "options": [
            {"label": "A", "text": "Angry", "correct": false},
            {"label": "B", "text": "Happy", "correct": false},
            {"label": "C", "text": "Concerned", "correct": true},
            {"label": "D", "text": "Indifferent", "correct": false}
          ],
          "nano_skill": [{"name": "ns.listening.emotion_inference", "confidence": 0.94, "reason": "Tests inferring speaker emotion from voice"}, {"name": "ns.listening.tone_interpretation", "confidence": 0.88, "reason": "Tests interpreting emotional tone"}],
          "micro_skill": [{"name": "ms.listening.audio_multiple_choice", "confidence": 0.94, "reason": "Tests audio-based multiple choice ability"}]
        },
        {
          "text": "What specific detail is mentioned about the topic?",
          "options": [
            {"label": "A", "text": "Detail A", "correct": true},
            {"label": "B", "text": "Detail B", "correct": false},
            {"label": "C", "text": "Detail C", "correct": false},
            {"label": "D", "text": "Detail D", "correct": false}
          ],
          "nano_skill": [{"name": "ns.listening.specific_detail_recognition", "confidence": 0.94, "reason": "Tests recognizing specific details in audio"}, {"name": "ns.listening.fact_extraction", "confidence": 0.88, "reason": "Tests extracting factual information"}],
          "micro_skill": [{"name": "ms.listening.audio_multiple_choice", "confidence": 0.94, "reason": "Tests audio-based multiple choice ability"}]
        },
        {
          "text": "What does the speaker plan to do next?",
          "options": [
            {"label": "A", "text": "Option A", "correct": false},
            {"label": "B", "text": "Option B", "correct": false},
            {"label": "C", "text": "Option C", "correct": true},
            {"label": "D", "text": "Option D", "correct": false}
          ],
          "nano_skill": [{"name": "ns.listening.future_action_inference", "confidence": 0.93, "reason": "Tests inferring planned future actions"}, {"name": "ns.grammar.future_intention_recognition", "confidence": 0.88, "reason": "Tests recognizing future intention markers"}],
          "micro_skill": [{"name": "ms.listening.audio_multiple_choice", "confidence": 0.93, "reason": "Tests audio-based multiple choice ability"}]
        },
        {
          "text": "What tone does the speaker use?",
          "options": [
            {"label": "A", "text": "Aggressive", "correct": false},
            {"label": "B", "text": "Polite but firm", "correct": true},
            {"label": "C", "text": "Sarcastic", "correct": false},
            {"label": "D", "text": "Apologetic", "correct": false}
          ],
          "nano_skill": [{"name": "ns.listening.tone_classification", "confidence": 0.94, "reason": "Tests classifying speaker's tone"}, {"name": "ns.listening.register_recognition", "confidence": 0.88, "reason": "Tests recognizing formal/informal register"}],
          "micro_skill": [{"name": "ms.listening.audio_multiple_choice", "confidence": 0.94, "reason": "Tests audio-based multiple choice ability"}]
        },
        {
          "text": "What specific information is mentioned?",
          "options": [
            {"label": "A", "text": "Information A", "correct": false},
            {"label": "B", "text": "Information B", "correct": true},
            {"label": "C", "text": "Information C", "correct": false},
            {"label": "D", "text": "Information D", "correct": false}
          ],
          "nano_skill": [{"name": "ns.listening.information_extraction", "confidence": 0.93, "reason": "Tests extracting key information"}, {"name": "ns.listening.fact_recall", "confidence": 0.88, "reason": "Tests recalling specific facts"}],
          "micro_skill": [{"name": "ms.listening.audio_multiple_choice", "confidence": 0.93, "reason": "Tests audio-based multiple choice ability"}]
        },
        {
          "text": "Who initiates the conversation in the audio?",
          "options": [
            {"label": "A", "text": "Person A", "correct": true},
            {"label": "B", "text": "Person B", "correct": false},
            {"label": "C", "text": "Person C", "correct": false},
            {"label": "D", "text": "Person D", "correct": false}
          ],
          "nano_skill": [{"name": "ns.listening.conversation_initiation", "confidence": 0.93, "reason": "Tests identifying who starts conversation"}, {"name": "ns.listening.speaker_turn_tracking", "confidence": 0.88, "reason": "Tests tracking speaker turns"}],
          "micro_skill": [{"name": "ms.listening.audio_multiple_choice", "confidence": 0.93, "reason": "Tests audio-based multiple choice ability"}]
        },
        {
          "text": "What is the relationship between the speakers?",
          "options": [
            {"label": "A", "text": "Friends", "correct": false},
            {"label": "B", "text": "Colleagues", "correct": false},
            {"label": "C", "text": "Service provider and customer", "correct": true},
            {"label": "D", "text": "Family members", "correct": false}
          ],
          "nano_skill": [{"name": "ns.listening.relationship_inference", "confidence": 0.94, "reason": "Tests inferring speaker relationship"}, {"name": "ns.listening.social_context_recognition", "confidence": 0.88, "reason": "Tests recognizing social context"}],
          "micro_skill": [{"name": "ms.listening.audio_multiple_choice", "confidence": 0.94, "reason": "Tests audio-based multiple choice ability"}]
        }
      ],
      "teacher_tip": "After choosing answers, ask students to explain WHY they selected each answer by referencing specific words or phrases they heard in the audio."
    }`;

export const getTrueFalseAudioExercise = () => `    {
      "type": "true-false-audio",
      "title": "Exercise X: True or False - Audio Analysis",
      "icon": "fa-balance-scale",
      "time": 6,
      "instructions": "Listen to the audio carefully and decide if each statement is true or false based on what you hear.",
      "audio_url": null,
      "statements": [
        {"text": "The speakers mention a specific time in the audio.", "isTrue": true, "nano_skill": [{"name": "ns.listening.time_mention_detection", "confidence": 0.95, "reason": "Tests detecting time references in audio"}, {"name": "ns.listening.specific_detail_verification", "confidence": 0.88, "reason": "Tests verifying presence of specific details"}], "micro_skill": [{"name": "ms.listening.audio_true_false_evaluation", "confidence": 0.95, "reason": "Tests true/false evaluation from audio"}]},
        {"text": "The conversation takes place in the morning.", "isTrue": false, "nano_skill": [{"name": "ns.listening.time_of_day_inference", "confidence": 0.94, "reason": "Tests inferring time of day from context"}, {"name": "ns.listening.contextual_time_markers", "confidence": 0.88, "reason": "Tests recognizing time markers"}], "micro_skill": [{"name": "ms.listening.audio_true_false_evaluation", "confidence": 0.94, "reason": "Tests true/false evaluation from audio"}]},
        {"text": "One of the speakers expresses dissatisfaction.", "isTrue": true, "nano_skill": [{"name": "ns.listening.emotion_detection", "confidence": 0.94, "reason": "Tests detecting dissatisfaction in voice"}, {"name": "ns.listening.negative_sentiment_recognition", "confidence": 0.88, "reason": "Tests recognizing negative sentiment"}], "micro_skill": [{"name": "ms.listening.audio_true_false_evaluation", "confidence": 0.94, "reason": "Tests true/false evaluation from audio"}]},
        {"text": "The audio mentions a price or cost.", "isTrue": true, "nano_skill": [{"name": "ns.listening.number_price_detection", "confidence": 0.95, "reason": "Tests detecting price/cost mentions"}, {"name": "ns.vocab.money_vocabulary_recognition", "confidence": 0.88, "reason": "Tests recognizing financial vocabulary"}], "micro_skill": [{"name": "ms.listening.audio_true_false_evaluation", "confidence": 0.95, "reason": "Tests true/false evaluation from audio"}]},
        {"text": "The speakers are planning to leave immediately.", "isTrue": false, "nano_skill": [{"name": "ns.listening.time_adverb_interpretation", "confidence": 0.93, "reason": "Tests interpreting 'immediately' claim"}, {"name": "ns.listening.future_plan_verification", "confidence": 0.88, "reason": "Tests verifying future plans"}], "micro_skill": [{"name": "ms.listening.audio_true_false_evaluation", "confidence": 0.93, "reason": "Tests true/false evaluation from audio"}]},
        {"text": "The audio includes a discussion about quality.", "isTrue": true, "nano_skill": [{"name": "ns.listening.topic_identification", "confidence": 0.93, "reason": "Tests identifying quality as topic"}, {"name": "ns.vocab.quality_vocabulary_recognition", "confidence": 0.88, "reason": "Tests recognizing quality-related words"}], "micro_skill": [{"name": "ms.listening.audio_true_false_evaluation", "confidence": 0.93, "reason": "Tests true/false evaluation from audio"}]},
        {"text": "The speakers sound angry and aggressive.", "isTrue": false, "nano_skill": [{"name": "ns.listening.emotion_intensity_evaluation", "confidence": 0.94, "reason": "Tests evaluating 'angry and aggressive' claim"}, {"name": "ns.listening.tone_analysis", "confidence": 0.88, "reason": "Tests analyzing speaker tone"}], "micro_skill": [{"name": "ms.listening.audio_true_false_evaluation", "confidence": 0.94, "reason": "Tests true/false evaluation from audio"}]},
        {"text": "A specific location or place is mentioned.", "isTrue": true, "nano_skill": [{"name": "ns.listening.place_mention_detection", "confidence": 0.94, "reason": "Tests detecting location mentions"}, {"name": "ns.vocab.place_vocabulary_recognition", "confidence": 0.88, "reason": "Tests recognizing place vocabulary"}], "micro_skill": [{"name": "ms.listening.audio_true_false_evaluation", "confidence": 0.94, "reason": "Tests true/false evaluation from audio"}]},
        {"text": "The speakers agree on everything discussed.", "isTrue": false, "nano_skill": [{"name": "ns.listening.agreement_disagreement_detection", "confidence": 0.93, "reason": "Tests detecting agreement/disagreement"}, {"name": "ns.listening.absolute_claim_verification", "confidence": 0.88, "reason": "Tests verifying 'everything' claim"}], "micro_skill": [{"name": "ms.listening.audio_true_false_evaluation", "confidence": 0.93, "reason": "Tests true/false evaluation from audio"}]},
        {"text": "The audio ends with a clear resolution.", "isTrue": true, "nano_skill": [{"name": "ns.listening.conversation_conclusion_identification", "confidence": 0.93, "reason": "Tests identifying conversation resolution"}, {"name": "ns.listening.narrative_closure_recognition", "confidence": 0.88, "reason": "Tests recognizing narrative closure"}], "micro_skill": [{"name": "ms.listening.audio_true_false_evaluation", "confidence": 0.93, "reason": "Tests true/false evaluation from audio"}]}
      ],
      "teacher_tip": "After completing the exercise, ask students to provide evidence from the audio to support their true/false answers. This helps them practice active listening and justification."
    }`;

export const getFillInBlanksAudioExercise = () => `    {
      "type": "fill-in-blanks-audio",
      "title": "Exercise X: Fill in the Blanks - Audio Dictation",
      "icon": "fa-pencil-alt",
      "time": 10,
      "instructions": "Listen to the audio and complete the sentences below with the missing words you hear.",
      "sentences": [
        {"text": "Welcome to _______ Restaurant.", "answer": "Mario's", "nano_skill": [{"name": "ns.listening.proper_noun_recognition", "confidence": 0.95, "reason": "Tests recognizing proper noun from audio"}, {"name": "ns.listening.dictation_accuracy", "confidence": 0.88, "reason": "Tests accurate word transcription"}], "micro_skill": [{"name": "ms.listening.audio_dictation", "confidence": 0.95, "reason": "Tests audio dictation ability"}]},
        {"text": "I'm _______ and I'll be your _______ today.", "answer": "Jennifer", "nano_skill": [{"name": "ns.listening.name_recognition", "confidence": 0.94, "reason": "Tests recognizing names from audio"}, {"name": "ns.listening.introduction_phrases", "confidence": 0.88, "reason": "Tests understanding introduction patterns"}], "micro_skill": [{"name": "ms.listening.audio_dictation", "confidence": 0.94, "reason": "Tests audio dictation ability"}]},
        {"text": "Can I start you off with something to _______?", "answer": "drink", "nano_skill": [{"name": "ns.listening.service_phrase_completion", "confidence": 0.94, "reason": "Tests completing common service phrases"}, {"name": "ns.vocab.restaurant_service_vocabulary", "confidence": 0.88, "reason": "Tests restaurant vocabulary"}], "micro_skill": [{"name": "ms.listening.audio_dictation", "confidence": 0.94, "reason": "Tests audio dictation ability"}]},
        {"text": "We have some _______ specials today.", "answer": "excellent", "nano_skill": [{"name": "ns.listening.adjective_recognition", "confidence": 0.93, "reason": "Tests recognizing descriptive adjectives"}, {"name": "ns.vocab.positive_adjective_vocabulary", "confidence": 0.88, "reason": "Tests positive descriptor vocabulary"}], "micro_skill": [{"name": "ms.listening.audio_dictation", "confidence": 0.93, "reason": "Tests audio dictation ability"}]},
        {"text": "The chef _______ the grilled salmon.", "answer": "recommends", "nano_skill": [{"name": "ns.listening.verb_form_recognition", "confidence": 0.94, "reason": "Tests recognizing verb forms from audio"}, {"name": "ns.grammar.third_person_singular_s", "confidence": 0.88, "reason": "Tests recognizing 3rd person -s ending"}], "micro_skill": [{"name": "ms.listening.audio_dictation", "confidence": 0.94, "reason": "Tests audio dictation ability"}]},
        {"text": "It comes with _______ vegetables.", "answer": "seasonal", "nano_skill": [{"name": "ns.listening.adjective_recognition", "confidence": 0.93, "reason": "Tests recognizing adjectives from audio"}, {"name": "ns.vocab.food_description_vocabulary", "confidence": 0.88, "reason": "Tests food description vocabulary"}], "micro_skill": [{"name": "ms.listening.audio_dictation", "confidence": 0.93, "reason": "Tests audio dictation ability"}]},
        {"text": "This dish is _______ popular with our guests.", "answer": "very", "nano_skill": [{"name": "ns.listening.intensifier_recognition", "confidence": 0.94, "reason": "Tests recognizing intensifier 'very'"}, {"name": "ns.grammar.adverb_of_degree", "confidence": 0.88, "reason": "Tests understanding degree adverbs"}], "micro_skill": [{"name": "ms.listening.audio_dictation", "confidence": 0.94, "reason": "Tests audio dictation ability"}]},
        {"text": "Would you like to _______ our dessert menu?", "answer": "see", "nano_skill": [{"name": "ns.listening.infinitive_verb_recognition", "confidence": 0.93, "reason": "Tests recognizing infinitive verbs"}, {"name": "ns.grammar.would_like_to_pattern", "confidence": 0.88, "reason": "Tests 'would like to' pattern completion"}], "micro_skill": [{"name": "ms.listening.audio_dictation", "confidence": 0.93, "reason": "Tests audio dictation ability"}]},
        {"text": "Or would you _______ to order now?", "answer": "like", "nano_skill": [{"name": "ns.listening.modal_pattern_completion", "confidence": 0.93, "reason": "Tests completing modal patterns"}, {"name": "ns.grammar.would_you_like_pattern", "confidence": 0.88, "reason": "Tests 'would you like' pattern"}], "micro_skill": [{"name": "ms.listening.audio_dictation", "confidence": 0.93, "reason": "Tests audio dictation ability"}]},
        {"text": "I can also bring you some _______ water.", "answer": "cold", "nano_skill": [{"name": "ns.listening.adjective_recognition", "confidence": 0.93, "reason": "Tests recognizing common adjectives"}, {"name": "ns.vocab.temperature_adjective", "confidence": 0.88, "reason": "Tests temperature vocabulary"}], "micro_skill": [{"name": "ms.listening.audio_dictation", "confidence": 0.93, "reason": "Tests audio dictation ability"}]}
      ],
      "word_bank": ["Mario's", "Jennifer", "server", "drink", "excellent", "recommends", "seasonal", "very", "see", "like", "cold"],
      "teacher_tip": "CRITICAL: Use EXACT structure matching basic fill-in-blanks exercise - 'sentences' array with 'text' and 'answer' fields, plus 'word_bank' array. Each sentence has ONE blank (represented by _______). Extract key vocabulary from audio transcript. DO NOT use 'full_transcript' or 'transcript_with_blanks' fields."
    }`;

export const getAnswerQuestionsAudioExercise = () => `    {
      "type": "answer-questions-audio",
      "title": "Exercise X: Answer Questions About the Audio",
      "icon": "fa-question-circle",
      "time": 10,
      "instructions": "Listen to the audio and answer these questions based on what you hear and your personal opinions.",
      "audio_url": null,
      "questions": [
        {"question": "Describe the main situation or event you hear in the audio. What is happening?", "focus": "Comprehension and summary", "nano_skill": [{"name": "ns.listening.main_idea_summary", "confidence": 0.95, "reason": "Tests summarizing main audio content"}, {"name": "ns.speaking.event_description", "confidence": 0.88, "reason": "Tests describing events clearly"}], "micro_skill": [{"name": "ms.listening.audio_response", "confidence": 0.95, "reason": "Tests responding to audio-based questions"}]},
        {"question": "What emotions or attitudes do you hear in the speakers' voices? How can you tell?", "focus": "Tone analysis and inference", "nano_skill": [{"name": "ns.listening.emotion_analysis", "confidence": 0.94, "reason": "Tests analyzing emotions in speech"}, {"name": "ns.listening.evidence_citing", "confidence": 0.88, "reason": "Tests citing evidence for analysis"}], "micro_skill": [{"name": "ms.listening.audio_response", "confidence": 0.94, "reason": "Tests responding to audio-based questions"}]},
        {"question": "What specific words or phrases stood out to you? Why?", "focus": "Vocabulary and attention to detail", "nano_skill": [{"name": "ns.listening.salient_vocabulary_identification", "confidence": 0.93, "reason": "Tests identifying notable vocabulary"}, {"name": "ns.speaking.justification_giving", "confidence": 0.88, "reason": "Tests explaining vocabulary choices"}], "micro_skill": [{"name": "ms.listening.audio_response", "confidence": 0.93, "reason": "Tests responding to audio-based questions"}]},
        {"question": "If you were in this situation, how would you respond? What would you say?", "focus": "Personal application and speaking practice", "nano_skill": [{"name": "ns.grammar.second_conditional_application", "confidence": 0.94, "reason": "Tests 'if I were' hypothetical"}, {"name": "ns.speaking.situational_response", "confidence": 0.88, "reason": "Tests providing situational responses"}], "micro_skill": [{"name": "ms.listening.audio_response", "confidence": 0.94, "reason": "Tests responding to audio-based questions"}]},
        {"question": "Compare this situation to a similar experience you've had. What's similar or different?", "focus": "Personal connection and comparison", "nano_skill": [{"name": "ns.grammar.comparative_similar_different", "confidence": 0.93, "reason": "Tests 'similar to' and 'different from'"}, {"name": "ns.speaking.personal_experience_connection", "confidence": 0.88, "reason": "Tests connecting to personal experience"}], "micro_skill": [{"name": "ms.listening.audio_response", "confidence": 0.93, "reason": "Tests responding to audio-based questions"}]},
        {"question": "What cultural insights can you gain from this audio? How might this situation differ in your country?", "focus": "Cultural awareness", "nano_skill": [{"name": "ns.listening.cultural_inference", "confidence": 0.92, "reason": "Tests inferring cultural elements"}, {"name": "ns.speaking.cross_cultural_comparison", "confidence": 0.88, "reason": "Tests cross-cultural comparison"}], "micro_skill": [{"name": "ms.listening.audio_response", "confidence": 0.92, "reason": "Tests responding to audio-based questions"}]},
        {"question": "What do you think happens after the audio ends? Predict the next part of the conversation.", "focus": "Prediction and creative thinking", "nano_skill": [{"name": "ns.listening.prediction_from_context", "confidence": 0.93, "reason": "Tests predicting based on context"}, {"name": "ns.grammar.future_tense_prediction", "confidence": 0.88, "reason": "Tests using future forms for prediction"}], "micro_skill": [{"name": "ms.listening.audio_response", "confidence": 0.93, "reason": "Tests responding to audio-based questions"}]},
        {"question": "What advice would you give to the speakers in this situation?", "focus": "Critical thinking and modal verbs", "nano_skill": [{"name": "ns.grammar.modal_advice_should_could", "confidence": 0.94, "reason": "Tests using modals for advice"}, {"name": "ns.speaking.advice_giving", "confidence": 0.88, "reason": "Tests giving appropriate advice"}], "micro_skill": [{"name": "ms.listening.audio_response", "confidence": 0.94, "reason": "Tests responding to audio-based questions"}]},
        {"question": "What is the most important piece of information you learned from the audio?", "focus": "Main idea identification", "nano_skill": [{"name": "ns.listening.key_information_prioritization", "confidence": 0.94, "reason": "Tests identifying most important info"}, {"name": "ns.speaking.importance_justification", "confidence": 0.88, "reason": "Tests justifying importance claims"}], "micro_skill": [{"name": "ms.listening.audio_response", "confidence": 0.94, "reason": "Tests responding to audio-based questions"}]},
        {"question": "How would you describe the relationship between the speakers based on their language and tone?", "focus": "Relationship analysis and pragmatics", "nano_skill": [{"name": "ns.listening.relationship_analysis", "confidence": 0.93, "reason": "Tests analyzing speaker relationship"}, {"name": "ns.listening.pragmatic_awareness", "confidence": 0.88, "reason": "Tests understanding pragmatic cues"}], "micro_skill": [{"name": "ms.listening.audio_response", "confidence": 0.93, "reason": "Tests responding to audio-based questions"}]}
      ],
      "teacher_tip": "Encourage students to refer directly to specific words and phrases they heard in the audio when answering. This develops their ability to provide evidence and detailed responses."
    }`;

// Exercise type to function mapping for easy selection - UPDATED WITH AUDIO EXERCISES
export const exerciseFunctions = {
  reading: getReadingExercise,
  "true-false": getTrueFalseExercise,
  matching: getMatchingExercise,
  "fill-in-blanks": getFillInBlanksExercise,
  "multiple-choice": getMultipleChoiceExercise,
  dialogue: getDialogueExercise,
  discussion: getDiscussionExercise,
  "error-correction": getErrorCorrectionExercise,
  "odd-one-out": getOddOneOutExercise,
  synonyms: getSynonymsExercise,
  antonyms: getAntonymsExercise,
  "synonyms-antonyms": getSynonymsAntonymsExercise,
  "sentence-transformation": getSentenceTransformationExercise,
  "word-order": getWordOrderExercise,
  "gap-text": getGapTextExercise,
  "negative-prefixes": getNegativePrefixesExercise,
  categorize: getCategorizeExercise,
  paraphrasing: getParaphrasingExercise,
  "complete-word": getCompleteWordExercise,
  "matching-halves": getMatchingHalvesExercise,
  "describe-picture": getDescribePictureExercise,
  "answer-questions": getAnswerQuestionsExercise,
  "multiple-choice-picture": getMultipleChoicePictureExercise,
  "true-false-picture": getTrueFalsePictureExercise,
  "answer-questions-picture": getAnswerQuestionsPictureExercise,
  // NEW: Audio exercises
  "listening-comprehension": getListeningComprehensionExercise,
  "multiple-choice-audio": getMultipleChoiceAudioExercise,
  "true-false-audio": getTrueFalseAudioExercise,
  "fill-in-blanks-audio": getFillInBlanksAudioExercise,
  "answer-questions-audio": getAnswerQuestionsAudioExercise,
};

export const exerciseOrder = [
  "reading",
  "true-false",
  "matching",
  "fill-in-blanks",
  "multiple-choice",
  "dialogue",
  "discussion",
  "error-correction",
  "odd-one-out",
  "synonyms",
  "antonyms",
  "synonyms-antonyms",
  "sentence-transformation",
  "word-order",
  "gap-text",
  "negative-prefixes",
  "categorize",
  "paraphrasing",
  "complete-word",
  "matching-halves",
  "describe-picture",
  "answer-questions",
  "multiple-choice-picture",
  "true-false-picture",
  "answer-questions-picture",
  // Audio exercises
  "listening-comprehension",
  "multiple-choice-audio",
  "true-false-audio",
  "fill-in-blanks-audio",
  "answer-questions-audio",
];
