import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import OpenAI from "npm:openai@4.77.0";

// Helper functions for media regeneration instructions
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

const getMediaRegenerationInstructions = (
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      worksheetId,
      exercisesToRegenerate, // Array of { exerciseIndex, type, media_search_query }
      selectedImage, // { url, description, photographer, photographerUrl }
      inputParams, // { lessonTopic, englishLevel, etc. }
      userId
    } = await req.json();

    console.log('Regenerating media exercises:', {
      worksheetId,
      exerciseCount: exercisesToRegenerate?.length,
      selectedImage: selectedImage?.url,
      userId
    });

    // Validation
    if (!worksheetId || !exercisesToRegenerate || !selectedImage || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize OpenAI
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current worksheet
    const { data: worksheet, error: fetchError } = await supabase
      .from('worksheets')
      .select('ai_response')
      .eq('id', worksheetId)
      .single();

    if (fetchError || !worksheet) {
      console.error('Failed to fetch worksheet:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Worksheet not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let worksheetData = JSON.parse(worksheet.ai_response);
    const regeneratedExercises = [];

    // Regenerate each exercise
    for (const exercise of exercisesToRegenerate) {
      console.log(`Regenerating exercise ${exercise.exerciseIndex} (${exercise.type})`);

      const systemMessage = getMediaRegenerationInstructions(
        exercise.type,
        selectedImage.description,
        selectedImage.url,
        inputParams.lessonTopic,
        inputParams.englishLevel
      );

      const userMessage = `Generate content for a ${exercise.type} exercise based on this image:
Image URL: ${selectedImage.url}
Image Description: ${selectedImage.description}
Lesson Topic: ${inputParams.lessonTopic}
English Level: ${inputParams.englishLevel}

Remember to follow all requirements and return ONLY valid JSON with the exercise content.`;

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: userMessage }
          ],
          max_completion_tokens: 2000,
        });

        const aiResponse = completion.choices[0]?.message?.content?.trim();
        
        if (!aiResponse) {
          console.error('Empty AI response for exercise:', exercise.exerciseIndex);
          continue;
        }

        // Parse AI response
        let exerciseContent;
        try {
          // Remove markdown code blocks if present
          const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          exerciseContent = JSON.parse(cleanedResponse);
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError, aiResponse);
          continue;
        }

        // Update the exercise in worksheetData
        if (worksheetData.exercises && worksheetData.exercises[exercise.exerciseIndex]) {
          worksheetData.exercises[exercise.exerciseIndex] = {
            ...worksheetData.exercises[exercise.exerciseIndex],
            ...exerciseContent,
            media_url: selectedImage.url,
            media_description: selectedImage.description,
            media_photographer: selectedImage.photographer,
            media_photographer_url: selectedImage.photographerUrl,
            pending_media_selection: false
          };

          regeneratedExercises.push({
            index: exercise.exerciseIndex,
            type: exercise.type,
            success: true
          });
        }

      } catch (aiError) {
        console.error(`AI error for exercise ${exercise.exerciseIndex}:`, aiError);
        regeneratedExercises.push({
          index: exercise.exerciseIndex,
          type: exercise.type,
          success: false,
          error: aiError instanceof Error ? aiError.message : 'Unknown error'
        });
      }
    }

    // Update worksheet in database
    const { error: updateError } = await supabase
      .from('worksheets')
      .update({
        ai_response: JSON.stringify(worksheetData),
        media_metadata: {
          selected_image: selectedImage,
          regenerated_at: new Date().toISOString(),
          regenerated_exercises: regeneratedExercises
        }
      })
      .eq('id', worksheetId);

    if (updateError) {
      console.error('Failed to update worksheet:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to save regenerated exercises' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully regenerated exercises:', regeneratedExercises);

    // Trigger Unsplash download tracking (API requirement)
    if (selectedImage.downloadLocation) {
      try {
        const UNSPLASH_ACCESS_KEY = Deno.env.get('UNSPLASH_ACCESS_KEY');
        if (UNSPLASH_ACCESS_KEY) {
          await fetch(selectedImage.downloadLocation, {
            headers: {
              'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
            }
          });
        }
      } catch (trackError) {
        console.warn('Failed to track Unsplash download:', trackError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        worksheetData,
        regeneratedExercises
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-media-exercises function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
