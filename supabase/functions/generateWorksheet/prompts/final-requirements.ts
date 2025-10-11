/**
 * Final requirements section - DYNAMIC content based on selected exercises
 */

export const getFinalRequirements = (hasGrammarFocus: boolean, exerciseCount: number = 8, selectedExercises?: string[], englishLevel?: string, hasSelectedImage?: boolean) => {
  // Exercise-specific requirements mapping
  const exerciseRequirements = {
    'reading': `Exercise with reading must have content more than 300 words. Analyze the lessonTopic, lessonGoal, grammarFocus and additionalInformation to determine the most appropriate text format. Ensure all content matches CEFR level ${englishLevel || 'as specified'}.`,
    'true-false': `EXACTLY 10 statements ALL directly based on the reading text from Exercise 1. NO general knowledge questions. Ensure all content matches CEFR level ${englishLevel || 'as specified'}.`,
    'matching': `EXACTLY 10 items to match with proper term-definition pairs. Ensure all content matches CEFR level ${englishLevel || 'as specified'}.`,
    'fill-in-blanks': `EXACTLY 10 sentences and 10 words in word bank. Ensure all content matches CEFR level ${englishLevel || 'as specified'}.`,
    'multiple-choice': `EXACTLY 10 questions with 4 options each. All 4 options must be completely different from each other. Ensure all content matches CEFR level ${englishLevel || 'as specified'}.`,
    'dialogue': `AT LEAST 10 dialogue exchanges and EXACTLY 10 expressions. Ensure all content matches CEFR level ${englishLevel || 'as specified'}.`,
    'discussion': `EXACTLY 10 discussion questions. Ensure all content matches CEFR level ${englishLevel || 'as specified'}.`,
    'error-correction': `EXACTLY 10 sentences with errors. Ensure all content matches CEFR level ${englishLevel || 'as specified'}.`,
    'odd-one-out': `EXACTLY 10 groups with EXACTLY 5 options each. Use only vocabulary units. Excluding propare names, names of cities, grammatical units, sentences. Each group must have clear odd-one-out with logical reasoning. Ensure all content matches CEFR level ${englishLevel || 'as specified'}.`,
    'synonyms-antonyms': `EXACTLY 10 word pairs with synonym/antonym matching. Use "items" array with "term", "definition", "letter" fields. Ensure all content matches CEFR level ${englishLevel || 'as specified'}.`,
    'sentence-transformation': `EXACTLY 10 sentences with "original", "instruction", and "transformed" fields. Keep the same meaning. Ensure all content matches CEFR level ${englishLevel || 'as specified'}.`,
    'word-order': `EXACTLY 10 sentences with "scrambled_words" (separated by " / ") and "correct_order" fields. Ensure all content matches CEFR level ${englishLevel || 'as specified'}.`,
    'gap-text': `EXACTLY 10 sentences with "text", "answer", and "verb" fields. Each sentence must have a word in parentheses after the gap for transformation. The "verb" field contains the base form of the verb in parentheses (e.g., "I _____ (go) to school yesterday" with "verb": "go"). Ensure all content matches CEFR level ${englishLevel || 'as specified'}.`,
    'negative-prefixes': `EXACTLY 10 words with "word" and "answer" fields. Use common negative prefixes: un-, in-, im-, dis-, ir-, il-. Ensure all content matches CEFR level ${englishLevel || 'as specified'}.`,
    'categorize': `EXACTLY 16 words to sort into EXACTLY 4 categories. MUST include "items" array with 16 strings AND "categories" array with 4 objects containing "name" and "correct_items" fields. Use only vocabulary units. Excluding propare names, names of cities, grammatical units, sentences. Example structure: "items": ["word1", "word2", ...], "categories": [{"name": "Category1", "correct_items": ["word1", "word2"]}]. Ensure all content matches CEFR level ${englishLevel || 'as specified'}.`,
    'paraphrasing': `EXACTLY 10 sentences with "original", "word_to_use", and "answer" fields. Ensure all content matches CEFR level ${englishLevel || 'as specified'}.`,
    'complete-word': `EXACTLY 10 words with "partial", "complete", and "clue" fields. Missing letters use always all the vowels: a, e, i, o, u, y. For missing letters dont use any consonants. Ensure all content matches CEFR level ${englishLevel || 'as specified'}.`,
    'matching-halves': `EXACTLY 10 sentence halves with "first_half", "second_half", and "id" fields. Ensure all content matches CEFR level ${englishLevel || 'as specified'}.`,
    'describe-picture': hasSelectedImage 
      ? `Generate complete exercise based on the provided image. Include "image_description" describing the actual image, 8 detailed "prompts" specific to what's visible in the image, "useful_vocabulary" relevant to the image content, "image_url", "photographer", and "photographer_url". Time: 10 min. Ensure all content matches CEFR level ${englishLevel || 'as specified'}.`
      : `Generate generic describe-picture exercise with general prompts. Include "image_description", 8 general "prompts", and "useful_vocabulary". Time: 10 min. Ensure all content matches CEFR level ${englishLevel || 'as specified'}.`,
    'answer-questions': hasSelectedImage
      ? `Generate EXACTLY 10 questions with "question" and "focus" fields based on the provided image. Questions should reference what's visible in the image and encourage personal response. Include "image_url", "photographer", and "photographer_url" in exercise data. Time: 8 min. Ensure all content matches CEFR level ${englishLevel || 'as specified'}.`
      : `EXACTLY 10 questions with "question" and "focus" fields for personal response exercises. Ensure all content matches CEFR level ${englishLevel || 'as specified'}.`,
    'multiple-choice-picture': hasSelectedImage
      ? `Generate EXACTLY 10 multiple-choice questions based on the provided image. Each question must have 4 options with one correct answer. Questions should reference what's visible in the image. Include "image_url", "photographer", and "photographer_url" in exercise data. Time: 8 min. Ensure all content matches CEFR level ${englishLevel || 'as specified'}.`
      : `Generate EXACTLY 10 multiple-choice questions about pictures in general. Time: 8 min. Ensure all content matches CEFR level ${englishLevel || 'as specified'}.`,
    'true-false-picture': hasSelectedImage
      ? `Generate EXACTLY 10 true/false statements based on the provided image. Statements should reference what's visible in the image. Include "image_url", "photographer", and "photographer_url" in exercise data. Time: 5 min. Ensure all content matches CEFR level ${englishLevel || 'as specified'}.`
      : `Generate EXACTLY 10 true/false statements about pictures in general. Time: 5 min. Ensure all content matches CEFR level ${englishLevel || 'as specified'}.`
  };

  let requirements = '\nCRITICAL REQUIREMENTS VERIFICATION:\n';
  
  // Generate requirements based on selected exercises or default order
  if (selectedExercises) {
    selectedExercises.slice(0, exerciseCount).forEach((exerciseType, index) => {
      const requirement = exerciseRequirements[exerciseType as keyof typeof exerciseRequirements];
      if (requirement) {
        requirements += `${index + 1}. Exercise ${index + 1} (${exerciseType}): ${requirement}\n`;
      }
    });
  } else {
    // Default order requirements (first 8 basic exercises)
    const defaultOrder = ['reading', 'true-false', 'matching', 'fill-in-blanks', 'multiple-choice', 'dialogue', 'discussion', 'error-correction'];
    defaultOrder.slice(0, exerciseCount).forEach((exerciseType, index) => {
      const requirement = exerciseRequirements[exerciseType as keyof typeof exerciseRequirements];
      if (requirement) {
        requirements += `${index + 1}. Exercise ${index + 1} (${exerciseType}): ${requirement}\n`;
      }
    });
  }
  
  requirements += `${exerciseCount + 1}. Vocabulary sheet: EXACTLY 15 terms with definitions.\n`;
  
  if (hasGrammarFocus) {
    requirements += `${exerciseCount + 2}. Grammar Rules: Must include 4-7 grammar rules with title, explanation, and 3 examples each.\n`;
  }
  
  requirements += '\nRETURN ONLY VALID JSON. NO MARKDOWN. NO ADDITIONAL TEXT.';
  
  return requirements;
};