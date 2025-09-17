/**
 * Prompt composer - combines all prompt parts into the complete system message
 */

import { getCoreInstructions } from './core-instructions.ts';
import { getExerciseTemplates } from './exercise-templates.ts';
import { getFinalRequirements } from './final-requirements.ts';

export const composeSystemMessage = (hasGrammarFocus: boolean, grammarFocus: string | null, formData: any, exerciseCount: number): string => {
  console.log(`🔧 [PROMPT-COMPOSER] Composing system message with ${exerciseCount} exercises, grammar focus: ${hasGrammarFocus ? grammarFocus : 'none'}`);
  console.log(`🔧 [PROMPT-COMPOSER] Exercise count passed to getCoreInstructions: ${exerciseCount}`);
  console.log(`🔧 [PROMPT-COMPOSER] Exercise count passed to getExerciseTemplates: ${exerciseCount}`);
  
  const coreInstructions = getCoreInstructions(hasGrammarFocus, grammarFocus, formData, exerciseCount);
  const exerciseTemplates = getExerciseTemplates(hasGrammarFocus, grammarFocus, exerciseCount);
  const finalRequirements = getFinalRequirements(hasGrammarFocus, exerciseCount);
  
  return `${coreInstructions}

${exerciseTemplates}

${finalRequirements}`;
};