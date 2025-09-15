/**
 * Individual exercise definitions - modular prompt system
 * CRITICAL: Each exercise maintains exact content as original prompt
 */

/**
 * Grammar rules section generator
 */
function getGrammarRulesSection(hasGrammarFocus: boolean, grammarFocus: string = ''): string {
  if (!hasGrammarFocus) {
    return '';
  }
  
  return `"grammar_rules": {
    "title": "Grammar Focus: ${grammarFocus}",
    "introduction": "Adjectives are words that describe or modify nouns, providing information about qualities such as size, color, shape, age, and many others. When we want to compare people, objects, or ideas, we use adjectives in their comparative or superlative forms.\\n\\nComparatives are used to compare two things or people, showing that one has a higher or lower degree of a particular quality than the other. For example, when saying \\"John is taller than Mike,\\" the adjective \\"taller\\" is in the comparative form, indicating a comparison between two individuals. Comparatives are often followed by the word \\"than\\" to introduce the second element of comparison.\\n\\nSuperlatives, on the other hand, are used to describe the extreme or highest degree of a quality among three or more things or people. For example, \\"Anna is the tallest in her class\\" uses the superlative form \\"tallest\\" to indicate that Anna has the greatest height compared to all others in the group. Superlatives are usually preceded by the definite article \\"the\\".\\n\\nThe formation of comparatives and superlatives depends largely on the length and ending of the adjective. One-syllable adjectives usually form comparatives and superlatives by adding the suffixes \\"-er\\" and \\"-est\\". For adjectives with two syllables or more, especially those with three or more syllables, the words \\"more\\" and \\"most\\" are used before the adjectives instead of adding suffixes.\\n\\nSome adjectives have irregular comparative and superlative forms that must be memorized as they do not follow standard patterns. For instance, \\"good\\" becomes \\"better\\" (comparative) and \\"best\\" (superlative).\\n\\nIn addition to indicating comparisons of difference, adjectives can also be used to express equality, using the structure \\"as + adjective + as\\" to show that two things share the same degree of a quality.\\n\\nUnderstanding and correctly using comparatives and superlatives is essential for effective communication, enabling speakers and writers to accurately compare qualities and express degrees of difference or similarity.",
    "rules": [
      {
        "title": "Forming Comparatives for One-Syllable Adjectives",
        "explanation": "Most one-syllable adjectives form their comparative by adding the suffix \\"-er\\" to the base adjective. If the adjective ends with a single consonant preceded by a single vowel, double the consonant before adding \\"-er\\". When the adjective ends with \\"-e\\", just add \\"-r\\".",
        "examples": ["food → colder food", "dish → spicier dish", "service → slower service"]
      },
      {
        "title": "Forming Superlatives for One-Syllable Adjectives",
        "explanation": "One-syllable adjectives form the superlative by adding the suffix \\"-est\\" to the base adjective. Similar spelling rules apply as with comparatives.",
        "examples": ["food → coldest food", "dish → spiciest dish", "service → slowest service"]
      },
      {
        "title": "Forming Comparatives and Superlatives for Adjectives with Two or More Syllables",
        "explanation": "Adjectives with two or more syllables generally form comparatives and superlatives by using \\"more\\" before the adjective for comparatives, and \\"most\\" before the adjective for superlatives. Some two-syllable adjectives can also take \\"-er\\" and \\"-est\\" if they end with \\"-y\\" or certain other endings.",
        "examples": ["delicious → more delicious → most delicious", "uncomfortable → more uncomfortable → most uncomfortable", "friendly staff → friendlier staff → friendliest staff"]
      },
      {
        "title": "Irregular Comparatives and Superlatives",
        "explanation": "Some adjectives have irregular forms that do not follow the usual patterns and must be memorized. These are common and important adjectives.",
        "examples": ["good service → better service → best service", "bad coffee → worse coffee → worst coffee", "far table → farther table → farthest table"]
      },
      {
        "title": "Using \\"than\\" in Comparatives",
        "explanation": "Comparative adjectives are usually followed by \\"than\\" to introduce the second element being compared.",
        "examples": ["This soup is colder than it should be.", "The second waiter was more polite than the first one."]
      },
      {
        "title": "Using \\"the\\" with Superlatives",
        "explanation": "Superlative adjectives are usually preceded by the definite article \\"the\\" to show that one thing is the highest or lowest in a group.",
        "examples": ["That was the worst pasta I've ever eaten.", "This is the most expensive restaurant in the area."]
      },
      {
        "title": "Comparing Equality with \\"as...as\\"",
        "explanation": "To show that two things are equal in some quality, use the structure \\"as + adjective + as\\".",
        "examples": ["This dish is not as hot as I expected.", "The new waiter is as friendly as the old one."]
      }
    ]
  },`;
}

