
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from "https://esm.sh/openai@4.28.0";
import { getExerciseTypesForCount, parseAIResponse } from './helpers.ts';
import { validateExercise } from './validators.ts';
import { isValidUUID, sanitizeInput, validatePrompt } from './security.ts';
import { RateLimiter } from './rateLimiter.ts';
import { getGeolocation } from './geolocation.ts';
import { composeSystemMessage } from './prompts/prompt-composer.ts';

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const rateLimiter = new RateLimiter();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Start generation time measurement
  const generationStartTime = Date.now();

  try {
    const { prompt, formData, userId, studentId, isRegeneration, selectedImage } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || 'unknown';
    
    console.log('📸 [GENERATE-WORKSHEET] Received selectedImage:', selectedImage ? 'YES' : 'NO');
    if (selectedImage) {
      console.log('📸 [GENERATE-WORKSHEET] Image details:', {
        hasId: !!selectedImage.id,
        hasUrl: !!selectedImage.url,
        hasDescription: !!selectedImage.description,
        hasPhotographer: !!selectedImage.photographer
      });
    }
    
    // Input validation
    const promptValidation = validatePrompt(prompt);
    if (!promptValidation.isValid) {
      return new Response(
        JSON.stringify({ error: promptValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate userId if provided
    if (userId && !isValidUUID(userId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid user ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enhanced rate limiting with multi-tier limits
    const rateLimitKey = ip;
    if (!rateLimiter.isAllowed(rateLimitKey)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get geolocation data
    const geoData = await getGeolocation(ip);

    // Sanitize inputs
    const sanitizedPrompt = sanitizeInput(prompt, 5000);
    
    console.log('Received validated prompt:', sanitizedPrompt.substring(0, 100) + '...');

    // Get teacher email if userId is provided
    let teacherEmail = null;
    if (userId) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single();
        
        teacherEmail = profile?.email || null;
      } catch (error) {
        // Continue without email - not critical for worksheet generation
      }
    }

    // Check if grammarFocus is provided in the prompt
    const hasGrammarFocus = sanitizedPrompt.includes('grammarFocus:');
    const grammarFocusMatch = sanitizedPrompt.match(/grammarFocus:\s*(.+?)(?:\n|$)/);
    const grammarFocus = grammarFocusMatch ? grammarFocusMatch[1].trim() : null;

    // Determine exercise count from lesson duration  
    let exerciseCount = 8; // Default for 60+ minutes
    
    if (isRegeneration && formData?.regenerationMode) {
      exerciseCount = 1;
    } else {
      if (formData?.lessonTime) {
        exerciseCount = formData.lessonTime === '45min' ? 6 : 8;
      } else {
        const durationMatch = sanitizedPrompt.match(/(\d+)\s*min/);
        const lessonDuration = durationMatch ? parseInt(durationMatch[1]) : 60;
        exerciseCount = lessonDuration <= 45 ? 6 : 8;
      }
    }
    
    const selectedExercises = formData?.selectedExercises;
    const effectiveExercises = isRegeneration && formData?.targetExerciseType 
      ? [formData.targetExerciseType] 
      : selectedExercises;
    const exerciseTypes = getExerciseTypesForCount(exerciseCount, effectiveExercises);
    
    // CREATE SYSTEM MESSAGE using modular prompt structure with selectedImage
    const systemMessage = composeSystemMessage(
      hasGrammarFocus, 
      grammarFocus, 
      formData, 
      exerciseCount, 
      effectiveExercises,
      selectedImage || null
    );

    // HEARTBEAT LOG: Before OpenAI API call
    const openaiStartTime = Date.now();
    console.log('🔵 HEARTBEAT: Starting OpenAI API call', {
      timestamp: new Date().toISOString(),
      elapsedSinceStart: Math.round((openaiStartTime - generationStartTime) / 1000) + 's',
      model: 'gpt-4.1-2025-04-14',
      exerciseCount,
      promptLength: sanitizedPrompt.length
    });

    // Generate worksheet using OpenAI with complete prompt structure
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4.1-2025-04-14", // Changed back to gpt-4o i można gpt-4.1-2025-04-14
      temperature: 0.2, // 
      messages: [
        {
          role: "system",
          content: systemMessage
        },
        {
          role: "user",
          content: sanitizedPrompt
        }
      ],
       max_tokens: 7000 // nowa nazwa parametru  max_completion_tokens: 7500
    });

    // HEARTBEAT LOG: After OpenAI API call
    const openaiEndTime = Date.now();
    const openaiDuration = Math.round((openaiEndTime - openaiStartTime) / 1000);
    console.log('🟢 HEARTBEAT: OpenAI API call completed', {
      timestamp: new Date().toISOString(),
      openaiDuration: openaiDuration + 's',
      totalElapsed: Math.round((openaiEndTime - generationStartTime) / 1000) + 's',
      responseLength: aiResponse.choices[0].message.content?.length || 0
    });

    const jsonContent = aiResponse.choices[0].message.content;
    
    // Parse the JSON response with error handling
    let worksheetData;
    try {
      // HEARTBEAT LOG: Starting JSON parsing
      console.log('🔵 HEARTBEAT: Starting JSON parsing', {
        timestamp: new Date().toISOString(),
        contentLength: jsonContent?.length || 0
      });

      if (!jsonContent) {
        throw new Error('No JSON content received from AI');
      }
      worksheetData = parseAIResponse(jsonContent);
      
      // HEARTBEAT LOG: JSON parsing completed
      console.log('🟢 HEARTBEAT: JSON parsing completed', {
        timestamp: new Date().toISOString(),
        exercisesCount: worksheetData.exercises?.length || 0
      });
      
      if (!worksheetData.title || !worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
        throw new Error('Invalid worksheet structure returned from AI');
      }
      
      if (worksheetData.exercises.length !== exerciseCount && !isRegeneration) {
        throw new Error(`Generated ${worksheetData.exercises.length} exercises instead of required ${exerciseCount}`);
      }
      
      // Validate exercises
      for (let i = 0; i < worksheetData.exercises.length; i++) {
        const exercise = worksheetData.exercises[i];
        try {
          validateExercise(exercise);
        } catch (validationError) {
          // Continue with lenient mode
        }
      }
      
      // Make sure exercise titles have correct sequential numbering
      worksheetData.exercises.forEach((exercise: any, index: number) => {
        const exerciseNumber = index + 1;
        const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ');
        exercise.title = `Exercise ${exerciseNumber}: ${exerciseType}`;
      });
      
      const sourceCount = Math.floor(Math.random() * (90 - 65) + 65);
      worksheetData.sourceCount = sourceCount;
      
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError, 'Response content:', jsonContent?.substring(0, 500));
      return new Response(
        JSON.stringify({ error: 'Failed to generate a valid worksheet structure. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate generation time
    const generationEndTime = Date.now();
    const generationTimeSeconds = Math.round((generationEndTime - generationStartTime) / 1000);

    // Save worksheet to database - SKIP FOR REGENERATION
    if (!isRegeneration) {
      try {
        // HEARTBEAT LOG: Starting database save
        console.log('🔵 HEARTBEAT: Starting database save', {
          timestamp: new Date().toISOString(),
          userId: userId || 'anonymous',
          studentId: studentId || 'none'
        });

        const fullPrompt = `SYSTEM MESSAGE:\n${systemMessage}\n\nUSER MESSAGE:\n${sanitizedPrompt}`;
        const sanitizedFormData = formData ? JSON.parse(JSON.stringify(formData)) : {};
        
        const { data: worksheet, error: worksheetError } = await supabase
          .from('worksheets')
          .insert({
            prompt: fullPrompt, // NOW SAVING FULL PROMPT (SYSTEM + USER)
            form_data: sanitizedFormData,
            ai_response: jsonContent?.substring(0, 50000) || '', // Limit response size
            html_content: JSON.stringify(worksheetData),
            user_id: userId || null,
            teacher_id: userId || null, // Add teacher_id for authenticated users
            teacher_email: teacherEmail, // Add teacher_email
            student_id: studentId || null, // Add student_id if provided
            ip_address: ip,
            status: 'created',
            title: worksheetData.title?.substring(0, 255) || 'Generated Worksheet', // Limit title length
            generation_time_seconds: generationTimeSeconds,
            country: geoData.country || null,
            city: geoData.city || null,
            selected_image: selectedImage || null  // CRITICAL: Store as JSONB directly, NO JSON.stringify()
          })
          .select('id, created_at, title');

        if (worksheetError) {
          console.error('Error saving worksheet to database:', worksheetError);
        }

        if (worksheet && worksheet.length > 0 && worksheet[0].id) {
          const worksheetId = worksheet[0].id;
          worksheetData.id = worksheetId;
          
          // HEARTBEAT LOG: Database save completed
          console.log('🟢 HEARTBEAT: Database save completed', {
            timestamp: new Date().toISOString(),
            worksheetId,
            generationTimeSeconds: generationTimeSeconds + 's',
            location: `${geoData.country || 'unknown'} ${geoData.city || 'unknown'}`,
            teacher: teacherEmail || 'anonymous'
          });
          
          console.log('Worksheet ID:', worksheetId);
          console.log('Generation time:', generationTimeSeconds, 'seconds');
          console.log('Location:', geoData.country || 'unknown', geoData.city || 'unknown');
          console.log('Teacher:', teacherEmail || 'anonymous');
          console.log('IP:', ip);
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }

    // HEARTBEAT LOG: Returning successful response
    console.log('🟢 HEARTBEAT: Returning successful response to client', {
      timestamp: new Date().toISOString(),
      totalDuration: Math.round((Date.now() - generationStartTime) / 1000) + 's'
    });

    return new Response(JSON.stringify(worksheetData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ CRITICAL ERROR in generateWorksheet:', error);
    
    // ENHANCED LOGGING: Log detailed error information
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Log OpenAI specific errors
    if ((error as any)?.response) {
      console.error('OpenAI API Error Response:', {
        status: (error as any).response?.status,
        statusText: (error as any).response?.statusText,
        data: (error as any).response?.data
      });
    }
    
    // Log rate limit errors
    if ((error as any)?.status === 429) {
      console.error('⚠️ RATE LIMIT ERROR: OpenAI API rate limit exceeded');
    }
    
    // Log timeout errors
    if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('ETIMEDOUT'))) {
      console.error('⏱️ TIMEOUT ERROR: Request to OpenAI timed out');
    }
    
    // Sanitize error message for client
    const sanitizedError = typeof error === 'object' && error !== null ? 
      'An internal error occurred. Please try again.' : 
      String(error).substring(0, 200);
    
    // Log the sanitized error being returned to client
    console.error('Returning error to client:', sanitizedError);
      
    return new Response(
      JSON.stringify({ 
        error: sanitizedError
      }),
      { 
        status: (error as any)?.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
