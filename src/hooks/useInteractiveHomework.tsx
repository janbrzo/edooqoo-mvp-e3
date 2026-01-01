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
  exerciseQuestionCounts?: Record<number, number>;
}

export const useInteractiveHomework = ({
  homeworkId,
  studentEmail,
  totalExercises,
  exerciseQuestionCounts = {}
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

  // Debounced auto-save function (Problem 3: reduced from 5 seconds to 1.5 seconds)
  const scheduleAutoSave = useCallback((exerciseIndex: number, exerciseType: string, exerciseAnswers: ExerciseAnswers) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Mark this exercise as pending save
    pendingSavesRef.current.add(exerciseIndex);
    setIsSaving(true);

    // Schedule new save (1.5 seconds for faster feedback)
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

  // Submit all homework - creates notification in homework_notifications table (bell icon)
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

      // PROBLEM 5 FIX: Call AI verification for open-ended exercises
      const openAnswerTypes = ['reading', 'discussion', 'describe', 'answer-questions', 'dialogue', 'answer-questions-audio'];
      
      try {
        // Get exercise types from answers (we need to load them from saved data)
        const { data: savedAnswers } = await supabase.rpc('get_student_homework_answers', {
          p_homework_id: homeworkId,
          p_student_email: studentEmail
        });

        if (savedAnswers && savedAnswers.length > 0) {
          const answersToVerify = savedAnswers
            .filter((ans: any) => openAnswerTypes.includes(ans.exercise_type))
            .map((ans: any) => {
              // Flatten answers object to string
              const answerValues = Object.values(ans.answers || {});
              return {
                question_index: ans.exercise_index,
                question_text: `Exercise ${ans.exercise_index + 1}`,
                student_answer: answerValues.join(', '),
                exercise_type: ans.exercise_type
              };
            })
            .filter((ans: any) => ans.student_answer.trim() !== '');

          if (answersToVerify.length > 0) {
            console.log('[submitHomework] Verifying', answersToVerify.length, 'open answers');
            
            const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('verify-open-answers', {
              body: { 
                answers: answersToVerify, 
                english_level: 'Intermediate',
                context: 'Homework submission'
              }
            });

            if (!verifyError && verifyResult?.evaluations) {
              console.log('[submitHomework] AI evaluation received:', verifyResult.evaluations.length, 'results');
              
              // Save AI evaluations to each answer
              for (const evaluation of verifyResult.evaluations) {
                await supabase
                  .from('homework_student_answers')
                  .update({ ai_evaluation: evaluation })
                  .eq('homework_id', homeworkId)
                  .eq('student_email', studentEmail)
                  .eq('exercise_index', evaluation.question_index);
              }
            } else if (verifyError) {
              console.error('[submitHomework] AI verification error:', verifyError);
            }
          }
        }
      } catch (aiError) {
        // Don't block submission if AI verification fails
        console.error('[submitHomework] AI verification failed (non-blocking):', aiError);
      }

      // Create notification for teacher using SECURITY DEFINER function
      // The SQL function fetches all data internally, so anonymous students don't need RLS access
      try {
        const { error: notifError } = await supabase.rpc('insert_homework_submission_notification', {
          p_homework_id: homeworkId
        });
        
        if (notifError) {
          console.error('[submitHomework] RPC notification error:', notifError);
        } else {
          console.log('[submitHomework] Notification created successfully');
        }
      } catch (notifError) {
        console.error('[submitHomework] Failed to create notification:', notifError);
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
  }, [homeworkId, studentEmail]);

  // Calculate progress - exercise is "answered" only when ALL questions have answers
  const getProgress = useCallback((): HomeworkProgress => {
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
