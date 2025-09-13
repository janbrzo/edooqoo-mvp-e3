export const mockNewExercisesData = {
  "title": "Complete Exercise Types - Full Test Worksheet",
  "subtitle": "Testing all 20 exercise types: Comprehensive English Practice",
  "introduction": "This comprehensive worksheet showcases all exercise types available in the system. Use this to test and preview each format's functionality including basic exercises and advanced new types.",
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
      "time": 8,
      "instructions": "In each group, identify the word that doesn't belong:",
      "questions": [
        {
          "options": ["happy", "joyful", "elated", "angry", "cheerful"],
          "correct_answer": "angry"
        },
        {
          "options": ["car", "bicycle", "train", "airplane", "book"],
          "correct_answer": "book"
        },
        {
          "options": ["doctor", "teacher", "lawyer", "student", "engineer"],
          "correct_answer": "student"
        },
        {
          "options": ["winter", "spring", "Monday", "summer", "autumn"],
          "correct_answer": "Monday"
        },
        {
          "options": ["red", "green", "blue", "circle", "yellow"],
          "correct_answer": "circle"
        },
        {
          "options": ["apple", "banana", "orange", "carrot", "grape"],
          "correct_answer": "carrot"
        },
        {
          "options": ["walk", "run", "jump", "sing", "dance"],
          "correct_answer": "sing"
        },
        {
          "options": ["Monday", "Tuesday", "Wednesday", "weekend", "Thursday"],
          "correct_answer": "weekend"
        }
      ],
      "teacher_tip": "Encourage students to explain their reasoning. There may be multiple valid answers depending on the categorization logic."
    },
    {
      "type": "synonyms-antonyms",
      "title": "Synonyms & Antonyms Matching",
      "icon": "Link",
      "time": 10,
      "instructions": "Match each word with its synonym or antonym from the options provided.",
      "items": [
        { "term": "Happy", "definition": "Joyful", "letter": "A" },
        { "term": "Big", "definition": "Large", "letter": "B" },
        { "term": "Fast", "definition": "Quick", "letter": "C" },
        { "term": "Cold", "definition": "Freezing", "letter": "D" },
        { "term": "Difficult", "definition": "Hard", "letter": "E" },
        { "term": "Beautiful", "definition": "Attractive", "letter": "F" },
        { "term": "Smart", "definition": "Intelligent", "letter": "G" },
        { "term": "Angry", "definition": "Furious", "letter": "H" }
      ],
      "teacher_tip": "Review the difference between synonyms and antonyms. Discuss context in which different synonyms might be more appropriate."
    },
    {
      "type": "sentence-transformation",
      "title": "Sentence Transformation",
      "icon": "RotateCcw",
      "time": 12,
      "instructions": "Transform these sentences using the instructions:",
      "sentences": [
        {
          "original": "They built this house in 2005.",
          "instruction": "Rewrite in passive voice",
          "transformed": "This house was built in 2005."
        },
        {
          "original": "She started working here five years ago.",
          "instruction": "Use present perfect continuous",
          "transformed": "She has been working here for five years."
        },
        {
          "original": "They will probably arrive late.",
          "instruction": "Use 'likely to'",
          "transformed": "They are likely to arrive late."
        },
        {
          "original": "I suggest that you call him.",
          "instruction": "Use modal verb",
          "transformed": "You should call him."
        },
        {
          "original": "It's possible that it will rain.",
          "instruction": "Use 'might'",
          "transformed": "It might rain."
        },
        {
          "original": "He couldn't solve the problem.",
          "instruction": "Use 'was unable to'",
          "transformed": "He was unable to solve the problem."
        },
        {
          "original": "The meeting was postponed because of the rain.",
          "instruction": "Use 'due to'",
          "transformed": "The meeting was postponed due to the rain."
        },
        {
          "original": "She is very good at playing piano.",
          "instruction": "Use adjective 'talented'",
          "transformed": "She is very talented at playing piano."
        }
      ],
      "teacher_tip": "Focus on maintaining the original meaning while changing the grammatical structure. Discuss different ways to express the same idea."
    },
    {
      "type": "word-order",
      "title": "Word Order Exercise",
      "icon": "ArrowUpDown",
      "time": 8,
      "instructions": "Put the words in the correct order to make sentences.",
      "sentences": [
        {
          "scrambled_words": "always / she / coffee / morning / drinks / in / the",
          "correct_order": "She always drinks coffee in the morning."
        },
        {
          "scrambled_words": "have / I / never / to / London / been",
          "correct_order": "I have never been to London."
        },
        {
          "scrambled_words": "playing / children / garden / are / the / in / the",
          "correct_order": "The children are playing in the garden."
        },
        {
          "scrambled_words": "will / tomorrow / we / early / leave",
          "correct_order": "We will leave early tomorrow."
        },
        {
          "scrambled_words": "has / finished / homework / already / his / he",
          "correct_order": "He has already finished his homework."
        },
        {
          "scrambled_words": "carefully / drives / always / my / father",
          "correct_order": "My father always drives carefully."
        },
        {
          "scrambled_words": "studying / has / English / been / she / years / for / three",
          "correct_order": "She has been studying English for three years."
        },
        {
          "scrambled_words": "might / rain / it / afternoon / this",
          "correct_order": "It might rain this afternoon."
        }
      ],
      "teacher_tip": "Review word order rules, especially adverb placement and auxiliary verb positions. Encourage students to read sentences aloud to check if they sound natural."
    },
    {
      "type": "gap-text",
      "title": "Gap Text (Cloze Test)",
      "icon": "Square",
      "time": 10,
      "instructions": "Fill in the gaps with the correct form of the verbs in brackets:",
      "sentences": [
        { "text": "Yesterday I ______ (go) to the supermarket to buy some groceries.", "answer": "went" },
        { "text": "The weather ______ (be) beautiful, so we decided to go for a walk.", "answer": "was" },
        { "text": "She has ______ (live) in Paris for five years now.", "answer": "been living" },
        { "text": "If I ______ (be) you, I would accept the job offer.", "answer": "were" },
        { "text": "The movie was so ______ (bore) that I fell asleep.", "answer": "boring" },
        { "text": "Can you ______ (do) me a favor and help me move this table?", "answer": "do" },
        { "text": "I'm looking ______ (forward) to seeing you again soon.", "answer": "forward" },
        { "text": "The train ______ (arrive) at 3:30 PM according to the schedule.", "answer": "should arrive" }
      ],
      "teacher_tip": "This exercise tests students' understanding of context and grammar. Discuss why certain words fit better than others in each gap."
    },
    {
      "type": "negative-prefixes",
      "title": "Negative Prefixes",
      "icon": "Minus",
      "time": 8,
      "instructions": "Add the correct negative prefix to make each word negative.",
      "words": [
        { "word": "happy", "answer": "unhappy" },
        { "word": "possible", "answer": "impossible" },
        { "word": "honest", "answer": "dishonest" },
        { "word": "regular", "answer": "irregular" },
        { "word": "legal", "answer": "illegal" },
        { "word": "complete", "answer": "incomplete" },
        { "word": "correct", "answer": "incorrect" },
        { "word": "polite", "answer": "impolite" }
      ],
      "teacher_tip": "Explain the different negative prefixes (un-, in-, dis-, im-, ir-, il-) and their usage patterns. Point out that the choice often depends on the first letter of the word."
    },
    {
      "type": "categorize",
      "title": "Word Categorization",
      "icon": "Grid3X3",
      "time": 10,
      "instructions": "Sort the words into the correct categories.",
      "words": [
        "apple", "car", "shirt", "banana", "bus", "dress", "orange", "train", 
        "jacket", "grape", "bicycle", "trousers", "pear", "truck", "sweater", 
        "strawberry", "motorcycle", "skirt", "peach", "taxi", "laptop", "phone", "tablet", "computer"
      ],
      "categories": [
        { "name": "Fruits", "words": ["apple", "banana", "orange", "grape", "pear", "strawberry", "peach"] },
        { "name": "Transportation", "words": ["car", "bus", "train", "bicycle", "truck", "motorcycle", "taxi"] },
        { "name": "Clothing", "words": ["shirt", "dress", "jacket", "trousers", "sweater", "skirt"] },
        { "name": "Electronics", "words": ["laptop", "phone", "tablet", "computer"] }
      ],
      "teacher_tip": "This exercise helps students organize vocabulary thematically. Discuss borderline cases and different possible categorizations."
    },
    {
      "type": "paraphrasing",
      "title": "Paraphrasing Exercise",
      "icon": "RefreshCw",
      "time": 12,
      "instructions": "Rewrite each sentence using the word in brackets.",
      "sentences": [
        {
          "original": "I eat a lot of sweets.",
          "word_to_use": "sweet tooth",
          "answer": "I have a sweet tooth."
        },
        {
          "original": "He tends to worry about everything.",
          "word_to_use": "anxious",
          "answer": "He is anxious about everything."
        },
        {
          "original": "She never gives up easily.",
          "word_to_use": "persistent",
          "answer": "She is very persistent."
        },
        {
          "original": "The presentation went very well.",
          "word_to_use": "success",
          "answer": "The presentation was a success."
        },
        {
          "original": "I can't remember where I put my keys.",
          "word_to_use": "forgotten",
          "answer": "I have forgotten where I put my keys."
        },
        {
          "original": "The weather made our trip difficult.",
          "word_to_use": "challenging",
          "answer": "The weather made our trip challenging."
        },
        {
          "original": "She always helps other people.",
          "word_to_use": "helpful",
          "answer": "She is always helpful to other people."
        },
        {
          "original": "The movie was not interesting at all.",
          "word_to_use": "boring",
          "answer": "The movie was very boring."
        }
      ],
      "teacher_tip": "Focus on how the same meaning can be expressed using different grammatical structures and vocabulary choices."
    },
    {
      "type": "complete-word",
      "title": "Complete the Word",
      "icon": "Edit3",
      "time": 8,
      "instructions": "Complete the words using the definitions provided.",
      "words": [
        {
          "incomplete_word": "P_LL",
          "definition": "a type of medication in tablet form",
          "complete_word": "PILL"
        },
        {
          "incomplete_word": "BR_DGE",
          "definition": "a structure built over a river or road",
          "complete_word": "BRIDGE"
        },
        {
          "incomplete_word": "SC_SSORS",
          "definition": "a tool for cutting paper or fabric",
          "complete_word": "SCISSORS"
        },
        {
          "incomplete_word": "UMB_ELLA",
          "definition": "protection from rain or sun",
          "complete_word": "UMBRELLA"
        },
        {
          "incomplete_word": "K_TCHEN",
          "definition": "a room where food is prepared",
          "complete_word": "KITCHEN"
        },
        {
          "incomplete_word": "B_CYCLE",
          "definition": "a two-wheeled vehicle you pedal",
          "complete_word": "BICYCLE"
        },
        {
          "incomplete_word": "W_NDOW",
          "definition": "an opening in a wall to let light in",
          "complete_word": "WINDOW"
        },
        {
          "incomplete_word": "C_MP_TER",
          "definition": "an electronic device for processing data",
          "complete_word": "COMPUTER"
        }
      ],
      "teacher_tip": "This exercise combines spelling practice with vocabulary recognition. Encourage students to use context clues from the definitions."
    },
    {
      "type": "matching-halves",
      "title": "Matching Sentence Halves",
      "icon": "Split",
      "time": 10,
      "instructions": "Match each sentence beginning with its correct ending.",
      "sentence_halves": [
        {
          "first_half": "If I had more time,",
          "second_half": "I would travel the world.",
          "correct_match": "1"
        },
        {
          "first_half": "I will call you",
          "second_half": "when I get home.",
          "correct_match": "2"
        },
        {
          "first_half": "She has been studying",
          "second_half": "English for three years.",
          "correct_match": "3"
        },
        {
          "first_half": "The movie was so boring",
          "second_half": "that we left early.",
          "correct_match": "4"
        },
        {
          "first_half": "Unless it stops raining,",
          "second_half": "we can't go to the beach.",
          "correct_match": "5"
        },
        {
          "first_half": "He works so hard",
          "second_half": "that he rarely takes breaks.",
          "correct_match": "6"
        },
        {
          "first_half": "Although she was tired,",
          "second_half": "she finished her project.",
          "correct_match": "7"
        },
        {
          "first_half": "The cake tastes",
          "second_half": "better than it looks.",
          "correct_match": "8"
        }
      ],
      "teacher_tip": "This exercise helps students understand sentence structure and logical connections. Discuss the different types of clauses and their relationships."
    },
    // New additional exercise types
    {
      "type": "describe",
      "title": "Describe the Picture",
      "icon": "Camera",
      "time": 15,
      "instructions": "Look carefully at the picture and describe what you see. Include details about people, objects, actions, colors, and setting.",
      "image_url": "/lovable-uploads/2d55c1e0-547e-45aa-a55c-e71479adb602.png",
      "questions": [
        { "text": "What can you see in the foreground?" },
        { "text": "What colors are predominant in the image?" },
        { "text": "What is happening in the picture?" },
        { "text": "How would you describe the mood or atmosphere?" }
      ],
      "teacher_tip": "Encourage students to use descriptive vocabulary and varied sentence structures. This exercise develops observation skills and expands vocabulary."
    },
    {
      "type": "answer-questions",
      "title": "Answer the Questions",
      "icon": "PlayCircle",
      "time": 12,
      "instructions": "Listen to the audio/watch the video/examine the image and answer the questions below.",
      "media_url": "/lovable-uploads/2d55c1e0-547e-45aa-a55c-e71479adb602.png",
      "media_type": "image",
      "questions": [
        { "text": "What is the main topic discussed?", "answer": "Sample answer based on content" },
        { "text": "What are the key details mentioned?", "answer": "Key details from the media" },
        { "text": "What conclusion can you draw?", "answer": "Student's inference from the content" },
        { "text": "How does this relate to your experience?", "answer": "Personal connection answer" }
      ],
      "teacher_tip": "This exercise develops listening/viewing comprehension and critical thinking skills. Encourage students to support their answers with evidence from the material."
    },
    // Basic exercise types
    {
      "type": "reading",
      "title": "Reading Comprehension",
      "icon": "BookOpen",
      "time": 15,
      "instructions": "Read the text carefully and answer the questions below.",
      "content": "The Benefits of Learning a Second Language\n\nLearning a second language has numerous advantages that extend far beyond simple communication. Research shows that bilingual individuals often demonstrate enhanced cognitive abilities, including improved problem-solving skills, better multitasking capabilities, and increased creativity.\n\nMoreover, speaking multiple languages can significantly boost career prospects. In today's globalized world, employers highly value multilingual employees who can communicate with international clients and navigate diverse cultural contexts. Studies indicate that bilingual professionals earn, on average, 5-20% more than their monolingual counterparts.\n\nFrom a personal development perspective, learning a new language opens doors to different cultures, literature, and ways of thinking. It allows individuals to form deeper connections with people from various backgrounds and gain a more nuanced understanding of the world.\n\nFurthermore, recent neuroscientific research suggests that bilingualism may help delay the onset of age-related cognitive decline, including conditions like dementia and Alzheimer's disease.",
      "questions": [
        { "text": "What cognitive benefits does bilingualism provide?", "answer": "Enhanced problem-solving, better multitasking, increased creativity" },
        { "text": "How much more do bilingual professionals typically earn?", "answer": "5-20% more than monolingual counterparts" },
        { "text": "What personal development benefits are mentioned?", "answer": "Cultural understanding, deeper connections, access to literature" },
        { "text": "What health benefits might bilingualism provide?", "answer": "May delay cognitive decline and dementia" }
      ],
      "teacher_tip": "Focus on reading strategies like skimming, scanning, and inference. Discuss how students arrived at their answers."
    },
    {
      "type": "true-false",
      "title": "True or False",
      "icon": "CheckCircle",
      "time": 8,
      "instructions": "Read each statement and decide if it is true (T) or false (F).",
      "statements": [
        { "text": "The Earth revolves around the Moon.", "is_true": false },
        { "text": "Water boils at 100 degrees Celsius at sea level.", "is_true": true },
        { "text": "There are 24 hours in a day.", "is_true": true },
        { "text": "Fish are mammals.", "is_true": false },
        { "text": "The capital of Australia is Sydney.", "is_true": false },
        { "text": "Shakespeare wrote 'Romeo and Juliet'.", "is_true": true },
        { "text": "Humans have five senses.", "is_true": true },
        { "text": "The Atlantic Ocean is the largest ocean.", "is_true": false }
      ],
      "teacher_tip": "Encourage students to explain their reasoning for each answer. This helps develop critical thinking and fact-checking skills."
    },
    {
      "type": "matching",
      "title": "Matching Exercise",
      "icon": "Link",
      "time": 10,
      "instructions": "Match each item in Column A with the correct item in Column B.",
      "items": [
        { "term": "Spain", "definition": "Madrid", "letter": "A" },
        { "term": "France", "definition": "Paris", "letter": "B" },
        { "term": "Italy", "definition": "Rome", "letter": "C" },
        { "term": "Germany", "definition": "Berlin", "letter": "D" },
        { "term": "Portugal", "definition": "Lisbon", "letter": "E" },
        { "term": "Greece", "definition": "Athens", "letter": "F" },
        { "term": "Netherlands", "definition": "Amsterdam", "letter": "G" },
        { "term": "Poland", "definition": "Warsaw", "letter": "H" }
      ],
      "teacher_tip": "This exercise helps students connect related concepts. Consider adding a brief geography discussion after completion."
    },
    {
      "type": "fill-in-blanks",
      "title": "Fill in the Blanks",
      "icon": "Edit",
      "time": 12,
      "instructions": "Complete the sentences using the words from the word bank.",
      "word_bank": ["beautiful", "quickly", "delicious", "carefully", "expensive", "quietly", "comfortable", "peacefully"],
      "sentences": [
        { "text": "The sunset looked absolutely _______ from the mountaintop.", "answer": "beautiful" },
        { "text": "She walked _______ through the library so as not to disturb others.", "answer": "quietly" },
        { "text": "The chef prepared a _______ meal for the special occasion.", "answer": "delicious" },
        { "text": "He drove _______ through the busy city streets.", "answer": "carefully" },
        { "text": "That designer handbag is quite _______ for most people.", "answer": "expensive" },
        { "text": "The train moved _______ through the countryside.", "answer": "quickly" },
        { "text": "The hotel bed was very _______ after the long journey.", "answer": "comfortable" },
        { "text": "The lake reflected the trees _______ in the morning light.", "answer": "peacefully" }
      ],
      "teacher_tip": "Focus on context clues and word forms. Discuss why certain words fit better than others in each context."
    },
    {
      "type": "multiple-choice",
      "title": "Multiple Choice",
      "icon": "List",
      "time": 12,
      "instructions": "Choose the best answer for each question.",
      "questions": [
        {
          "text": "What is the capital of Japan?",
          "options": [
            { "label": "A", "text": "Seoul", "correct": false },
            { "label": "B", "text": "Tokyo", "correct": true },
            { "label": "C", "text": "Beijing", "correct": false },
            { "label": "D", "text": "Bangkok", "correct": false }
          ]
        },
        {
          "text": "Which planet is closest to the Sun?",
          "options": [
            { "label": "A", "text": "Venus", "correct": false },
            { "label": "B", "text": "Earth", "correct": false },
            { "label": "C", "text": "Mercury", "correct": true },
            { "label": "D", "text": "Mars", "correct": false }
          ]
        },
        {
          "text": "What does 'ubiquitous' mean?",
          "options": [
            { "label": "A", "text": "Rare", "correct": false },
            { "label": "B", "text": "Present everywhere", "correct": true },
            { "label": "C", "text": "Ancient", "correct": false },
            { "label": "D", "text": "Expensive", "correct": false }
          ]
        },
        {
          "text": "Who painted the Mona Lisa?",
          "options": [
            { "label": "A", "text": "Pablo Picasso", "correct": false },
            { "label": "B", "text": "Vincent van Gogh", "correct": false },
            { "label": "C", "text": "Leonardo da Vinci", "correct": true },
            { "label": "D", "text": "Claude Monet", "correct": false }
          ]
        },
        {
          "text": "Which grammar structure is correct?",
          "options": [
            { "label": "A", "text": "I am living here since 2020", "correct": false },
            { "label": "B", "text": "I have been living here since 2020", "correct": true },
            { "label": "C", "text": "I live here since 2020", "correct": false },
            { "label": "D", "text": "I lived here since 2020", "correct": false }
          ]
        },
        {
          "text": "What is the past participle of 'to write'?",
          "options": [
            { "label": "A", "text": "wrote", "correct": false },
            { "label": "B", "text": "writing", "correct": false },
            { "label": "C", "text": "written", "correct": true },
            { "label": "D", "text": "writes", "correct": false }
          ]
        },
        {
          "text": "Choose the correct preposition: 'I'm good ___ mathematics.'",
          "options": [
            { "label": "A", "text": "in", "correct": false },
            { "label": "B", "text": "on", "correct": false },
            { "label": "C", "text": "at", "correct": true },
            { "label": "D", "text": "with", "correct": false }
          ]
        },
        {
          "text": "Which sentence uses the conditional correctly?",
          "options": [
            { "label": "A", "text": "If I was you, I would study more", "correct": false },
            { "label": "B", "text": "If I were you, I would study more", "correct": true },
            { "label": "C", "text": "If I am you, I would study more", "correct": false },
            { "label": "D", "text": "If I be you, I would study more", "correct": false }
          ]
        }
      ],
      "teacher_tip": "Encourage students to eliminate obviously wrong answers first. Discuss test-taking strategies and reasoning processes."
    },
    {
      "type": "dialogue",
      "title": "Complete the Dialogue",
      "icon": "MessageSquare",
      "time": 12,
      "instructions": "Complete the dialogue using appropriate expressions from the box.",
      "dialogue": [
        { "speaker": "Customer", "text": "Excuse me, I'm looking for a good restaurant nearby." },
        { "speaker": "Local", "text": "_______ What kind of food do you prefer?" },
        { "speaker": "Customer", "text": "I'd like something Italian, preferably not too expensive." },
        { "speaker": "Local", "text": "_______ There's a great pizzeria just around the corner." },
        { "speaker": "Customer", "text": "That sounds perfect! How do I get there?" },
        { "speaker": "Local", "text": "_______ Go straight for two blocks, then turn right." },
        { "speaker": "Customer", "text": "Thank you so much for your help!" },
        { "speaker": "Local", "text": "_______" }
      ],
      "expressions": [
        "Sure, I can help!",
        "I'd recommend...",
        "It's very simple.",
        "You're welcome!"
      ],
      "expression_instruction": "Use these expressions to complete the dialogue naturally.",
      "teacher_tip": "Focus on natural conversation flow and appropriate expressions for different situations. Practice pronunciation and intonation."
    },
    {
      "type": "discussion",
      "title": "Discussion Questions",
      "icon": "Users",
      "time": 20,
      "instructions": "Discuss these questions with your partner or in small groups.",
      "questions": [
        "What role does technology play in modern education?",
        "How has social media changed the way we communicate?",
        "What are the advantages and disadvantages of remote work?",
        "How can we encourage more sustainable living practices?",
        "What makes a good leader in today's world?",
        "How important is cultural diversity in the workplace?",
        "What impact does climate change have on daily life?",
        "How can we balance work and personal life effectively?"
      ],
      "teacher_tip": "Encourage students to share personal experiences and different perspectives. Focus on fluency over accuracy in discussion activities."
    },
    {
      "type": "error-correction",
      "title": "Error Correction",
      "icon": "AlertCircle",
      "time": 10,
      "instructions": "Find and correct the errors in these sentences.",
      "sentences": [
        { "text": "I am living in London since 2010.", "correction": "I have been living in London since 2010." },
        { "text": "She don't like coffee very much.", "correction": "She doesn't like coffee very much." },
        { "text": "Can you borrow me your pen?", "correction": "Can you lend me your pen?" },
        { "text": "I'm looking forward to see you.", "correction": "I'm looking forward to seeing you." },
        { "text": "He told me that he will come tomorrow.", "correction": "He told me that he would come tomorrow." },
        { "text": "This is the most better solution.", "correction": "This is the best solution." },
        { "text": "I have visited London last year.", "correction": "I visited London last year." },
        { "text": "She is more tall than her sister.", "correction": "She is taller than her sister." }
      ],
      "teacher_tip": "Help students identify error patterns and understand why the corrections are needed. Focus on common mistakes."
    },
    {
      "type": "true-false",
      "title": "True or False",
      "icon": "CheckSquare",
      "time": 8,
      "instructions": "Read each statement and decide if it is true or false.",
      "statements": [
        { "text": "English is the most spoken language in the world by native speakers.", "isTrue": false },
        { "text": "The past tense of 'go' is 'went'.", "isTrue": true },
        { "text": "Shakespeare wrote 'Romeo and Juliet'.", "isTrue": true },
        { "text": "The plural of 'child' is 'childs'.", "isTrue": false },
        { "text": "Present perfect is formed with 'have/has + past participle'.", "isTrue": true },
        { "text": "Australia is the smallest continent.", "isTrue": true },
        { "text": "There are 26 letters in the English alphabet.", "isTrue": true },
        { "text": "The word 'run' can only be used as a verb.", "isTrue": false }
      ],
      "teacher_tip": "Encourage students to explain their reasoning. This helps identify areas where they need more clarification."
    }
  ],
  "vocabulary_sheet": [
    { "term": "Transformation", "meaning": "The act of changing something completely" },
    { "term": "Categorize", "meaning": "To put things into groups based on their characteristics" },
    { "term": "Paraphrase", "meaning": "To express something in different words while keeping the same meaning" },
    { "term": "Prefix", "meaning": "A letter or group of letters added to the beginning of a word" },
    { "term": "Synonym", "meaning": "A word that has the same or similar meaning as another word" },
    { "term": "Antonym", "meaning": "A word that means the opposite of another word" },
    { "term": "Context", "meaning": "The situation or background that helps explain something" },
    { "term": "Structure", "meaning": "The way something is organized or arranged" }
  ]
};