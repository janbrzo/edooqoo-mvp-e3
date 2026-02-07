import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  HomeworkStudentAnswer, 
  ExerciseAnswers,
  HomeworkProgress 
} from '@/types/interactiveHomework';
import { AiEvaluation } from '@/components/homework/AiEvaluationBadge';
import { 
  buildItemEvaluations, 
  calculateOverallMastery,
  OPEN_ENDED_EXERCISE_TYPES,
  ItemEvaluation 
} from '@/utils/masteryCalculator';
import { safeGetNanoSkill } from '@/utils/textObjectFixer';

interface UseInteractiveHomeworkProps {
  homeworkId: string;
  studentEmail: string;
  totalExercises: number;
  exerciseQuestionCounts?: Record<number, number>;
  exercises?: any[]; // PROBLEM 4.2: Accept exercises array to get question texts and suggested answers
}

export const useInteractiveHomework = ({
  homeworkId,
  studentEmail,
  totalExercises,
  exerciseQuestionCounts = {},
  exercises = []
}: UseInteractiveHomeworkProps) => {
  const [answers, setAnswers] = useState<Record<number, ExerciseAnswers>>({});
  const [aiEvaluations, setAiEvaluations] = useState<Record<number, Record<number, AiEvaluation>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);
  const [isWaitingForAiEval, setIsWaitingForAiEval] = useState(false);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const pendingSavesRef = useRef<Set<number>>(new Set());
  
  // PROBLEM 2 FIX: Active time tracking per exercise
  const exerciseStartTimeRef = useRef<Record<number, number>>({});
  const exerciseActiveTimeRef = useRef<Record<number, number>>({});
  const isTabActiveRef = useRef(true);

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
        const loadedEvaluations: Record<number, Record<number, AiEvaluation>> = {}; // PROBLEM 4: Load AI evaluations per exercise -> per question
        let allSubmitted = true;

        data.forEach((answer: any) => {
          loadedAnswers[answer.exercise_index] = answer.answers;
          
          // PROBLEM 4: Load AI evaluation - handle both old format (single) and new format (per-question)
          if (answer.ai_evaluation) {
            const evalData = answer.ai_evaluation;
            
            // Check if it's new per-question format (has question_evaluations array)
            if (evalData.question_evaluations && Array.isArray(evalData.question_evaluations)) {
              loadedEvaluations[answer.exercise_index] = {};
              evalData.question_evaluations.forEach((qEval: any) => {
                loadedEvaluations[answer.exercise_index][qEval.question_index] = qEval;
              });
            } else if (evalData.is_acceptable !== undefined) {
              // Old format - single evaluation for whole exercise, store under index 0
              loadedEvaluations[answer.exercise_index] = { 0: evalData as AiEvaluation };
            }
          }
          
          if (!answer.is_submitted) {
            allSubmitted = false;
          }
          if (answer.submitted_at) {
            setSubmittedAt(new Date(answer.submitted_at));
          }
        });

        setAnswers(loadedAnswers);
        setAiEvaluations(loadedEvaluations); // PROBLEM 4: Store loaded evaluations
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

  // PROBLEM 2 FIX: Calculate active time for an exercise
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
      
      // PROBLEM 2 FIX: Include active time in save
      const activeTimeMs = getActiveTimeMs(exerciseIndex);
      
      const { error } = await supabase.rpc('save_homework_answer', {
        p_homework_id: homeworkId,
        p_student_email: studentEmail,
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
  }, [homeworkId, studentEmail, getActiveTimeMs]);

  // Debounced auto-save function (Problem 3: reduced from 5 seconds to 1.5 seconds)
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

    console.log('[useInteractiveHomework] Saving with itemEvaluations:', {
      exerciseIndex,
      exerciseType,
      mastery,
      itemEvaluationsCount: itemEvaluations?.length || 0
    });

    // Schedule new save (1.5 seconds for faster feedback)
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
    // PROBLEM 2 FIX: Start tracking time for this exercise if not already
    if (!exerciseStartTimeRef.current[exerciseIndex]) {
      exerciseStartTimeRef.current[exerciseIndex] = Date.now();
    }
    
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

      // PROBLEM 6 FIX: Call AI verification for ALL open-ended exercise types
      const openAnswerTypes = [
        'reading', 'discussion', 'describe', 'answer-questions', 
        'dialogue', 'answer-questions-audio', 'describe-picture',
        'answer-questions-picture', 'paraphrasing', 'speaking',
        'sentence-transformation', 'essay', 'gap-text', 'word-order',
        'listening-comprehension'
      ];
      
      console.log('[submitHomework] Starting AI verification process...');
      console.log('[submitHomework] Recognized open answer types:', openAnswerTypes);
      setIsWaitingForAiEval(true);
      
      try {
        // Get exercise types from answers (we need to load them from saved data)
        const { data: savedAnswers } = await supabase.rpc('get_student_homework_answers', {
          p_homework_id: homeworkId,
          p_student_email: studentEmail
        });

        console.log('[submitHomework] Fetched saved answers:', savedAnswers?.length || 0);
        
        if (savedAnswers && savedAnswers.length > 0) {
          // Log all exercise types for debugging
          const allTypes = savedAnswers.map((a: any) => a.exercise_type);
          console.log('[submitHomework] All exercise types:', allTypes);
          
          // PROBLEM 4: Build answers with individual questions for per-question AI verification
          const answersToVerify: any[] = [];
          
          for (const ans of savedAnswers.filter((a: any) => {
            const isOpen = openAnswerTypes.includes(a.exercise_type);
            console.log(`[submitHomework] Exercise ${a.exercise_index}: type=${a.exercise_type}, isOpen=${isOpen}`);
            return isOpen;
          })) {
            const exerciseData = exercises[ans.exercise_index];
            const studentAnswersForExercise = ans.answers || {};
            
            // Get questions/prompts/sentences array from exercise
            // PROBLEM 2.1 FIX: Add 'items' for listening-comprehension support
            const questionItems = exerciseData?.questions || exerciseData?.prompts || exerciseData?.sentences || exerciseData?.expressions || exerciseData?.items || [];
            
            // PROBLEM 4: Send each question separately for individual evaluation
            Object.entries(studentAnswersForExercise).forEach(([qIdxStr, studentAnswer]) => {
              const qIdx = parseInt(qIdxStr);
              const questionItem = questionItems[qIdx];
              
              if (!questionItem || !studentAnswer || String(studentAnswer).trim() === '') return;
              
              // Extract question text based on data structure
              let questionText = '';
              let suggestedAnswer = '';
              
              if (typeof questionItem === 'string') {
                questionText = questionItem;
              } else {
                questionText = questionItem.text || questionItem.question || questionItem.prompt || questionItem.original || '';
                suggestedAnswer = questionItem.suggested_answer || questionItem.answer || questionItem.correct_answer || questionItem.correct || questionItem.transformed || '';
              }
              
              // Add exercise context
              if (exerciseData?.instructions && qIdx === 0) {
                questionText = `[Instructions: ${exerciseData.instructions}]\n\n${questionText}`;
              }
              
              answersToVerify.push({
                exercise_index: ans.exercise_index,
                question_index: qIdx,
                question_text: questionText,
                student_answer: String(studentAnswer),
                suggested_answer: suggestedAnswer || undefined,
                exercise_type: ans.exercise_type
              });
            });
          }

          if (answersToVerify.length > 0) {
            console.log('[submitHomework] Verifying', answersToVerify.length, 'individual questions');
            
            const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('verify-open-answers', {
              body: { 
                answers: answersToVerify, 
                english_level: 'Intermediate',
                context: 'Homework submission - individual question evaluation'
              }
            });

            if (!verifyError && verifyResult?.evaluations) {
              console.log('[submitHomework] AI evaluation received:', verifyResult.evaluations.length, 'results');
              
              // PROBLEM 4: Group evaluations by exercise_index, then by question_index
              const groupedEvaluations: Record<number, Record<number, AiEvaluation>> = {};
              const dbUpdates: Record<number, { question_evaluations: any[] }> = {};
              
              for (const evaluation of verifyResult.evaluations) {
                const exIdx = evaluation.exercise_index ?? evaluation.question_index; // Fallback if not present
                const qIdx = evaluation.question_index ?? 0;
                
                if (!groupedEvaluations[exIdx]) {
                  groupedEvaluations[exIdx] = {};
                  dbUpdates[exIdx] = { question_evaluations: [] };
                }
                
                groupedEvaluations[exIdx][qIdx] = {
                  is_acceptable: evaluation.is_acceptable,
                  quality_score: evaluation.quality_score,
                  feedback: evaluation.feedback,
                  question_index: qIdx
                };
                
                dbUpdates[exIdx].question_evaluations.push({
                  question_index: qIdx,
                  is_acceptable: evaluation.is_acceptable,
                  quality_score: evaluation.quality_score,
                  feedback: evaluation.feedback
                });
              }
              
              // Save to database - one update per exercise with all question evaluations
              // PROBLEM 1 FIX: Also update item_evaluations and mastery from AI scores
              for (const [exIdxStr, evalData] of Object.entries(dbUpdates)) {
                const exIdx = parseInt(exIdxStr);
                
              // Build item_evaluations with AI mastery scores
                const exerciseData = exercises[exIdx];
                const questionItems = exerciseData?.questions || exerciseData?.prompts || exerciseData?.sentences || exerciseData?.expressions || exerciseData?.items || [];
                
                // PROBLEM 2B FIX: Build lookup of items with nano_skill for proper mapping
                const itemsWithNanoSkill = questionItems
                  .map((item: any, idx: number) => ({ item, idx, nanoSkill: safeGetNanoSkill(item) }))
                  .filter((x: any) => x.nanoSkill !== null);
                
                // Map AI results back to original nano_skills using position matching
                const itemEvals: ItemEvaluation[] = evalData.question_evaluations.map((qEval: any, aiIdx: number) => {
                  // Try to find by question_index first
                  let matchedItem = itemsWithNanoSkill.find((x: any) => x.idx === qEval.question_index);
                  
                  // Fallback: if not found, use position in AI results array
                  if (!matchedItem && aiIdx < itemsWithNanoSkill.length) {
                    matchedItem = itemsWithNanoSkill[aiIdx];
                  }
                  
                  return {
                    question_index: matchedItem?.idx ?? qEval.question_index,
                    name: matchedItem?.nanoSkill?.name || `question_${qEval.question_index}`,
                    reason: matchedItem?.nanoSkill?.reason || '',
                    mastery: Math.round(qEval.quality_score * 100), // 0-1 → 0-100
                    hasValue: true
                  };
                });
                
                const overallMastery = itemEvals.length > 0
                  ? Math.round(itemEvals.reduce((sum, e) => sum + e.mastery, 0) / itemEvals.length)
                  : null;
                
                await supabase
                  .from('homework_student_answers')
                  .update({ 
                    ai_evaluation: evalData,
                    item_evaluations: JSON.parse(JSON.stringify(itemEvals)),
                    mastery: overallMastery,
                    eval_trigger: 'submit_homework'
                  })
                  .eq('homework_id', homeworkId)
                  .eq('student_email', studentEmail)
                  .eq('exercise_index', exIdx);
              }
              
              // Update aiEvaluations state immediately with grouped structure
              setAiEvaluations(prev => {
                const updated = { ...prev };
                for (const [exIdx, questionEvals] of Object.entries(groupedEvaluations)) {
                  updated[parseInt(exIdx)] = questionEvals as Record<number, AiEvaluation>;
                }
                return updated;
              });
              setIsWaitingForAiEval(false);
            } else if (verifyError) {
              console.error('[submitHomework] AI verification error:', verifyError);
              setIsWaitingForAiEval(false);
            }
          }
        }
      } catch (aiError) {
        // Don't block submission if AI verification fails
        console.error('[submitHomework] AI verification failed (non-blocking):', aiError);
        setIsWaitingForAiEval(false);
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

  // Calculate progress - percentage based on individual tasks, exercises based on full completion
  const getProgress = useCallback((): HomeworkProgress => {
    let answeredExercises = 0;
    let totalTasks = 0;
    let answeredTasks = 0;
    
    // Count total tasks across ALL exercises (not just answered ones)
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
    if (homeworkId && studentEmail) {
      loadAnswers();
    }
  }, [homeworkId, studentEmail, loadAnswers]);

  // PROBLEM 2 FIX: Visibility change tracking for active time
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
    aiEvaluations,
    isLoading,
    isSaving,
    lastSavedAt,
    isSubmitted,
    submittedAt,
    isWaitingForAiEval,
    updateAnswer,
    saveOnBlur,
    submitHomework,
    verifyStudentEmail,
    getProgress,
    refetchAnswers: loadAnswers
  };
};
