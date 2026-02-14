/**
 * Welcome Test Questions - 45 predefined questions across 7 sections
 * This is the FULL version (largest of 3 planned options)
 */

import type { WelcomeTestQuestionDef, WelcomeTestSectionDef } from '@/types/welcomeTest';

// =====================================================
// SECTION 1: About You (Q1-Q8)
// =====================================================

const aboutYouQuestions: WelcomeTestQuestionDef[] = [
  {
    id: 'wt_q1',
    section: 'about_you',
    question_type: 'self_assessment',
    question_text: 'How would you describe your English right now?',
    description: 'Choose the option that best describes your current level.',
    options: [
      'I can handle basic everyday situations like ordering food or asking for directions',
      'I can have simple conversations about familiar topics but struggle with complex ideas',
      'I can discuss most topics but make grammatical mistakes and sometimes lack vocabulary',
      'I speak fluently in most situations but want to sound more natural and precise',
      'I\'m comfortable in English but want to master advanced/professional language',
    ],
    scoring_logic: 'Self-awareness: compare with actual grammar/vocab scores to detect over/underestimation',
    detected_trait: {
      trait_name: 'self_assessed_level',
      mapping: {
        '0': 'A1-A2',
        '1': 'A2-B1',
        '2': 'B1-B2',
        '3': 'B2-C1',
        '4': 'C1-C2',
      },
    },
  },
  {
    id: 'wt_q2',
    section: 'about_you',
    question_type: 'preference_choice',
    question_text: 'When you speak English, what frustrates you the most?',
    description: 'Select all that apply.',
    multi_select: true,
    options: [
      'I know what I want to say but can\'t find the right words',
      'I make grammar mistakes that I know are wrong',
      'I can\'t understand native speakers when they talk fast',
      'I feel nervous and forget everything I know',
      'I can\'t express complex ideas - I simplify too much',
      'My pronunciation makes people ask me to repeat',
    ],
    scoring_logic: 'Identifies main barriers + emotional relationship with errors (fixed vs growth mindset signals)',
  },
  {
    id: 'wt_q3',
    section: 'about_you',
    question_type: 'preference_choice',
    question_text: 'What\'s your main reason for learning English?',
    options: [
      'I need it for my job - meetings, emails, presentations',
      'I\'m preparing for an exam (IELTS, Cambridge, etc.)',
      'I want to travel and communicate freely',
      'I want to watch movies/read books without subtitles',
      'I want to feel confident talking to English speakers',
      'Career advancement - I need English for promotion',
      'I\'m moving to an English-speaking country',
    ],
    scoring_logic: 'Motivation type: instrumental (work, exam) vs integrative (travel, movies, confidence)',
    detected_trait: {
      trait_name: 'motivation_type',
      mapping: {
        '0': 'instrumental',
        '1': 'instrumental',
        '2': 'integrative',
        '3': 'integrative',
        '4': 'integrative',
        '5': 'instrumental',
        '6': 'instrumental',
      },
    },
  },
  {
    id: 'wt_q4',
    section: 'about_you',
    question_type: 'scenario_reaction',
    question_text: 'How do you usually react when you don\'t understand something in English?',
    options: [
      'I ask the person to repeat or explain',
      'I pretend I understood and hope for the best',
      'I try to guess from context',
      'I get stressed and switch to my language',
      'I look it up immediately on my phone',
    ],
    scoring_logic: 'Tolerance of ambiguity (Ely, 1995) - key predictor of language learning success',
    detected_trait: {
      trait_name: 'ambiguity_tolerance',
      mapping: {
        '0': 'high',
        '1': 'low',
        '2': 'high',
        '3': 'low',
        '4': 'medium',
      },
    },
  },
  {
    id: 'wt_q5',
    section: 'about_you',
    question_type: 'preference_choice',
    question_text: 'How much time can you realistically spend on English per week (outside lessons)?',
    options: [
      'Almost none - I only have lesson time',
      '15-30 minutes a few times a week',
      'About 1 hour spread across the week',
      '2-3 hours - I\'m committed',
      'More than 3 hours - English is my priority',
    ],
    scoring_logic: 'Available time budget - directly affects strategy selection (spaced repetition intervals, homework load)',
    detected_trait: {
      trait_name: 'weekly_study_time',
      mapping: {
        '0': 'none',
        '1': '15_30_min',
        '2': '1_hour',
        '3': '2_3_hours',
        '4': '3_plus_hours',
      },
    },
  },
  {
    id: 'wt_q6',
    section: 'about_you',
    question_type: 'preference_choice',
    question_text: 'Which of these learning activities do you enjoy? Pick all that apply.',
    multi_select: true,
    options: [
      'Watching videos/movies in English',
      'Reading articles or books',
      'Having conversations',
      'Doing grammar exercises',
      'Learning new vocabulary with flashcards',
      'Listening to podcasts',
      'Writing texts (emails, stories)',
      'Playing language games/quizzes',
      'Singing songs in English',
    ],
    scoring_logic: 'Preferred input channels (Visual/Auditory/Kinesthetic + Active/Passive). Krashen\'s Input Hypothesis.',
  },
  {
    id: 'wt_q7',
    section: 'about_you',
    question_type: 'self_assessment',
    question_text: 'How do you feel about making mistakes in English?',
    options: [
      'I don\'t mind at all - that\'s how you learn',
      'I prefer not to, but I can handle it',
      'I feel embarrassed but try to push through',
      'I avoid speaking because I\'m afraid of mistakes',
      'I get really frustrated with myself',
    ],
    scoring_logic: 'Error anxiety level (Horwitz Foreign Language Anxiety Scale)',
    detected_trait: {
      trait_name: 'anxiety_level',
      mapping: {
        '0': 'low',
        '1': 'low',
        '2': 'medium',
        '3': 'high',
        '4': 'high',
      },
    },
  },
  {
    id: 'wt_q8',
    section: 'about_you',
    question_type: 'preference_choice',
    question_text: 'When you learn a new word, what helps you remember it best?',
    options: [
      'Seeing it written down with a definition',
      'Hearing it in a sentence',
      'Using it in my own sentence right away',
      'Connecting it to a picture or image',
      'Repeating it many times',
      'Understanding the word parts (prefix, root, suffix)',
    ],
    scoring_logic: 'Dominant memory encoding strategy (Dual Coding Theory, Paivio)',
    detected_trait: {
      trait_name: 'preferred_input_channel',
      mapping: {
        '0': 'visual',
        '1': 'auditory',
        '2': 'kinesthetic',
        '3': 'visual',
        '4': 'auditory',
        '5': 'visual',
      },
    },
  },
];

