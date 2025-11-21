import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4.28.0";
import { getExerciseTypesForCount, parseAIResponse } from "./helpers.ts";
import { validateExercise } from "./validators.ts";
import { isValidUUID, sanitizeInput, validatePrompt } from "./security.ts";
import { RateLimiter } from "./rateLimiter.ts";
import { getGeolocation } from "./geolocation.ts";
import { composeSystemMessage } from "./prompts/prompt-composer.ts";

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY")! });

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const rateLimiter = new RateLimiter();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Start generation time measurement
  const generationStartTime = Date.now();

  try {
    const { prompt, formData, userId, studentId, isRegeneration } = await req.json();
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Input validation
    const promptValidation = validatePrompt(prompt);
    if (!promptValidation.isValid) {
      return new Response(JSON.stringify({ error: promptValidation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate userId if provided
    if (userId && !isValidUUID(userId)) {
      return new Response(JSON.stringify({ error: "Invalid user ID format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enhanced rate limiting with multi-tier limits
    const rateLimitKey = ip;
    if (!rateLimiter.isAllowed(rateLimitKey)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ⏱️ TIMING: Get geolocation data
    const geoStartTime = Date.now();
    const geoData = await getGeolocation(ip);
    const geoDuration = Date.now() - geoStartTime;
    console.log(`⏱️ [TIMING] Geolocation lookup: ${geoDuration}ms`);

    // Sanitize inputs
    const sanitizedPrompt = sanitizeInput(prompt, 5000);

    console.log("Received validated prompt:", sanitizedPrompt.substring(0, 100) + "...");

    // Get teacher email if userId is provided
    let teacherEmail = null;
    if (userId) {
      try {
        const { data: profile } = await supabase.from("profiles").select("email").eq("id", userId).single();

        teacherEmail = profile?.email || null;
      } catch (error) {
        // Continue without email - not critical for worksheet generation
      }
    }

    // Check if grammarFocus is provided in the prompt
    const hasGrammarFocus = sanitizedPrompt.includes("grammarFocus:");
    const grammarFocusMatch = sanitizedPrompt.match(/grammarFocus:\s*(.+?)(?:\n|$)/);
    const grammarFocus = grammarFocusMatch ? grammarFocusMatch[1].trim() : null;

    // ============================================================
    // BATCH GENERATION MODE - Generate multiple exercise types in one call
    // ============================================================
    if (formData?.isBatchGeneration && formData?.targetExerciseTypes && Array.isArray(formData.targetExerciseTypes)) {
      console.log('🔄 [BATCH-MODE] Batch generation requested for types:', formData.targetExerciseTypes);
      
      const exerciseCountPerType = formData.exerciseCountPerType || 1;
      const batchExercises = [];
      
      for (const exerciseType of formData.targetExerciseTypes) {
        console.log(`🔄 [BATCH-MODE] Generating ${exerciseCountPerType} exercise(s) of type: ${exerciseType}`);
        
        // Use the existing system message composer with this specific exercise type
        const batchSystemMessage = composeSystemMessage(
          false, // hasGrammarFocus
          null,  // grammarFocus
          { ...formData, selectedExercises: [exerciseType] },
          exerciseCountPerType,
          [exerciseType],
          formData?.selectedImage || null,
          formData?.selectedAudio || null
        );
        
        // Generate exercise(s) for this type
        const batchResponse = await openai.chat.completions.create({
          model: "gpt-5-mini-2025-08-07",
          temperature: 1,
          messages: [
            { role: "system", content: batchSystemMessage },
            { role: "user", content: sanitizedPrompt }
          ],
          max_completion_tokens: 20000,
        });
        
        const batchContent = batchResponse.choices[0].message.content;
        
        if (batchContent) {
          try {
            const batchData = parseAIResponse(batchContent);
            if (batchData.exercises && Array.isArray(batchData.exercises)) {
              batchExercises.push(...batchData.exercises);
              console.log(`✅ [BATCH-MODE] Generated ${batchData.exercises.length} exercise(s) for type: ${exerciseType}`);
            }
          } catch (error) {
            console.error(`❌ [BATCH-MODE] Failed to parse response for type ${exerciseType}:`, error);
          }
        }
      }
      
      console.log(`✅ [BATCH-MODE] Total exercises generated: ${batchExercises.length}`);
      
      // Return batch exercises directly
      return new Response(
        JSON.stringify({ 
          exercises: batchExercises,
          success: true 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Determine exercise count from lesson duration
    let exerciseCount = 8; // Default for 60+ minutes

    if (isRegeneration && formData?.regenerationMode) {
      exerciseCount = 1;
    } else {
      if (formData?.lessonTime) {
        exerciseCount = formData.lessonTime === "45min" ? 6 : 8;
      } else {
        const durationMatch = sanitizedPrompt.match(/(\d+)\s*min/);
        const lessonDuration = durationMatch ? parseInt(durationMatch[1]) : 60;
        exerciseCount = lessonDuration <= 45 ? 6 : 8;
      }
    }

    const selectedExercises = formData?.selectedExercises;
    const effectiveExercises =
      isRegeneration && formData?.targetExerciseType ? [formData.targetExerciseType] : selectedExercises;

    // CHECK: Do exercises require picture?
    const pictureRequiredExercises = [
      "describe-picture",
      "answer-questions-picture",
      "true-false-picture",
      "multiple-choice-picture",
    ];
    const requiresPicture = effectiveExercises?.some((ex) =>
      pictureRequiredExercises.some((reqEx) => ex.includes(reqEx)),
    );

    // Check if audio is required
    const audioRequiredExercises = [
      "listening-comprehension",
      "multiple-choice-audio",
      "true-false-audio",
      "fill-in-blanks-audio",
      "answer-questions-audio",
    ];
    const requiresAudio = effectiveExercises?.some((ex) =>
      audioRequiredExercises.some((reqEx) => ex.includes(reqEx)),
    );

    console.log("📸 Picture requirement check:", {
      selectedExercises: effectiveExercises,
      requiresPicture,
      hasExistingImage: !!formData?.selectedImage,
    });

    // ============================================================
    // OPTYMALIZACJA 1: RÓWNOLEGŁE GENEROWANIE IMAGE + AUDIO
    // ============================================================
    
    let selectedImage = formData?.selectedImage || null;
    let selectedAudio = formData?.selectedAudio || null;
    
    // DEBUGGING: Log received media from formData
    console.log('📸🎵 [MEDIA-CHECK] Initial media state:', {
      hasSelectedImage: !!selectedImage,
      hasSelectedAudio: !!selectedAudio,
      requiresPicture,
      requiresAudio,
    });

    // Prepare media generation promises for parallel execution
    const mediaGenerationPromises: Array<{
      type: 'image' | 'audio';
      promise: Promise<any>;
    }> = [];

    // Add IMAGE generation promise if needed
    if (requiresPicture && !selectedImage) {
      console.log("🎨 [IMAGE-PARALLEL] Queuing image generation");
      
      const imagePromise = (async () => {
        const startTime = Date.now();
        try {
          const topic = formData?.lessonTopic || formData?.topic || "general English lesson";
          const englishLevel = formData?.englishLevel || "B1/B2";

          console.log("🎨 [IMAGE-PARALLEL] Starting image generation:", { topic, englishLevel });

          const imageGenResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-image`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
            body: JSON.stringify({ topic, englishLevel }),
          });

          if (!imageGenResponse.ok) {
            const errorText = await imageGenResponse.text();
            console.error("🎨 [IMAGE-PARALLEL] Generation failed:", errorText);
            throw new Error(`Image generation failed: ${imageGenResponse.status}`);
          }

          const imageGenData = await imageGenResponse.json();
          const duration = Math.round((Date.now() - startTime) / 1000);

          if (imageGenData.success && imageGenData.image) {
            console.log("🎨 [IMAGE-PARALLEL] Image generated successfully in " + duration + "s");
            return { success: true, data: imageGenData.image };
          } else {
            throw new Error("Invalid response from generate-image function");
          }
        } catch (imageError) {
          const duration = Math.round((Date.now() - startTime) / 1000);
          console.error("🎨 [IMAGE-PARALLEL] Failed after " + duration + "s:", imageError);
          return { success: false, error: imageError };
        }
      })();

      mediaGenerationPromises.push({ type: 'image', promise: imagePromise });
    }

    // Add AUDIO generation promise if needed
    if (requiresAudio && !selectedAudio) {
      console.log("🎵 [AUDIO-PARALLEL] Queuing audio generation");

      const audioPromise = (async () => {
        const startTime = Date.now();
        try {
          const topic = formData?.lessonTopic || "general English lesson";
          const englishLevel = formData?.englishLevel || "B1/B2";
          const lessonFocus = formData?.lessonGoal || "";
          const additionalInformation = formData?.additionalInformation || "";
          const grammarFocus = formData?.teachingPreferences || "";

          console.log("🎵 [AUDIO-PARALLEL] Starting audio generation:", { 
            topic, 
            englishLevel, 
            lessonFocus 
          });

          const audioGenResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-audio`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              topic,
              englishLevel,
              lessonFocus,
              additionalInformation,
              grammarFocus,
              duration: 90
            }),
          });

          if (audioGenResponse.ok) {
            const audioData = await audioGenResponse.json();
            const duration = Math.round((Date.now() - startTime) / 1000);
            console.log("🎵 [AUDIO-PARALLEL] Audio generated successfully in " + duration + "s");
            return { success: true, data: audioData.audioData };
          } else {
            const errorText = await audioGenResponse.text();
            console.error("🎵 [AUDIO-PARALLEL] Generation failed:", errorText);
            throw new Error("Audio generation failed");
          }
        } catch (audioError) {
          const duration = Math.round((Date.now() - startTime) / 1000);
          console.error("🎵 [AUDIO-PARALLEL] Failed after " + duration + "s:", audioError);
          return { success: false, error: audioError };
        }
      })();

      mediaGenerationPromises.push({ type: 'audio', promise: audioPromise });
    }

    // EXECUTE ALL MEDIA GENERATION IN PARALLEL
    if (mediaGenerationPromises.length > 0) {
      const parallelStartTime = Date.now();
      console.log(`⚡ [PARALLEL-MEDIA] Starting ${mediaGenerationPromises.length} media generation(s) in parallel`);

      const results = await Promise.allSettled(
        mediaGenerationPromises.map(item => item.promise)
      );

      const parallelDuration = Math.round((Date.now() - parallelStartTime) / 1000);
      console.log(`⚡ [PARALLEL-MEDIA] All media generation completed in ${parallelDuration}s`);

      // Process results
      results.forEach((result, index) => {
        const mediaType = mediaGenerationPromises[index].type;
        
        if (result.status === 'fulfilled') {
          const { success, data } = result.value;
          if (success && data) {
            if (mediaType === 'image') {
              selectedImage = data;
              console.log("✅ [PARALLEL-MEDIA] Image assigned successfully");
            } else if (mediaType === 'audio') {
              selectedAudio = data;
              console.log("✅ [PARALLEL-MEDIA] Audio assigned successfully");
            }
          } else {
            console.log(`⚠️ [PARALLEL-MEDIA] ${mediaType} generation returned no data, continuing without`);
          }
        } else {
          console.error(`❌ [PARALLEL-MEDIA] ${mediaType} generation rejected:`, result.reason);
          console.log(`⚠️ Continuing worksheet generation without ${mediaType}`);
        }
      });
    }

    const hasAudioMedia = selectedAudio !== null;

    const hasPictureMedia = selectedImage !== null;
    const exerciseTypes = getExerciseTypesForCount(exerciseCount, effectiveExercises);

    // Enhanced logging for picture mode debugging
    console.log("📸 Picture mode final state:", {
      hasPictureMedia,
      hasImageUrl: !!selectedImage?.url,
      imageId: selectedImage?.id,
      imageSource: selectedImage?.source,
      hasDetailedDescription: !!selectedImage?.detailedDescription,
      descriptionPreview: selectedImage?.detailedDescription?.substring(0, 150),
    });

    // DEBUG: Log audio data before passing to prompt composer
    console.log('🎵 [DEBUG] selectedAudio being passed to prompt composer:', {
      hasAudio: !!selectedAudio,
      hasTranscript: !!selectedAudio?.transcript,
      transcriptLength: selectedAudio?.transcript?.length || 0,
      transcriptPreview: selectedAudio?.transcript?.substring(0, 100) || '[EMPTY]',
      audioDuration: selectedAudio?.duration,
      audioVoice: selectedAudio?.voice,
    });

    // CREATE SYSTEM MESSAGE using modular prompt structure with selectedImage and selectedAudio
    const systemMessage = composeSystemMessage(
      hasGrammarFocus,
      grammarFocus,
      formData,
      exerciseCount,
      effectiveExercises,
      selectedImage,
      selectedAudio
    );

    // HEARTBEAT LOG: Before OpenAI API call
    const openaiStartTime = Date.now();
    console.log("🔵 HEARTBEAT: Starting OpenAI API call", {
      timestamp: new Date().toISOString(),
      elapsedSinceStart: Math.round((openaiStartTime - generationStartTime) / 1000) + "s",
      model: "gpt-5-mini-2025-08-07", //gpt-4.1-2025-04-14
      exerciseCount,
      promptLength: sanitizedPrompt.length,
    });

    // Generate worksheet using OpenAI with complete prompt structure
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-5-mini-2025-08-07", // gpt-4.1-2025-04-14 Changed back to gpt-4o i można gpt-4.1-2025-04-14
      temperature: 1, //0.2
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        {
          role: "user",
          content: sanitizedPrompt,
        },
      ],
      max_completion_tokens: 20000, // nowa nazwa parametru  max_completion_tokens: 7500
    });

    // HEARTBEAT LOG: After OpenAI API call
    const openaiEndTime = Date.now();
    const openaiDuration = Math.round((openaiEndTime - openaiStartTime) / 1000);
    console.log("🟢 HEARTBEAT: OpenAI API call completed", {
      timestamp: new Date().toISOString(),
      openaiDuration: openaiDuration + "s",
      totalElapsed: Math.round((openaiEndTime - generationStartTime) / 1000) + "s",
      responseLength: aiResponse.choices[0].message.content?.length || 0,
    });

    const jsonContent = aiResponse.choices[0].message.content;

    // Parse the JSON response with error handling
    let worksheetData;
    try {
      // HEARTBEAT LOG: Starting JSON parsing
      console.log("🔵 HEARTBEAT: Starting JSON parsing", {
        timestamp: new Date().toISOString(),
        contentLength: jsonContent?.length || 0,
      });

      if (!jsonContent) {
        throw new Error("No JSON content received from AI");
      }
      worksheetData = parseAIResponse(jsonContent);

      // HEARTBEAT LOG: JSON parsing completed
      console.log("🟢 HEARTBEAT: JSON parsing completed", {
        timestamp: new Date().toISOString(),
        exercisesCount: worksheetData.exercises?.length || 0,
      });

      if (!worksheetData.title || !worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
        throw new Error("Invalid worksheet structure returned from AI");
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
        const exerciseType = exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace(/-/g, " ");
        exercise.title = `Exercise ${exerciseNumber}: ${exerciseType}`;
      });

      const sourceCount = Math.floor(Math.random() * (90 - 65) + 65);
      worksheetData.sourceCount = sourceCount;
    } catch (parseError) {
      console.error(
        "Failed to parse AI response as JSON:",
        parseError,
        "Response content:",
        jsonContent?.substring(0, 500),
      );
      return new Response(
        JSON.stringify({ error: "Failed to generate a valid worksheet structure. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Calculate generation time
    const generationEndTime = Date.now();
    const generationTimeSeconds = Math.round((generationEndTime - generationStartTime) / 1000);

    // Save worksheet to database - SKIP FOR REGENERATION
    if (!isRegeneration) {
      try {
        // ⏱️ TIMING: Starting database save
        const dbSaveStartTime = Date.now();
        console.log("🔵 HEARTBEAT: Starting database save", {
          timestamp: new Date().toISOString(),
          userId: userId || "anonymous",
          studentId: studentId || "none",
        });

        const fullPrompt = `SYSTEM MESSAGE:\n${systemMessage}\n\nUSER MESSAGE:\n${sanitizedPrompt}`;
        const sanitizedFormData = formData ? JSON.parse(JSON.stringify(formData)) : {};

        // 🧹 OPTIMIZATION 3A: Remove base64 data URLs before saving to database
        // This saves ~0.5-3MB per worksheet and drastically reduces egress costs
        const sanitizedImage = selectedImage ? {
          ...selectedImage,
          url: selectedImage.url?.startsWith('data:') ? null : selectedImage.url,
          ai_generated_url: selectedImage.ai_generated_url?.startsWith('data:') ? null : selectedImage.ai_generated_url,
          thumbnail: selectedImage.thumbnail?.startsWith('data:') ? null : selectedImage.thumbnail
        } : null;

        const sanitizedAudio = selectedAudio ? {
          ...selectedAudio,
          url: selectedAudio.url?.startsWith('data:') ? null : selectedAudio.url,
          ai_generated_audio_url: selectedAudio.ai_generated_audio_url?.startsWith('data:') ? null : selectedAudio.ai_generated_audio_url
        } : null;

        const { data: worksheet, error: worksheetError } = await supabase
          .from("worksheets")
          .insert({
            prompt: fullPrompt,
            form_data: sanitizedFormData,
            ai_response: jsonContent?.substring(0, 50000) || "",
            html_content: JSON.stringify(worksheetData),
            user_id: userId || null,
            teacher_id: userId || null,
            teacher_email: teacherEmail,
            student_id: studentId || null,
            selected_image: sanitizedImage,
            selected_audio: sanitizedAudio,
            audio_url: selectedAudio?.ai_generated_audio_url || selectedAudio?.url || null,
            audio_transcript: selectedAudio?.transcript || null,
            audio_duration: selectedAudio?.duration || null,
            audio_voice: selectedAudio?.voice || null,
            ip_address: ip,
            status: "created",
            title: worksheetData.title?.substring(0, 255) || "Generated Worksheet",
            generation_time_seconds: generationTimeSeconds,
            country: geoData.country || null,
            city: geoData.city || null,
          })
          .select("id, created_at, title");

        if (worksheetError) {
          console.error("Error saving worksheet to database:", worksheetError);
        }

        if (worksheet && worksheet.length > 0 && worksheet[0].id) {
          const worksheetId = worksheet[0].id;
          worksheetData.id = worksheetId;

          // ⏱️ TIMING: Database save completed
          const dbSaveDuration = Date.now() - dbSaveStartTime;
          console.log(`⏱️ [TIMING] Database save: ${dbSaveDuration}ms`);

          // HEARTBEAT LOG: Database save completed
          console.log("🟢 HEARTBEAT: Database save completed", {
            timestamp: new Date().toISOString(),
            worksheetId,
            generationTimeSeconds: generationTimeSeconds + "s",
            location: `${geoData.country || "unknown"} ${geoData.city || "unknown"}`,
            teacher: teacherEmail || "anonymous",
          });

          console.log("Worksheet ID:", worksheetId);
          console.log("Generation time:", generationTimeSeconds, "seconds");
          console.log("Location:", geoData.country || "unknown", geoData.city || "unknown");
          console.log("Teacher:", teacherEmail || "anonymous");
          console.log("IP:", ip);
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
      }
    }

    // ETAP 4: Add selected_image to response if it exists (so frontend receives it)
    if (selectedImage) {
      worksheetData.selected_image = selectedImage;
      console.log('📸 [RESPONSE] Returning selected_image in response:', {
        hasUrl: !!selectedImage.url,
        source: selectedImage.source,
        urlType: selectedImage.url?.startsWith('data:') ? 'base64' : 'external',
        urlPreview: selectedImage.url?.substring(0, 80) + '...',
      });
    }

    // ETAP 5: Add audio fields to response
    if (selectedAudio) {
      worksheetData.audio_url = selectedAudio.ai_generated_audio_url || selectedAudio.url || null;
      worksheetData.audio_transcript = selectedAudio.transcript || null;
      worksheetData.audio_duration = selectedAudio.duration || null;
      worksheetData.audio_voice = selectedAudio.voice || null;
      worksheetData.selected_audio = selectedAudio;
      
      console.log('🎵 [RESPONSE] Returning audio fields in response:', {
        hasAudioUrl: !!worksheetData.audio_url,
        hasTranscript: !!worksheetData.audio_transcript,
        transcriptLength: worksheetData.audio_transcript?.length || 0,
        duration: worksheetData.audio_duration,
        voice: worksheetData.audio_voice
      });
    }

    // ⏱️ TIMING SUMMARY: Complete breakdown of all operations
    const totalDuration = Date.now() - generationStartTime;
    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                      ⏱️  TIMING SUMMARY - WORKSHEET GENERATION              ║
╚════════════════════════════════════════════════════════════════════════════╝
  📊 Total Generation Time: ${(totalDuration / 1000).toFixed(2)}s (${totalDuration}ms)
  
  🔹 Phase Breakdown:
     • Geolocation:        ${geoDuration}ms
     • Media Generation:   ${mediaGenerationPromises.length > 0 ? 'See parallel logs above' : 'Skipped (no media required)'}
     • OpenAI API Call:    ${openaiDuration}s
     • JSON Parsing:       Fast (< 100ms)
     • Database Save:      ${!isRegeneration ? 'See DB logs above' : 'Skipped (regeneration)'}
  
  🎯 Configuration:
     • Model:              gpt-5-mini-2025-08-07
     • Exercise Count:     ${exerciseCount}
     • Has Picture:        ${!!selectedImage}
     • Has Audio:          ${!!selectedAudio}
     • Regeneration Mode:  ${!!isRegeneration}
  
  📍 Context:
     • Location:           ${geoData.country || 'unknown'} / ${geoData.city || 'unknown'}
     • IP:                 ${ip}
     • Teacher:            ${teacherEmail || 'anonymous'}
╚════════════════════════════════════════════════════════════════════════════╝
    `);

    // HEARTBEAT LOG: Returning successful response
    console.log("🟢 HEARTBEAT: Returning successful response to client", {
      timestamp: new Date().toISOString(),
      totalDuration: Math.round((Date.now() - generationStartTime) / 1000) + "s",
      hasSelectedImage: !!selectedImage,
      hasAudio: !!selectedAudio,
    });

    return new Response(JSON.stringify(worksheetData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ CRITICAL ERROR in generateWorksheet:", error);

    // ENHANCED LOGGING: Log detailed error information
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    // Log OpenAI specific errors
    if ((error as any)?.response) {
      console.error("OpenAI API Error Response:", {
        status: (error as any).response?.status,
        statusText: (error as any).response?.statusText,
        data: (error as any).response?.data,
      });
    }

    // Log rate limit errors
    if ((error as any)?.status === 429) {
      console.error("⚠️ RATE LIMIT ERROR: OpenAI API rate limit exceeded");
    }

    // Log timeout errors
    if (error instanceof Error && (error.message.includes("timeout") || error.message.includes("ETIMEDOUT"))) {
      console.error("⏱️ TIMEOUT ERROR: Request to OpenAI timed out");
    }

    // Sanitize error message for client
    const sanitizedError =
      typeof error === "object" && error !== null
        ? "An internal error occurred. Please try again."
        : String(error).substring(0, 200);

    // Log the sanitized error being returned to client
    console.error("Returning error to client:", sanitizedError);

    return new Response(
      JSON.stringify({
        error: sanitizedError,
      }),
      {
        status: (error as any)?.status || 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
