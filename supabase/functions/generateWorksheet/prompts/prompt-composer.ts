/**
 * Prompt composer - combines all prompt parts into the complete system message
 */

import { getCoreInstructions } from './core-instructions.ts';
import { getExerciseTemplates } from './exercise-templates.ts';
import { getFinalRequirements } from './final-requirements.ts';

export const composeSystemMessage = (
  hasGrammarFocus: boolean, 
  grammarFocus: string | null, 
  formData: any, 
  exerciseCount: number = 8, 
  selectedExercises?: string[],
  selectedImage?: any
): string => {
  // Build image context if available
  let imageContext = '';
  if (selectedImage) {
    imageContext = `\n\nIMAGE CONTEXT FOR PICTURE EXERCISES:
You have access to the following image for picture-based exercises:
- Image URL: ${selectedImage.url}
- Image Description: ${selectedImage.description}
- Photographer: ${selectedImage.photographer}
- Photo Source: Unsplash

For any picture-based exercises (describe-picture, answer-questions with picture, multiple-choice with picture, true-false with picture):
- Reference this specific image in your instructions
- Create questions and content based on what's visible in this image
- Include the image URL in the exercise data as "image_url": "${selectedImage.url}"
- Add photographer attribution: "photographer": "${selectedImage.photographer}", "photographer_url": "${selectedImage.photographerUrl}"
`;
  }
  
  const coreInstructions = getCoreInstructions(hasGrammarFocus, grammarFocus, formData, exerciseCount, selectedExercises);
  // ETAP 4: Pass hasSelectedImage boolean to getExerciseTemplates
  const exerciseTemplates = getExerciseTemplates(hasGrammarFocus, grammarFocus, exerciseCount, selectedExercises, !!selectedImage);
  const finalRequirements = getFinalRequirements(hasGrammarFocus, exerciseCount, selectedExercises, formData.englishLevel, !!selectedImage);
  
  return `${coreInstructions}${imageContext}

${exerciseTemplates}

${finalRequirements}`;
};