/**
 * Exercise templates for generating example structures in the prompt
 */

export const getReadingExerciseTemplate = () => `    {
      "type": "reading",
      "title": "Exercise 1: Reading Comprehension",
      "instruction": "Read the text and answer the questions below.",
      "content": {
        "text": "New York City is famous for its incredible diversity of restaurants. From street vendors selling hot dogs to Michelin-starred establishments, the city offers something for every taste and budget. Many visitors are surprised to discover that some of the best food comes from small, family-owned restaurants in neighborhoods like Chinatown, Little Italy, and Jackson Heights. These authentic eateries often serve traditional recipes that have been passed down through generations. Food critics recommend trying at least three different cuisines during a visit to truly experience what makes New York's dining scene so special.",
        "questions": [
          {
            "question": "What makes New York City's restaurant scene special?",
            "answer": "Its incredible diversity of restaurants offering something for every taste and budget"
          },
          {
            "question": "Where can visitors find some of the best authentic food?",
            "answer": "In small, family-owned restaurants in neighborhoods like Chinatown, Little Italy, and Jackson Heights"
          },
          {
            "question": "What do these authentic eateries often serve?",
            "answer": "Traditional recipes that have been passed down through generations"
          },
          {
            "question": "How many different cuisines do food critics recommend trying?",
            "answer": "At least three different cuisines"
          },
          {
            "question": "What range of dining options does NYC offer?",
            "answer": "From street vendors selling hot dogs to Michelin-starred establishments"
          }
        ]
      },
      "teacher_tip": "This exercise introduces restaurant vocabulary while building reading comprehension skills. Ask students to share their own dining experiences in their home countries."
    }`;

export const getTrueFalseExerciseTemplate = () => `    {
      "type": "true-false",
      "title": "Exercise 2: True or False",
      "instruction": "Based on the reading text, decide if these statements are true or false.",
      "content": {
        "statements": [
          {
            "statement": "New York City only has expensive, high-end restaurants.",
            "answer": false
          },
          {
            "statement": "Some of the best food comes from small, family-owned restaurants.",
            "answer": true
          },
          {
            "statement": "Chinatown is mentioned as a place to find authentic food.",
            "answer": true
          },
          {
            "statement": "Food critics suggest trying only one cuisine during a visit.",
            "answer": false
          },
          {
            "statement": "Traditional recipes are often passed down through generations.",
            "answer": true
          },
          {
            "statement": "Street vendors only sell hot dogs in New York City.",
            "answer": false
          }
        ]
      },
      "teacher_tip": "Use this exercise to check comprehension and introduce the concept of inference. Students must distinguish between stated facts and assumptions."
    }`;

export const getMatchingExerciseTemplate = () => `    {
      "type": "matching",
      "title": "Exercise 3: Vocabulary Matching",
      "instruction": "Match the restaurant terms with their correct definitions.",
      "content": {
        "items": [
          {
            "term": "Michelin-starred",
            "definition": "A restaurant awarded stars by the prestigious Michelin Guide for exceptional quality"
          },
          {
            "term": "Street vendor",
            "definition": "A person who sells food from a cart or stand on the street"
          },
          {
            "term": "Authentic",
            "definition": "Genuine and true to the original tradition or culture"
          },
          {
            "term": "Eatery",
            "definition": "A casual term for a restaurant or place where food is served"
          },
          {
            "term": "Cuisine",
            "definition": "A style of cooking characteristic of a particular country or region"
          },
          {
            "term": "Establishment",
            "definition": "A business, especially a restaurant or hotel"
          },
          {
            "term": "Food critic",
            "definition": "A professional who reviews and evaluates restaurants and food"
          },
          {
            "term": "Dining scene",
            "definition": "The overall restaurant and food culture of a particular place"
          }
        ]
      },
      "teacher_tip": "This vocabulary directly relates to the reading text. After matching, have students create sentences using these terms to reinforce learning."
    }`;

export const getFillInBlanksExerciseTemplate = () => `    {
      "type": "fill-in-blanks",
      "title": "Exercise 4: Fill in the Blanks",
      "instruction": "Complete the sentences using the words from the word bank. Use each word only once.",
      "content": {
        "sentences": [
          "The waiter recommended the chef's _______ for tonight.",
          "Could you please bring us the _______ so we can see the prices?",
          "I'd like to make a _______ for two people at 7 PM.",
          "The restaurant has a great _______ with live jazz music.",
          "This dish has too much salt - it's very _______.",
          "The service was excellent, so we left a generous _______.",
          "They serve the most _______ Italian pasta in the city.",
          "The _______ was so friendly and helped us choose our meals."
        ],
        "word_bank": ["special", "menu", "reservation", "atmosphere", "salty", "tip", "delicious", "server"],
        "answers": ["special", "menu", "reservation", "atmosphere", "salty", "tip", "delicious", "server"]
      },
      "teacher_tip": "This exercise reinforces restaurant vocabulary in context. Encourage students to explain why each word fits in its specific sentence."
    }`;

