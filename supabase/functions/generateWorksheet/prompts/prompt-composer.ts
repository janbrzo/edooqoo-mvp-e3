/**
 * Prompt composer - combines all prompt parts into the complete system message
 */

import { getCoreInstructions } from './core-instructions.ts';
import { getExerciseTemplates } from './exercise-templates.ts';
import { getFinalRequirements } from './final-requirements.ts';

export const composeSystemMessage = (hasGrammarFocus: boolean, grammarFocus: string | null, formData: any, exerciseCount: number): string => {
  const coreInstructions = getCoreInstructions(hasGrammarFocus, grammarFocus, formData, exerciseCount);
  const exerciseTemplates = getExerciseTemplates(hasGrammarFocus, grammarFocus);
  const finalRequirements = getFinalRequirements(hasGrammarFocus, exerciseCount);
  
  return `${coreInstructions}

${exerciseTemplates}

${finalRequirements}`;
};