// =====================================================
// SECTION 2: Your English Experience (Q9-Q13)
// =====================================================

const experienceQuestions: WelcomeTestQuestionDef[] = [
  {
    id: 'wt_q9',
    section: 'experience',
    question_type: 'preference_choice',
    question_text: 'How long have you been learning English?',
    options: [
      'Less than 1 year',
      '1-3 years',
      '3-5 years',
      '5-10 years',
      'More than 10 years',
    ],
    scoring_logic: 'Learning duration context - longer learners may have fossilized errors',
  },
  {
    id: 'wt_q10',
    section: 'experience',
    question_type: 'preference_choice',
    question_text: 'Where have you mainly learned English so far?',
    description: 'Select all that apply.',
    multi_select: true,
    options: [
      'School (as a subject)',
      'University',
      'Private lessons with a teacher',
      'Language school/course',
      'Self-study (apps, books, YouTube)',
      'Living/working in an English-speaking country',
      'Through work (using English daily)',
    ],
    scoring_logic: 'Learning context affects fossilized errors - YouTube self-learner vs Cambridge course student have different patterns',
  },
  {
    id: 'wt_q11',
    section: 'experience',
    question_type: 'preference_choice',
    question_text: 'Have you ever taken an official English exam?',
    options: [
      'No, never',
      'Yes - school/university exam',
      'Yes - Cambridge (FCE/CAE/CPE)',
      'Yes - IELTS',
      'Yes - TOEFL',
      'Yes - other',
    ],
    scoring_logic: 'Exam experience indicates familiarity with structured assessment and formal English',
  },
  {
    id: 'wt_q12',
    section: 'experience',
    question_type: 'open_reflection',
    question_text: 'What\'s the biggest challenge you\'ve faced learning English?',
    description: 'In 1-2 sentences, describe your biggest frustration or challenge with English.',
    scoring_logic: 'Narrative self-assessment. Sentiment analysis + keywords reveal emotional relationship with learning.',
  },
  {
    id: 'wt_q13',
    section: 'experience',
    question_type: 'open_reflection',
    question_text: 'Is there anything specific your previous teachers did that worked really well for you?',
    description: 'Tell us what methods or approaches helped you learn best.',
    scoring_logic: 'What worked before = what will likely work again. Practical pedagogical intelligence.',
  },
];

