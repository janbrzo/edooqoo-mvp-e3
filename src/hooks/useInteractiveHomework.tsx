import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  HomeworkStudentAnswer, 
  ExerciseAnswers,
  HomeworkProgress 
} from '@/types/interactiveHomework';

interface UseInteractiveHomeworkProps {
  homeworkId: string;
  studentEmail: string;
  totalExercises: number;
}

export const useInteractiveHomework = ({
  homeworkId,
  studentEmail,
  totalExercises
}: UseInteractiveHomeworkProps) => {
  const [answers, setAnswers] = useState<Record<number, ExerciseAnswers>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const pendingSavesRef = useRef<Set<number>>(new Set());

  // Verify student email against database
  const verifyStudentEmail = useCallback(async (homeworkId: string, email: string): Promise<boolean> => {
    try {
      const { data: homework, error } = await supabase
        .from('homework_assignments')
        .select('student_id, students(student_email)')
        .eq('id', homeworkId)
        .single();

      if (error) throw error;

      // @ts-ignore - Supabase types for nested relations
      const registeredEmail = homework?.students?.student_email;
      
      // Email matches if it's the registered student email
      return registeredEmail === email;
    } catch (error) {
      console.error('Error verifying student email:', error);
      return false;
    }
  }, []);

  // Load existing answers from database
  const loadAnswers = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.rpc('get_student_homework_answers', {
        p_homework_id: homeworkId,
        p_student_email: studentEmail
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedAnswers: Record<number, ExerciseAnswers> = {};
        let allSubmitted = true;

        data.forEach((answer: any) => {
          loadedAnswers[answer.exercise_index] = answer.answers;
          if (!answer.is_submitted) {
            allSubmitted = false;
          }
          if (answer.submitted_at) {
            setSubmittedAt(new Date(answer.submitted_at));
          }
        });

        setAnswers(loadedAnswers);
        setIsSubmitted(allSubmitted);
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
  }, [homeworkId, studentEmail]);

  // Save a single exercise answer to database
  const saveAnswer = useCallback(async (exerciseIndex: number, exerciseType: string, exerciseAnswers: ExerciseAnswers) => {
    try {
      setIsSaving(true);
      
      const { error } = await supabase.rpc('save_homework_answer', {
        p_homework_id: homeworkId,
        p_student_email: studentEmail,
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
  }, [homeworkId, studentEmail]);

  // Debounced auto-save function (5 seconds)
  const scheduleAutoSave = useCallback((exerciseIndex: number, exerciseType: string, exerciseAnswers: ExerciseAnswers) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Mark this exercise as pending save
    pendingSavesRef.current.add(exerciseIndex);
    setIsSaving(true);

    // Schedule new save
    saveTimeoutRef.current = setTimeout(() => {
      saveAnswer(exerciseIndex, exerciseType, exerciseAnswers);
    }, 5000);
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

  // Submit all homework
  const submitHomework = useCallback(async () => {
    try {
      setIsSaving(true);

      const { error } = await supabase.rpc('submit_homework_answers', {
        p_homework_id: homeworkId,
        p_student_email: studentEmail
      });

      if (error) throw error;

      setIsSubmitted(true);
      setSubmittedAt(new Date());

      // Send email notification to teacher about submission
      try {
        const answeredCount = Object.keys(answers).length;
        await supabase.functions.invoke('send-homework-email', {
          body: {
            homeworkId,
            studentEmail,
            isSubmissionNotification: true,
            answeredExercisesCount: answeredCount
          }
        });
        console.log('[submitHomework] Teacher notification email sent');
      } catch (emailError) {
        console.error('[submitHomework] Failed to send teacher notification:', emailError);
        // Don't fail the whole submission if email fails
      }

      toast({
        title: "Homework submitted!",
        description: "Your teacher has been notified.",
      });

      return true;
    } catch (error: any) {
      console.error('Error submitting homework:', error);
      toast({
        title: "Error submitting homework",
        description: error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [homeworkId, studentEmail, answers]);

  // Calculate progress
  const getProgress = useCallback((): HomeworkProgress => {
    const answeredExercises = Object.keys(answers).length;
    const percentageComplete = totalExercises > 0 
      ? Math.round((answeredExercises / totalExercises) * 100) 
      : 0;

    return {
      totalExercises,
      answeredExercises,
      percentageComplete
    };
  }, [answers, totalExercises]);

  // Load answers on mount
  useEffect(() => {
    if (homeworkId && studentEmail) {
      loadAnswers();
    }
  }, [homeworkId, studentEmail, loadAnswers]);

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
    isSubmitted,
    submittedAt,
    updateAnswer,
    saveOnBlur,
    submitHomework,
    verifyStudentEmail,
    getProgress,
    refetchAnswers: loadAnswers
  };
};