/**
 * Exercise 1: Reading
 */
export function getExercise1_Reading(): string {
  return `    {
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
}

/**
 * Exercise 2: True/False
 */
export function getExercise2_TrueFalse(): string {
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
}

/**
 * Exercise 3: Matching
 */
export function getExercise3_Matching(): string {
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
}

/**
 * Exercise 4: Fill in Blanks
 */
export function getExercise4_FillInBlanks(): string {
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
}

/**
 * Exercise 5: Multiple Choice
 */
export function getExercise5_MultipleChoice(): string {
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
          "text": "I think this is ______ pizza I've ever eaten!",
          "options": [
            {"label": "A", "text": "delicious", "correct": false},
            {"label": "B", "text": "more delicious", "correct": false},
            {"label": "C", "text": "most delicious", "correct": false},
            {"label": "D", "text": "the most delicious", "correct": true}
          ]
        },
        {
          "text": "The service here is not ______ fast as at McDonald's.",
          "options": [
            {"label": "A", "text": "as", "correct": true},
            {"label": "B", "text": "so", "correct": false},
            {"label": "C", "text": "than", "correct": false},
            {"label": "D", "text": "more", "correct": false}
          ]
        },
        {
          "text": "This soup is much ______ than I expected.",
          "options": [
            {"label": "A", "text": "hot", "correct": false},
            {"label": "B", "text": "hotter", "correct": true},
            {"label": "C", "text": "hottest", "correct": false},
            {"label": "D", "text": "more hot", "correct": false}
          ]
        },
        {
          "text": "The prices at this restaurant are ______ in the neighborhood.",
          "options": [
            {"label": "A", "text": "expensive", "correct": false},
            {"label": "B", "text": "more expensive", "correct": false},
            {"label": "C", "text": "most expensive", "correct": false},
            {"label": "D", "text": "the most expensive", "correct": true}
          ]
        }
      ],
      "teacher_tip": "Focus on discussing why the incorrect options are wrong. This helps reinforce the grammar rules and prevents common mistakes."
    }`;
}

/**
 * Exercise 6: Dialogue
 */
export function getExercise6_Dialogue(): string {
  return `    {
      "type": "dialogue",
      "title": "Exercise 6: Role-play Dialogue",
      "icon": "fa-comments",
      "time": 10,
      "instructions": "Practice this dialogue with your teacher. One person is the customer, and the other is the waiter. Then create your own dialogue using the expressions below.",
      "dialogue": [
        {"speaker": "Waiter", "text": "Good evening! Do you have a reservation?"},
        {"speaker": "Customer", "text": "Yes, we have a table for two under the name Johnson."},
        {"speaker": "Waiter", "text": "Perfect! Right this way, please. Here are your menus."},
        {"speaker": "Customer", "text": "Thank you. Could I have a few minutes to decide?"},
        {"speaker": "Waiter", "text": "Of course! Take your time. Can I start you with something to drink?"},
        {"speaker": "Customer", "text": "I'll have a glass of white wine, please."},
        {"speaker": "Waiter", "text": "Excellent choice. And for you, sir?"},
        {"speaker": "Customer 2", "text": "Just water for me, thanks."},
        {"speaker": "Waiter", "text": "No problem. I'll be right back with your drinks."},
        {"speaker": "Customer", "text": "Excuse me, I think there's a problem with my order."},
        {"speaker": "Waiter", "text": "Oh no! What seems to be the issue?"},
        {"speaker": "Customer", "text": "I ordered the salmon, but this appears to be chicken."},
        {"speaker": "Waiter", "text": "I'm so sorry about that mistake. Let me fix this right away."},
        {"speaker": "Customer", "text": "Thank you, I appreciate it."}
      ],
      "expressions": [
        {"phrase": "Do you have a reservation?", "meaning": "Asking if someone has booked a table in advance"},
        {"phrase": "Right this way, please", "meaning": "Polite way to ask someone to follow you"},
        {"phrase": "Could I have a few minutes?", "meaning": "Asking for more time to make a decision"},
        {"phrase": "Take your time", "meaning": "Telling someone they don't need to hurry"},
        {"phrase": "What seems to be the issue?", "meaning": "Politely asking about a problem"},
        {"phrase": "Let me fix this right away", "meaning": "Promising to solve the problem immediately"},
        {"phrase": "I appreciate it", "meaning": "A polite way to say thank you"}
      ],
      "teacher_tip": "After practicing the dialogue, encourage the student to create their own restaurant scenario. You can role-play different situations like ordering dessert, asking for the check, or making a reservation over the phone."
    }`;
}

