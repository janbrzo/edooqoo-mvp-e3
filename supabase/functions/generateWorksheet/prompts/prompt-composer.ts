/**
 * Prompt composer - combines all prompt parts into the complete system message
 */

import { getCoreInstructions } from './core-instructions.ts';
import { getExerciseTemplates } from './exercise-templates.ts';
import { getFinalRequirements } from './final-requirements.ts';

export const composeSystemMessage = (hasGrammarFocus: boolean, grammarFocus: string | null, formData: any, exerciseCount: number = 8, selectedExercises?: string[]): string => {
  const coreInstructions = getCoreInstructions(hasGrammarFocus, grammarFocus, formData, exerciseCount, selectedExercises);
  const exerciseTemplates = getExerciseTemplates(hasGrammarFocus, grammarFocus, exerciseCount, selectedExercises);
  const finalRequirements = getFinalRequirements(hasGrammarFocus, exerciseCount, selectedExercises, formData.englishLevel);
  
  return `${coreInstructions}

${exerciseTemplates}

${finalRequirements}`;
};