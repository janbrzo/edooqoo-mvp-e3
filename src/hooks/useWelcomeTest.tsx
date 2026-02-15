/**
 * useWelcomeTest - Hook for Welcome Test session management
 * Handles answer submission, timing, trait detection, version filtering, pause/resume
 * Issues fixed: debounced events, cross-device resume, teacher mode, auto-translation
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
  persistedAnsweredCount: number | null;
  isTeacherMode: boolean;
  studentNativeLanguage: string | null;
}

// Questions that are text-input based and should only commit on blur/navigate
const TEXT_INPUT_TYPES = new Set(['fill_blank', 'open_ended', 'open_reflection']);

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
    isTeacherMode: false,
    studentNativeLanguage: null,
  });

  const questionTimers = useRef<Record<string, number>>({});
  const detectedTraits = useRef<Record<string, string>>({});
  const committedSections = useRef<Set<string>>(new Set());
  const pendingCommit = useRef<string | null>(null);

  // Load test by share token
  useEffect(() => {
    if (!shareToken) {
      setState(prev => ({ ...prev, loading: false, error: 'No test token provided' }));
      return;
    }

    const fetchTest = async () => {
      try {
        // Check if current user is a teacher
        const { data: { user } } = await supabase.auth.getUser();
        const isTeacher = !!user;

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

        // Fetch student's native language for auto-translation
        let nativeLang: string | null = null;
        if (studentId) {
          const { data: studentData } = await supabase
            .from('students')
            .select('native_language')
            .eq('id', studentId)
            .single();
          nativeLang = studentData?.native_language || null;
        }

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

        // Restore version from localStorage OR generation_params
        const storedVersion = localStorage.getItem(`wt_version_${shareToken}`);
        const dbVersion = (fullTest?.generation_params as any)?.test_version || null;
        const resolvedVersion = (storedVersion || dbVersion) as TestVersion;

        const isCompleted = testInfo.status === 'completed' || testInfo.status === 'reviewed';
        const hasExistingAnswers = Object.keys(existingAnswers).length > 0;

        // Update status to in_progress if assigned (only if not teacher)
        if (testInfo.status === 'assigned' && !isTeacher) {
          await supabase
            .from('student_tests')
            .update({ status: 'in_progress', started_at: new Date().toISOString() })
            .eq('id', testInfo.id);
        }

        // For cross-device resume: find first unanswered question
        let restoredSectionIndex = 0;
        let restoredQuestionIndex = 0;
        
        if (hasExistingAnswers && resolvedVersion && !isCompleted) {
          // Compute visible questions for this version
          const visibleSections = resolvedVersion === 'short'
            ? WELCOME_TEST_SECTIONS_WITH_QUESTIONS.map(s => ({
                ...s,
                questions: s.questions.filter(q => WELCOME_TEST_SHORT_QUESTION_IDS.includes(q.id)),
              })).filter(s => s.questions.length > 0)
            : WELCOME_TEST_SECTIONS_WITH_QUESTIONS;
          
          // Find first unanswered question
          let found = false;
          for (let si = 0; si < visibleSections.length && !found; si++) {
            for (let qi = 0; qi < visibleSections[si].questions.length && !found; qi++) {
              if (existingAnswers[visibleSections[si].questions[qi].id] === undefined) {
                restoredSectionIndex = si;
                restoredQuestionIndex = qi;
                found = true;
              }
            }
          }
          if (!found) {
            // All answered, go to last question
            const lastSection = visibleSections.length - 1;
            restoredSectionIndex = lastSection;
            restoredQuestionIndex = visibleSections[lastSection].questions.length - 1;
          }
        }

        // If has existing answers but not completed, show paused state
        const shouldPause = !isCompleted && hasExistingAnswers && !!resolvedVersion && !isTeacher;

        const persistedCount = (testInfo as any).answered_count || dbAnsweredCount || null;

        setState(prev => ({
          ...prev,
          testId: testInfo.id,
          studentId,
          teacherId,
          title: testInfo.title || 'Welcome Test',
          answers: existingAnswers,
          loading: false,
          completed: isCompleted,
          testVersion: resolvedVersion,
          currentSectionIndex: restoredSectionIndex,
          currentQuestionIndex: restoredQuestionIndex,
          persistedAnsweredCount: persistedCount,
          paused: shouldPause || false,
          isTeacherMode: isTeacher,
          studentNativeLanguage: nativeLang,
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

  // Persist position on navigation (localStorage only - fast)
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
    // Also persist to DB for cross-device
    if (state.testId) {
      supabase
        .from('student_tests')
        .update({ generation_params: { test_version: version } as unknown as Json })
        .eq('id', state.testId)
        .then(() => {});
    }
    setState(prev => ({ ...prev, testVersion: version, currentSectionIndex: 0, currentQuestionIndex: 0 }));
  }, [shareToken, state.testId]);

  // Commit answer to DB + log event (called on blur/navigate for text, immediately for radio/checkbox)
  const commitAnswer = useCallback(async (questionId: string, answer: unknown) => {
    if (!state.testId || state.isTeacherMode) return;

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

      // Log section-level event (one per section, upsert pattern via DELETE+INSERT)
      if (state.studentId && state.teacherId) {
        const sectionId = questionDef.section;
        
        // Collect all answers for this section
        const currentAnswers = { ...state.answers, [questionId]: answer };
        const sectionQuestions = ALL_WELCOME_TEST_QUESTIONS.filter(q => q.section === sectionId);
        const sectionAnswerCount = sectionQuestions.filter(q => currentAnswers[q.id] !== undefined).length;

        // Only log once per section change (debounce)
        const sectionKey = `${sectionId}_${sectionAnswerCount}`;
        if (!committedSections.current.has(sectionKey)) {
          committedSections.current.add(sectionKey);

          // DELETE previous events for this section, then INSERT new one
          await supabase
            .from('student_events')
            .delete()
            .eq('student_id', state.studentId)
            .eq('source_id', state.testId)
            .eq('event_type', 'welcome_test_section_progress')
            .eq('element_type', sectionId);

          await supabase.rpc('add_student_event', {
            p_student_id: state.studentId,
            p_teacher_id: state.teacherId,
            p_event_type: 'welcome_test_section_progress',
            p_event_source: 'welcome_test',
            p_source_id: state.testId,
            p_element_type: sectionId,
            p_event_payload: {
              test_type: 'welcome',
              section: sectionId,
              section_answers_count: sectionAnswerCount,
              section_total: sectionQuestions.length,
              detected_traits: { ...detectedTraits.current },
            } as unknown as Json,
            p_skill_ids: [],
          });
        }
      }
    } catch (err) {
      console.error('Error committing answer:', err);
    }
  }, [state.testId, state.studentId, state.teacherId, state.answers, state.isTeacherMode]);

  // Save answer - updates local state, commits immediately for non-text questions
  const saveAnswer = useCallback(async (questionId: string, answer: unknown) => {
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: answer },
    }));

    const questionDef = ALL_WELCOME_TEST_QUESTIONS.find(q => q.id === questionId);
    if (!questionDef) return;

    // For text inputs, defer commit to blur/navigation
    if (TEXT_INPUT_TYPES.has(questionDef.question_type)) {
      pendingCommit.current = questionId;
      return;
    }

    // For radio/checkbox/matrix, commit immediately
    await commitAnswer(questionId, answer);
  }, [commitAnswer]);

  // Flush pending text answer (called on navigation)
  const flushPendingAnswer = useCallback(async () => {
    if (pendingCommit.current && state.answers[pendingCommit.current] !== undefined) {
      await commitAnswer(pendingCommit.current, state.answers[pendingCommit.current]);
      pendingCommit.current = null;
    }
  }, [commitAnswer, state.answers]);

  // Save "I don't know" answer
  const saveIdontKnow = useCallback((questionId: string) => {
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: '__IDK__' },
    }));
    commitAnswer(questionId, '__IDK__');
  }, [commitAnswer]);

  // Skip question (just move forward without saving)
  const skipQuestion = useCallback(() => {
    flushPendingAnswer();
    goToNext();
  }, []);

  // Navigation
  const goToNext = useCallback(() => {
    flushPendingAnswer();
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
  }, [sections, flushPendingAnswer]);

  const goToPrevious = useCallback(() => {
    flushPendingAnswer();
    setState(prev => {
      if (prev.currentQuestionIndex > 0) {
        return { ...prev, currentQuestionIndex: prev.currentQuestionIndex - 1 };
      } else if (prev.currentSectionIndex > 0) {
        const prevSection = sections[prev.currentSectionIndex - 1];
        return { ...prev, currentSectionIndex: prev.currentSectionIndex - 1, currentQuestionIndex: prevSection.questions.length - 1 };
      }
      return prev;
    });
  }, [sections, flushPendingAnswer]);

  const goToSection = useCallback((sectionIndex: number) => {
    flushPendingAnswer();
    setState(prev => ({ ...prev, currentSectionIndex: sectionIndex, currentQuestionIndex: 0 }));
  }, [flushPendingAnswer]);

  const goToQuestionInSection = useCallback((sectionIndex: number, questionIndex: number) => {
    flushPendingAnswer();
    setState(prev => ({ ...prev, currentSectionIndex: sectionIndex, currentQuestionIndex: questionIndex }));
  }, [flushPendingAnswer]);

  // Pause test
  const pauseTest = useCallback(() => {
    flushPendingAnswer();
    setState(prev => ({ ...prev, paused: true }));
    toast.success('Test paused. Your progress is saved. Come back anytime!');
  }, [flushPendingAnswer]);

  const resumeTest = useCallback(() => {
    setState(prev => ({ ...prev, paused: false }));
  }, []);

  // Complete test
  const completeTest = useCallback(async () => {
    if (!state.testId) return false;

    await flushPendingAnswer();
    setState(prev => ({ ...prev, submitting: true }));

    try {
      await supabase.rpc('calculate_test_results', { p_test_id: state.testId });

      const finalAnsweredCount = allVisibleQuestions.filter(q => state.answers[q.id] !== undefined).length;
      
      await supabase
        .from('student_tests')
        .update({ answered_count: finalAnsweredCount })
        .eq('id', state.testId);

      await supabase.functions.invoke('process-welcome-test', {
        body: {
          test_id: state.testId,
          student_id: state.studentId,
          teacher_id: state.teacherId,
          answers: state.answers,
          detected_traits: detectedTraits.current,
          answered_count: finalAnsweredCount,
        },
      });

      if (shareToken) {
        localStorage.removeItem(`wt_position_${shareToken}`);
      }

      setState(prev => ({ ...prev, completed: true, submitting: false, persistedAnsweredCount: finalAnsweredCount }));
      toast.success('Welcome Test completed! Your teacher will review the results.');
      return true;
    } catch (err) {
      console.error('Error completing welcome test:', err);
      toast.error('Failed to complete test');
      setState(prev => ({ ...prev, submitting: false }));
      return false;
    }
  }, [state.testId, state.studentId, state.teacherId, state.answers, shareToken, flushPendingAnswer, allVisibleQuestions]);

  // Progress calculation
  const totalQuestions = allVisibleQuestions.length;
  const answeredCount = allVisibleQuestions.filter(q => state.answers[q.id] !== undefined).length;
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const displayAnsweredCount = state.completed
    ? Math.max(answeredCount, state.persistedAnsweredCount || 0)
    : answeredCount;

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
    flushPendingAnswer,
  };
}