/**
 * Exercise 7: Discussion
 */
export function getExercise7_Discussion(): string {
  return `    {
      "type": "discussion",
      "title": "Exercise 7: Discussion Questions",
      "icon": "fa-users",
      "time": 10,
      "instructions": "Discuss these questions with your teacher. Give detailed answers and examples from your own experience.",
      "questions": [
        {"text": "What is the most popular type of cuisine in your country? Why do you think it's so popular?"},
        {"text": "Describe the worst restaurant experience you've ever had. What went wrong, and how did you handle the situation?"},
        {"text": "Do you prefer eating at expensive restaurants or simple, casual places? Explain your preference."},
        {"text": "What would you do if you received the wrong order at a restaurant? How would you complain politely?"},
        {"text": "Are food trucks popular in your city? What kind of food do they typically serve?"},
        {"text": "How important is it for restaurants to offer vegetarian or vegan options? Why?"},
        {"text": "Describe your ideal restaurant. What kind of atmosphere, service, and food would it have?"},
        {"text": "Have you ever worked in the food service industry? What was it like dealing with customer complaints?"}
      ],
      "teacher_tip": "Encourage the student to give personal examples and detailed explanations. Follow up on interesting points they mention to keep the conversation flowing naturally."
    }`;
}

/**
 * Exercise 8: Error Correction
 */
export function getExercise8_ErrorCorrection(): string {
  return `    {
      "type": "error-correction",
      "title": "Exercise 8: Error Correction",
      "icon": "fa-edit",
      "time": 8,
      "instructions": "Each sentence contains one grammatical error. Find and correct the mistake.",
      "sentences": [
        {"incorrect": "This restaurant is more good than the previous one we visited.", "correct": "This restaurant is better than the previous one we visited.", "explanation": "Use 'better' (irregular comparative) instead of 'more good' for the adjective 'good'."},
        {"incorrect": "The pizza here is the most delicious than anywhere else in the city.", "correct": "The pizza here is more delicious than anywhere else in the city.", "explanation": "Use 'more delicious than' (comparative) when comparing two things, not superlative 'most delicious'."},
        {"incorrect": "My soup is not so hot as yours.", "correct": "My soup is not as hot as yours.", "explanation": "Use 'as...as' structure for equality comparisons, not 'so...as' in negative contexts."},
        {"incorrect": "This is the better meal I have ever had in my life.", "correct": "This is the best meal I have ever had in my life.", "explanation": "Use superlative 'best' when comparing among three or more items, not comparative 'better'."},
        {"incorrect": "The service was more slow than I expected.", "correct": "The service was slower than I expected.", "explanation": "One-syllable adjectives like 'slow' form comparatives with '-er', not 'more'."},
        {"incorrect": "This restaurant is expensiver than the one downtown.", "correct": "This restaurant is more expensive than the one downtown.", "explanation": "Multi-syllable adjectives like 'expensive' use 'more' for comparatives, not '-er' endings."},
        {"incorrect": "The waitress was the most friendliest person in the restaurant.", "correct": "The waitress was the friendliest person in the restaurant.", "explanation": "Don't use 'most' with superlatives that already end in '-est'. Use either 'most friendly' or 'friendliest'."},
        {"incorrect": "Today's special is as expensive than the regular menu items.", "correct": "Today's special is as expensive as the regular menu items.", "explanation": "Use 'as...as' for equality comparisons, not 'as...than'."}
      ],
      "teacher_tip": "After correcting each sentence, ask the student to explain why the original sentence was wrong. This reinforces their understanding of comparative and superlative rules."
    }`;
}

/**
 * Exercise map for easy selection
 */
