/**
 * Prompt composer - combines all prompt parts into the complete system message
 */

import { getCoreInstructions } from './core-instructions.ts';
import { getExerciseTemplates } from './exercise-templates.ts';
import { getFinalRequirements } from './final-requirements.ts';
import { normalizeExerciseId } from '../helpers.ts';

export const composeSystemMessage = (
  hasGrammarFocus: boolean, 
  grammarFocus: string | null, 
  formData: any, 
  exerciseCount: number = 8, 
  selectedExercises?: string[],
  selectedImage?: any
): string => {
  // ✅ Pass ORIGINAL selectedExercises (with -picture suffix) to ALL functions
  // Each function will handle normalization internally if needed for template lookup
  const coreInstructions = getCoreInstructions(hasGrammarFocus, grammarFocus, formData, exerciseCount, selectedExercises, selectedImage);
  
  // ✅ Pass ORIGINAL exercises - exerciseTemplates will normalize internally for lookup
  // but preserve original type in output JSON
  const exerciseTemplates = getExerciseTemplates(hasGrammarFocus, grammarFocus, exerciseCount, selectedExercises, !!selectedImage);
  
  // ✅ Pass ORIGINAL selectedExercises (with -picture) to finalRequirements
  const finalRequirements = getFinalRequirements(hasGrammarFocus, exerciseCount, selectedExercises, formData.englishLevel, !!selectedImage);
  
  return `${coreInstructions}

${exerciseTemplates}

${finalRequirements}`;
};