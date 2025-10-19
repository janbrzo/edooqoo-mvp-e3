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
  
  // Build image context if available
  let imageContext = '';
  if (selectedImage) {
    // Check if this is an AI-generated image with detailed description
    const isAIGenerated = selectedImage.source === 'gemini-generated';
    const hasDetailedDescription = !!selectedImage.detailedDescription;

    if (isAIGenerated && hasDetailedDescription) {
      // AI-GENERATED IMAGE: Use detailed description for precise exercise generation
      imageContext = `\n\nAI-GENERATED IMAGE CONTENT FOR PICTURE EXERCISES:

You have been provided with an AI-generated image specifically created for this lesson. Below is a DETAILED, FACTUAL description of the image content:

${selectedImage.detailedDescription}

IMAGE CONTEXT FOR PICTURE EXERCISES:

For picture-based exercises, use SPECIFIC DETAILS from description above (people, objects, colors, positions, actions). Each exercise must focus on different aspects. Non-picture exercises ignore this image.
`;
    }
  }
  
  const coreInstructions = getCoreInstructions(hasGrammarFocus, grammarFocus, formData, exerciseCount, normalizedExercises, !!selectedImage);
  const exerciseTemplates = getExerciseTemplates(hasGrammarFocus, grammarFocus, exerciseCount, selectedExercises, !!selectedImage);
  const finalRequirements = getFinalRequirements(hasGrammarFocus, exerciseCount, selectedExercises, formData.englishLevel, !!selectedImage);
  
  return `${coreInstructions}${imageContext}

${exerciseTemplates}

${finalRequirements}`;
};