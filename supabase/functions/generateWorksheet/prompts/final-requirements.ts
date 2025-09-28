/**
 * Final requirements section - DYNAMIC content based on selected exercises
 */

export const getFinalRequirements = (hasGrammarFocus: boolean, exerciseCount: number = 8, selectedExercises?: string[]) => {
  console.log(`🔧 [FINAL-REQUIREMENTS] Generating requirements for ${exerciseCount} exercises, selected: ${selectedExercises?.join(', ') || 'default order'}`);
  
  // Exercise-specific requirements mapping
  const exerciseRequirements = {
    'reading': 'Exercise with reading must have content more than 300 words. Analyze the lessonTopic, lessonGoal, grammarFocus and additionalInformation to determine the most appropriate text format.',
    'true-false': 'EXACTLY 10 statements ALL directly based on the reading text from Exercise 1. NO general knowledge questions.',
    'matching': 'EXACTLY 10 items to match with proper term-definition pairs.',
    'fill-in-blanks': 'EXACTLY 10 sentences and 10 words in word bank.',
    'multiple-choice': 'EXACTLY 10 questions with 4 options each. All 4 options must be completely different from each other.',
    'dialogue': 'AT LEAST 10 dialogue exchanges and EXACTLY 10 expressions.',
    'discussion': 'EXACTLY 10 discussion questions.',
    'error-correction': 'EXACTLY 10 sentences with errors.',
    'odd-one-out': 'EXACTLY 10 groups with EXACTLY 5 options each. Use only vocabulary units. Excluding propare names, names of cities, grammatical units, sentences. Each group must have clear odd-one-out with logical reasoning.',
    'synonyms-antonyms': 'EXACTLY 10 word pairs with synonym/antonym matching. Use "items" array with "term", "definition", "letter" fields.',
    'sentence-transformation': 'EXACTLY 10 sentences with "original", "instruction", and "transformed" fields. Keep the same meaning.',
    'word-order': 'EXACTLY 10 sentences with "scrambled_words" (separated by " / ") and "correct_order" fields.',
    'gap-text': 'EXACTLY 10 sentences with "text", "answer", and "verb" fields. Each sentence must have a word in parentheses after the gap for transformation. The "verb" field contains the base form of the verb in parentheses (e.g., "I _____ (go) to school yesterday" with "verb": "go").',
    'negative-prefixes': 'EXACTLY 10 words with "word" and "answer" fields. Use common negative prefixes: un-, in-, im-, dis-, ir-, il-.',
    'categorize': 'EXACTLY 16 words to sort into EXACTLY 4 categories. MUST include "items" array with 16 strings AND "categories" array with 4 objects containing "name" and "correct_items" fields. Use only vocabulary units. Excluding propare names, names of cities, grammatical units, sentences. Example structure: "items": ["word1", "word2", ...], "categories": [{"name": "Category1", "correct_items": ["word1", "word2"]}].',
    'paraphrasing': 'EXACTLY 10 sentences with "original", "word_to_use", and "answer" fields.',
    'complete-word': 'EXACTLY 10 words with "partial", "complete", and "clue" fields. Missing letters use always all the vowels: a, e, i, o, u, y. For missing letters dont use any consonants.',
    'matching-halves': 'EXACTLY 10 sentence halves with "first_half", "second_half", and "id" fields.',
    'describe-picture': 'Image description and 8 guiding prompts. Include "image_description", "prompts", "useful_vocabulary", and "teacher_tip".',
    'answer-questions': 'EXACTLY 10 questions with "question" and "focus" fields for personal response exercises.'
  };

  let requirements = '\nCRITICAL REQUIREMENTS VERIFICATION:\n';
  
  // Generate requirements based on selected exercises or default order
  if (selectedExercises) {
    selectedExercises.slice(0, exerciseCount).forEach((exerciseType, index) => {
      const requirement = exerciseRequirements[exerciseType];
      if (requirement) {
        requirements += `${index + 1}. Exercise ${index + 1} (${exerciseType}): ${requirement}\n`;
      }
    });
  } else {
    // Default order requirements (first 8 basic exercises)
    const defaultOrder = ['reading', 'true-false', 'matching', 'fill-in-blanks', 'multiple-choice', 'dialogue', 'discussion', 'error-correction'];
    defaultOrder.slice(0, exerciseCount).forEach((exerciseType, index) => {
      const requirement = exerciseRequirements[exerciseType];
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
  
  console.log(`🔧 [FINAL-REQUIREMENTS] Generated requirements: ${requirements.substring(0, 200)}...`);
  return requirements;
};