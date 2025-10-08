/**
 * Media instructions - guidance for AI to generate media-enhanced exercises
 */

export const getMediaInstructions = (selectedMediaTypes?: string[]): string => {
  if (!selectedMediaTypes || selectedMediaTypes.length === 0) {
    return '';
  }

  const hasMedia = selectedMediaTypes.length > 0;
  const mediaType = selectedMediaTypes[0]; // Currently only support 1 media type

  if (!hasMedia) return '';

  let instructions = '\n\n=== MEDIA INTEGRATION INSTRUCTIONS ===\n\n';

  if (mediaType === 'picture') {
    instructions += `🔴 CRITICAL: This worksheet includes PICTURE-ENHANCED exercises.

⚠️⚠️⚠️ PHASE 1 GENERATION (Current) - STRICT RULES ⚠️⚠️⚠️

For exercises that are picture-compatible (multiple-choice, true-false, answer-questions, describe-picture):

✅ YOU MUST INCLUDE ONLY these fields in the exercise JSON:
   - "type": "multiple-choice" (or appropriate type)
   - "title": "Exercise X: [Title]"
   - "icon": "[icon]"
   - "time": [time in minutes]
   - "media_type": "picture"
   - "media_search_query": "A detailed, specific search term for finding an appropriate image (e.g., 'modern restaurant interior with people dining', 'busy office workspace professionals working', 'family cooking together in kitchen')"
   - "pending_media_selection": true
   - "instructions": "Look at the picture and [complete the exercise]"

❌ YOU MUST NOT INCLUDE these fields in Phase 1:
   - "questions" - DO NOT GENERATE
   - "options" - DO NOT GENERATE
   - "statements" - DO NOT GENERATE
   - "prompts" - DO NOT GENERATE
   - "useful_vocabulary" - DO NOT GENERATE
   - Any other exercise content fields - DO NOT GENERATE

🚫 ABSOLUTELY DO NOT GENERATE:
   - Questions for multiple-choice exercises
   - Answer options for multiple-choice exercises
   - Statements for true-false exercises
   - Questions for answer-questions exercises
   - Prompts for describe-picture exercises
   - Any exercise content whatsoever

WHY? Because the teacher will select an image first, and then we'll regenerate content based on that specific image in Phase 2.

📋 The "media_search_query" REQUIREMENTS:
   - Descriptive and specific (NOT generic terms like "office" or "restaurant")
   - Related to the lesson topic
   - Suitable for finding appropriate, educational images
   - In English
   - Safe for educational context
   - Example GOOD queries: "modern restaurant interior with people dining and waiter serving", "busy office workspace with professionals working on computers and collaborating"
   - Example BAD queries: "restaurant", "office", "people"

PHASE 2 GENERATION (After image selection):
This will happen in a separate AI call after the teacher selects an image. The system will regenerate ONLY the content for media-enhanced exercises with the actual selected image description.

✅ CORRECT Phase 1 output for picture-enhanced exercise:
{
  "type": "multiple-choice",
  "title": "Exercise 5: Multiple Choice About the Image",
  "icon": "fa-check-square",
  "time": 8,
  "media_type": "picture",
  "media_search_query": "diverse group of students studying together in modern library with books and laptops",
  "pending_media_selection": true,
  "instructions": "Look at the picture carefully and choose the best answer for each question."
}

❌ INCORRECT Phase 1 output (DO NOT DO THIS):
{
  "type": "multiple-choice",
  "title": "Exercise 5: Multiple Choice About the Image",
  "icon": "fa-check-square",
  "time": 8,
  "media_type": "picture",
  "media_search_query": "students in library",
  "pending_media_selection": true,
  "instructions": "Look at the picture carefully and choose the best answer for each question.",
  "questions": [...] // ❌ DO NOT INCLUDE THIS IN PHASE 1!
}

📌 REMEMBER:
- Only picture-compatible exercises should have media fields
- Other exercises in the worksheet should be generated normally with FULL content
- Keep the total exercise count as specified
- Ensure media_search_query is detailed and specific enough to find relevant images
- DO NOT generate any exercise content (questions/options/statements) for media exercises in Phase 1`;
  }

  return instructions;
};

