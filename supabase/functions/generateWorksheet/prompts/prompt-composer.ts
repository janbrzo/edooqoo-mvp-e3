/**
 * Prompt composer - combines all prompt parts into the complete system message
 */

import { getCoreInstructions } from './core-instructions.ts';
import { getExerciseTemplates } from './exercise-templates.ts';
import { getFinalRequirements } from './final-requirements.ts';

export const composeSystemMessage = (hasGrammarFocus: boolean, grammarFocus: string | null, formData: any, exerciseCount: number = 8): string => {
  console.log(`🔧 [PROMPT-COMPOSER] Composing system message with ${exerciseCount} exercises, grammar focus: ${grammarFocus || 'none'}`);
  
  const coreInstructions = getCoreInstructions(hasGrammarFocus, grammarFocus, formData, exerciseCount);
  console.log(`🔧 [PROMPT-COMPOSER] Exercise count passed to getCoreInstructions: ${exerciseCount}`);
  
  const exerciseTemplates = getExerciseTemplates(hasGrammarFocus, grammarFocus, exerciseCount);
  console.log(`🔧 [PROMPT-COMPOSER] Exercise count passed to getExerciseTemplates: ${exerciseCount}`);
  
  const finalRequirements = getFinalRequirements(hasGrammarFocus, exerciseCount);
  
  return `${coreInstructions}

${exerciseTemplates}

${finalRequirements}`;
};