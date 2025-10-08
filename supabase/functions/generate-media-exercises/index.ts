import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import OpenAI from "npm:openai@4.77.0";
import { getMediaRegenerationInstructions } from '../generateWorksheet/prompts/media-instructions.ts';

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