// =====================================================
// SECTION 3: Real-Life Scenarios (Q14-Q19)
// =====================================================

const scenarioQuestions: WelcomeTestQuestionDef[] = [
  {
    id: 'wt_q14',
    section: 'scenarios',
    question_type: 'scenario_reaction',
    question_text: 'You\'re at a coffee shop abroad. The barista asks you something you don\'t fully understand. What do you do?',
    options: [
      'I say "Sorry, could you repeat that please?" and try again',
      'I just point at the menu and smile',
      'I use Google Translate on my phone',
      'I answer with what I think they asked',
    ],
    scoring_logic: 'Communication strategy under pressure - active vs avoidant coping',
    detected_trait: {
      trait_name: 'error_attitude',
      mapping: {
        '0': 'comfortable',
        '1': 'avoidant',
        '2': 'cautious',
        '3': 'comfortable',
      },
    },
  },
  {
    id: 'wt_q15',
    section: 'scenarios',
    question_type: 'scenario_reaction',
    question_text: 'Your English-speaking colleague sends you a long email about a project. Some parts are unclear. What do you do?',
    options: [
      'I read it carefully, look up unknown words, and reply',
      'I reply asking them to clarify the confusing parts',
      'I understand most of it and guess the rest from context',
      'I struggle to understand and need to translate most of it',
      'I don\'t try to understand, I use ChatGPT',
    ],
    element_type: 'reading',
    scoring_logic: 'Reading comprehension strategy + self-reported reading level',
  },
  {
    id: 'wt_q16',
    section: 'scenarios',
    question_type: 'open_ended',
    question_text: 'You need to describe a problem with your hotel room to the reception.',
    description: 'Write 2-3 sentences explaining that your room\'s air conditioning isn\'t working and you\'d like it fixed or to change rooms.',
    element_type: 'writing',
    scoring_logic: 'Actual writing level - grammar accuracy, vocabulary range, pragmatic appropriateness. Compare with Q1 self-assessment.',
    nano_skill: 'ns.writing.complaint_register',
  },
  {
    id: 'wt_q17',
    section: 'scenarios',
    question_type: 'open_ended',
    question_text: 'You\'re in a job interview and they ask "Tell me about a challenge you\'ve faced at work." How would you answer?',
    description: 'Write 3-4 sentences as if you\'re actually in the interview.',
    element_type: 'writing',
    scoring_logic: 'Pragmatic competence + discourse management under pressure. Formal/informal register, coherence, complexity.',
    nano_skill: 'ns.writing.formal_narrative',
  },
  {
    id: 'wt_q18',
    section: 'scenarios',
    question_type: 'multiple_choice',
    question_text: 'Read this short dialogue and answer: What is the main problem the speakers are discussing?\n\nA: "I\'ve been waiting for the delivery for three weeks now."\nB: "I understand your frustration. Let me check the tracking number."\nA: "I already checked online - it says \'in transit\' but nothing has moved since Tuesday."\nB: "I see. I\'ll escalate this to our logistics team and call you back today."',
    options: [
      'A package that hasn\'t arrived',
      'A broken product',
      'A billing issue',
      'A cancelled order',
    ],
    correct_answer: 'A package that hasn\'t arrived',
    element_type: 'reading',
    difficulty_level: 2,
    scoring_logic: 'Reading comprehension - extracting main idea. Difficulty level B1-B2.',
    nano_skill: 'ns.reading.identify_main_idea',
  },
  {
    id: 'wt_q19',
    section: 'scenarios',
    question_type: 'multiple_choice',
    question_text: 'Read this text and answer the question below:\n\n"According to a recent study, more than 60% of employees prefer a hybrid work model, combining remote and office work. Researchers found that this arrangement not only improves work-life balance but also increases productivity by up to 15%. However, managers report challenges in maintaining team cohesion and ensuring equal opportunities for career advancement among remote and in-office workers."\n\nWhat does the author suggest is the main benefit of hybrid work?',
    options: [
      'It saves companies money on office space',
      'It improves work-life balance and productivity',
      'It makes managers\' jobs easier',
      'It eliminates the need for offices',
    ],
    correct_answer: 'It improves work-life balance and productivity',
    element_type: 'reading',
    difficulty_level: 3,
    scoring_logic: 'Reading comprehension - inference, not just surface-level understanding. B2 level.',
    nano_skill: 'ns.reading.inference_from_text',
  },
  // NEW: Speaking question - describe hotel problem out loud
  {
    id: 'wt_q16s',
    section: 'scenarios',
    question_type: 'speaking_record',
    question_text: 'Now try to describe the hotel problem out loud.\n\nImagine you\'re at the reception. Record yourself explaining that your air conditioning isn\'t working.',
    description: 'Record up to 60 seconds. Don\'t worry about perfection - speak naturally!',
    element_type: 'speaking',
    max_recording_seconds: 60,
    scoring_logic: 'Speaking fluency, pronunciation, pragmatic appropriateness. Compare with written version (Q16).',
    nano_skill: 'ns.speaking.complaint_oral',
  },
  // NEW: Listening comprehension
  {
    id: 'wt_q18l',
    section: 'scenarios',
    question_type: 'listening_comprehension',
    question_text: 'Listen to this short conversation and answer: What does the customer want?',
    audio_url: '', // Will be pre-generated
    audio_transcript: 'A: "Excuse me, I ordered a medium latte about twenty minutes ago and I\'m still waiting."\nB: "I\'m sorry about that. Let me check with the barista. Would you like me to make you a fresh one right away?"\nA: "Yes please, and could I get it with oat milk this time instead?"',
    options: [
      'A refund for the late order',
      'A fresh latte with oat milk',
      'To speak to the manager',
      'To cancel the order',
    ],
    correct_answer: 'A fresh latte with oat milk',
    element_type: 'listening',
    difficulty_level: 2,
    scoring_logic: 'Listening comprehension - detail extraction from dialogue. B1 level.',
    nano_skill: 'ns.listening.detail_extraction',
  },
];
// =====================================================

