
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateWorksheet } from "@/services/worksheetService";
import { FormData } from "@/components/WorksheetForm";
import { v4 as uuidv4 } from 'uuid';
import { formatPromptForAI, createFormDataForStorage } from "@/utils/promptFormatter";
import { processExercises } from "@/utils/exerciseProcessor";
import { getExpectedExerciseCount, validateWorksheet, createSampleVocabulary } from "@/utils/worksheetUtils";
import { deepFixTextObjects } from "@/utils/textObjectFixer";
import { useEventTracking } from "@/hooks/useEventTracking";
import { useTokenSystem } from "@/hooks/useTokenSystem";
import { supabase } from "@/integrations/supabase/client";
import { generateAudioForWorksheet, generateImageForWorksheet } from '@/services/mediaService';
import { streamWorksheetGeneration } from '@/services/worksheetStreamService';

export const useWorksheetGeneration = (
  userId: string | null,
  worksheetState: any,
  studentId?: string | null
) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [startGenerationTime, setStartGenerationTime] = useState<number>(0);
  const [streamProgress, setStreamProgress] = useState<{
    exercisesGenerated: number;
    expectedTotal: number;
  } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();
  const { trackEvent } = useEventTracking(userId);
  const { tokenLeft, hasTokens, isDemo, consumeToken } = useTokenSystem(userId);

  const generateWorksheetHandler = async (data: FormData) => {
    console.log('🚀 Starting worksheet generation for:', data.lessonTime);
    console.log('🔧 Form data received:', { 
      lessonTime: data.lessonTime, 
      grammarFocus: data.teachingPreferences,
      hasGrammar: !!(data.teachingPreferences && data.teachingPreferences.trim()),
      studentId
    });

    // FLAG: Track if streaming has started to prevent premature modal close
    let streamingStarted = false;

    // CRITICAL ADDITION: Sync subscription status before generation
    // This ensures expired subscriptions are detected before allowing worksheet generation
    if (userId) {
      try {
        console.log('🔄 Syncing subscription status before worksheet generation...');
        await supabase.functions.invoke('check-subscription-status');
        console.log('✅ Subscription status synchronized');
      } catch (error) {
        console.error('⚠️ Warning: Subscription sync failed before generation:', error);
        // Continue with generation - sync failure shouldn't block generation
      }
    }

    // Check token requirements for authenticated users
    if (!isDemo && !hasTokens) {
      toast({
        title: "No tokens available",
        description: "You need tokens to generate worksheets. Please upgrade your plan or purchase tokens.",
        variant: "destructive"
      });
      return;
    }
    
    // CRITICAL FIX: Clear storage but DON'T set any worksheet ID yet
    worksheetState.clearWorksheetStorage();

    // CRITICAL FIX: Generate temporary ID but DON'T set it in state yet
    const temporaryWorksheetId = uuidv4();
    console.log('🆔 Generated temporary worksheet ID (for fallback only):', temporaryWorksheetId);

    worksheetState.setInputParams(data);
    setIsGenerating(true);
    
    const startTime = Date.now();
    setStartGenerationTime(startTime);
    
    // Track worksheet generation start
    trackEvent({
      eventType: 'worksheet_generation_start',
      eventData: {
        worksheetId: temporaryWorksheetId,
        timestamp: new Date().toISOString()
      }
    });
    
    try {
      console.log('📡 Starting worksheet generation...');
      
      // NEW: Create full prompt for ChatGPT and save it to database
      const fullPrompt = formatPromptForAI(data);
      const formDataForStorage = createFormDataForStorage(data);
      
      // CRITICAL FIX: Only pass userId if it exists, don't use 'anonymous'
      if (!userId) {
        console.error('❌ CRITICAL: No authenticated user - cannot generate worksheet');
        throw new Error("You must be logged in to generate worksheets");
      }
      
      // ============================================================
      // KROK 1: PRE-GENERATE MEDIA (if needed)
      // This prevents 546 WORKER_LIMIT errors by moving media generation
      // to frontend, reducing backend execution time from 60s+ to <30s
      // ============================================================
      let selectedAudio = data.selectedAudio || null;
      let selectedImage = data.selectedImage || null;
      
      // Check if exercises require audio
      const audioRequiredExercises = [
        "listening-comprehension", "multiple-choice-audio", 
        "true-false-audio", "fill-in-blanks-audio", "answer-questions-audio"
      ];
      const requiresAudio = data.selectedExercises?.some(ex => 
        audioRequiredExercises.some(reqEx => ex.includes(reqEx))
      );
      
      // Check if exercises require picture
      const pictureRequiredExercises = [
        "describe-picture", "answer-questions-picture",
        "true-false-picture", "multiple-choice-picture"
      ];
      const requiresPicture = data.selectedExercises?.some(ex => 
        pictureRequiredExercises.some(reqEx => ex.includes(reqEx))
      );
      
      console.log('🔍 Media requirements:', { requiresAudio, requiresPicture, hasAudio: !!selectedAudio, hasImage: !!selectedImage });
      
      // Generate media BEFORE worksheet (if needed and not already provided)
      if (requiresAudio && !selectedAudio) {
        console.log('🎵 Pre-generating audio...');
        toast({
          title: "Generating audio...",
          description: "This may take up to 45 seconds",
        });
        
        try {
          selectedAudio = await generateAudioForWorksheet(data);
          console.log('✅ Audio pre-generated successfully');
        } catch (error) {
          console.error('❌ Audio generation failed:', error);
          toast({
            title: "Audio generation failed",
            description: "Continuing without audio",
            variant: "destructive"
          });
        }
      }
      
      if (requiresPicture && !selectedImage) {
        console.log('🎨 Pre-generating image...');
        toast({
          title: "Generating image...",
          description: "This may take up to 40 seconds",
        });
        
        try {
          selectedImage = await generateImageForWorksheet(data);
          console.log('✅ Image pre-generated successfully');
        } catch (error) {
          console.error('❌ Image generation failed:', error);
          toast({
            title: "Image generation failed",
            description: "Continuing without image",
            variant: "destructive"
          });
        }
      }
      
      // Update inputParams with generated media BEFORE worksheet generation
      // This ensures GeneratingModal shows correct duration (150s vs 90s) and media info
      worksheetState.setInputParams({
        ...data,
        selectedAudio,
        selectedImage,
      });
      
      // ============================================================
      // KROK 2: GENERATE WORKSHEET (now with pre-generated media)
      // WITH STREAMING for real-time progress
      // ============================================================
      console.log('📝 Generating worksheet with STREAMING enabled...');
      
      let worksheetResult: any = null;
      
      // CRITICAL: Mark that streaming has started
      streamingStarted = true;
      console.log('🚦 Streaming flag set to TRUE - modal will stay open');
      
      // Use streaming for generation
      abortControllerRef.current = streamWorksheetGeneration(
        { 
          prompt: fullPrompt,
          formData: {
            ...formDataForStorage,
            selectedAudio,
            selectedImage,
          },
          studentId
        },
        userId,
        {
          onStart: () => {
            console.log('🚀 Streaming started');
            const expectedTotal = getExpectedExerciseCount(data.lessonTime);
            setStreamProgress({ exercisesGenerated: 0, expectedTotal });
            
            toast({
              title: "Generating exercises...",
              description: "Creating your personalized worksheet",
            });
          },
          onProgress: (progress) => {
            console.log(`📝 Progress: ${progress.exercisesGenerated}/${progress.expectedTotal}`);
            setStreamProgress(progress);
            
            // Toast for each exercise
            toast({
              title: `Generated exercise ${progress.exercisesGenerated}/${progress.expectedTotal}`,
              description: "Real-time progress",
              duration: 2000,
            });
          },
          onDone: async (result) => {
            console.log('✅ Streaming complete:', result.worksheetId);
            worksheetResult = result.worksheet;
            worksheetResult.id = result.worksheetId;
            setStreamProgress(null);
            
            // Continue with existing completion logic
            await handleWorksheetCompletion(worksheetResult, data, startTime);
          },
          onError: (error) => {
            console.error('❌ Stream error:', error);
            setStreamProgress(null);
            setIsGenerating(false); // Close modal on streaming error
            throw error;
          }
        }
      );
      
      // Wait for streaming to complete
      // The actual completion is handled in onDone callback
      return;
    } catch (error) {
      console.error("💥 Worksheet generation error:", error);
      
      // Track failed worksheet generation
      trackEvent({
        eventType: 'worksheet_generation_complete',
        eventData: {
          worksheetId: temporaryWorksheetId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      });
      
      // ENHANCED: Detect network errors (CORS, Failed to fetch)
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isNetworkError = errorMessage.includes('Failed to fetch') || 
                            errorMessage.includes('CORS') || 
                            errorMessage.includes('NetworkError') ||
                            errorMessage.includes('net::ERR');
      
      if (isNetworkError) {
        console.warn('🌐 Network error detected - showing external issue message');
        
        // Special toast for external issues - stays for 3 seconds
        toast({
          title: "Generation failed due to external issues",
          description: "No tokens consumed. Your data is preserved. Please click 'Generate Custom Worksheet' again.",
          variant: "default",
          className: "bg-yellow-50 border-l-4 border-l-yellow-500 shadow-lg",
          duration: 3000
        });
      } else {
        // Regular error handling for API errors
        toast({
          title: "Worksheet generation failed",
          description: error instanceof Error 
            ? `Error: ${error.message}. Please try again with different parameters.` 
            : "An unexpected error occurred. Please try again.",
          variant: "destructive"
        });
      }
      
      // Don't clear the form data - user stays on form with preserved data
    } finally {
      console.log('🏁 Finishing generation process...');
      
      // CRITICAL FIX: Only close modal if streaming hasn't started
      // If streaming started, it will close modal in onDone/onError callbacks
      if (!streamingStarted) {
        console.log('🚪 Closing modal - streaming never started (error before streaming)');
        setIsGenerating(false);
      } else {
        console.log('🔄 Modal stays open - streaming in progress (will close in callbacks)');
      }
      
      // MOVED HERE: Update student activity if studentId is provided - AT THE VERY END
      if (studentId) {
        console.log('🔄 FINAL STEP: Updating student activity for:', studentId);
        
        // Add a small delay to ensure the worksheet has been fully processed
        setTimeout(() => {
          // Dispatch custom event to notify other components about student update
          window.dispatchEvent(new CustomEvent('studentUpdated', { 
            detail: { studentId } 
          }));
          
          console.log('🔄 StudentUpdated event dispatched AFTER generation completed for:', studentId);
        }, 500);
      }
    }
  };

  // Helper function to handle worksheet completion (extracted for reuse)
  const handleWorksheetCompletion = async (worksheetResult: any, data: FormData, startTime: number) => {
    console.log("✅ Generated worksheet result received:", {
      hasData: !!worksheetResult,
      hasId: !!worksheetResult?.id,
      realId: worksheetResult?.id,
      exerciseCount: worksheetResult?.exercises?.length || 0,
      hasTitle: !!worksheetResult?.title,
      hasVocabulary: !!worksheetResult?.vocabulary_sheet
    });

    const finalWorksheetId = worksheetResult?.id;
    
    if (!finalWorksheetId) {
      console.error('❌ CRITICAL: No valid ID received from backend!');
      throw new Error("Failed to save worksheet to database - no ID returned");
    }

    // Consume token for authenticated users AFTER successful generation
    console.log('🎯 TOKEN CONSUMPTION CHECK:', {
      isDemo,
      userId,
      hasUserId: !!userId,
      willConsumeToken: !isDemo && !!userId,
      finalWorksheetId
    });
    
    if (!isDemo && userId) {
      console.log('✅ Attempting to consume token for user:', userId);
      const tokenConsumed = await consumeToken(finalWorksheetId);
      console.log('🔍 Token consumption result:', tokenConsumed);
      if (!tokenConsumed) {
        console.warn('⚠️ Failed to consume token, but worksheet was generated');
      } else {
        console.log('✅ Token consumed successfully');
      }
    }
    
    const actualGenerationTime = Math.round((Date.now() - startTime) / 1000);
    console.log('⏱️ Generation time:', actualGenerationTime, 'seconds');
    
    worksheetState.setGenerationTime(actualGenerationTime);
    worksheetState.setSourceCount(worksheetResult.sourceCount || Math.floor(Math.random() * (90 - 65) + 65));
    
    const expectedExerciseCount = getExpectedExerciseCount(data.lessonTime);
    console.log(`🎯 Expected ${expectedExerciseCount} exercises for ${data.lessonTime}`);
    
    console.log('🔍 Starting worksheet validation...');
    if (validateWorksheet(worksheetResult, expectedExerciseCount)) {
      console.log('✅ Worksheet validation passed, processing exercises...');
      
      // CRITICAL: Deep fix the entire worksheet before processing
      console.log('🔧 DEEP FIXING entire worksheet before processing...');
      const deepFixedWorksheet = deepFixTextObjects(worksheetResult, 'worksheet');
      console.log('🔧 Worksheet after deep fix:', deepFixedWorksheet);
      
      // Trim exercises if more than expected are returned
      if (deepFixedWorksheet.exercises.length > expectedExerciseCount) {
        console.log(`✂️ Trimming exercises from ${deepFixedWorksheet.exercises.length} to ${expectedExerciseCount}`);
        deepFixedWorksheet.exercises = deepFixedWorksheet.exercises.slice(0, expectedExerciseCount);
      }
      
      // FIXED: Pass correct lessonTime and hasGrammar parameters
      const hasGrammar = !!(data.teachingPreferences && data.teachingPreferences.trim());
      console.log('🔧 Processing exercises with parameters:', { 
        lessonTime: data.lessonTime, 
        hasGrammar,
        exerciseCount: deepFixedWorksheet.exercises.length 
      });
      
      deepFixedWorksheet.exercises = processExercises(deepFixedWorksheet.exercises, data.lessonTime, hasGrammar);
      
      // CRITICAL: Set the correct worksheet ID on the worksheet object
      deepFixedWorksheet.id = finalWorksheetId;
      
      if (!deepFixedWorksheet.vocabulary_sheet || deepFixedWorksheet.vocabulary_sheet.length === 0) {
        console.log('📝 Creating sample vocabulary sheet...');
        deepFixedWorksheet.vocabulary_sheet = createSampleVocabulary(15);
      }
      
      console.log('💾 CRITICAL FIX: Setting worksheet ID FIRST, then worksheet data');
      
      // CRITICAL FIX: Set the worksheet ID FIRST before setting worksheet data
      worksheetState.setWorksheetId(finalWorksheetId);
      
      // CRITICAL FIX: Add small delay to ensure state is updated
      setTimeout(() => {
        console.log('💾 Now setting both worksheets in state with final ID:', finalWorksheetId);
        worksheetState.setGeneratedWorksheet(deepFixedWorksheet);
        worksheetState.setEditableWorksheet(deepFixedWorksheet);
        
        // Mark generation as complete
        setIsGenerating(false);
      }, 100);
      
      // Track successful worksheet generation
      trackEvent({
        eventType: 'worksheet_generation_complete',
        eventData: {
          worksheetId: finalWorksheetId,
          success: true,
          generationTimeSeconds: actualGenerationTime,
          timestamp: new Date().toISOString()
        }
      });
      
      console.log('🎉 Worksheet generation completed successfully with ID:', finalWorksheetId);
      toast({
        title: "Worksheet generated successfully!",
        description: "Your custom worksheet is now ready to use.",
        className: "bg-white border-l-4 border-l-green-500 shadow-lg rounded-xl"
      });
      
      // Update student activity if studentId is provided
      if (studentId) {
        console.log('🔄 FINAL STEP: Updating student activity for:', studentId);
        
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('studentUpdated', { 
            detail: { studentId } 
          }));
          
          console.log('🔄 StudentUpdated event dispatched AFTER generation completed for:', studentId);
        }, 500);
      }
    } else {
      console.log('❌ Worksheet validation failed');
      throw new Error("Generated worksheet data is incomplete or invalid");
    }
  };

  return {
    isGenerating,
    generateWorksheetHandler,
    tokenLeft,
    hasTokens,
    isDemo,
    streamProgress,
    cancelGeneration: () => {
      console.log('🛑 Cancelling generation...');
      abortControllerRef.current?.abort();
      setIsGenerating(false);
      setStreamProgress(null);
      toast({
        title: "Generation cancelled",
        description: "Worksheet generation was stopped",
      });
    }
  };
};
