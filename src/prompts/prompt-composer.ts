/**
 * Main prompt composer that dynamically builds the complete prompt
 * Based on lesson duration and grammar focus requirements
 */

import { 
  getCoreInstructions, 
  getGrammarSection, 
  getNoGrammarSection, 
  getCriticalVerification 
} from './core-instructions';

import {
  getReadingExerciseTemplate,
  getTrueFalseExerciseTemplate,
  getMatchingExerciseTemplate,
  getFillInBlanksExerciseTemplate,
  getMultipleChoiceExerciseTemplate,
  getDialogueExerciseTemplate,
  getDiscussionExerciseTemplate,
  getErrorCorrectionExerciseTemplate,
  getVocabularySheetTemplate,
  getGrammarRulesTemplate
} from './exercise-templates';

interface FormData {
  englishLevel: string;
  lessonTime: string;
  teachingPreferences?: string;
}

export const composeWorksheetPrompt = (formData: FormData, hasGrammarFocus: boolean, grammarFocus?: string) => {
  // Determine exercise count based on lesson duration
  const exerciseCount = formData.lessonTime === '45' ? 6 : 8;
  
  // Get exercise templates based on duration
  const exerciseTemplates = getSelectedExerciseTemplates(exerciseCount);
  
  // Build the complete system message
  const systemMessage = `${getCoreInstructions()}

${hasGrammarFocus ? getGrammarSection(grammarFocus!, formData.englishLevel) : getNoGrammarSection()}

20. Generate a structured JSON worksheet with this EXACT format:
EXAMPLE OUTPUT (IGNORE CONTENT, FOCUS ON STRUCTURE):
{
  "title": "In a restaurant",
  "subtitle": "Making a complaint about your dish in a restaurant: adjectives practice",
  "introduction": "In this lesson, you'll practice a restaurant role-play, learn how to order food, and make a complaint about an incorrect order. You'll also review grammar related to adjectives in their comparative and superlative forms.",
  ${hasGrammarFocus ? getGrammarRulesTemplate(grammarFocus!) : ''}
  "exercises": [
${exerciseTemplates}
  ],
${getVocabularySheetTemplate()}
}
END OF EXAMPLE

${getCriticalVerification(hasGrammarFocus)}`;

  // Update the exercise count instruction dynamically
  const finalSystemMessage = systemMessage.replace(
    '2. Use EXACTLY these exercise types in this EXACT ORDER: reading, true-false, matching, fill-in-blanks, multiple-choice, dialogue, discussion, error-correction',
    `1. Create EXACTLY ${exerciseCount} exercises. No fewer, no more. Number them Exercise 1 through Exercise ${exerciseCount}.
2. Use EXACTLY these exercise types in this EXACT ORDER: ${getExerciseTypesList(exerciseCount)}`
  );

  return finalSystemMessage;
};

const getSelectedExerciseTemplates = (count: number): string => {
  const templates = [
    getReadingExerciseTemplate(),
    getTrueFalseExerciseTemplate(),
    getMatchingExerciseTemplate(),
    getFillInBlanksExerciseTemplate(),
    getMultipleChoiceExerciseTemplate(),
    getDialogueExerciseTemplate()
  ];

  // Add remaining exercises for 60-minute lessons
  if (count === 8) {
    templates.push(getDiscussionExerciseTemplate());
    templates.push(getErrorCorrectionExerciseTemplate());
  }

  return templates.join(',\n');
};

const getExerciseTypesList = (count: number): string => {
  const types = [
    'reading',
    'true-false', 
    'matching',
    'fill-in-blanks',
    'multiple-choice',
    'dialogue'
  ];

  if (count === 8) {
    types.push('discussion', 'error-correction');
  }

  return types.join(', ');
};

// Helper function for backwards compatibility
export const getExerciseTypesForCount = (count: number): string[] => {
  const fullSet = [
    'reading',
    'true-false',
    'matching',
    'fill-in-blanks',
    'multiple-choice',
    'dialogue',
    'discussion',
    'error-correction'
  ];
  
  return count === 6 ? fullSet.slice(0, 6) : fullSet;
};