const grammarQuestions: WelcomeTestQuestionDef[] = [
  {
    id: 'wt_q20',
    section: 'grammar',
    question_type: 'fill_blank',
    question_text: 'She ___ (go) to the gym every morning.',
    description: 'Write the correct form of the verb in brackets.',
    correct_answer: 'goes',
    element_type: 'grammar',
    difficulty_level: 1,
    scoring_logic: 'Present Simple 3rd person -s. A2 level grammar.',
    nano_skill: 'ns.grammar.present_simple_third_person',
  },
  {
    id: 'wt_q21',
    section: 'grammar',
    question_type: 'fill_blank',
    question_text: 'I ___ (study) English for three years.',
    description: 'Write the correct form of the verb in brackets.',
    correct_answer: ['have been studying', 'have studied'],
    element_type: 'grammar',
    difficulty_level: 3,
    scoring_logic: 'Present Perfect Continuous / Present Perfect. B1-B2 level.',
    nano_skill: 'ns.grammar.present_perfect_continuous',
  },
  {
    id: 'wt_q22',
    section: 'grammar',
    question_type: 'multiple_choice',
    question_text: 'If I ___ earlier, I wouldn\'t have missed the train.',
    options: [
      'leave',
      'left',
      'had left',
      'would leave',
    ],
    correct_answer: 'had left',
    element_type: 'grammar',
    difficulty_level: 4,
    scoring_logic: 'Third Conditional. B2 level grammar.',
    nano_skill: 'ns.grammar.third_conditional',
  },
  {
    id: 'wt_q23',
    section: 'grammar',
    question_type: 'multiple_choice',
    question_text: 'The report ___ by the team last week.',
    options: [
      'wrote',
      'was written',
      'has written',
      'is written',
    ],
    correct_answer: 'was written',
    element_type: 'grammar',
    difficulty_level: 3,
    scoring_logic: 'Past Simple Passive. B1-B2 level.',
    nano_skill: 'ns.grammar.passive_voice_past',
  },
  {
    id: 'wt_q24',
    section: 'grammar',
    question_type: 'multiple_choice',
    question_text: 'Find the error: "She don\'t like coffee."',
    description: 'Choose the corrected version.',
    options: [
      'She doesn\'t like coffee.',
      'She didn\'t like coffee.',
      'She not like coffee.',
      'She isn\'t like coffee.',
    ],
    correct_answer: 'She doesn\'t like coffee.',
    element_type: 'grammar',
    difficulty_level: 1,
    scoring_logic: 'Error correction - 3rd person negative. A2 level.',
    nano_skill: 'ns.grammar.negative_third_person',
  },
  {
    id: 'wt_q25',
    section: 'grammar',
    question_type: 'multiple_choice',
    question_text: 'Find the error: "I have went to London last year."',
    description: 'Choose the corrected version.',
    options: [
      'I went to London last year.',
      'I have gone to London last year.',
      'I have been to London last year.',
      'I was went to London last year.',
    ],
    correct_answer: 'I went to London last year.',
    element_type: 'grammar',
    difficulty_level: 2,
    scoring_logic: 'Error correction - Past Simple vs Present Perfect. B1 level.',
    nano_skill: 'ns.grammar.past_simple_vs_present_perfect',
  },
  {
    id: 'wt_q26',
    section: 'grammar',
    question_type: 'fill_blank',
    question_text: '"It started raining two hours ago."\n\nComplete the sentence: It ___ for two hours.',
    description: 'Fill in the blank to rewrite the sentence using the correct tense. Write only the missing words (e.g. "has been raining").',
    correct_answer: 'has been raining',
    element_type: 'grammar',
    difficulty_level: 3,
    scoring_logic: 'Sentence transformation - Present Perfect Continuous. B1-B2 level.',
    nano_skill: 'ns.grammar.sentence_transformation_ppc',
  },
  {
    id: 'wt_q27',
    section: 'grammar',
    question_type: 'fill_blank',
    question_text: '"People say he is very smart."\n\nComplete the sentence: He ___ very smart.',
    description: 'Fill in the blank to rewrite using a passive construction. Write only the missing words (e.g. "is said to be").',
    correct_answer: 'is said to be',
    element_type: 'grammar',
    difficulty_level: 4,
    scoring_logic: 'Sentence transformation - Passive reporting. B2-C1 level.',
    nano_skill: 'ns.grammar.passive_reporting',
  },
];

