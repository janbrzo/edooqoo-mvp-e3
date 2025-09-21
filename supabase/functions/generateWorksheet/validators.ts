
// Exercise validation functions

/**
 * Validates a single exercise based on its type
 */
export function validateExercise(exercise: any): void {
  if (!exercise || typeof exercise !== 'object') {
    throw new Error('Exercise must be an object');
  }
  
  if (!exercise.type || typeof exercise.type !== 'string') {
    throw new Error('Exercise must have a valid type');
  }
  
  // Type-specific validation
  switch (exercise.type) {
    case 'reading':
      validateReadingExercise(exercise);
      break;
    case 'matching':
      validateMatchingExercise(exercise);
      break;
    case 'fill-in-blanks':
      validateFillInBlanksExercise(exercise);
      break;
    case 'multiple-choice':
      validateMultipleChoiceExercise(exercise);
      break;
    case 'dialogue':
      validateDialogueExercise(exercise);
      break;
    case 'true-false':
      validateTrueFalseExercise(exercise);
      break;
    case 'discussion':
      validateDiscussionExercise(exercise);
      break;
    case 'error-correction':
      validateErrorCorrectionExercise(exercise);
      break;
    // New Phase 1 exercise validations
    case 'odd-one-out':
      validateOddOneOutExercise(exercise);
      break;
    case 'synonyms-antonyms':
      validateSynonymsAntonymsExercise(exercise);
      break;
    case 'sentence-transformation':
      validateSentenceTransformationExercise(exercise);
      break;
    case 'word-order':
      validateWordOrderExercise(exercise);
      break;
    case 'gap-text':
      validateGapTextExercise(exercise);
      break;
    case 'negative-prefixes':
      validateNegativePrefixesExercise(exercise);
      break;
    default:
      console.warn(`Unknown exercise type: ${exercise.type}`);
  }
}

function validateReadingExercise(exercise: any): void {
  if (!exercise.content || typeof exercise.content !== 'string') {
    throw new Error('Reading exercise must have content');
  }
  
  const wordCount = exercise.content.split(/\s+/).filter(Boolean).length;
  if (wordCount < 200 || wordCount > 400) {
    console.warn(`Reading exercise word count (${wordCount}) outside recommended range of 200-400 words`);
  }
  
  if (!exercise.questions || !Array.isArray(exercise.questions) || exercise.questions.length < 5) {
    throw new Error('Reading exercise must have at least 5 questions');
  }
}

function validateMatchingExercise(exercise: any): void {
  if (!exercise.items || !Array.isArray(exercise.items) || exercise.items.length < 5) {
    throw new Error('Matching exercise must have at least 5 items');
  }
  
  for (const item of exercise.items) {
    if (!item.term || !item.definition) {
      throw new Error('Each matching item must have both term and definition');
    }
  }
}

function validateFillInBlanksExercise(exercise: any): void {
  if (!exercise.sentences || !Array.isArray(exercise.sentences) || exercise.sentences.length < 5) {
    throw new Error('Fill-in-blanks exercise must have at least 5 sentences');
  }
  
  if (!exercise.word_bank || !Array.isArray(exercise.word_bank) || exercise.word_bank.length < 5) {
    throw new Error('Fill-in-blanks exercise must have a word bank with at least 5 words');
  }
}

function validateMultipleChoiceExercise(exercise: any): void {
  if (!exercise.questions || !Array.isArray(exercise.questions) || exercise.questions.length < 5) {
    throw new Error('Multiple choice exercise must have at least 5 questions');
  }
  
  for (const question of exercise.questions) {
    if (!question.options || !Array.isArray(question.options) || question.options.length !== 4) {
      throw new Error('Each multiple choice question must have exactly 4 options');
    }
    
    const correctCount = question.options.filter((opt: any) => opt.correct).length;
    if (correctCount !== 1) {
      throw new Error('Each multiple choice question must have exactly one correct answer');
    }
  }
}

function validateDialogueExercise(exercise: any): void {
  if (!exercise.dialogue || !Array.isArray(exercise.dialogue) || exercise.dialogue.length < 5) {
    throw new Error('Dialogue exercise must have at least 5 exchanges');
  }
  
  if (!exercise.expressions || !Array.isArray(exercise.expressions) || exercise.expressions.length < 5) {
    throw new Error('Dialogue exercise must have at least 5 expressions');
  }
}

function validateTrueFalseExercise(exercise: any): void {
  if (!exercise.statements || !Array.isArray(exercise.statements) || exercise.statements.length < 5) {
    throw new Error('True/False exercise must have at least 5 statements');
  }
  
  for (const statement of exercise.statements) {
    if (typeof statement.isTrue !== 'boolean') {
      throw new Error('Each true/false statement must have a boolean isTrue property');
    }
  }
}

function validateDiscussionExercise(exercise: any): void {
  if (!exercise.questions || !Array.isArray(exercise.questions) || exercise.questions.length < 5) {
    throw new Error('Discussion exercise must have at least 5 questions');
  }
}

function validateErrorCorrectionExercise(exercise: any): void {
  if (!exercise.sentences || !Array.isArray(exercise.sentences) || exercise.sentences.length < 5) {
    throw new Error('Error correction exercise must have at least 5 sentences');
  }
  
  for (const sentence of exercise.sentences) {
    if (!sentence.text || !sentence.correction) {
      throw new Error('Each error correction sentence must have both text and correction');
    }
  }
}