export const getMediaRegenerationInstructions = (
  exerciseType: string,
  imageDescription: string,
  imageUrl: string,
  lessonTopic: string,
  englishLevel?: string
): string => {
  return `=== MEDIA EXERCISE REGENERATION ===

You are regenerating content for a ${exerciseType} exercise that will be paired with an image.

IMAGE DETAILS:
- URL: ${imageUrl}
- Description: ${imageDescription}

LESSON CONTEXT:
- Topic: ${lessonTopic}
- Level: ${englishLevel || 'Not specified'}

YOUR TASK:
Generate ONLY the exercise content (questions, options, statements, etc.) based on the image and lesson context.
The content must be directly related to what's visible in the image.

REQUIREMENTS FOR ${exerciseType.toUpperCase()}:

${getExerciseSpecificRequirements(exerciseType, englishLevel)}

Return ONLY the exercise content fields as valid JSON. Do not include type, title, icon, time, or media fields.

EXAMPLE RESPONSE FORMAT:
${getExerciseContentExample(exerciseType)}`;
};

const getExerciseSpecificRequirements = (exerciseType: string, englishLevel?: string): string => {
  const levelNote = englishLevel ? `All content must match CEFR level ${englishLevel}.` : '';
  
  switch (exerciseType) {
    case 'multiple-choice':
      return `- EXACTLY 10 questions about the image
- Each question must have 4 different options (A, B, C, D)
- Questions should focus on: what you can see, people's actions, objects, setting, atmosphere
- Mark the correct option with "correct": true
- ${levelNote}`;
    
    case 'true-false':
      return `- EXACTLY 10 statements about the image
- Mix of true and false statements (not all true or all false)
- Statements should describe: visible elements, people's actions, objects, colors, positions
- Mark each with "isTrue": true or false
- ${levelNote}`;
    
    case 'answer-questions':
      return `- EXACTLY 10 open-ended questions about the image
- Questions should encourage description and interpretation
- Include "question" and "focus" fields for each
- Focus areas: description, inference, personal opinion, comparison
- ${levelNote}`;
    
    case 'describe-picture':
      return `- 8 guiding prompts for picture description
- Include "image_description", "prompts" array, "useful_vocabulary" array, "teacher_tip"
- Prompts should guide students to describe different aspects of the image
- Vocabulary should be relevant to what's visible in the image
- ${levelNote}`;
    
    default:
      return `Generate appropriate content for ${exerciseType} based on the image. ${levelNote}`;
  }
};

const getExerciseContentExample = (exerciseType: string): string => {
  switch (exerciseType) {
    case 'multiple-choice':
      return `{
  "questions": [
    {
      "text": "What are the people in the image doing?",
      "options": [
        {"label": "A", "text": "Working on computers", "correct": true},
        {"label": "B", "text": "Having a meeting", "correct": false},
        {"label": "C", "text": "Eating lunch", "correct": false},
        {"label": "D", "text": "Playing games", "correct": false}
      ]
    },
    // ... 9 more questions
  ],
  "teacher_tip": "Encourage students to look carefully at details in the image before answering."
}`;
    
    case 'true-false':
      return `{
  "statements": [
    {"text": "There are at least three people visible in the image.", "isTrue": true},
    {"text": "Everyone in the image is wearing formal business attire.", "isTrue": false},
    // ... 8 more statements
  ],
  "teacher_tip": "Ask students to explain their answers by pointing to specific details in the image."
}`;
    
    case 'answer-questions':
      return `{
  "questions": [
    {"question": "What can you see in this image?", "focus": "description"},
    {"question": "What do you think the people are doing?", "focus": "inference"},
    // ... 8 more questions
  ],
  "teacher_tip": "Encourage full sentences and descriptive language."
}`;
    
    case 'describe-picture':
      return `{
  "image_description": "A modern office space with people working",
  "prompts": [
    "Describe the general setting and atmosphere of the image",
    "What objects can you see in the foreground?",
    // ... 6 more prompts
  ],
  "useful_vocabulary": ["office", "computer", "desk", "colleagues", "workspace"],
  "teacher_tip": "Have students describe the image in increasing detail."
}`;
    
    default:
      return `{ /* appropriate fields for ${exerciseType} */ }`;
  }
};
