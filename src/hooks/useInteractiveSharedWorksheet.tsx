// ============================================
// FAZA 2: Interactive Shared Worksheets - Student Hook
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ExerciseAnswers } from '@/types/interactiveHomework';
import { SharedWorksheetProgress } from '@/types/interactiveSharedWorksheet';

// PROBLEM 1: Exercise type classification for AI verification
const OPEN_ENDED_EXERCISE_TYPES = [
  'reading', 'discussion', 'describe', 'answer-questions', 
  'dialogue', 'answer-questions-audio', 'describe-picture',
  'answer-questions-picture', 'paraphrasing', 'speaking',
  'sentence-transformation', 'essay', 'gap-text', 'word-order'
];

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
  const saveAnswer = useCallback(async (exerciseIndex: number, exerciseType: string, exerciseAnswers: ExerciseAnswers, mastery?: number | null) => {
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
        p_mastery: mastery ?? null
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

    // Schedule new save (1.5 seconds for faster real-time updates)
    saveTimeoutRef.current = setTimeout(() => {
      saveAnswer(exerciseIndex, exerciseType, exerciseAnswers);
    }, 1500);
  }, [saveAnswer]);

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
      saveAnswer(exerciseIndex, exerciseType, exerciseAnswers);
    }
  }, [answers, saveAnswer]);

  // Calculate progress
  const getProgress = useCallback((): SharedWorksheetProgress => {
    let answeredExercises = 0;
    
    Object.keys(answers).forEach(exerciseIndexStr => {
      const exerciseIndex = parseInt(exerciseIndexStr);
      const exerciseAnswers = answers[exerciseIndex];
      const questionCount = exerciseQuestionCounts[exerciseIndex] || 1;
      
      const answeredQuestionsCount = Object.values(exerciseAnswers || {})
        .filter(answer => answer !== null && answer !== undefined && answer !== '')
        .length;
      
      if (answeredQuestionsCount >= questionCount) {
        answeredExercises++;
      }
    });

    const percentageComplete = totalExercises > 0 
      ? Math.round((answeredExercises / totalExercises) * 100) 
      : 0;

    return {
      totalExercises,
      answeredExercises,
      percentageComplete
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

  // PROBLEM 1 FIX (Opcja B): AI verification on tab/window close
  useEffect(() => {
    const handleBeforeUnload = async () => {
      // Save all pending answers first
      const answersToVerify: any[] = [];
      
      for (const exerciseIndexStr of Object.keys(answers)) {
        const exerciseIndex = parseInt(exerciseIndexStr);
        const exerciseType = exerciseTypesRef.current[exerciseIndex];
        const exerciseAnswers = answers[exerciseIndex];
        
        // Save final answer with time
        if (exerciseAnswers && Object.keys(exerciseAnswers).length > 0) {
          const activeTimeMs = getActiveTimeMs(exerciseIndex);
          
          // Use sendBeacon for reliable unload saving
          const saveData = {
            p_worksheet_id: worksheetId,
            p_student_email: studentEmail.trim().toLowerCase(),
            p_exercise_index: exerciseIndex,
            p_exercise_type: exerciseType,
            p_answers: exerciseAnswers,
            p_time_spent_ms: activeTimeMs
          };
          
          // Non-blocking save attempt using fetch with keepalive
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/save_worksheet_answer`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
            },
            body: JSON.stringify(saveData),
            keepalive: true
          }).catch(() => {});
          
          // Collect open-ended for AI verification
          if (OPEN_ENDED_EXERCISE_TYPES.includes(exerciseType)) {
            const exercise = exercises[exerciseIndex];
            answersToVerify.push({
              question_index: exerciseIndex,
              question_text: exercise?.title || `Exercise ${exerciseIndex + 1}`,
              student_answer: Object.values(exerciseAnswers).join(', '),
              exercise_type: exerciseType
            });
          }
        }
      }
      
      // Trigger AI verification for open-ended exercises
      if (answersToVerify.length > 0) {
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-open-answers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify({
            answers: answersToVerify,
            english_level: 'Intermediate',
            context: `Worksheet ${worksheetId} - student completing exercises`
          }),
          keepalive: true
        }).catch(() => {});
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
