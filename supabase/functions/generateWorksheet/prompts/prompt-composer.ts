/**
 * Prompt composer - combines all prompt parts into the complete system message
 */

import { getCoreInstructions } from './core-instructions.ts';
import { getExerciseTemplates } from './exercise-templates.ts';
import { getFinalRequirements } from './final-requirements.ts';
import { getMediaInstructions } from './media-instructions.ts';

export const composeSystemMessage = (hasGrammarFocus: boolean, grammarFocus: string | null, formData: any, exerciseCount: number = 8, selectedExercises?: string[]): string => {
  // Check if worksheet uses picture media
  const hasPictureMedia = formData?.selectedMediaTypes?.includes('picture') || false;
  
  const coreInstructions = getCoreInstructions(hasGrammarFocus, grammarFocus, formData, exerciseCount, selectedExercises);
  const mediaInstructions = getMediaInstructions(hasPictureMedia);
  const exerciseTemplates = getExerciseTemplates(hasGrammarFocus, grammarFocus, exerciseCount, selectedExercises);
  const finalRequirements = getFinalRequirements(hasGrammarFocus, exerciseCount, selectedExercises, formData.englishLevel, hasPictureMedia);
  
  return `${coreInstructions}

${mediaInstructions}

${exerciseTemplates}

${finalRequirements}`;
};