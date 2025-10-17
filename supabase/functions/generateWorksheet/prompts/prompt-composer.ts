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
  selectedImage?: any,
  selectedVideo?: any
): string => {
  // Normalize exercises to handle -picture suffix
  const normalizedExercises = selectedExercises?.map(ex => {
    const normalized = normalizeExerciseId(ex);
    return normalized.baseId;
  });
  
  // Check if any exercises require picture or video
  const hasPictureExercises = selectedExercises?.some(ex => ex.endsWith('-picture')) || false;
  const hasVideoExercises = selectedExercises?.some(ex => ex.endsWith('-video')) || false;
  
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
  
  // Build video context if available
  let videoContext = '';
  if (selectedVideo) {
    videoContext = `\n\nVIDEO CONTEXT FOR VIDEO EXERCISES:
You have access to the following video for video-based exercises:
- Video URL: ${selectedVideo.url}
- Video Title: ${selectedVideo.title}
- Video Description: ${selectedVideo.description}
- Channel: ${selectedVideo.channelTitle}
- Source: YouTube

For any video-based exercises (describe-video, answer-questions-video, multiple-choice-video, true-false-video):
- These exercises with "-video" suffix MUST reference this specific video
- Create questions and content based on what's visible/audible in this video
- Include the video URL in the exercise data as "video_url": "${selectedVideo.url}"
- Add video metadata: "video_title": "${selectedVideo.title}", "channel_title": "${selectedVideo.channelTitle}"
- Consider both visual and audio elements when creating questions
- For describe-video: Focus on scenes, actions, body language, setting
- For comprehension: Focus on main ideas, details, vocabulary used

IMPORTANT: Exercises WITHOUT the "-video" suffix should be generated normally without referencing the video.
`;
  }
  
  const coreInstructions = getCoreInstructions(hasGrammarFocus, grammarFocus, formData, exerciseCount, normalizedExercises, !!selectedImage || !!selectedVideo);
  const exerciseTemplates = getExerciseTemplates(hasGrammarFocus, grammarFocus, exerciseCount, selectedExercises, !!selectedImage || !!selectedVideo);
  const finalRequirements = getFinalRequirements(hasGrammarFocus, exerciseCount, selectedExercises, formData.englishLevel, !!selectedImage || !!selectedVideo);
  
  return `${coreInstructions}${imageContext}${videoContext}

${exerciseTemplates}

${finalRequirements}`;
};