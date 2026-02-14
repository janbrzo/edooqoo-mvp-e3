/**
 * useWelcomeTest - Hook for Welcome Test session management
 * Handles answer submission, timing, trait detection, version filtering, pause/resume
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  ALL_WELCOME_TEST_QUESTIONS, 
  WELCOME_TEST_SECTIONS_WITH_QUESTIONS,
  WELCOME_TEST_SHORT_QUESTION_IDS 
} from '@/data/welcomeTestQuestions';
import type { WelcomeTestQuestionDef, WelcomeTestSectionDef } from '@/types/welcomeTest';
import type { Json } from '@/integrations/supabase/types';

interface UseWelcomeTestProps {
  shareToken: string | null;
}

type TestVersion = 'short' | 'full' | null;

interface WelcomeTestState {
  testId: string | null;
  studentId: string | null;
  teacherId: string | null;
  title: string;
  loading: boolean;
  error: string | null;
  answers: Record<string, unknown>;
  currentSectionIndex: number;
  currentQuestionIndex: number;
  completed: boolean;
  submitting: boolean;
  testVersion: TestVersion;
  paused: boolean;
  persistedAnsweredCount: number | null; // for completed tests
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
    testVersion: null,
    paused: false,
    persistedAnsweredCount: null,
  });

  const questionTimers = useRef<Record<string, number>>({});
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

        const { data: fullTest } = await supabase
          .from('student_tests')
          .select('student_id, teacher_id, generation_params')
          .eq('id', testInfo.id)
          .single();

        const studentId = fullTest?.student_id || null;
        const teacherId = fullTest?.teacher_id || null;

        // Load existing answers
        const { data: questionsData } = await supabase
          .from('student_test_questions')
          .select('*')
          .eq('test_id', testInfo.id)
          .order('question_index', { ascending: true });

        const existingAnswers: Record<string, unknown> = {};
        let dbAnsweredCount = 0;
        if (questionsData) {
          for (const q of questionsData) {
            if (q.student_answer !== null) {
              const questionDef = ALL_WELCOME_TEST_QUESTIONS[q.question_index];
              if (questionDef) {
                existingAnswers[questionDef.id] = q.student_answer;
                dbAnsweredCount++;
              }
            }
          }
        }

        // Restore version from localStorage
        const storedVersion = localStorage.getItem(`wt_version_${shareToken}`);

        // Update status to in_progress if assigned
        if (testInfo.status === 'assigned') {
          await supabase
            .from('student_tests')
            .update({ status: 'in_progress', started_at: new Date().toISOString() })
            .eq('id', testInfo.id);
        }

        // Restore position from localStorage
        let restoredSectionIndex = 0;
        let restoredQuestionIndex = 0;
        const storedPos = localStorage.getItem(`wt_position_${shareToken}`);
        if (storedPos) {
          try {
            const pos = JSON.parse(storedPos);
            restoredSectionIndex = pos.sectionIndex || 0;
            restoredQuestionIndex = pos.questionIndex || 0;
          } catch {}
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
          testVersion: (storedVersion as TestVersion) || null,
          currentSectionIndex: restoredSectionIndex,
          currentQuestionIndex: restoredQuestionIndex,
          persistedAnsweredCount: dbAnsweredCount > 0 ? dbAnsweredCount : null,
        }));
      } catch (err) {
        console.error('Error loading welcome test:', err);
        setState(prev => ({ ...prev, loading: false, error: 'Failed to load test' }));
      }
    };

    fetchTest();
  }, [shareToken]);

  // Filter sections based on version
  const sections = useMemo(() => {
    if (state.testVersion === 'short') {
      return WELCOME_TEST_SECTIONS_WITH_QUESTIONS.map(section => ({
        ...section,
        questions: section.questions.filter(q => WELCOME_TEST_SHORT_QUESTION_IDS.includes(q.id)),
      })).filter(section => section.questions.length > 0);
    }
    return WELCOME_TEST_SECTIONS_WITH_QUESTIONS;
  }, [state.testVersion]);

  const allVisibleQuestions = useMemo(() => sections.flatMap(s => s.questions), [sections]);
  const currentSection = sections[state.currentSectionIndex];
  const currentQuestion = currentSection?.questions[state.currentQuestionIndex] || null;

  // Start timer for current question
  useEffect(() => {
    if (currentQuestion) {
      questionTimers.current[currentQuestion.id] = Date.now();
    }
  }, [currentQuestion?.id]);

  // Persist position on navigation
  useEffect(() => {
    if (shareToken && !state.completed && state.testVersion) {
      localStorage.setItem(`wt_position_${shareToken}`, JSON.stringify({
        sectionIndex: state.currentSectionIndex,
        questionIndex: state.currentQuestionIndex,
      }));
    }
  }, [state.currentSectionIndex, state.currentQuestionIndex, shareToken, state.completed, state.testVersion]);

  // Set test version
  const setTestVersion = useCallback((version: 'short' | 'full') => {
    if (shareToken) {
      localStorage.setItem(`wt_version_${shareToken}`, version);
    }
    setState(prev => ({ ...prev, testVersion: version, currentSectionIndex: 0, currentQuestionIndex: 0 }));
  }, [shareToken]);

  // Save answer
  const saveAnswer = useCallback(async (questionId: string, answer: unknown) => {
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

  // Save "I don't know" answer
  const saveIdontKnow = useCallback((questionId: string) => {
    saveAnswer(questionId, '__IDK__');
  }, [saveAnswer]);

  // Skip question (just move forward without saving)
  const skipQuestion = useCallback(() => {
    goToNext();
  }, []);

  // Navigation
  const goToNext = useCallback(() => {
    setState(prev => {
      const section = sections[prev.currentSectionIndex];
      if (!section) return prev;
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

  const goToQuestionInSection = useCallback((sectionIndex: number, questionIndex: number) => {
    setState(prev => ({ ...prev, currentSectionIndex: sectionIndex, currentQuestionIndex: questionIndex }));
  }, []);

  // Pause test
  const pauseTest = useCallback(() => {
    setState(prev => ({ ...prev, paused: true }));
    toast.success('Test paused. Your progress is saved. Come back anytime!');
  }, []);

  const resumeTest = useCallback(() => {
    setState(prev => ({ ...prev, paused: false }));
  }, []);

  // Complete test
  const completeTest = useCallback(async () => {
    if (!state.testId) return false;

    setState(prev => ({ ...prev, submitting: true }));

    try {
      await supabase.rpc('calculate_test_results', { p_test_id: state.testId });

      await supabase.functions.invoke('process-welcome-test', {
        body: {
          test_id: state.testId,
          student_id: state.studentId,
          teacher_id: state.teacherId,
          answers: state.answers,
          detected_traits: detectedTraits.current,
        },
      });

      // Clean up localStorage
      if (shareToken) {
        localStorage.removeItem(`wt_position_${shareToken}`);
      }

      setState(prev => ({ ...prev, completed: true, submitting: false }));
      toast.success('Welcome Test completed! Your teacher will review the results.');
      return true;
    } catch (err) {
      console.error('Error completing welcome test:', err);
      toast.error('Failed to complete test');
      setState(prev => ({ ...prev, submitting: false }));
      return false;
    }
  }, [state.testId, state.studentId, state.teacherId, state.answers, shareToken]);

  // Progress calculation
  const totalQuestions = allVisibleQuestions.length;
  const answeredCount = allVisibleQuestions.filter(q => state.answers[q.id] !== undefined).length;
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // For completed tests, use persisted count if available
  const displayAnsweredCount = state.completed && state.persistedAnsweredCount !== null
    ? state.persistedAnsweredCount
    : answeredCount;

  // Global question index within visible questions
  const globalQuestionIndex = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < state.currentSectionIndex; i++) {
      idx += sections[i]?.questions.length || 0;
    }
    return idx + state.currentQuestionIndex;
  }, [state.currentSectionIndex, state.currentQuestionIndex, sections]);

  const isLastQuestion = state.currentSectionIndex === sections.length - 1 && 
    currentSection && state.currentQuestionIndex === currentSection.questions.length - 1;

  const canComplete = answeredCount >= totalQuestions * 0.5;

  // Estimated time remaining (avg 40s per question)
  const estimatedMinutesRemaining = Math.max(1, Math.ceil((totalQuestions - answeredCount) * 40 / 60));

  return {
    ...state,
    sections,
    currentSection,
    currentQuestion,
    globalQuestionIndex,
    totalQuestions,
    answeredCount: displayAnsweredCount,
    progress,
    isLastQuestion,
    canComplete,
    estimatedMinutesRemaining,
    saveAnswer,
    saveIdontKnow,
    skipQuestion,
    goToNext,
    goToPrevious,
    goToSection,
    goToQuestionInSection,
    completeTest,
    setTestVersion,
    pauseTest,
    resumeTest,
  };
}