export const getMultipleChoiceExerciseTemplate = () => `    {
      "type": "multiple-choice",
      "title": "Exercise 5: Multiple Choice - Comparative and Superlative Adjectives",
      "instruction": "Choose the correct form of the adjective to complete each sentence.",
      "content": {
        "questions": [
          {
            "question": "This restaurant is _______ than the one we went to yesterday.",
            "options": [
              "a) more expensive",
              "b) most expensive", 
              "c) expensive",
              "d) expensiver"
            ],
            "correct_answer": "a",
            "explanation": "Use 'more + adjective' for comparative form with adjectives of 2+ syllables"
          },
          {
            "question": "This is the _______ meal I've ever had!",
            "options": [
              "a) more delicious",
              "b) most delicious",
              "c) delicious", 
              "d) deliciouser"
            ],
            "correct_answer": "b",
            "explanation": "Use 'most + adjective' for superlative form with adjectives of 2+ syllables"
          },
          {
            "question": "The pizza here is _______ than at that famous Italian place.",
            "options": [
              "a) good",
              "b) better",
              "c) best",
              "d) more good"
            ],
            "correct_answer": "b", 
            "explanation": "'Better' is the irregular comparative form of 'good'"
          },
          {
            "question": "This is the _______ restaurant in the neighborhood.",
            "options": [
              "a) busy",
              "b) busier", 
              "c) busiest",
              "d) most busy"
            ],
            "correct_answer": "c",
            "explanation": "For one-syllable adjectives ending in 'y', change 'y' to 'i' and add '-est' for superlative"
          },
          {
            "question": "The service here is _______ than I expected.",
            "options": [
              "a) fast",
              "b) faster",
              "c) fastest", 
              "d) more fast"
            ],
            "correct_answer": "b",
            "explanation": "For one-syllable adjectives, add '-er' for comparative form"
          },
          {
            "question": "Among all the desserts, the chocolate cake is the _______.",
            "options": [
              "a) sweet",
              "b) sweeter",
              "c) sweetest",
              "d) most sweet"
            ],
            "correct_answer": "c",
            "explanation": "For one-syllable adjectives, add '-est' for superlative form"
          }
        ]
      },
      "teacher_tip": "Focus on the rules for forming comparatives and superlatives. Have students identify whether adjectives are one syllable, two syllables, or irregular forms."
    }`;

export const getDialogueExerciseTemplate = () => `    {
      "type": "dialogue",
      "title": "Exercise 6: Dialogue Practice",
      "instruction": "Practice this conversation between a customer and server. Pay attention to polite expressions and restaurant vocabulary.",
      "content": {
        "dialogue": [
          {
            "speaker": "Server",
            "text": "Good evening! Welcome to Mario's. Do you have a reservation?"
          },
          {
            "speaker": "Customer", 
            "text": "Yes, we have a table for two under the name Johnson."
          },
          {
            "speaker": "Server",
            "text": "Perfect! Right this way, please. Here are your menus. Can I start you off with something to drink?"
          },
          {
            "speaker": "Customer",
            "text": "I'll have a glass of red wine, and my friend will have sparkling water, please."
          },
          {
            "speaker": "Server", 
            "text": "Excellent choices. Have you had a chance to look at our specials for tonight?"
          },
          {
            "speaker": "Customer",
            "text": "Not yet. What would you recommend?"
          },
          {
            "speaker": "Server",
            "text": "Our grilled salmon with lemon butter sauce is very popular, and the chicken parmesan is fantastic."
          },
          {
            "speaker": "Customer",
            "text": "The salmon sounds delicious. I'll have that, please."
          },
          {
            "speaker": "Server",
            "text": "Great choice! And for your friend?"
          },
          {
            "speaker": "Customer",
            "text": "She's still deciding. Could we have a few more minutes?"
          }
        ],
        "key_expressions": [
          "Do you have a reservation?",
          "Right this way, please",
          "Can I start you off with...?", 
          "What would you recommend?",
          "Could we have a few more minutes?"
        ]
      },
      "teacher_tip": "Have students practice this dialogue, then create their own version using different dishes and drinks. Focus on polite language and natural flow."
    }`;

export const getDiscussionExerciseTemplate = () => `    {
      "type": "discussion", 
      "title": "Exercise 7: Discussion Questions",
      "instruction": "Discuss these questions with your teacher. Give detailed answers and examples from your own experience.",
      "content": {
        "questions": [
          "What's your favorite type of cuisine and why? Describe a memorable meal you've had.",
          "How important is the atmosphere of a restaurant to you? What makes a good dining atmosphere?",
          "Do you prefer to cook at home or eat out? What are the advantages and disadvantages of each?",
          "Have you ever had a bad experience at a restaurant? What happened and how was it resolved?", 
          "What dining customs from your country might surprise foreign visitors?",
          "If you could open your own restaurant, what type of food would you serve and why?"
        ]
      },
      "teacher_tip": "Encourage students to give detailed responses and share personal experiences. This develops fluency and confidence in expressing opinions."
    }`;