// =====================================================
// SECTION 5: Vocabulary & Expressions (Q28-Q35)
// =====================================================

const vocabularyQuestions: WelcomeTestQuestionDef[] = [
  {
    id: 'wt_q28',
    section: 'vocabulary',
    question_type: 'multiple_choice',
    question_text: 'Can you ___ me a favour?',
    options: ['do', 'make', 'give', 'take'],
    correct_answer: 'do',
    element_type: 'vocabulary',
    difficulty_level: 2,
    scoring_logic: 'Collocation: do a favour. B1 level.',
    nano_skill: 'ns.vocabulary.collocation_do_make',
  },
  {
    id: 'wt_q29',
    section: 'vocabulary',
    question_type: 'multiple_choice',
    question_text: 'She ___ a deep breath before speaking.',
    options: ['took', 'made', 'did', 'got'],
    correct_answer: 'took',
    element_type: 'vocabulary',
    difficulty_level: 2,
    scoring_logic: 'Collocation: take a breath. B1 level.',
    nano_skill: 'ns.vocabulary.collocation_take',
  },
  {
    id: 'wt_q30',
    section: 'vocabulary',
    question_type: 'fill_blank',
    question_text: 'The ___ (decide) was made yesterday.',
    description: 'Write the correct NOUN form of the word in brackets. Example: "arrive" → "arrival".',
    correct_answer: 'decision',
    element_type: 'vocabulary',
    difficulty_level: 2,
    scoring_logic: 'Word formation: verb to noun. B1 level.',
    nano_skill: 'ns.vocabulary.word_formation_noun',
  },
  {
    id: 'wt_q31',
    section: 'vocabulary',
    question_type: 'fill_blank',
    question_text: 'He spoke very ___ (confident).',
    description: 'Write the correct form of the word in brackets.',
    correct_answer: 'confidently',
    element_type: 'vocabulary',
    difficulty_level: 2,
    scoring_logic: 'Word formation: adjective to adverb. B1 level.',
    nano_skill: 'ns.vocabulary.word_formation_adverb',
  },
  {
    id: 'wt_q32',
    section: 'vocabulary',
    question_type: 'multiple_choice',
    question_text: 'The deadline is really tight. We need to ___ up.',
    options: ['hurry', 'run', 'go', 'move'],
    correct_answer: 'hurry',
    element_type: 'vocabulary',
    difficulty_level: 2,
    scoring_logic: 'Contextual vocabulary: phrasal verb meaning. B1-B2 level.',
    nano_skill: 'ns.vocabulary.phrasal_verb_contextual',
  },
  {
    id: 'wt_q33',
    section: 'vocabulary',
    question_type: 'multiple_choice',
    question_text: 'She was absolutely ___ when she heard she got the job.',
    options: ['thrilled', 'sad', 'angry', 'bored'],
    correct_answer: 'thrilled',
    element_type: 'vocabulary',
    difficulty_level: 3,
    scoring_logic: 'Nuance understanding: extreme adjectives. B2 level.',
    nano_skill: 'ns.vocabulary.extreme_adjectives',
  },
  {
    id: 'wt_q34',
    section: 'vocabulary',
    question_type: 'multiple_choice',
    question_text: 'What does "break the ice" mean?',
    options: [
      'To damage something frozen',
      'To make people feel more comfortable in a social situation',
      'To start an argument',
      'To solve a difficult problem',
    ],
    correct_answer: 'To make people feel more comfortable in a social situation',
    element_type: 'vocabulary',
    difficulty_level: 3,
    scoring_logic: 'Idiom comprehension. B2 level.',
    nano_skill: 'ns.vocabulary.idiom_comprehension',
  },
  {
    id: 'wt_q35',
    section: 'vocabulary',
    question_type: 'multiple_choice',
    question_text: 'When she heard the price, she said "That costs ___!"',
    options: [
      'an arm and a leg',
      'a hand and a foot',
      'blood and sweat',
      'a king\'s crown',
    ],
    correct_answer: 'an arm and a leg',
    element_type: 'vocabulary',
    difficulty_level: 3,
    scoring_logic: 'Idiom production/recognition. B2 level.',
    nano_skill: 'ns.vocabulary.idiom_production',
  },
];

