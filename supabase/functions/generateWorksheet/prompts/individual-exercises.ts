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
      "instructions": "Choose the word that doesn't belong in each group.",
      "questions": [
        {"options": ["pizza", "pasta", "sushi", "lasagna"], "correct_answer": "sushi"},
        {"options": ["waiter", "chef", "customer", "cook"], "correct_answer": "customer"},
        {"options": ["appetizer", "dessert", "beverage", "main course"], "correct_answer": "beverage"},
        {"options": ["spicy", "sweet", "expensive", "salty"], "correct_answer": "expensive"},
        {"options": ["reservation", "complaint", "compliment", "order"], "correct_answer": "compliment"},
        {"options": ["fork", "spoon", "napkin", "knife"], "correct_answer": "napkin"},
        {"options": ["breakfast", "lunch", "snack", "dinner"], "correct_answer": "snack"},
        {"options": ["grilled", "fried", "boiled", "delicious"], "correct_answer": "delicious"}
      ],
      "teacher_tip": "After students identify the odd word, ask them to explain their reasoning. This develops critical thinking and vocabulary categorization skills."
    }`;

export const getSynonymsAntonymsExercise = () => `    {
      "type": "synonyms-antonyms",
      "title": "Exercise 10: Synonyms and Antonyms",
      "icon": "fa-exchange-alt",
      "time": 7,
      "instructions": "Find synonyms or antonyms for the words related to restaurant experiences.",
      "synonym_pairs": [
        {"word": "delicious", "synonym": "tasty", "options": ["tasty", "expensive", "cold", "small"]},
        {"word": "expensive", "synonym": "costly", "options": ["cheap", "costly", "tasty", "fast"]},
        {"word": "popular", "synonym": "famous", "options": ["unknown", "famous", "quiet", "slow"]},
        {"word": "complaint", "synonym": "criticism", "options": ["praise", "criticism", "order", "tip"]},
        {"word": "fresh", "synonym": "new", "options": ["old", "new", "cooked", "spicy"]}
      ],
      "antonym_pairs": [
        {"word": "hot", "antonym": "cold", "options": ["warm", "spicy", "cold", "fresh"]},
        {"word": "expensive", "antonym": "cheap", "options": ["costly", "cheap", "good", "bad"]},
        {"word": "busy", "antonym": "quiet", "options": ["crowded", "noisy", "quiet", "fast"]},
        {"word": "polite", "antonym": "rude", "options": ["kind", "nice", "rude", "helpful"]},
        {"word": "satisfied", "antonym": "disappointed", "options": ["happy", "pleased", "disappointed", "excited"]}
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
      "instructions": "Fill in the gaps with the correct words:",
      "sentences": [
        {"text": "Food is an important part of every culture around the _____.", "answer": "world"},
        {"text": "Italian families often _____ around the dinner table to share meals.", "answer": "gather"},
        {"text": "Japanese cuisine emphasizes fresh _____ and beautiful presentation.", "answer": "ingredients"},
        {"text": "Mexican food is known for its bold _____ and use of spices.", "answer": "flavors"},
        {"text": "Every meal tells a story about the _____ and traditions.", "answer": "people"},
        {"text": "Fish and rice are the _____ of many traditional Japanese meals.", "answer": "foundation"},
        {"text": "Corn, beans, and chili peppers are _____ ingredients in Mexican recipes.", "answer": "essential"},
        {"text": "Different countries have developed unique cooking _____ over thousands of years.", "answer": "styles"}
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
      "words": ["pizza", "waiter", "spoon", "breakfast", "sushi", "chef", "fork", "lunch", "pasta", "customer", "knife", "dinner", "burger", "manager", "plate", "snack"],
      "categories": [
        {"name": "Food Items", "words": ["pizza", "sushi", "pasta", "burger"]},
        {"name": "Restaurant Staff", "words": ["waiter", "chef", "manager", "customer"]},
        {"name": "Eating Utensils", "words": ["spoon", "fork", "knife", "plate"]},
        {"name": "Meal Times", "words": ["breakfast", "lunch", "dinner", "snack"]}
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
        {"incomplete_word": "r_s_au_ant", "complete_word": "restaurant", "definition": "A place where people go to eat meals"},
        {"incomplete_word": "d_lic_o_s", "complete_word": "delicious", "definition": "Having a very pleasant taste"},
        {"incomplete_word": "a_pet_z_r", "complete_word": "appetizer", "definition": "A small dish served before the main course"},
        {"incomplete_word": "r_ser_at_on", "complete_word": "reservation", "definition": "Booking a table in advance"},
        {"incomplete_word": "c_st_m_r", "complete_word": "customer", "definition": "A person who buys food or service"},
        {"incomplete_word": "v_g_tar_an", "complete_word": "vegetarian", "definition": "Someone who doesn't eat meat"},
        {"incomplete_word": "w_it_r", "complete_word": "waiter", "definition": "A person who serves food in a restaurant"},
        {"incomplete_word": "m_n_", "complete_word": "menu", "definition": "A list of food and drinks available"},
        {"incomplete_word": "_xp_ns_ve", "complete_word": "expensive", "definition": "Costing a lot of money"},
        {"incomplete_word": "c_mpl_int", "complete_word": "complaint", "definition": "An expression of dissatisfaction"}
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
        {"first_half": "I'd like to make a reservation", "second_half": "for two people at 7 PM tonight.", "id": 1},
        {"first_half": "The waiter recommended", "second_half": "the grilled salmon with vegetables.", "id": 2},
        {"first_half": "Could you please bring us", "second_half": "some more bread and water?", "id": 3},
        {"first_half": "I'm sorry, but this isn't", "second_half": "what I ordered from the menu.", "id": 4},
        {"first_half": "The restaurant is famous", "second_half": "for its authentic Italian cuisine.", "id": 5},
        {"first_half": "We always leave a tip", "second_half": "when the service is excellent.", "id": 6},
        {"first_half": "The food was so spicy", "second_half": "that I couldn't finish my meal.", "id": 7},
        {"first_half": "Would you like to try", "second_half": "our chef's special dessert today?", "id": 8}
      ],
      "teacher_tip": "After matching, have students read the complete sentences aloud to practice pronunciation and natural sentence rhythm."
    }`;

// =============== 12 NEW EXERCISES - PHASE 3 (2 exercises) ===============

export const getDescribePictureExercise = () => `    {
      "type": "describe-picture",
      "title": "Exercise 19: Describe the Picture",
      "icon": "fa-image",
      "time": 8,
      "instructions": "Look at the restaurant scene and describe what you see using the vocabulary from this lesson.",
      "image_description": "A busy New York restaurant interior with customers seated at tables, waiters serving food, and a chef visible in the open kitchen. There are plates of various dishes including pizza, pasta, and salads on the tables.",
      "prompts": [
        "Describe the restaurant's atmosphere (busy, quiet, elegant, casual).",
        "What types of food can you see on the tables?",
        "How many people are working in the restaurant?",
        "What are the customers doing?",
        "Compare this restaurant to your favorite restaurant.",
        "What would you order if you were eating here?",
        "Describe the uniforms or clothes the staff are wearing.",
        "What emotions do the customers seem to be showing?"
      ],
      "useful_vocabulary": ["crowded", "busy", "elegant", "casual", "appetizing", "professional", "satisfied", "enjoying", "chatting", "dining", "serving", "preparing"],
      "teacher_tip": "Encourage students to use comparative and superlative forms when describing. Ask follow-up questions to extend their descriptions and practice new vocabulary."
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

// Exercise type to function mapping for easy selection - UPDATED WITH 12 NEW EXERCISES
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
  'synonyms-antonyms': getSynonymsAntonymsExercise,
  'sentence-transformation': getSentenceTransformationExercise,
  'word-order': getWordOrderExercise,
  'gap-text': getGapTextExercise,
  'negative-prefixes': getNegativePrefixesExercise,
  'categorize': getCategorizeExercise,
  'paraphrasing': getParaphrasingExercise,
  'complete-word': getCompleteWordExercise,
  'matching-halves': getMatchingHalvesExercise,
  'describe-picture': getDescribePictureExercise,
  'answer-questions': getAnswerQuestionsExercise
};

export const exerciseOrder = [
  // ORIGINAL 8 EXERCISES:
  'reading',
  'true-false', 
  'matching',
  'fill-in-blanks',
  'multiple-choice',
  'dialogue',
  'discussion',
  'error-correction',
  // 12 NEW EXERCISES ADDED:
  'odd-one-out',
  'synonyms-antonyms',
  'sentence-transformation',
  'word-order',
  'gap-text',
  'negative-prefixes',
  'categorize',
  'paraphrasing',
  'complete-word',
  'matching-halves',
  'describe-picture',
  'answer-questions'
];