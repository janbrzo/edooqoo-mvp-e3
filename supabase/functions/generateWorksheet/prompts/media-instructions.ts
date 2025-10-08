/**
 * Media-enhanced instructions for Phase 1 generation
 * When picture mode is enabled, AI generates METADATA ONLY for picture exercises
 */

export const getMediaInstructions = (hasPictureMedia: boolean) => {
  if (!hasPictureMedia) {
    return ''; // No special instructions for non-media worksheets
  }

  return `

CRITICAL PICTURE MODE INSTRUCTIONS:

You are generating a worksheet that will include PICTURE-BASED exercises. This is a TWO-PHASE process:

PHASE 1 (YOUR CURRENT TASK - METADATA ONLY):
For picture-based exercises (describe-picture, answer-questions with pictures, multiple-choice with pictures, true-false with pictures):
- Generate ONLY the exercise structure and metadata
- Include title, instructions, time, and basic framework
- DO NOT generate actual questions, prompts, or specific content yet
- Use placeholder text like "[Questions will be generated based on selected image]"
- Mark these exercises with: "pending_media": true

Example PHASE 1 structure for describe-picture:
{
  "type": "describe-picture",
  "title": "Exercise X: Describe the Picture",
  "icon": "fa-image",
  "time": 10,
  "instructions": "Look at the image carefully and answer the guiding questions below.",
  "pending_media": true,
  "media_type": "picture",
  "prompts": "[Will be generated after image selection]",
  "image_description": "[Will be provided after image selection]",
  "useful_vocabulary": "[Will be generated based on selected image]",
  "teacher_tip": "Exercise content will be generated after teacher selects an appropriate image."
}

Example PHASE 1 structure for answer-questions (picture version):
{
  "type": "answer-questions",
  "title": "Exercise X: Answer Questions About the Picture",
  "icon": "fa-question-circle",
  "time": 8,
  "instructions": "Answer the following questions based on the image shown.",
  "pending_media": true,
  "media_type": "picture",
  "questions": "[Will be generated after image selection]",
  "teacher_tip": "Questions will be created to match the selected image and lesson context."
}

PHASE 2 (WILL HAPPEN LATER):
After the teacher selects an image, a separate AI call will:
- Generate specific questions, prompts, and content based on the actual image
- Reference visual details from the selected photograph
- Create exercises that connect the image to the lesson topic

WHY THIS APPROACH?
The teacher needs to choose an appropriate image before we can create meaningful, image-specific questions and content. Generating generic questions now would be wasteful and less effective.

IMPORTANT: 
- For NON-picture exercises (reading, matching, etc.), generate FULL content as normal
- Only picture-based exercises use this two-phase approach
- Always include "pending_media": true for picture exercises in Phase 1
`;
};
