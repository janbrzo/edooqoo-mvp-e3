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
    imageContext = `\n\nIMAGE CONTEXT FOR PICTURE EXERCISES:
You have access to the following image for picture-based exercises:
- Image URL: ${selectedImage.url}
- Image Description: ${selectedImage.description}
- Photographer: ${selectedImage.photographer}
- Photo Source: Unsplash

For any picture-based exercises (describe-picture, answer-questions-picture, multiple-choice-picture, true-false-picture):
- These exercises with "-picture" suffix MUST reference this specific image
- Create questions and content based on what's visible in this image
- Include the image URL in the exercise data as "image_url": "${selectedImage.url}"
- Add photographer attribution: "photographer": "${selectedImage.photographer}", "photographer_url": "${selectedImage.photographerUrl}"

IMPORTANT: Exercises WITHOUT the "-picture" suffix should be generated normally without referencing the image.
`;
  }
  
  const coreInstructions = getCoreInstructions(hasGrammarFocus, grammarFocus, formData, exerciseCount, normalizedExercises, !!selectedImage);
  const exerciseTemplates = getExerciseTemplates(hasGrammarFocus, grammarFocus, exerciseCount, selectedExercises, !!selectedImage);
  const finalRequirements = getFinalRequirements(hasGrammarFocus, exerciseCount, selectedExercises, formData.englishLevel, !!selectedImage);
  
  return `${coreInstructions}${imageContext}

${exerciseTemplates}

${finalRequirements}`;
};