// =====================================================
// SECTION 6: Communication Style (Q36-Q40)
// =====================================================

const communicationQuestions: WelcomeTestQuestionDef[] = [
  {
    id: 'wt_q36',
    section: 'communication',
    question_type: 'open_ended',
    question_text: 'How would you politely decline an invitation to a colleague\'s party?',
    description: 'Write 1-2 sentences.',
    element_type: 'writing',
    scoring_logic: 'Pragmatic competence - ability to use language in social context. Register, politeness strategies.',
    nano_skill: 'ns.writing.pragmatic_declining',
  },
  // NEW: Speaking question - decline invitation out loud
  {
    id: 'wt_q36s',
    section: 'communication',
    question_type: 'speaking_record',
    question_text: 'Now record yourself declining the invitation verbally.\n\nImagine your colleague just invited you. Speak naturally as if you\'re talking to them.',
    description: 'Record up to 45 seconds. Be polite but clear.',
    element_type: 'speaking',
    max_recording_seconds: 45,
    scoring_logic: 'Speaking pragmatics - politeness strategies in real-time speech.',
    nano_skill: 'ns.speaking.pragmatic_declining_oral',
  },
  {
    id: 'wt_q37',
    section: 'communication',
    question_type: 'open_ended',
    question_text: 'Rewrite this sentence to sound more formal:\n\n"Hey, just wanted to check if you got my email about the meeting thing."',
    description: 'Write the formal version.',
    element_type: 'writing',
    scoring_logic: 'Register awareness - ability to shift between formal and informal register.',
    nano_skill: 'ns.writing.register_shift',
  },
  {
    id: 'wt_q38',
    section: 'communication',
    question_type: 'multiple_choice',
    question_text: 'Which of these sounds most natural?',
    options: [
      'I want that you help me',
      'I want you to help me',
      'I want you help me',
      'I want for you to help me',
    ],
    correct_answer: 'I want you to help me',
    element_type: 'grammar',
    difficulty_level: 2,
    scoring_logic: 'Grammatical intuition (implicit knowledge vs explicit). Natural-sounding English detection.',
    nano_skill: 'ns.grammar.verb_pattern_want',
  },
  {
    id: 'wt_q39',
    section: 'communication',
    question_type: 'scenario_reaction',
    question_text: 'You need to explain why you were late to a meeting. Choose the best response:',
    options: [
      'Sorry I\'m late. Traffic.',
      'I apologize for being late. There was an accident on the highway.',
      'I\'m so sorry for the delay. Unfortunately, there was a major traffic jam due to an accident. I left early but couldn\'t avoid it.',
      'My deepest apologies for this unacceptable tardiness.',
    ],
    correct_answer: 'I\'m so sorry for the delay. Unfortunately, there was a major traffic jam due to an accident. I left early but couldn\'t avoid it.',
    element_type: 'writing',
    difficulty_level: 3,
    scoring_logic: 'Pragmatic appropriacy - not too casual, not too formal. Middle options are correct.',
    nano_skill: 'ns.writing.pragmatic_appropriacy',
  },
  {
    id: 'wt_q40',
    section: 'communication',
    question_type: 'open_reflection',
    question_text: 'Read these two versions. Which sounds better and why?\n\nVersion A: "The meeting was good. We talked about the project. Everyone agreed."\n\nVersion B: "The meeting went well - we discussed the project timeline and reached a consensus on the next steps."',
    description: 'Which version sounds better to you and why? Write 1 sentence.',
    element_type: 'writing',
    scoring_logic: 'Awareness of discourse quality - can student recognize and explain better text?',
    nano_skill: 'ns.writing.discourse_quality_awareness',
  },
];