export const getErrorCorrectionExerciseTemplate = () => `    {
      "type": "error-correction",
      "title": "Exercise 8: Error Correction",
      "instruction": "Find and correct the mistakes in these sentences. Each sentence has one error related to comparative and superlative adjectives.",
      "content": {
        "sentences": [
          {
            "incorrect": "This restaurant is more good than the last one we tried.",
            "correct": "This restaurant is better than the last one we tried.",
            "error_type": "Irregular comparative form"
          },
          {
            "incorrect": "She ordered the most spiciest dish on the menu.",
            "correct": "She ordered the spiciest dish on the menu.",
            "error_type": "Double superlative"
          },
          {
            "incorrect": "The service here is more fast than at other places.",
            "correct": "The service here is faster than at other places.", 
            "error_type": "Wrong comparative form for one-syllable adjective"
          },
          {
            "incorrect": "This is the most delicious cake I never tasted.",
            "correct": "This is the most delicious cake I have ever tasted.",
            "error_type": "Wrong auxiliary verb with superlative"
          },
          {
            "incorrect": "The pizza was more better than I expected.",
            "correct": "The pizza was better than I expected.",
            "error_type": "Double comparative"
          },
          {
            "incorrect": "This is the expensivest restaurant in town.",
            "correct": "This is the most expensive restaurant in town.",
            "error_type": "Wrong superlative form for multi-syllable adjective"
          }
        ]
      },
      "teacher_tip": "Review the rules for forming comparatives and superlatives after this exercise. Focus on irregular forms and common mistakes students make."
    }`;

export const getVocabularySheetTemplate = () => `  "vocabulary_sheet": {
    "title": "Essential Restaurant Vocabulary",
    "words": [
      {
        "word": "Reservation",
        "meaning": "A booking or arrangement to have a table at a restaurant at a specific time"
      },
      {
        "word": "Menu",
        "meaning": "A list of food and drinks available in a restaurant with their prices"
      },
      {
        "word": "Appetizer",
        "meaning": "A small dish served before the main course to stimulate the appetite"
      },
      {
        "word": "Main course", 
        "meaning": "The principal dish of a meal, usually the largest and most substantial"
      },
      {
        "word": "Dessert",
        "meaning": "A sweet course eaten at the end of a meal"
      },
      {
        "word": "Bill/Check",
        "meaning": "The written statement of charges for food and drinks in a restaurant"
      },
      {
        "word": "Tip/Gratuity",
        "meaning": "Extra money given to the server for good service"
      },
      {
        "word": "Specials",
        "meaning": "Dishes that are not on the regular menu, often featuring seasonal ingredients"
      },
      {
        "word": "To order",
        "meaning": "To request food or drinks from a server in a restaurant"
      },
      {
        "word": "Rare/Medium/Well-done",
        "meaning": "Different levels of cooking for meat, especially steak"
      },
      {
        "word": "House wine",
        "meaning": "The restaurant's standard, usually affordable wine selection"
      },
      {
        "word": "Cuisine",
        "meaning": "A style of cooking, especially one characteristic of a particular country"
      },
      {
        "word": "Fresh",
        "meaning": "Recently made, prepared, or harvested; not preserved or processed"
      },
      {
        "word": "Spicy",
        "meaning": "Having a strong, hot flavor from spices like chili peppers"
      },
      {
        "word": "Tender",
        "meaning": "Easy to chew; soft texture, especially referring to meat"
      }
    ]
  }`;

export const getGrammarRulesTemplate = (grammarFocus: string) => `  "grammar_rules": {
    "title": "Grammar Focus: ${grammarFocus}",
    "introduction": "Adjectives are words that describe or modify nouns, providing information about qualities such as size, color, shape, age, and many others. When we want to compare people, objects, or ideas, we use adjectives in their comparative or superlative forms.\\n\\nComparatives are used to compare two things or people, showing that one has a higher or lower degree of a particular quality than the other. For example, when saying \\"John is taller than Mike,\\" the adjective \\"taller\\" is in the comparative form, indicating a comparison between two individuals. Comparatives are often followed by the word \\"than\\" to introduce the second element of comparison.\\n\\nSuperlatives, on the other hand, are used to describe the extreme or highest degree of a quality among three or more things or people. For example, \\"Anna is the tallest in her class\\" uses the superlative form \\"tallest\\" to indicate that Anna has the greatest height compared to all others in the group. Superlatives are usually preceded by the definite article \\"the\\".\\n\\nThe formation of comparatives and superlatives depends largely on the length and ending of the adjective. One-syllable adjectives usually form comparatives and superlatives by adding the suffixes \\"-er\\" and \\"-est\\". For adjectives with two syllables or more, especially those with three or more syllables, the words \\"more\\" and \\"most\\" are used before the adjective instead of adding suffixes.\\n\\nSome adjectives have irregular comparative and superlative forms that must be memorized as they do not follow standard patterns. For instance, \\"good\\" becomes \\"better\\" (comparative) and \\"best\\" (superlative).\\n\\nIn addition to indicating comparisons of difference, adjectives can also be used to express equality, using the structure \\"as + adjective + as\\" to show that two things share the same degree of a quality.\\n\\nUnderstanding and correctly using comparatives and superlatives is essential for effective communication, enabling speakers and writers to accurately compare qualities and express degrees of difference or similarity.",
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