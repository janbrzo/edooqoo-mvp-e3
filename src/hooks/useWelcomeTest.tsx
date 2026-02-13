/**
 * useWelcomeTest - Hook for Welcome Test session management
 * Handles answer submission, timing, trait detection, and event logging
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ALL_WELCOME_TEST_QUESTIONS, WELCOME_TEST_SECTIONS_WITH_QUESTIONS } from '@/data/welcomeTestQuestions';
import type { WelcomeTestQuestionDef, WelcomeTestSection } from '@/types/welcomeTest';
import type { Json } from '@/integrations/supabase/types';

interface UseWelcomeTestProps {
  shareToken: string | null;
}

interface WelcomeTestState {
  testId: string | null;
  studentId: string | null;
  teacherId: string | null;
  title: string;
  loading: boolean;
  error: string | null;
  answers: Record<string, unknown>; // question_id -> answer
  currentSectionIndex: number;
  currentQuestionIndex: number; // within section
  completed: boolean;
  submitting: boolean;
}

export function useWelcomeTest({ shareToken }: UseWelcomeTestProps) {
  const [state, setState] = useState<WelcomeTestState>({
    testId: null,
    studentId: null,
    teacherId: null,
    title: 'Welcome Test',
    loading: true,
    error: null,
    answers: {},
    currentSectionIndex: 0,
    currentQuestionIndex: 0,
    completed: false,
    submitting: false,
  });

  const questionTimers = useRef<Record<string, number>>({}); // question_id -> start timestamp
  const detectedTraits = useRef<Record<string, string>>({});

  // Load test by share token
  useEffect(() => {
    if (!shareToken) {
      setState(prev => ({ ...prev, loading: false, error: 'No test token provided' }));
      return;
    }

    const fetchTest = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_test_by_share_token', { p_share_token: shareToken });

        if (error) throw error;
        if (!data || data.length === 0) {
          setState(prev => ({ ...prev, loading: false, error: 'Test not found or expired' }));
          return;
        }

        const testInfo = data[0];

        // Get student_id and teacher_id from student_tests table
        const { data: fullTest } = await supabase
          .from('student_tests')
          .select('student_id, teacher_id')
          .eq('id', testInfo.id)
          .single();

        const studentId = fullTest?.student_id || null;
        const teacherId = fullTest?.teacher_id || null;

        // Load existing answers if any
        const { data: questionsData } = await supabase
          .from('student_test_questions')
          .select('*')
          .eq('test_id', testInfo.id)
          .order('question_index', { ascending: true });

        const existingAnswers: Record<string, unknown> = {};
        if (questionsData) {
          for (const q of questionsData) {
            if (q.student_answer !== null) {
              const questionDef = ALL_WELCOME_TEST_QUESTIONS[q.question_index];
              if (questionDef) {
                existingAnswers[questionDef.id] = q.student_answer;
              }
            }
          }
        }

        // Update status to in_progress if assigned
        if (testInfo.status === 'assigned') {
          await supabase
            .from('student_tests')
            .update({ status: 'in_progress', started_at: new Date().toISOString() })
            .eq('id', testInfo.id);
        }

        setState(prev => ({
          ...prev,
          testId: testInfo.id,
          studentId,
          teacherId,
          title: testInfo.title || 'Welcome Test',
          answers: existingAnswers,
          loading: false,
          completed: testInfo.status === 'completed' || testInfo.status === 'reviewed',
        }));
      } catch (err) {
        console.error('Error loading welcome test:', err);
        setState(prev => ({ ...prev, loading: false, error: 'Failed to load test' }));
      }
    };

    fetchTest();
  }, [shareToken]);

  const sections = WELCOME_TEST_SECTIONS_WITH_QUESTIONS;
  const currentSection = sections[state.currentSectionIndex];
  const currentQuestion = currentSection?.questions[state.currentQuestionIndex] || null;

  // Start timer for current question
  useEffect(() => {
    if (currentQuestion) {
      questionTimers.current[currentQuestion.id] = Date.now();
    }
  }, [currentQuestion?.id]);

  // Save answer
  const saveAnswer = useCallback(async (questionId: string, answer: unknown) => {
    // Update local state immediately
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: answer },
    }));

    if (!state.testId) return;

    const questionDef = ALL_WELCOME_TEST_QUESTIONS.find(q => q.id === questionId);
    if (!questionDef) return;

    const questionIndex = ALL_WELCOME_TEST_QUESTIONS.indexOf(questionDef);
    const timeSpent = questionTimers.current[questionId]
      ? Math.round((Date.now() - questionTimers.current[questionId]) / 1000)
      : 0;

    // Check correctness for questions with correct_answer
    let isCorrect: boolean | null = null;
    if (questionDef.correct_answer) {
      if (Array.isArray(questionDef.correct_answer)) {
        const answerStr = String(answer).toLowerCase().trim();
        isCorrect = questionDef.correct_answer.some(
          ca => ca.toLowerCase().trim() === answerStr
        );
      } else {
        isCorrect = String(answer).toLowerCase().trim() === 
                    String(questionDef.correct_answer).toLowerCase().trim();
      }
    }

    // Detect traits
    if (questionDef.detected_trait && typeof answer === 'string') {
      const optionIndex = questionDef.options?.indexOf(answer);
      if (optionIndex !== undefined && optionIndex >= 0) {
        const traitValue = questionDef.detected_trait.mapping[String(optionIndex)];
        if (traitValue) {
          detectedTraits.current[questionDef.detected_trait.trait_name] = traitValue;
        }
      }
    }

    // Save to database
    try {
      await supabase
        .from('student_test_questions')
        .update({
          student_answer: answer as Json,
          is_correct: isCorrect,
          answered_at: new Date().toISOString(),
          time_spent_seconds: timeSpent,
        })
        .eq('test_id', state.testId)
        .eq('question_index', questionIndex);

      // Log event to student_events
      if (state.studentId && state.teacherId) {
        const nanoSkillRatings = questionDef.nano_skill && isCorrect !== null
          ? [{ name: questionDef.nano_skill, reason: isCorrect ? 'correct' : 'incorrect', mastery: isCorrect ? 100 : 0 }]
          : undefined;

        await supabase.rpc('add_student_event', {
          p_student_id: state.studentId,
          p_teacher_id: state.teacherId,
          p_event_type: 'test_answer_submitted',
          p_event_source: 'test',
          p_source_id: state.testId,
          p_element_type: questionDef.element_type || null,
          p_event_payload: {
            test_type: 'welcome',
            question_index: questionIndex,
            question_id: questionId,
            question_type: questionDef.question_type,
            section: questionDef.section,
            student_answer: answer,
            is_correct: isCorrect,
            time_spent_seconds: timeSpent,
            nano_skill_ratings: nanoSkillRatings,
            detected_traits: { ...detectedTraits.current },
          } as unknown as Json,
          p_skill_ids: questionDef.nano_skill ? [questionDef.nano_skill] : [],
        });
      }
    } catch (err) {
      console.error('Error saving answer:', err);
    }
  }, [state.testId, state.studentId, state.teacherId]);

  // Navigation
  const goToNext = useCallback(() => {
    setState(prev => {
      const section = sections[prev.currentSectionIndex];
      if (prev.currentQuestionIndex < section.questions.length - 1) {
        return { ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 };
      } else if (prev.currentSectionIndex < sections.length - 1) {
        return { ...prev, currentSectionIndex: prev.currentSectionIndex + 1, currentQuestionIndex: 0 };
      }
      return prev;
    });
  }, [sections]);

  const goToPrevious = useCallback(() => {
    setState(prev => {
      if (prev.currentQuestionIndex > 0) {
        return { ...prev, currentQuestionIndex: prev.currentQuestionIndex - 1 };
      } else if (prev.currentSectionIndex > 0) {
        const prevSection = sections[prev.currentSectionIndex - 1];
        return { ...prev, currentSectionIndex: prev.currentSectionIndex - 1, currentQuestionIndex: prevSection.questions.length - 1 };
      }
      return prev;
    });
  }, [sections]);

  const goToSection = useCallback((sectionIndex: number) => {
    setState(prev => ({ ...prev, currentSectionIndex: sectionIndex, currentQuestionIndex: 0 }));
  }, []);

  // Complete test
  const completeTest = useCallback(async () => {
    if (!state.testId) return false;

    setState(prev => ({ ...prev, submitting: true }));

    try {
      // Calculate results via RPC
      await supabase.rpc('calculate_test_results', { p_test_id: state.testId });

      // Call process-welcome-test edge function
      await supabase.functions.invoke('process-welcome-test', {
        body: {
          test_id: state.testId,
          student_id: state.studentId,
          teacher_id: state.teacherId,
          answers: state.answers,
          detected_traits: detectedTraits.current,
        },
      });

      setState(prev => ({ ...prev, completed: true, submitting: false }));
      toast.success('Welcome Test completed! Your teacher will review the results.');
      return true;
    } catch (err) {
      console.error('Error completing welcome test:', err);
      toast.error('Failed to complete test');
      setState(prev => ({ ...prev, submitting: false }));
      return false;
    }
  }, [state.testId, state.studentId, state.teacherId, state.answers]);

  // Progress calculation
  const totalQuestions = ALL_WELCOME_TEST_QUESTIONS.length;
  const answeredCount = Object.keys(state.answers).length;
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // Global question index
  const globalQuestionIndex = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < state.currentSectionIndex; i++) {
      idx += sections[i].questions.length;
    }
    return idx + state.currentQuestionIndex;
  }, [state.currentSectionIndex, state.currentQuestionIndex, sections]);

  const isLastQuestion = state.currentSectionIndex === sections.length - 1 && 
    state.currentQuestionIndex === sections[sections.length - 1].questions.length - 1;

  const canComplete = answeredCount >= totalQuestions * 0.5; // At least 50% answered

  return {
    ...state,
    sections,
    currentSection,
    currentQuestion,
    globalQuestionIndex,
    totalQuestions,
    answeredCount,
    progress,
    isLastQuestion,
    canComplete,
    saveAnswer,
    goToNext,
    goToPrevious,
    goToSection,
    completeTest,
  };
}