// New Phase 1 exercise validation functions
function validateOddOneOutExercise(exercise: any): void {
  console.log('🔧 [VALIDATOR] Validating odd-one-out exercise:', JSON.stringify(exercise, null, 2));
  
  if (!exercise.groups || !Array.isArray(exercise.groups) || exercise.groups.length < 8) {
    console.log('🔧 [VALIDATOR] Expected groups array with 8+ items, got:', exercise.groups);
    throw new Error('Odd One Out exercise must have at least 8 groups');
  }
  
  for (const group of exercise.groups) {
    if (!group.words || !Array.isArray(group.words) || group.words.length !== 4) {
      console.log('🔧 [VALIDATOR] Expected 4 words in group, got:', group.words);
      throw new Error('Each Odd One Out group must have exactly 4 words');
    }
    if (!group.odd_one) {
      console.log('🔧 [VALIDATOR] Missing odd_one in group:', group);
      throw new Error('Each Odd One Out group must have an odd_one property');
    }
    if (!group.reason) {
      console.log('🔧 [VALIDATOR] Missing reason in group:', group);
      throw new Error('Each Odd One Out group must have a reason property');
    }
  }
}

function validateSynonymsAntonymsExercise(exercise: any): void {
  console.log('🔧 [VALIDATOR] Validating synonyms-antonyms exercise:', JSON.stringify(exercise, null, 2));
  
  if (!exercise.pairs || !Array.isArray(exercise.pairs) || exercise.pairs.length < 10) {
    console.log('🔧 [VALIDATOR] Expected pairs array with 10+ items, got:', exercise.pairs);
    throw new Error('Synonyms/Antonyms exercise must have at least 10 pairs');
  }
  
  for (const pair of exercise.pairs) {
    if (!pair.word || !pair.match || !pair.type) {
      console.log('🔧 [VALIDATOR] Missing properties in pair:', pair);
      throw new Error('Each synonym/antonym pair must have word, match, and type properties');
    }
  }
}

function validateSentenceTransformationExercise(exercise: any): void {
  console.log('🔧 [VALIDATOR] Validating sentence-transformation exercise:', JSON.stringify(exercise, null, 2));
  
  if (!exercise.sentences || !Array.isArray(exercise.sentences) || exercise.sentences.length < 10) {
    console.log('🔧 [VALIDATOR] Expected sentences array with 10+ items, got:', exercise.sentences);
    throw new Error('Sentence Transformation exercise must have at least 10 sentences');
  }
  
  for (const sentence of exercise.sentences) {
    if (!sentence.original || !sentence.transformed || !sentence.instruction) {
      console.log('🔧 [VALIDATOR] Missing properties in sentence:', sentence);
      throw new Error('Each transformation sentence must have original, transformed, and instruction');
    }
  }
}

function validateWordOrderExercise(exercise: any): void {
  console.log('🔧 [VALIDATOR] Validating word-order exercise:', JSON.stringify(exercise, null, 2));
  
  if (!exercise.sentences || !Array.isArray(exercise.sentences) || exercise.sentences.length < 10) {
    console.log('🔧 [VALIDATOR] Expected sentences array with 10+ items, got:', exercise.sentences);
    throw new Error('Word Order exercise must have at least 10 sentences');
  }
  
  for (const sentence of exercise.sentences) {
    if (!sentence.scrambled_words || !sentence.correct_order) {
      console.log('🔧 [VALIDATOR] Missing properties in sentence:', sentence);
      throw new Error('Each word order sentence must have scrambled_words and correct_order');
    }
  }
}

function validateGapTextExercise(exercise: any): void {
  console.log('🔧 [VALIDATOR] Validating gap-text exercise:', JSON.stringify(exercise, null, 2));
  
  if (!exercise.sentences || !Array.isArray(exercise.sentences) || exercise.sentences.length < 10) {
    console.log('🔧 [VALIDATOR] Expected sentences array with 10+ items, got:', exercise.sentences);
    throw new Error('Gap Text exercise must have at least 10 sentences');
  }
  
  for (const sentence of exercise.sentences) {
    if (!sentence.text || !sentence.answer) {
      console.log('🔧 [VALIDATOR] Missing properties in sentence:', sentence);
      throw new Error('Each gap text sentence must have text and answer');
    }
    if (!sentence.text.includes('_____')) {
      console.log('🔧 [VALIDATOR] Sentence missing blanks:', sentence.text);
      throw new Error('Gap text sentence must contain blank spaces (_____)');
    }
  }
  
  if (exercise.word_bank && !Array.isArray(exercise.word_bank)) {
    console.log('🔧 [VALIDATOR] Invalid word_bank:', exercise.word_bank);
    throw new Error('Word bank must be an array if provided');
  }
}

function validateNegativePrefixesExercise(exercise: any): void {
  console.log('🔧 [VALIDATOR] Validating negative-prefixes exercise:', JSON.stringify(exercise, null, 2));
  
  if (!exercise.words || !Array.isArray(exercise.words) || exercise.words.length < 10) {
    console.log('🔧 [VALIDATOR] Expected words array with 10+ items, got:', exercise.words);
    throw new Error('Negative Prefixes exercise must have at least 10 words');
  }
  
  for (const word of exercise.words) {
    if (!word.base_word || !word.prefix) {
      console.log('🔧 [VALIDATOR] Missing properties in word:', word);
      throw new Error('Each negative prefix word must have base_word and prefix');
    }
  }
}
