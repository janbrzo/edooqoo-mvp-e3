// ============================================
// FAZA 2: Interactive Shared Worksheets - Student Hook
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ExerciseAnswers } from '@/types/interactiveHomework';
import { SharedWorksheetProgress } from '@/types/interactiveSharedWorksheet';
import { 
  buildItemEvaluations, 
  calculateOverallMastery,
  OPEN_ENDED_EXERCISE_TYPES,
  ItemEvaluation 
} from '@/utils/masteryCalculator';

interface UseInteractiveSharedWorksheetProps {
  worksheetId: string;
  studentEmail: string;
  totalExercises: number;
  exerciseQuestionCounts?: Record<number, number>;
  exercises?: any[]; // For AI verification context
}

export const useInteractiveSharedWorksheet = ({
  worksheetId,
  studentEmail,
  totalExercises,
  exerciseQuestionCounts = {},
  exercises = []
}: UseInteractiveSharedWorksheetProps) => {
  const [answers, setAnswers] = useState<Record<number, ExerciseAnswers>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const pendingSavesRef = useRef<Set<number>>(new Set());
  
  // PROBLEM 1 FIX: Active time tracking per exercise
  const exerciseStartTimeRef = useRef<Record<number, number>>({});
  const exerciseActiveTimeRef = useRef<Record<number, number>>({});
  const isTabActiveRef = useRef(true);
  const exerciseTypesRef = useRef<Record<number, string>>({});

  // Verify student email against database
  const verifyStudentEmail = useCallback(async (worksheetId: string, email: string): Promise<boolean> => {
    try {
      console.log('[useInteractiveSharedWorksheet] Verifying email:', email, 'for worksheet:', worksheetId);
      
      const { data, error } = await supabase.rpc('verify_worksheet_student_email', {
        p_worksheet_id: worksheetId,
        p_email: email.trim().toLowerCase()
      });

      if (error) {
        console.error('[useInteractiveSharedWorksheet] Verification error:', error);
        throw error;
      }

      console.log('[useInteractiveSharedWorksheet] Verification result:', data);
      return data === true;
    } catch (error) {
      console.error('Error verifying student email:', error);
      return false;
    }
  }, []);

  // Load existing answers from database
  const loadAnswers = useCallback(async () => {
    if (!worksheetId || !studentEmail) return;
    
    try {
      setIsLoading(true);
      console.log('[useInteractiveSharedWorksheet] Loading answers for:', worksheetId, studentEmail);
      
      const { data, error } = await supabase.rpc('get_worksheet_student_answers', {
        p_worksheet_id: worksheetId,
        p_student_email: studentEmail.trim().toLowerCase()
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedAnswers: Record<number, ExerciseAnswers> = {};

        data.forEach((answer: any) => {
          loadedAnswers[answer.exercise_index] = answer.answers;
        });

        setAnswers(loadedAnswers);
        console.log('[useInteractiveSharedWorksheet] Loaded answers:', loadedAnswers);
      }
    } catch (error: any) {
      console.error('Error loading answers:', error);
      toast({
        title: "Error loading your answers",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [worksheetId, studentEmail]);

  // PROBLEM 1 FIX: Calculate active time for an exercise
  const getActiveTimeMs = useCallback((exerciseIndex: number): number => {
    const accumulated = exerciseActiveTimeRef.current[exerciseIndex] || 0;
    const startTime = exerciseStartTimeRef.current[exerciseIndex];
    
    if (startTime && isTabActiveRef.current) {
      return accumulated + (Date.now() - startTime);
    }
    return accumulated;
  }, []);

  // Save a single exercise answer to database
  const saveAnswer = useCallback(async (
    exerciseIndex: number, 
    exerciseType: string, 
    exerciseAnswers: ExerciseAnswers, 
    mastery?: number | null,
    itemEvaluations?: ItemEvaluation[] | null
  ) => {
    try {
      setIsSaving(true);
      
      // PROBLEM 1 FIX: Include active time in save
      const activeTimeMs = getActiveTimeMs(exerciseIndex);
      
      const { error } = await supabase.rpc('save_worksheet_answer', {
        p_worksheet_id: worksheetId,
        p_student_email: studentEmail.trim().toLowerCase(),
        p_exercise_index: exerciseIndex,
        p_exercise_type: exerciseType,
        p_answers: exerciseAnswers as any,
        p_time_spent_ms: activeTimeMs,
        p_mastery: mastery ?? null,
        p_item_evaluations: itemEvaluations ? JSON.parse(JSON.stringify(itemEvaluations)) : null
      });

      if (error) throw error;

      setLastSavedAt(new Date());
      pendingSavesRef.current.delete(exerciseIndex);
      
      // Show save confirmation only if no other saves are pending
      if (pendingSavesRef.current.size === 0) {
        setIsSaving(false);
      }
    } catch (error: any) {
      console.error('Error saving answer:', error);
      toast({
        title: "Error saving answer",
        description: error.message,
        variant: "destructive"
      });
      setIsSaving(false);
    }
  }, [worksheetId, studentEmail, getActiveTimeMs]);

  // Debounced auto-save function (1.5 seconds for real-time feel)
  const scheduleAutoSave = useCallback((exerciseIndex: number, exerciseType: string, exerciseAnswers: ExerciseAnswers) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Mark this exercise as pending save
    pendingSavesRef.current.add(exerciseIndex);
    setIsSaving(true);

    // PROBLEM 1: Build per-item evaluations with nano_skill_ratings
    const exerciseData = exercises[exerciseIndex];
    const mastery = calculateOverallMastery(exerciseType, exerciseData, exerciseAnswers as Record<string | number, any>);
    const itemEvaluations = buildItemEvaluations(exerciseData, exerciseAnswers as Record<string | number, any>, exerciseType);
    
    console.log('[useInteractiveSharedWorksheet] Saving with itemEvaluations:', {
      exerciseIndex,
      exerciseType,
      mastery,
      itemEvaluationsCount: itemEvaluations?.length || 0
    });
    
    // Schedule new save (1.5 seconds for faster real-time updates)
    saveTimeoutRef.current = setTimeout(() => {
      saveAnswer(exerciseIndex, exerciseType, exerciseAnswers, mastery, itemEvaluations);
    }, 1500);
  }, [saveAnswer, exercises]);

  // Update answer and schedule auto-save
  const updateAnswer = useCallback((
    exerciseIndex: number, 
    exerciseType: string,
    questionIndex: number, 
    value: any
  ) => {
    // PROBLEM 1 FIX: Start tracking time for this exercise if not already
    if (!exerciseStartTimeRef.current[exerciseIndex]) {
      exerciseStartTimeRef.current[exerciseIndex] = Date.now();
    }
    
    // Store exercise type for AI verification
    exerciseTypesRef.current[exerciseIndex] = exerciseType;
    
    setAnswers(prev => {
      const exerciseAnswers = prev[exerciseIndex] || {};
      const updated = {
        ...prev,
        [exerciseIndex]: {
          ...exerciseAnswers,
          [questionIndex]: value
        }
      };

      // Schedule auto-save with updated answers
      scheduleAutoSave(exerciseIndex, exerciseType, updated[exerciseIndex]);

      return updated;
    });
  }, [scheduleAutoSave]);

  // Save immediately on blur (when user leaves input field)
  const saveOnBlur = useCallback((exerciseIndex: number, exerciseType: string) => {
    // Clear any pending auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const exerciseAnswers = answers[exerciseIndex];
    if (exerciseAnswers) {
      // PROBLEM 1: Build per-item evaluations with nano_skill_ratings
      const exerciseData = exercises[exerciseIndex];
      const mastery = calculateOverallMastery(exerciseType, exerciseData, exerciseAnswers as Record<string | number, any>);
      const itemEvaluations = buildItemEvaluations(exerciseData, exerciseAnswers as Record<string | number, any>, exerciseType);
      saveAnswer(exerciseIndex, exerciseType, exerciseAnswers, mastery, itemEvaluations);
    }
  }, [answers, saveAnswer, exercises]);

  // Calculate progress - percentage based on individual tasks, exercises based on full completion
  const getProgress = useCallback((): SharedWorksheetProgress => {
    let answeredExercises = 0;
    let totalTasks = 0;
    let answeredTasks = 0;
    
    // Count total tasks across ALL exercises
    for (let i = 0; i < totalExercises; i++) {
      const questionCount = exerciseQuestionCounts[i] || 1;
      totalTasks += questionCount;
    }
    
    Object.keys(answers).forEach(exerciseIndexStr => {
      const exerciseIndex = parseInt(exerciseIndexStr);
      const exerciseAnswers = answers[exerciseIndex];
      const questionCount = exerciseQuestionCounts[exerciseIndex] || 1;
      
      const answeredQuestionsCount = Object.values(exerciseAnswers || {})
        .filter(answer => answer !== null && answer !== undefined && answer !== '')
        .length;
      
      answeredTasks += answeredQuestionsCount;
      
      if (answeredQuestionsCount >= questionCount) {
        answeredExercises++;
      }
    });

    const percentageComplete = totalTasks > 0 
      ? Math.round((answeredTasks / totalTasks) * 100) 
      : 0;

    return {
      totalExercises,
      answeredExercises,
      percentageComplete,
      totalTasks,
      answeredTasks
    };
  }, [answers, totalExercises, exerciseQuestionCounts]);

  // Load answers on mount
  useEffect(() => {
    if (worksheetId && studentEmail) {
      loadAnswers();
    }
  }, [worksheetId, studentEmail, loadAnswers]);

  // PROBLEM 1 FIX: Visibility change tracking for active time
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab became inactive - pause all timers
        isTabActiveRef.current = false;
        Object.keys(exerciseStartTimeRef.current).forEach(indexStr => {
          const idx = parseInt(indexStr);
          const startTime = exerciseStartTimeRef.current[idx];
          if (startTime) {
            exerciseActiveTimeRef.current[idx] = (exerciseActiveTimeRef.current[idx] || 0) + (Date.now() - startTime);
            exerciseStartTimeRef.current[idx] = 0;
          }
        });
      } else {
        // Tab became active - restart timers
        isTabActiveRef.current = true;
        Object.keys(exerciseActiveTimeRef.current).forEach(indexStr => {
          const idx = parseInt(indexStr);
          exerciseStartTimeRef.current[idx] = Date.now();
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // PLAN FIX: AI verification on tab/window close using fetch with keepalive
  // USES CONDITIONAL LOGIC: Only queue AI eval if last_saved_at > last_ai_eval_at
  useEffect(() => {
    const handleBeforeUnload = async () => {
      // Iterate through all exercises with answers
      for (const exerciseIndexStr of Object.keys(answers)) {
        const exerciseIndex = parseInt(exerciseIndexStr);
        const exerciseType = exerciseTypesRef.current[exerciseIndex];
        const exerciseAnswers = answers[exerciseIndex];
        
        // Skip if no answers
        if (!exerciseAnswers || Object.keys(exerciseAnswers).length === 0) continue;
        
        const activeTimeMs = getActiveTimeMs(exerciseIndex);
        
        // 1. Save the answer itself using fetch with keepalive (ALWAYS)
        const saveData = {
          p_worksheet_id: worksheetId,
          p_student_email: studentEmail.trim().toLowerCase(),
          p_exercise_index: exerciseIndex,
          p_exercise_type: exerciseType,
          p_answers: exerciseAnswers,
          p_time_spent_ms: activeTimeMs
        };
        
        fetch(`https://bvfrkzdlklyvnhlpleck.supabase.co/rest/v1/rpc/save_worksheet_answer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2ZnJremRsa2x5dm5obHBsZWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNDYyMzQsImV4cCI6MjA2MDgyMjIzNH0.RXlVKVPO4WTD6c4sA9fZIYAQe6zKPqoMoVE6Ilit9ls',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2ZnJremRsa2x5dm5obHBsZWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNDYyMzQsImV4cCI6MjA2MDgyMjIzNH0.RXlVKVPO4WTD6c4sA9fZIYAQe6zKPqoMoVE6Ilit9ls',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(saveData),
          keepalive: true
        }).catch(() => {});
        
        // 2. Queue for AI evaluation ONLY for open-ended exercises
        // CONDITIONAL: Check if evaluation is needed (last_saved_at > last_ai_eval_at)
        if (OPEN_ENDED_EXERCISE_TYPES.includes(exerciseType)) {
          const exercise = exercises[exerciseIndex];
          const queueData = {
            p_worksheet_id: worksheetId,
            p_student_email: studentEmail.trim().toLowerCase(),
            p_exercise_index: exerciseIndex,
            p_exercise_type: exerciseType,
            p_answers: exerciseAnswers,
            p_english_level: 'Intermediate',
            p_context: {
              title: exercise?.title || `Exercise ${exerciseIndex + 1}`,
              questions: exercise?.questions || exercise?.prompts || exercise?.sentences || exercise?.expressions || exercise?.items || []
            }
          };
          
          // Use fetch with keepalive (more reliable than sendBeacon for RPC with headers)
          fetch(`https://bvfrkzdlklyvnhlpleck.supabase.co/rest/v1/rpc/queue_worksheet_ai_evaluation`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2ZnJremRsa2x5dm5obHBsZWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNDYyMzQsImV4cCI6MjA2MDgyMjIzNH0.RXlVKVPO4WTD6c4sA9fZIYAQe6zKPqoMoVE6Ilit9ls',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2ZnJremRsa2x5dm5obHBsZWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNDYyMzQsImV4cCI6MjA2MDgyMjIzNH0.RXlVKVPO4WTD6c4sA9fZIYAQe6zKPqoMoVE6Ilit9ls',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(queueData),
            keepalive: true
          }).catch(() => {});
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [answers, worksheetId, studentEmail, exercises, getActiveTimeMs]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // PLAN FIX: 10-minute inactivity timer for auto AI evaluation
  const lastAiEvalTriggerRef = useRef<number>(0);
  
  useEffect(() => {
    const TEN_MINUTES = 10 * 60 * 1000;
    const ONE_MINUTE = 60 * 1000;
    
    const checkAndTriggerAiEval = async () => {
      if (!lastSavedAt) return;
      
      const timeSinceLastSave = Date.now() - lastSavedAt.getTime();
      const timeSinceLastTrigger = Date.now() - lastAiEvalTriggerRef.current;
      
      // Only trigger if:
      // 1. More than 10 minutes since last save
      // 2. We haven't triggered since that save
      if (timeSinceLastSave >= TEN_MINUTES && lastSavedAt.getTime() > lastAiEvalTriggerRef.current) {
        console.log('[useInteractiveSharedWorksheet] 10 min passed, checking for pending AI evaluations');
        
        // Queue AI evaluations for all open-ended exercises
        for (const exerciseIndexStr of Object.keys(answers)) {
          const exerciseIndex = parseInt(exerciseIndexStr);
          const exerciseType = exerciseTypesRef.current[exerciseIndex];
          
          if (!OPEN_ENDED_EXERCISE_TYPES.includes(exerciseType)) continue;
          
          const exerciseAnswers = answers[exerciseIndex];
          if (!exerciseAnswers || Object.keys(exerciseAnswers).length === 0) continue;
          
          // Check if AI eval is actually needed using RPC
          try {
            const { data: needsEval } = await supabase.rpc('needs_ai_evaluation', {
              p_worksheet_id: worksheetId,
              p_student_email: studentEmail.trim().toLowerCase(),
              p_exercise_index: exerciseIndex
            });
            
            if (needsEval) {
              const exercise = exercises[exerciseIndex];
              await supabase.rpc('queue_worksheet_ai_evaluation', {
                p_worksheet_id: worksheetId,
                p_student_email: studentEmail.trim().toLowerCase(),
                p_exercise_index: exerciseIndex,
                p_exercise_type: exerciseType,
                p_answers: exerciseAnswers as any, // Cast to any for JSON compatibility
                p_english_level: 'Intermediate',
                p_context: {
                  title: exercise?.title || `Exercise ${exerciseIndex + 1}`,
                  questions: exercise?.questions || exercise?.prompts || exercise?.sentences || exercise?.expressions || exercise?.items || []
                }
              });
              console.log(`[useInteractiveSharedWorksheet] Queued AI eval for exercise ${exerciseIndex}`);
            }
          } catch (err) {
            console.error('[useInteractiveSharedWorksheet] Failed to queue AI eval:', err);
          }
        }
        
        // Mark that we've triggered
        lastAiEvalTriggerRef.current = Date.now();
      }
    };
    
    // Check every minute
    const interval = setInterval(checkAndTriggerAiEval, ONE_MINUTE);
    
    return () => clearInterval(interval);
  }, [lastSavedAt, answers, worksheetId, studentEmail, exercises]);

  return {
    answers,
    isLoading,
    isSaving,
    lastSavedAt,
    updateAnswer,
    saveOnBlur,
    verifyStudentEmail,
    getProgress,
    refetchAnswers: loadAnswers
  };
};
