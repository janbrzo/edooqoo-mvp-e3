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
  // Normalize exercises to handle -picture suffix
  const normalizedExercises = selectedExercises?.map(ex => {
    const normalized = normalizeExerciseId(ex);
    return normalized.baseId;
  });
  
  // Check if any exercises require picture
  const hasPictureExercises = selectedExercises?.some(ex => ex.endsWith('-picture')) || false;
  
  const coreInstructions = getCoreInstructions(hasGrammarFocus, grammarFocus, formData, exerciseCount, normalizedExercises, selectedImage);
  const exerciseTemplates = getExerciseTemplates(hasGrammarFocus, grammarFocus, exerciseCount, selectedExercises, !!selectedImage);
  const finalRequirements = getFinalRequirements(hasGrammarFocus, exerciseCount, selectedExercises, formData.englishLevel, !!selectedImage);
  
  return `${coreInstructions}

${exerciseTemplates}

${finalRequirements}`;
};