// =====================================================
// SECTION 7: Your Goals & Preferences (Q41-Q45)
// =====================================================

const goalsQuestions: WelcomeTestQuestionDef[] = [
  {
    id: 'wt_q41',
    section: 'goals',
    question_type: 'open_reflection',
    question_text: 'If you could achieve ONE thing in English in the next 3 months, what would it be?',
    description: 'Write freely - there are no wrong answers.',
    scoring_logic: 'Goal Setting Theory (Locke & Latham). Concrete, ambitious goals increase outcomes 20-25%.',
  },
  // NEW: Speaking question - self-introduction
  {
    id: 'wt_q41s',
    section: 'goals',
    question_type: 'speaking_record',
    question_text: 'Record a 30-second introduction of yourself in English.\n\nSay your name, what you do, and why you\'re learning English.',
    description: 'Speak freely for up to 30 seconds. There\'s no right or wrong way!',
    element_type: 'speaking',
    max_recording_seconds: 30,
    scoring_logic: 'Spontaneous speech production - fluency, complexity, accuracy baseline.',
    nano_skill: 'ns.speaking.self_introduction',
  },
  {
    id: 'wt_q42',
    section: 'goals',
    question_type: 'preference_choice',
    question_text: 'How do you prefer to receive feedback on your mistakes?',
    options: [
      'Correct me immediately, every time',
      'Note them down and discuss at the end',
      'Only correct major mistakes, ignore small ones',
      'Write corrections for me to review later',
      'I prefer to self-correct with hints',
    ],
    scoring_logic: 'Feedback preference = how to build Live Session interactions and formulate AI feedback',
    detected_trait: {
      trait_name: 'feedback_preference',
      mapping: {
        '0': 'immediate',
        '1': 'delayed_discussion',
        '2': 'major_only',
        '3': 'written_review',
        '4': 'self_correct',
      },
    },
  },
  {
    id: 'wt_q43',
    section: 'goals',
    question_type: 'preference_choice',
    question_text: 'What topics interest you the most? Pick up to 3.',
    multi_select: true,
    max_selections: 3,
    options: [
      'Technology & Innovation',
      'Business & Finance',
      'Travel & Culture',
      'Health & Lifestyle',
      'Science & Nature',
      'Entertainment & Pop Culture',
      'Sports',
      'Food & Cooking',
      'Psychology & Self-improvement',
      'Politics & Current Events',
      'Art & Literature',
      'History',
    ],
    scoring_logic: 'Content preferences for worksheet generation, flashcard sets, and lesson topics',
  },
  {
    id: 'wt_q44',
    section: 'goals',
    question_type: 'self_assessment_matrix',
    question_text: 'How would you rate your confidence in these areas?',
    description: 'Rate each area from 1 (not confident) to 5 (very confident).',
    matrix_items: [
      'Speaking with strangers',
      'Writing formal emails',
      'Understanding movies without subtitles',
      'Reading news articles',
      'Giving presentations',
      'Small talk at parties',
    ],
    matrix_scale: { min: 1, max: 5, labels: { 1: 'Not confident', 3: 'Somewhat', 5: 'Very confident' } },
    scoring_logic: 'Self-efficacy map (Bandura) - perception of own abilities in different contexts. Compare with actual results.',
  },
  {
    id: 'wt_q45',
    section: 'goals',
    question_type: 'open_reflection',
    question_text: 'Is there anything else you\'d like your teacher to know about you or your learning?',
    description: 'This is optional - write anything you think might be helpful.',
    scoring_logic: 'Open-ended final reflection. Catches anything the structured questions missed.',
  },
];

