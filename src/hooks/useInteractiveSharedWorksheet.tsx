// ============================================
// FAZA 2: Interactive Shared Worksheets - Student Hook
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ExerciseAnswers } from '@/types/interactiveHomework';
import { SharedWorksheetProgress } from '@/types/interactiveSharedWorksheet';

interface UseInteractiveSharedWorksheetProps {
  worksheetId: string;
  studentEmail: string;
  totalExercises: number;
  exerciseQuestionCounts?: Record<number, number>;
}

export const useInteractiveSharedWorksheet = ({
  worksheetId,
  studentEmail,
  totalExercises,
  exerciseQuestionCounts = {}
}: UseInteractiveSharedWorksheetProps) => {
  const [answers, setAnswers] = useState<Record<number, ExerciseAnswers>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const pendingSavesRef = useRef<Set<number>>(new Set());

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

  // Save a single exercise answer to database
  const saveAnswer = useCallback(async (exerciseIndex: number, exerciseType: string, exerciseAnswers: ExerciseAnswers) => {
    try {
      setIsSaving(true);
      
      const { error } = await supabase.rpc('save_worksheet_answer', {
        p_worksheet_id: worksheetId,
        p_student_email: studentEmail.trim().toLowerCase(),
        p_exercise_index: exerciseIndex,
        p_exercise_type: exerciseType,
        p_answers: exerciseAnswers as any
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
  }, [worksheetId, studentEmail]);

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
