/**
 * Individual exercise templates - each exercise as a separate function
 * Maintains EXACT content from original prompt, just separated for modularity
 */

export const getReadingExercise = () => {
  return `    {
      "type": "reading",
      "title": "Exercise 1: Reading Comprehension",
      "icon": "fa-book-open",
      "time": 9,
      "instructions": "Read the following text and answer the questions below.",
      "content": "New York City is famous for its restaurants. People from all over the world live there, so the city offers many different types of food. You can find Italian, Chinese, Mexican, Japanese, Greek, Thai, Indian, and many more international cuisines. American-style diners and fast food restaurants are also very popular.\\nMost restaurants in New York have menus that include appetizers, main dishes, and desserts. Appetizers are small dishes that people eat before the main meal, such as soups, salads, or garlic bread. Main dishes are usually bigger and include meat, fish, or vegetarian options, often served with rice, potatoes, or pasta. Desserts like cheesecake, brownies, or ice cream are very common.\\nSome of the most popular types of food in New York include pizza, burgers, sushi, and pasta. People also enjoy trying food from food trucks, especially for lunch. One of the most famous dishes in the United States, and especially in New York, is the New York-style pizza. It's a thin, wide slice of pizza, usually eaten with your hands.\\nOf course, not every restaurant visit is perfect. Some common complaints that people make in New York restaurants include:\\n"The food is cold."\\n"This is not what I ordered."\\n"The portion is too small."\\n"I waited too long for my food."\\n"The bill is incorrect."\\nLearning how to order food and make polite complaints in English is very useful if you ever visit New York or work in customer service.",
      "questions": [
        {"text": "Why is there such a wide variety of food in New York City restaurants?", "answer": "Because people from all over the world live in New York, so the city offers many different types of international cuisine."},
        {"text": "What are some typical examples of appetizers, main dishes, and desserts mentioned in the text?", "answer": "Appetizers: soups, salads, garlic bread; Main dishes: meat, fish, or vegetarian options with rice, potatoes, or pasta; Desserts: cheesecake, brownies, ice cream."},
        {"text": "What is special about New York-style pizza?", "answer": "It is a thin, wide slice of pizza, usually eaten with your hands."},
        {"text": "What are some of the most popular international cuisines in New York?", "answer": "Italian, Chinese, Mexican, Japanese, Greek, Thai, and Indian cuisines."},
        {"text": "What are some common complaints that customers make in New York restaurants?", "answer": "The food is cold, This is not what I ordered, The portion is too small, I waited too long for my food, and The bill is incorrect."}
      ],
      "teacher_tip": "Use the comprehension questions as a starting point to ask more personal questions related to your student's life and experiences. Encourage them to share their opinions on the topics and situations mentioned in the text."
    }`;
};