export const EXERCISE_MAP = {
  1: { name: 'reading', func: getExercise1_Reading },
  2: { name: 'true-false', func: getExercise2_TrueFalse },
  3: { name: 'matching', func: getExercise3_Matching },
  4: { name: 'fill-in-blanks', func: getExercise4_FillInBlanks },
  5: { name: 'multiple-choice', func: getExercise5_MultipleChoice },
  6: { name: 'dialogue', func: getExercise6_Dialogue },
  7: { name: 'discussion', func: getExercise7_Discussion },
  8: { name: 'error-correction', func: getExercise8_ErrorCorrection }
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use getSelectedExercises instead
 */
export function getExerciseExamples(hasGrammarFocus: boolean, grammarFocus: string = ''): string {
  return getSelectedExercises([1, 2, 3, 4, 5, 6, 7, 8], hasGrammarFocus, grammarFocus);
}

/**
 * Dynamic exercise selection function
 */
export function getSelectedExercises(exerciseNumbers: number[], hasGrammarFocus: boolean, grammarFocus: string = ''): string {
  console.log(`🎯 Building exercises: ${exerciseNumbers.length} exercises (${exerciseNumbers.join(', ')})`);
  
  const grammarSection = getGrammarRulesSection(hasGrammarFocus, grammarFocus);
  
  const exercisesList = exerciseNumbers
    .map(num => {
      const exercise = EXERCISE_MAP[num as keyof typeof EXERCISE_MAP];
      if (!exercise) {
        console.error(`❌ Exercise ${num} not found in EXERCISE_MAP`);
        return null;
      }
      console.log(`✅ Adding exercise ${num}: ${exercise.name}`);
      return exercise.func();
    })
    .filter(Boolean)
    .join(',\n');

  console.log(`📝 Generated exercises JSON length: ${exercisesList.length} characters`);

  return `
EXAMPLE OUTPUT (IGNORE CONTENT, FOCUS ON STRUCTURE):
{
  "title": "In a restaurant",
  "subtitle": "Making a complaint about your dish in a restaurant: adjectives practice",
  "introduction": "In this lesson, you'll practice a restaurant role-play, learn how to order food, and make a complaint about an incorrect order. You'll also review grammar related to adjectives in their comparative and superlative forms.",
  ${grammarSection}
  "exercises": [
${exercisesList}
  ],
  ${getWarmupQuestions()}
  ${getVocabularySheet()}
  ${getTeacherNotes()}
}
END OF EXAMPLE`;
}

/**
 * Warmup questions section
 */
function getWarmupQuestions(): string {
  return `"warmup_questions": [
    {"question": "Do you enjoy trying new restaurants? What's your favorite type of food?"},
    {"question": "When was the last time you ate at a restaurant? What did you order?"},
    {"question": "Have you ever had any problems with food or service at a restaurant?"}
  ],`;
}

/**
 * Vocabulary sheet section
 */
function getVocabularySheet(): string {
  return `"vocabulary_sheet": {
    "title": "Restaurant Vocabulary",
    "words": [
      {"word": "appetizer", "definition": "A small dish served before the main course", "example": "We shared a cheese appetizer before our main meals."},
      {"word": "reservation", "definition": "A table booked in advance at a restaurant", "example": "I made a reservation for 7 PM at the Italian restaurant."},
      {"word": "complaint", "definition": "An expression of dissatisfaction about service or food", "example": "The manager handled our complaint about the cold soup very professionally."},
      {"word": "portion", "definition": "The amount of food served to one person", "example": "The portion was so large that I couldn't finish it all."},
      {"word": "cuisine", "definition": "A style of cooking from a particular country or region", "example": "Thai cuisine is known for its spicy flavors and fresh ingredients."},
      {"word": "bill/check", "definition": "The amount of money you need to pay for your meal", "example": "Could we have the bill, please? We'd like to pay now."},
      {"word": "tip", "definition": "Extra money given to restaurant staff for good service", "example": "In the US, it's customary to leave a 15-20% tip."},
      {"word": "menu", "definition": "A list of food and drinks available at a restaurant", "example": "The menu had so many options that it was hard to choose."}
    ]
  },`;
}

/**
 * Teacher notes section
 */
function getTeacherNotes(): string {
  return `"teacher_notes": {
    "lesson_focus": "This lesson combines restaurant vocabulary, complaint expressions, and comparative/superlative adjective practice in real-world contexts.",
    "key_points": [
      "Students practice making polite complaints using comparative structures",
      "Role-play activities build confidence in restaurant situations",
      "Grammar focus reinforces adjective comparison rules through practical examples",
      "Discussion questions encourage personal sharing and opinion expression"
    ],
    "extension_activities": [
      "Have students create their own restaurant menu with comparative descriptions",
      "Practice ordering food over the phone to make a delivery order",
      "Write a restaurant review using comparative and superlative adjectives"
    ],
    "common_mistakes": [
      "Using 'more better' instead of 'better'",
      "Forgetting 'the' before superlatives",
      "Mixing up 'than' and 'as' in comparisons"
    ]
  }`;
}