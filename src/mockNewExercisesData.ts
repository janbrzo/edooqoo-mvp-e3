export const mockNewExercisesData = {
  "title": "New Exercise Types - Test Worksheet",
  "subtitle": "Testing all 6 new exercise types: Advanced English Practice",
  "introduction": "This is a test worksheet showcasing all the new exercise types that have been implemented. Use this to preview and test the functionality of each new exercise format.",
  "warmup_questions": [
    "How do you feel about trying new types of English exercises?",
    "What learning methods work best for you?",
    "Do you prefer exercises that challenge your thinking or focus on specific skills?"
  ],
  "exercises": [
    {
      "type": "odd-one-out",
      "title": "Odd One Out",
      "icon": "Target",
      "time": 6,
      "instructions": "In each group, identify the word that doesn't belong and explain why.",
      "questions": [
        {
          "instruction": "Which word doesn't belong?",
          "options": ["happy", "joyful", "elated", "angry", "cheerful"],
          "correct_answer": "angry"
        },
        {
          "instruction": "Which word doesn't belong?",
          "options": ["car", "bicycle", "train", "airplane", "book"],
          "correct_answer": "book"
        },
        {
          "instruction": "Which word doesn't belong?",
          "options": ["doctor", "teacher", "lawyer", "student", "engineer"],
          "correct_answer": "student"
        },
        {
          "instruction": "Which word doesn't belong?",
          "options": ["winter", "spring", "Monday", "summer", "autumn"],
          "correct_answer": "Monday"
        }
      ],
      "teacher_tip": "Encourage students to explain their reasoning and discuss alternative answers."
    },
    {
      "type": "synonyms-antonyms",
      "title": "Synonyms and Antonyms Matching",
      "icon": "ArrowLeftRight",
      "time": 8,
      "instructions": "Find the synonym or antonym for each word as indicated.",
      "items": [
        {
          "word": "big",
          "type": "synonym",
          "answer": "large"
        },
        {
          "word": "fast",
          "type": "synonym", 
          "answer": "quick"
        },
        {
          "word": "happy",
          "type": "antonym",
          "answer": "sad"
        },
        {
          "word": "difficult",
          "type": "synonym",
          "answer": "hard"
        },
        {
          "word": "beautiful",
          "type": "synonym",
          "answer": "gorgeous"
        },
        {
          "word": "cold",
          "type": "antonym",
          "answer": "hot"
        }
      ],
      "teacher_tip": "Practice pronunciation and encourage students to use these words in sentences."
    },
    {
      "type": "sentence-transformation",
      "title": "Sentence Transformation",
      "icon": "RotateCw",
      "time": 10,
      "instructions": "Transform each sentence according to the given instruction.",
      "sentences": [
        {
          "instruction": "Change to passive voice:",
          "original": "The chef prepared the meal.",
          "transformed": "The meal was prepared by the chef."
        },
        {
          "instruction": "Change to question form:",
          "original": "She speaks French fluently.",
          "transformed": "Does she speak French fluently?"
        },
        {
          "instruction": "Change to negative form:",
          "original": "They have finished their homework.",
          "transformed": "They haven't finished their homework."
        },
        {
          "instruction": "Change to past tense:",
          "original": "He goes to work by bus.",
          "transformed": "He went to work by bus."
        }
      ],
      "teacher_tip": "Focus on grammar rules and encourage students to explain the transformations."
    },
    {
      "type": "word-order",
      "title": "Word Order Exercise",
      "icon": "ArrowUpDown",
      "time": 7,
      "instructions": "Arrange the scrambled words to form correct sentences.",
      "sentences": [
        {
          "scrambled_words": "always / coffee / morning / drinks / she / in / the",
          "correct_order": "She always drinks coffee in the morning."
        },
        {
          "scrambled_words": "are / studying / students / the / library / in / quietly / the",
          "correct_order": "The students are studying quietly in the library."
        },
        {
          "scrambled_words": "never / homework / his / forgets / to / do / he",
          "correct_order": "He never forgets to do his homework."
        },
        {
          "scrambled_words": "beautiful / flowers / garden / the / has / many / in / it",
          "correct_order": "The garden has many beautiful flowers in it."
        }
      ],
      "teacher_tip": "Emphasize word order rules and sentence structure patterns."
    },
    {
      "type": "gap-text",
      "title": "Gap Text Exercise",
      "icon": "FileText",
      "time": 12,
      "instructions": "Read the text and fill in the missing words from the word bank.",
      "word_bank": ["challenging", "difficult", "practice", "improve", "study", "mistakes", "opportunity"],
      "sentences": [
        {
          "text": "Learning English can be both _____ and rewarding.",
          "answer": "challenging"
        },
        {
          "text": "Many students find it _____ to master grammar rules.",
          "answer": "difficult"
        },
        {
          "text": "With regular _____ and dedication, anyone can improve.",
          "answer": "practice"
        },
        {
          "text": "The key is to _____ consistently every day.",
          "answer": "study"
        },
        {
          "text": "Don't be afraid of making _____ - they help you learn.",
          "answer": "mistakes"
        },
        {
          "text": "Every mistake is a learning _____ that helps you grow.",
          "answer": "opportunity"
        }
      ],
      "teacher_tip": "Discuss the meaning of each word and encourage students to use context clues."
    },
    {
      "type": "negative-prefixes",
      "title": "Negative Prefixes",
      "icon": "Minus",
      "time": 8,
      "instructions": "Add the correct negative prefix (un-, in-, dis-, im-, ir-, il-) to make each word negative.",
      "words": [
        {
          "word": "happy",
          "answer": "unhappy"
        },
        {
          "word": "possible",
          "answer": "impossible"
        },
        {
          "word": "agree",
          "answer": "disagree"
        },
        {
          "word": "regular",
          "answer": "irregular"
        },
        {
          "word": "correct",
          "answer": "incorrect"
        },
        {
          "word": "legal",
          "answer": "illegal"
        }
      ],
      "teacher_tip": "Explain the rules for choosing the correct prefix and provide more examples."
    }
  ],
  "vocabulary_sheet": [
    {
      "term": "Odd one out",
      "meaning": "The item that is different from the others in a group"
    },
    {
      "term": "Synonym",
      "meaning": "A word that has the same or similar meaning as another word"
    },
    {
      "term": "Antonym",
      "meaning": "A word that means the opposite of another word"
    },
    {
      "term": "Transformation",
      "meaning": "The process of changing something into a different form"
    },
    {
      "term": "Word order",
      "meaning": "The sequence in which words are arranged in a sentence"
    },
    {
      "term": "Gap text",
      "meaning": "A reading exercise with missing words to be filled in"
    },
    {
      "term": "Prefix",
      "meaning": "A letter or group of letters added to the beginning of a word"
    },
    {
      "term": "Negative prefix",
      "meaning": "A prefix that makes a word negative or opposite in meaning"
    }
  ]
};