export const getTrueFalseExercise = () => {
  return `    {
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
};

export const getMatchingExercise = () => {
  return `    {
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
};

export const getFillInBlanksExercise = () => {
  return `    {
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
};

export const getMultipleChoiceExercise = () => {
  return `    {
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
};

export const getDialogueExercise = () => {
  return `    {
      "type": "dialogue",
      "title": "Exercise 6: Dialogue Practice",
      "icon": "fa-comments",
      "time": 8,
      "instructions": "Read the dialogue and practice with a partner.",
      "dialogue": [
        {"speaker": "Waiter", "text": "Good evening! Can I take your order?"},
        {"speaker": "Customer", "text": "Yes, I'd like the grilled salmon with vegetables, please."},
        {"speaker": "Waiter", "text": "How would you like the salmon cooked?"},
        {"speaker": "Customer", "text": "Medium, please. And can I have a salad instead of fries?"},
        {"speaker": "Waiter", "text": "Of course! What kind of dressing would you like?"},
        {"speaker": "Customer", "text": "Italian dressing, please."},
        {"speaker": "Waiter", "text": "Perfect. And what would you like to drink?"},
        {"speaker": "Customer", "text": "I'll have a glass of white wine."},
        {"speaker": "Waiter", "text": "Excellent choice. I'll get that started for you."},
        {"speaker": "Customer", "text": "Thank you."},
        {"speaker": "Waiter", "text": "Here's your meal. How does everything look?"},
        {"speaker": "Customer", "text": "Actually, I think there's a problem. I ordered salmon, but this looks like chicken."},
        {"speaker": "Waiter", "text": "Oh, I'm so sorry about that mistake. Let me fix this right away."},
        {"speaker": "Customer", "text": "Thank you, I appreciate it."},
        {"speaker": "Waiter", "text": "Here's your correct order - the grilled salmon. Again, I apologize for the confusion."},
        {"speaker": "Customer", "text": "No problem, these things happen. This looks much better!"},
        {"speaker": "Waiter", "text": "Is there anything else I can get for you?"},
        {"speaker": "Customer", "text": "No, everything looks perfect now. Thank you for fixing it so quickly."}
      ],
      "teacher_tip": "Practice this dialogue with students, then ask them to create their own version with a different type of complaint or order mistake."
    }`;
};

export const getDiscussionExercise = () => {
  return `    {
      "type": "discussion",
      "title": "Exercise 7: Discussion Questions",
      "icon": "fa-users",
      "time": 8,
      "instructions": "Discuss these questions with your teacher or partner.",
      "questions": [
        "What's your favorite type of international cuisine and why?",
        "Have you ever had to make a complaint in a restaurant? What happened?",
        "How do people in your country usually complain when they receive poor service?",
        "What do you think is more important in a restaurant - good food or good service? Why?",
        "Is it common to leave tips in restaurants in your country? How much is appropriate?",
        "Do you prefer eating at expensive restaurants or casual places? What are the advantages of each?",
        "What's the worst restaurant experience you've ever had?",
        "How do you usually decide which restaurant to visit when you go out to eat?",
        "Do you think it's acceptable to send food back if it's not prepared correctly? Why or why not?",
        "What advice would you give to someone visiting a restaurant in your country for the first time?"
      ],
      "teacher_tip": "Encourage students to use the comparative and superlative forms they learned in previous exercises when discussing their preferences and experiences."
    }`;
};

export const getErrorCorrectionExercise = () => {
  return `    {
      "type": "error-correction",
      "title": "Exercise 8: Error Correction",
      "icon": "fa-eraser",
      "time": 8,
      "instructions": "Find and correct the mistake in each sentence.",
      "sentences": [
        {"incorrect": "This restaurant is more better than the other one.", "correct": "This restaurant is better than the other one.", "explanation": "Don't use 'more' with comparative adjectives that already have '-er'."},
        {"incorrect": "That was the most tastyest meal I've ever had.", "correct": "That was the tastiest meal I've ever had.", "explanation": "Don't use 'most' with superlative adjectives that already have '-est'."},
        {"incorrect": "Chinese food is more spicy than Italian food.", "correct": "Chinese food is spicier than Italian food.", "explanation": "One-syllable adjectives ending in 'y' change to 'ier' in the comparative form."},
        {"incorrect": "This is the expensiver restaurant in town.", "correct": "This is the most expensive restaurant in town.", "explanation": "Multi-syllable adjectives use 'most' to form the superlative."},
        {"incorrect": "My sister cooks more good than me.", "correct": "My sister cooks better than me.", "explanation": "'Good' has an irregular comparative form: 'better'."},
        {"incorrect": "That's the worse coffee I've ever tasted.", "correct": "That's the worst coffee I've ever tasted.", "explanation": "'Bad' has an irregular superlative form: 'worst'."},
        {"incorrect": "This pizza is as delicious than the one we had yesterday.", "correct": "This pizza is as delicious as the one we had yesterday.", "explanation": "Use 'as...as' to show equality, not 'as...than'."},
        {"incorrect": "She is the most tall girl in our class.", "correct": "She is the tallest girl in our class.", "explanation": "One-syllable adjectives form superlatives with '-est', not 'most'."},
        {"incorrect": "This soup is more cold than it should be.", "correct": "This soup is colder than it should be.", "explanation": "One-syllable adjectives form comparatives with '-er', not 'more'."},
        {"incorrect": "Of all the dishes, I like pasta the more.", "correct": "Of all the dishes, I like pasta the most.", "explanation": "When comparing three or more items, use the superlative 'most'."}
      ],
      "teacher_tip": "After correcting each sentence, ask students to explain the grammar rule that applies. This reinforces their understanding of comparative and superlative forms."
    }`;
};