
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
    const { prompt, formData, userId, studentId } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || 'unknown';
    
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
        console.log('Teacher email fetched:', teacherEmail);
      } catch (error) {
        console.warn('Could not fetch teacher email:', error);
        // Continue without email - not critical for worksheet generation
      }
    }

    // Check if grammarFocus is provided in the prompt
    const hasGrammarFocus = sanitizedPrompt.includes('grammarFocus:');
    const grammarFocusMatch = sanitizedPrompt.match(/grammarFocus:\s*(.+?)(?:\n|$)/);
    const grammarFocus = grammarFocusMatch ? grammarFocusMatch[1].trim() : null;

    // Determine exercise count from lesson duration  
    let exerciseCount = 8; // Default for 60+ minutes
    
    // Check if formData has lessonTime, otherwise parse from prompt
    if (formData?.lessonTime) {
      exerciseCount = formData.lessonTime === '45min' ? 6 : 8;
      console.log(`🔧 [MAIN] Exercise count from formData: ${exerciseCount} (${formData.lessonTime})`);
    } else {
      // Fallback: Parse lesson duration from prompt
      const durationMatch = sanitizedPrompt.match(/(\d+)\s*min/);
      const lessonDuration = durationMatch ? parseInt(durationMatch[1]) : 60;
      
      console.log(`🔧 [MAIN] Lesson duration detected from prompt: ${lessonDuration} minutes`);
      
      // Set exercise count based on duration
      if (lessonDuration <= 45) {
        exerciseCount = 6;
      } else {
        exerciseCount = 8;
      }
      
      console.log(`🔧 [MAIN] Logic: ${lessonDuration} <= 45 ? 6 : 8 = ${exerciseCount}`);
    }
    
    console.log(`🔧 [MAIN] Exercise count set to: ${exerciseCount} exercises`);
    
    // Handle custom selected exercises if provided
    const selectedExercises = formData?.selectedExercises;
    if (selectedExercises) {
      console.log(`🔧 [MAIN] Custom exercises selected:`, selectedExercises);
    } else {
      console.log(`🔧 [MAIN] Using default exercise selection`);
    }
    
    // FIXED: Now correctly using calculated exerciseCount and selectedExercises
    const exerciseTypes = getExerciseTypesForCount(exerciseCount, selectedExercises);
    console.log(`🔧 [MAIN] Selected exercise types for ${exerciseCount} exercises:`, exerciseTypes);
    
    console.log(`Generating ${exerciseCount} exercises in prompt`);
    console.log('Composing system message with modular prompt structure...');
    
    // CREATE SYSTEM MESSAGE using modular prompt structure with correct exerciseCount and selectedExercises
    const systemMessage = composeSystemMessage(hasGrammarFocus, grammarFocus, formData, exerciseCount, selectedExercises);

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

    const jsonContent = aiResponse.choices[0].message.content;
    
    console.log('AI response received, processing...');
    
    // Parse the JSON response with error handling
    let worksheetData;
    try {
      worksheetData = parseAIResponse(jsonContent);
      
      if (!worksheetData.title || !worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
        throw new Error('Invalid worksheet structure returned from AI');
      }
      
      // Validate we got the expected number of exercises  
      if (worksheetData.exercises.length !== exerciseCount) {
        console.warn(`Expected ${exerciseCount} exercises but got ${worksheetData.exercises.length}`);
        throw new Error(`Generated ${worksheetData.exercises.length} exercises instead of required ${exerciseCount}`);
      }
      
      // Enhanced validation for exercise requirements
      for (const exercise of worksheetData.exercises) {
        validateExercise(exercise);
      }
      
      // Make sure exercise titles have correct sequential numbering
      worksheetData.exercises.forEach((exercise: any, index: number) => {
        const exerciseNumber = index + 1;
        const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, ' ');
        exercise.title = `Exercise ${exerciseNumber}: ${exerciseType}`;
      });
      
      console.log('Final exercise count:', worksheetData.exercises?.length || 0, `(target: ${exerciseCount})`);
      console.log('Grammar Rules included:', !!worksheetData.grammar_rules);
      
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

    // Save worksheet to database with FULL PROMPT (SYSTEM + USER)
    try {
      // CREATE FULL PROMPT - this is what should be saved to database
      const fullPrompt = `SYSTEM MESSAGE:\n${systemMessage}\n\nUSER MESSAGE:\n${sanitizedPrompt}`;
      
      // Sanitize form data
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
          city: geoData.city || null
        })
        .select('id, created_at, title');

      if (worksheetError) {
        console.error('Error saving worksheet to database:', worksheetError);
      }

      // Track generation event if we have a worksheet ID
      if (worksheet && worksheet.length > 0 && worksheet[0].id) {
        const worksheetId = worksheet[0].id;
        worksheetData.id = worksheetId;
        console.log('Worksheet generated and saved successfully with ID:', worksheetId);
        console.log(`Generation time: ${generationTimeSeconds} seconds`);
        console.log(`Geo data: ${geoData.country || 'unknown'}, ${geoData.city || 'unknown'}`);
        console.log(`Teacher email saved: ${teacherEmail || 'no email'}`);
      }
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
    }

    return new Response(JSON.stringify(worksheetData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generateWorksheet:', error);
    
    // Sanitize error message
    const sanitizedError = typeof error === 'object' && error !== null ? 
      'An internal error occurred' : 
      String(error).substring(0, 200);
      
    return new Response(
      JSON.stringify({ 
        error: sanitizedError
      }),
      { 
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