// =====================================================
// ASSEMBLED SECTIONS
// =====================================================

export const WELCOME_TEST_SECTIONS_WITH_QUESTIONS: WelcomeTestSectionDef[] = [
  {
    id: 'about_you',
    title: 'About You',
    subtitle: 'Help us understand your learning style and preferences',
    icon: 'User',
    questions: aboutYouQuestions,
  },
  {
    id: 'experience',
    title: 'Your English Experience',
    subtitle: 'Tell us about your journey with English so far',
    icon: 'BookOpen',
    questions: experienceQuestions,
  },
  {
    id: 'scenarios',
    title: 'Real-Life Scenarios',
    subtitle: 'How would you handle these situations?',
    icon: 'MessageSquare',
    questions: scenarioQuestions,
  },
  {
    id: 'grammar',
    title: 'Grammar Check',
    subtitle: 'Let\'s see where your grammar stands',
    icon: 'PenTool',
    questions: grammarQuestions,
  },
  {
    id: 'vocabulary',
    title: 'Vocabulary & Expressions',
    subtitle: 'Test your word power and knowledge of expressions',
    icon: 'BookOpen',
    questions: vocabularyQuestions,
  },
  {
    id: 'communication',
    title: 'Communication Style',
    subtitle: 'How do you use English in real communication?',
    icon: 'MessageCircle',
    questions: communicationQuestions,
  },
  {
    id: 'goals',
    title: 'Your Goals & Preferences',
    subtitle: 'What do you want to achieve and how do you like to learn?',
    icon: 'Target',
    questions: goalsQuestions,
  },
];

// Flat list of all questions for easy access
export const ALL_WELCOME_TEST_QUESTIONS: WelcomeTestQuestionDef[] = 
  WELCOME_TEST_SECTIONS_WITH_QUESTIONS.flatMap(s => s.questions);

export const WELCOME_TEST_TOTAL_QUESTIONS = ALL_WELCOME_TEST_QUESTIONS.length;

// Short version: ~25 key questions covering all sections + trait detectors + 1 speaking + 1 listening
export const WELCOME_TEST_SHORT_QUESTION_IDS = [
  // About You (4): self-assessment, motivation, anxiety, input channel
  'wt_q1', 'wt_q3', 'wt_q7', 'wt_q8',
  // Experience (2): duration, open challenge
  'wt_q9', 'wt_q12',
  // Scenarios (4): error attitude, writing task, speaking, listening
  'wt_q14', 'wt_q16', 'wt_q16s', 'wt_q18l',
  // Grammar (3): A2 simple, B2 conditional, B1-B2 transformation
  'wt_q20', 'wt_q22', 'wt_q26',
  // Vocabulary (3): collocation, word formation, idiom
  'wt_q28', 'wt_q30', 'wt_q34',
  // Communication (2): open declining, natural sounding
  'wt_q36', 'wt_q38',
  // Goals (4): feedback pref, interests, confidence matrix, self-intro speaking
  'wt_q42', 'wt_q43', 'wt_q44', 'wt_q41s',
];

export const WELCOME_TEST_SHORT_QUESTIONS_COUNT = WELCOME_TEST_SHORT_QUESTION_IDS.length;
