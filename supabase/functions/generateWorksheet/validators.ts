
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
    if (!sentence.incorrect || !sentence.correct) {
      throw new Error('Each error correction sentence must have both incorrect and correct');
    }
  }
}

// New Phase 1 exercise validation functions
function validateOddOneOutExercise(exercise: any): void {
  if (!exercise.questions || !Array.isArray(exercise.questions) || exercise.questions.length < 8) {
    throw new Error('Odd One Out exercise must have at least 8 questions');
  }
  
  for (const question of exercise.questions) {
    if (!question.options || !Array.isArray(question.options) || question.options.length !== 5) {
      throw new Error('Each Odd One Out question must have exactly 5 options');
    }
    if (!question.correct_answer) {
      throw new Error('Each Odd One Out question must have a correct answer');
    }
  }
}

function validateSynonymsAntonymsExercise(exercise: any): void {
  if (!exercise.items || !Array.isArray(exercise.items) || exercise.items.length < 8) {
    throw new Error('Synonyms/Antonyms exercise must have at least 8 items');
  }
  
  for (const item of exercise.items) {
    if (!item.word || !item.match) {
      throw new Error('Each synonym/antonym item must have both word and match');
    }
  }
}

function validateSentenceTransformationExercise(exercise: any): void {
  if (!exercise.sentences || !Array.isArray(exercise.sentences) || exercise.sentences.length < 8) {
    throw new Error('Sentence Transformation exercise must have at least 8 sentences');
  }
  
  for (const sentence of exercise.sentences) {
    if (!sentence.original || !sentence.transformed || !sentence.instruction) {
      throw new Error('Each transformation sentence must have original, transformed, and instruction');
    }
  }
}

function validateWordOrderExercise(exercise: any): void {
  if (!exercise.sentences || !Array.isArray(exercise.sentences) || exercise.sentences.length < 8) {
    throw new Error('Word Order exercise must have at least 8 sentences');
  }
  
  for (const sentence of exercise.sentences) {
    if (!sentence.scrambled_words || !sentence.correct_order) {
      throw new Error('Each word order sentence must have scrambled_words and correct_order');
    }
  }
}

function validateGapTextExercise(exercise: any): void {
  if (!exercise.sentences || !Array.isArray(exercise.sentences) || exercise.sentences.length < 8) {
    throw new Error('Gap Text exercise must have at least 8 sentences');
  }
  
  for (const sentence of exercise.sentences) {
    if (!sentence.text || !sentence.answer) {
      throw new Error('Each gap text sentence must have text and answer');
    }
    if (!sentence.text.includes('_____')) {
      throw new Error('Gap text sentence must contain blank spaces (_____)');
    }
  }
  
  if (exercise.word_bank && !Array.isArray(exercise.word_bank)) {
    throw new Error('Word bank must be an array if provided');
  }
}

function validateNegativePrefixesExercise(exercise: any): void {
  if (!exercise.words || !Array.isArray(exercise.words) || exercise.words.length < 8) {
    throw new Error('Negative Prefixes exercise must have at least 8 words');
  }
  
  for (const word of exercise.words) {
    if (!word.base_word || !word.prefix) {
      throw new Error('Each negative prefix word must have base_word and prefix');
    }
  }
}
