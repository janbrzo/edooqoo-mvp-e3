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
        {"text": "Why is there such a wide variety of food in New York City restaurants?", "answer": "Because people from all over the world live in New York, so the city offers many different types of international cuisine."},
        {"text": "What are some typical examples of appetizers, main dishes, and desserts mentioned in the text?", "answer": "Appetizers: soups, salads, garlic bread; Main dishes: meat, fish, or vegetarian options with rice, potatoes, or pasta; Desserts: cheesecake, brownies, ice cream."},
        {"text": "What is special about New York-style pizza?", "answer": "It is a thin, wide slice of pizza, usually eaten with your hands."},
        {"text": "What are some of the most popular international cuisines in New York?", "answer": "Italian, Chinese, Mexican, Japanese, Greek, Thai, and Indian cuisines."},
        {"text": "What are some common complaints that customers make in New York restaurants?", "answer": "The food is cold, This is not what I ordered, The portion is too small, I waited too long for my food, and The bill is incorrect."}
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
        {"text": "New York City offers many international cuisines because people from all over the world live there.", "isTrue": true},
        {"text": "American-style diners are not popular in New York.", "isTrue": false},
        {"text": "Appetizers are usually bigger than main dishes.", "isTrue": false},
        {"text": "New York-style pizza is thick and eaten with a fork and knife.", "isTrue": false},
        {"text": "Food trucks are especially popular for lunch in New York.", "isTrue": true},
        {"text": "All restaurant visits in New York are perfect according to the text.", "isTrue": false},
        {"text": "One common complaint is that the food arrives cold.", "isTrue": true},
        {"text": "Desserts like cheesecake and brownies are common in New York restaurants.", "isTrue": true},
        {"text": "The text mentions that learning to complain politely is useful for customer service work.", "isTrue": true},
        {"text": "Main dishes in New York restaurants never include vegetarian options.", "isTrue": false}
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
        {"term": "Appetizer", "definition": "A small dish served before the main course to stimulate the appetite."},
        {"term": "Cuisine", "definition": "A style or method of cooking, especially as characteristic of a particular country or region."},
        {"term": "Portion", "definition": "The amount of food served to one person at a meal."},
        {"term": "Incorrect", "definition": "Not accurate or wrong; used especially in the context of errors with orders or bills."},
        {"term": "Complaint", "definition": "A statement that something is wrong or not satisfactory, especially in service or quality."},
        {"term": "Fine dining", "definition": "A high-end, expensive restaurant experience offering exceptional food, service, and atmosphere."},
        {"term": "Reservation", "definition": "An arrangement made in advance to secure a table at a restaurant."},
        {"term": "Signature dish", "definition": "A unique or famous meal that represents a restaurant or chef's style."},
        {"term": "Undercooked", "definition": "Food that has not been cooked long enough and may be unsafe or unpleasant to eat."},
        {"term": "Customer service", "definition": "The assistance and advice provided by a restaurant or business to people who use its services."}
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
        {"text": "New York is _____ for its wide variety of restaurants and street food.", "answer": "famous"},
        {"text": "The city offers many _____ cuisines, like Thai, Italian, and Indian.", "answer": "international"},
        {"text": "Customers often complain when their bill is _____.", "answer": "incorrect"},
        {"text": "Appetizers are usually _____ dishes served before the main course.", "answer": "small"},
        {"text": "Pizza is one of the most _____ foods in New York.", "answer": "popular"},
        {"text": "One common complaint is that the food arrives _____.", "answer": "cold"},
        {"text": "You can try food from many _____ cultures in New York.", "answer": "different"},
        {"text": "New York-style pizza is known for its wide and _____ crust.", "answer": "thin"},
        {"text": "Some restaurants are very _____, but they offer high-quality service.", "answer": "expensive"},
        {"text": "It is _____ to leave a tip in American restaurants.", "answer": "common"}
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
          ]
        },
        {
          "text": "That was the ______ meal I've ever had!",
          "options": [
            {"label": "A", "text": "most delicious", "correct": true},
            {"label": "B", "text": "more delicious", "correct": false},
            {"label": "C", "text": "deliciouser", "correct": false},
            {"label": "D", "text": "deliciousest", "correct": false}
          ]
        },
        {
          "text": "Chinese food is usually ______ than British food.",
          "options": [
            {"label": "A", "text": "spicy", "correct": false},
            {"label": "B", "text": "the spiciest", "correct": false},
            {"label": "C", "text": "spicier", "correct": true},
            {"label": "D", "text": "most spicy", "correct": false}
          ]
        },
        {
          "text": "That's the ______ restaurant in our neighborhood.",
          "options": [
            {"label": "A", "text": "expensiver", "correct": false},
            {"label": "B", "text": "most expensive", "correct": true},
            {"label": "C", "text": "more expensive", "correct": false},
            {"label": "D", "text": "expensivest", "correct": false}
          ]
        },
        {
          "text": "John eats ______ than his brother.",
          "options": [
            {"label": "A", "text": "most slowly", "correct": false},
            {"label": "B", "text": "the slowest", "correct": false},
            {"label": "C", "text": "slow", "correct": false},
            {"label": "D", "text": "more slowly", "correct": true}
          ]
        },
        {
          "text": "This soup is ______ than the one I made yesterday.",
          "options": [
            {"label": "A", "text": "tastier", "correct": true},
            {"label": "B", "text": "the tastiest", "correct": false},
            {"label": "C", "text": "tasty", "correct": false},
            {"label": "D", "text": "more tastiest", "correct": false}
          ]
        },
        {
          "text": "Of all the dishes on the menu, the lasagna is the ______.",
          "options": [
            {"label": "A", "text": "good", "correct": false},
            {"label": "B", "text": "better", "correct": false},
            {"label": "C", "text": "best", "correct": true},
            {"label": "D", "text": "more better", "correct": false}
          ]
        },
        {
          "text": "Pizza is ______ than soup for a quick lunch.",
          "options": [
            {"label": "A", "text": "the convenient", "correct": false},
            {"label": "B", "text": "more convenient", "correct": true},
            {"label": "C", "text": "convenientest", "correct": false},
            {"label": "D", "text": "most convenient", "correct": false}
          ]
        },
        {
          "text": "This is the ______ café in town. Everyone loves it!",
          "options": [
            {"label": "A", "text": "more popular", "correct": false},
            {"label": "B", "text": "popular", "correct": false},
            {"label": "C", "text": "popularest", "correct": false},
            {"label": "D", "text": "most popular", "correct": true}
          ]
        },
        {
          "text": "The weather today is much ______ than it was yesterday.",
          "options": [
            {"label": "A", "text": "warmer", "correct": true},
            {"label": "B", "text": "the warmest", "correct": false},
            {"label": "C", "text": "warm", "correct": false},
            {"label": "D", "text": "most warm", "correct": false}
          ]
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
        {"text": "This pizza is more better than the one I had yesterday.", "correction": "This pizza is better than the one I had yesterday."},
        {"text": "She is the most tallest girl in the class.", "correction": "She is the tallest girl in the class."},
        {"text": "My house is more big than yours.", "correction": "My house is bigger than yours."},
        {"text": "Today is the most hottest day of the year.", "correction": "Today is the hottest day of the year."},
        {"text": "This restaurant is more expensiveer than the other one.", "correction": "This restaurant is more expensive than the other one."},
        {"text": "He is smarter than his brother.", "correction": "He is smarter than his brother."},
        {"text": "That movie was the most funniest I have ever seen.", "correction": "That movie was the funniest I have ever seen."},
        {"text": "My car is more faster now after the repair.", "correction": "My car is faster now after the repair."},
        {"text": "Winter is colder than summer.", "correction": "Winter is colder than summer."},
        {"text": "She is the more talented singer in our group.", "correction": "She is the most talented singer in our group."}
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
        {"options": ["running", "swimming", "cycling", "sport", "dancing"], "correct_answer": "sport"},
        {"options": ["quickly", "slowly", "carefully", "fast", "quietly"], "correct_answer": "fast"},
        {"options": ["delicious", "tasty", "eat", "spicy", "sweet"], "correct_answer": "eat"},
        {"options": ["waiter", "chef", "serve", "cook", "bartender"], "correct_answer": "serve"},
        {"options": ["reservation", "booking", "order", "complain", "menu"], "correct_answer": "complain"},
        {"options": ["hot", "cold", "warmth", "fresh", "spicy"], "correct_answer": "warmth"},
        {"options": ["eating", "drinking", "table", "cooking", "serving"], "correct_answer": "table"},
        {"options": ["expensive", "cheap", "beautifully", "fresh", "delicious"], "correct_answer": "beautifully"}
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
        { "term": "delicious", "definition": "tasty", "letter": "A" },
        { "term": "expensive", "definition": "costly", "letter": "B" },
        { "term": "recommend", "definition": "suggest", "letter": "C" },
        { "term": "popular", "definition": "well-liked", "letter": "D" },
        { "term": "affordable", "definition": "reasonably priced", "letter": "E" },
        { "term": "authentic", "definition": "genuine", "letter": "F" },
        { "term": "amazing", "definition": "wonderful", "letter": "G" },
        { "term": "cozy", "definition": "comfortable", "letter": "H" },
        { "term": "busy", "definition": "crowded", "letter": "I" },
        { "term": "excellent", "definition": "outstanding", "letter": "J" }
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
        { "term": "expensive", "definition": "cheap", "letter": "A" },
        { "term": "delicious", "definition": "tasteless", "letter": "B" },
        { "term": "spicy", "definition": "mild", "letter": "C" },
        { "term": "fresh", "definition": "stale", "letter": "D" },
        { "term": "hot", "definition": "cold", "letter": "E" },
        { "term": "crowded", "definition": "empty", "letter": "F" },
        { "term": "fast", "definition": "slow", "letter": "G" },
        { "term": "polite", "definition": "rude", "letter": "H" },
        { "term": "clean", "definition": "dirty", "letter": "I" },
        { "term": "quiet", "definition": "noisy", "letter": "J" }
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
        { "term": "delicious", "definition": "tasty", "letter": "A" },
        { "term": "expensive", "definition": "cheap", "letter": "B" },
        { "term": "popular", "definition": "famous", "letter": "C" },
        { "term": "fresh", "definition": "new", "letter": "D" },
        { "term": "hot", "definition": "cold", "letter": "E" },
        { "term": "busy", "definition": "quiet", "letter": "F" },
        { "term": "polite", "definition": "rude", "letter": "G" },
        { "term": "satisfied", "definition": "disappointed", "letter": "H" },
        { "term": "complaint", "definition": "criticism", "letter": "I" },
        { "term": "quick", "definition": "fast", "letter": "J" }
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
        {"original": "The chef prepares the meals every morning.", "instruction": "Change to passive voice", "transformed": "The meals are prepared by the chef every morning."},
        {"original": "The restaurant is more expensive than the café.", "instruction": "Use 'not as... as'", "transformed": "The café is not as expensive as the restaurant."},
        {"original": "I have never eaten such delicious pizza.", "instruction": "Use superlative", "transformed": "This is the most delicious pizza I have ever eaten."},
        {"original": "The waiter said, 'Your table is ready.'", "instruction": "Change to reported speech", "transformed": "The waiter said that our table was ready."},
        {"original": "We ordered dessert after we finished the main course.", "instruction": "Use 'having + past participle'", "transformed": "Having finished the main course, we ordered dessert."},
        {"original": "The food was so spicy that I couldn't eat it.", "instruction": "Use 'too... to'", "transformed": "The food was too spicy for me to eat."},
        {"original": "If you don't make a reservation, you won't get a table.", "instruction": "Use 'unless'", "transformed": "Unless you make a reservation, you won't get a table."},
        {"original": "This restaurant serves better food than that one.", "instruction": "Use superlative", "transformed": "This restaurant serves the best food in the area."},
        {"original": "I suggest you try the fish today.", "instruction": "Use modal verb", "transformed": "You should try the fish today."},
        {"original": "The service was so slow that we left early.", "instruction": "Use 'too... to'", "transformed": "The service was too slow for us to stay."}
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
        {"scrambled_words": "this / restaurant / the / in / food / neighborhood / best / serves", "correct_order": "This restaurant serves the best food in the neighborhood."},
        {"scrambled_words": "always / we / tip / good / service / for / leave / a", "correct_order": "We always leave a tip for good service."},
        {"scrambled_words": "menu / has / the / variety / wide / of / dishes / a", "correct_order": "The menu has a wide variety of dishes."},
        {"scrambled_words": "complained / customer / the / about / cold / the / food", "correct_order": "The customer complained about the cold food."},
        {"scrambled_words": "book / should / you / advance / table / in / a", "correct_order": "You should book a table in advance."},
        {"scrambled_words": "pizza / New York / famous / is / style / for / its", "correct_order": "New York is famous for its pizza style."},
        {"scrambled_words": "eating / prefer / out / to / cooking / I / home / at", "correct_order": "I prefer eating out to cooking at home."},
        {"scrambled_words": "been / have / to / you / restaurant / this / before", "correct_order": "Have you been to this restaurant before?"},
        {"scrambled_words": "waiter / recommended / the / special / chef's / today's", "correct_order": "The waiter recommended today's chef's special."},
        {"scrambled_words": "delicious / was / most / the / I've / meal / ever / had", "correct_order": "It was the most delicious meal I've ever had."}
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
        {"text": "Yesterday I _____ (go) to the restaurant to meet my friend.", "answer": "went", "verb": "go"},
        {"text": "The waiter _____ (be) very polite and helpful throughout the meal.", "answer": "was", "verb": "be"},
        {"text": "She has _____ (work) as a chef in this restaurant for five years now.", "answer": "been working", "verb": "work"},
        {"text": "If I _____ (be) you, I would try the seafood special today.", "answer": "were", "verb": "be"},
        {"text": "The food was so _____ (spice) that I had to drink three glasses of water.", "answer": "spicy", "verb": "spice"},
        {"text": "Can you _____ (recommend) a good wine to go with this dish?", "answer": "recommend", "verb": "recommend"},
        {"text": "I'm looking _____ (forward) to trying their famous dessert menu.", "answer": "forward", "verb": "forward"},
        {"text": "The restaurant _____ (open) at 6 PM according to their website.", "answer": "opens", "verb": "open"},
        {"text": "By next month, they _____ (serve) customers for ten years.", "answer": "will have been serving", "verb": "serve"},
        {"text": "We _____ (wait) for our table for nearly an hour yesterday.", "answer": "waited", "verb": "wait"}
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
        {"word": "satisfied", "answer": "dissatisfied"},
        {"word": "cooked", "answer": "uncooked"},
        {"word": "polite", "answer": "impolite"},
        {"word": "correct", "answer": "incorrect"},
        {"word": "fresh", "answer": "unfresh"},
        {"word": "expensive", "answer": "inexpensive"},
        {"word": "comfortable", "answer": "uncomfortable"},
        {"word": "honest", "answer": "dishonest"},
        {"word": "possible", "answer": "impossible"},
        {"word": "popular", "answer": "unpopular"}
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
      "items": ["pizza", "waiter", "spoon", "breakfast", "sushi", "chef", "fork", "lunch", "pasta", "customer", "knife", "dinner", "burger", "manager", "plate", "snack"],
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
        {"original": "The food was absolutely delicious.", "paraphrase": "The meal was extremely tasty.", "alternatives": ["The dish was incredibly flavorful.", "The cuisine was wonderfully appetizing."]},
        {"original": "We had to wait a long time for our order.", "paraphrase": "Our food took ages to arrive.", "alternatives": ["The service was very slow.", "We waited forever for our meal."]},
        {"original": "The restaurant is always crowded on weekends.", "paraphrase": "The place gets really busy on Saturdays and Sundays.", "alternatives": ["It's packed with customers during weekends.", "Weekend dining there is always hectic."]},
        {"original": "I complained about the cold soup.", "paraphrase": "I told the waiter that my soup wasn't hot enough.", "alternatives": ["I expressed dissatisfaction with the soup's temperature.", "I mentioned that the soup needed reheating."]},
        {"original": "This café serves the best coffee in town.", "paraphrase": "You can't find better coffee anywhere else in the city.", "alternatives": ["This place has the finest coffee around.", "No other café makes coffee this good."]},
        {"original": "The bill was much higher than expected.", "paraphrase": "We were surprised by how expensive the meal was.", "alternatives": ["The cost exceeded our expectations.", "The price was shockingly steep."]}
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
        {"partial": "rest_urant", "complete": "restaurant", "clue": "A place where people go to eat meals"},
        {"partial": "del_cious", "complete": "delicious", "clue": "Having a very pleasant taste"},
        {"partial": "_ppetizer", "complete": "appetizer", "clue": "A small dish served before the main course"},
        {"partial": "reserv_tion", "complete": "reservation", "clue": "Booking a table in advance"},
        {"partial": "cust_mer", "complete": "customer", "clue": "A person who buys food or service"},
        {"partial": "veget_rian", "complete": "vegetarian", "clue": "Someone who doesn't eat meat"},
        {"partial": "w_iter", "complete": "waiter", "clue": "A person who serves food in a restaurant"},
        {"partial": "men_", "complete": "menu", "clue": "A list of food and drinks available"},
        {"partial": "_xpensive", "complete": "expensive", "clue": "Costing a lot of money"},
        {"partial": "compl_int", "complete": "complaint", "clue": "An expression of dissatisfaction"}
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
        {"first_half": "I'd like to make a reservation", "second_half": "for four people at 7:30 PM this Friday.", "id": 1},
        {"first_half": "The waiter recommended the grilled salmon", "second_half": "because it's the chef's specialty this week.", "id": 2},
        {"first_half": "Could you bring us two glasses of sparkling water", "second_half": "and the dessert menu, please?", "id": 3},
        {"first_half": "I ordered the vegetarian pasta", "second_half": "but they brought me a seafood dish instead.", "id": 4},
        {"first_half": "This Italian restaurant is famous", "second_half": "for serving the most authentic pizza in town.", "id": 5},
        {"first_half": "We always leave a generous tip", "second_half": "when the service exceeds our expectations.", "id": 6},
        {"first_half": "The curry was so incredibly spicy", "second_half": "that I had to order a glass of milk.", "id": 7},
        {"first_half": "Would you like to try the chocolate lava cake", "second_half": "which our pastry chef made fresh today?", "id": 8},
        {"first_half": "The restaurant refused to serve us", "second_half": "because we arrived after their closing time.", "id": 9},
        {"first_half": "My grandmother taught me how to cook", "second_half": "traditional French dishes when I was young.", "id": 10}
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
        "Describe the overall scene and atmosphere you observe in the image.",
        "What specific objects, people, or elements can you identify?",
        "What colors, textures, or visual details stand out to you?",
        "What activity or situation is taking place in this image?",
        "How would you describe the mood or feeling this image conveys?",
        "What details in the image are most interesting or unusual?",
        "If you were in this scene, what would you notice first?",
        "What story could you tell based on what you see in the image?"
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
        {"question": "What's your favorite restaurant in your city, and why do you think it's better than others?", "focus": "Comparatives and personal preferences"},
        {"question": "Describe the worst restaurant experience you've ever had. What went wrong?", "focus": "Past tense and complaint language"},
        {"question": "If you could open your own restaurant, what type of cuisine would you serve and why?", "focus": "Conditional and future plans"},
        {"question": "How do you usually react when you receive poor service in a restaurant?", "focus": "Present habits and complaint strategies"},
        {"question": "What's the most expensive meal you've ever eaten? Was it worth the price?", "focus": "Superlatives and past experiences"},
        {"question": "Do you prefer eating at home or dining out? Give three reasons for your preference.", "focus": "Comparisons and justification"},
        {"question": "What advice would you give to someone visiting a restaurant in your country for the first time?", "focus": "Modal verbs and cultural advice"},
        {"question": "How has your taste in food changed as you've gotten older?", "focus": "Present perfect and personal development"}
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
          ]
        },
        {
          "text": "How would you describe the atmosphere in this image?",
          "options": [
            {"label": "A", "text": "Quiet and empty", "correct": false},
            {"label": "B", "text": "Crowded and lively", "correct": true},
            {"label": "C", "text": "Formal and elegant", "correct": false},
            {"label": "D", "text": "Dark and gloomy", "correct": false}
          ]
        },
        {
          "text": "What type of food can you see in the picture?",
          "options": [
            {"label": "A", "text": "Only desserts", "correct": false},
            {"label": "B", "text": "Various international dishes", "correct": true},
            {"label": "C", "text": "Only breakfast items", "correct": false},
            {"label": "D", "text": "Only beverages", "correct": false}
          ]
        },
        {
          "text": "How many people are visible in this restaurant scene?",
          "options": [
            {"label": "A", "text": "None", "correct": false},
            {"label": "B", "text": "One or two", "correct": false},
            {"label": "C", "text": "Several people", "correct": true},
            {"label": "D", "text": "Only staff members", "correct": false}
          ]
        },
        {
          "text": "What can you infer about the service style from the image?",
          "options": [
            {"label": "A", "text": "Self-service only", "correct": false},
            {"label": "B", "text": "Table service by waiters", "correct": true},
            {"label": "C", "text": "Takeaway only", "correct": false},
            {"label": "D", "text": "Food truck style", "correct": false}
          ]
        },
        {
          "text": "Which best describes the restaurant's style?",
          "options": [
            {"label": "A", "text": "Fast food chain", "correct": false},
            {"label": "B", "text": "Casual dining establishment", "correct": true},
            {"label": "C", "text": "Fine dining restaurant", "correct": false},
            {"label": "D", "text": "Street food vendor", "correct": false}
          ]
        },
        {
          "text": "What time of day does this picture suggest?",
          "options": [
            {"label": "A", "text": "Early morning", "correct": false},
            {"label": "B", "text": "Lunch or dinner time", "correct": true},
            {"label": "C", "text": "Late night", "correct": false},
            {"label": "D", "text": "Breakfast time", "correct": false}
          ]
        },
        {
          "text": "What emotion do the customers seem to be showing?",
          "options": [
            {"label": "A", "text": "Anger and frustration", "correct": false},
            {"label": "B", "text": "Enjoyment and satisfaction", "correct": true},
            {"label": "C", "text": "Boredom and disinterest", "correct": false},
            {"label": "D", "text": "Confusion and worry", "correct": false}
          ]
        },
        {
          "text": "Based on the image, which statement is most accurate?",
          "options": [
            {"label": "A", "text": "The restaurant appears to be closing", "correct": false},
            {"label": "B", "text": "The restaurant is popular and busy", "correct": true},
            {"label": "C", "text": "The restaurant has poor service", "correct": false},
            {"label": "D", "text": "The restaurant serves only one type of cuisine", "correct": false}
          ]
        },
        {
          "text": "What can you see on the tables in this picture?",
          "options": [
            {"label": "A", "text": "Only empty plates", "correct": false},
            {"label": "B", "text": "Food dishes and beverages", "correct": true},
            {"label": "C", "text": "Only menus", "correct": false},
            {"label": "D", "text": "Nothing at all", "correct": false}
          ]
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
        {"text": "The restaurant in the picture appears to be busy with customers.", "isTrue": true},
        {"text": "There is no food visible on any of the tables.", "isTrue": false},
        {"text": "You can see staff members working in this restaurant.", "isTrue": true},
        {"text": "The restaurant looks completely empty with no people.", "isTrue": false},
        {"text": "There are multiple tables with customers in the image.", "isTrue": true},
        {"text": "The picture shows only the kitchen area of a restaurant.", "isTrue": false},
        {"text": "People in the image appear to be enjoying their meals.", "isTrue": true},
        {"text": "The restaurant appears to be closed and dark.", "isTrue": false},
        {"text": "You can see different types of dishes on the tables.", "isTrue": true},
        {"text": "The image shows a very formal, expensive fine dining restaurant.", "isTrue": false}
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
        {"question": "Describe the atmosphere of the restaurant you see in the picture. Use at least 3 adjectives.", "focus": "Descriptive vocabulary and observation"},
        {"question": "What types of food can you identify in the image? Compare them to food you enjoy eating.", "focus": "Food vocabulary and comparisons"},
        {"question": "How many people can you see in the restaurant? What do you think they are doing?", "focus": "Present continuous and speculation"},
        {"question": "Would you like to eat at this restaurant? Why or why not? Give specific reasons.", "focus": "Expressing preferences and justification"},
        {"question": "Compare this restaurant to your favorite restaurant. What's similar and what's different?", "focus": "Comparatives and contrasts"},
        {"question": "What can you say about the service style based on what you see in the picture?", "focus": "Inference and deduction"},
        {"question": "Imagine you are eating at this restaurant. What would you order and why?", "focus": "Hypothetical situations and food vocabulary"},
        {"question": "What time of day do you think this picture was taken? What details make you think that?", "focus": "Evidence-based reasoning"},
        {"question": "How does the restaurant in the picture compare to typical restaurants in your country?", "focus": "Cultural comparison and description"},
        {"question": "If you were the manager of this restaurant, what would you improve and what would you keep the same?", "focus": "Conditional and critical thinking"}
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

// Exercise type to function mapping for easy selection - UPDATED WITH 12 NEW EXERCISES + PICTURE VERSIONS
export const exerciseFunctions = {
  reading: getReadingExercise,
  'true-false': getTrueFalseExercise,
  matching: getMatchingExercise,
  'fill-in-blanks': getFillInBlanksExercise,
  'multiple-choice': getMultipleChoiceExercise,
  dialogue: getDialogueExercise,
  discussion: getDiscussionExercise,
  'error-correction': getErrorCorrectionExercise,
  // 12 NEW EXERCISES ADDED:
  'odd-one-out': getOddOneOutExercise,
  'synonyms': getSynonymsExercise, // NEW
  'antonyms': getAntonymsExercise, // NEW
  'synonyms-antonyms': getSynonymsAntonymsExercise, // LEGACY - for backward compatibility
  'sentence-transformation': getSentenceTransformationExercise,
  'word-order': getWordOrderExercise,
  'gap-text': getGapTextExercise,
  'negative-prefixes': getNegativePrefixesExercise,
  'categorize': getCategorizeExercise,
  'paraphrasing': getParaphrasingExercise,
  'complete-word': getCompleteWordExercise,
  'matching-halves': getMatchingHalvesExercise,
  // NEW: Picture-based exercise versions
  'describe-picture': getDescribePictureExercise,
  'answer-questions': getAnswerQuestionsExercise,
  'multiple-choice-picture': getMultipleChoicePictureExercise,
  'true-false-picture': getTrueFalsePictureExercise,
  'answer-questions-picture': getAnswerQuestionsPictureExercise
};

// =============== ORDERED LIST OF EXERCISES - UPDATED WITH NEW EXERCISES ===============

export const exerciseOrder = [
  'reading',
  'true-false',
  'matching',
  'fill-in-blanks',
  'multiple-choice',
  'dialogue',
  'discussion',
  'error-correction',
  // New Phase 1 exercises
  'odd-one-out',
  'synonyms', // NEW - preferred over combined
  'antonyms', // NEW - preferred over combined
  'synonyms-antonyms', // LEGACY - still available for old worksheets
  'sentence-transformation',
  'word-order',
  'gap-text',
  'negative-prefixes',
  // New Phase 2 exercises
  'categorize',
  'paraphrasing',
  'complete-word',
  'matching-halves',
  // Picture mode exercises
  'describe-picture',
  'answer-questions',
  'multiple-choice-picture',
  'true-false-picture',
  'answer-questions-picture'
];