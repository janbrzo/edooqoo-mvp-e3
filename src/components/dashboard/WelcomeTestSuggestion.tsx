/**
 * WelcomeTestSuggestion - Banner suggesting teacher to send Welcome Test to new student
 * Shows on StudentPage overview tab when no Welcome Test has been completed
 * Points 5, 12, 18: Auto-email, real-time progress, preview, view results
 */

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Send, Loader2, Copy, ExternalLink, Eye, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useStudentTests } from '@/hooks/useStudentTests';
import { ALL_WELCOME_TEST_QUESTIONS } from '@/data/welcomeTestQuestions';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface WelcomeTestSuggestionProps {
  studentId: string;
  teacherId: string;
  studentName: string;
  studentEmail?: string | null;
}

export function WelcomeTestSuggestion({ studentId, teacherId, studentName, studentEmail }: WelcomeTestSuggestionProps) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'no_test' | 'pending' | 'in_progress' | 'completed' | 'hidden'>('loading');
  const [creating, setCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [testId, setTestId] = useState<string | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const { createTest, addQuestions, generateShareToken } = useStudentTests({ studentId, teacherId });

  useEffect(() => {
    checkWelcomeTest();
  }, [studentId, teacherId]);

  // Poll for progress when pending/in_progress
  useEffect(() => {
    if ((status === 'pending' || status === 'in_progress') && testId) {
      const interval = setInterval(fetchProgress, 10000); // every 10s
      fetchProgress();
      return () => clearInterval(interval);
    }
  }, [status, testId]);

  const checkWelcomeTest = async () => {
    try {
      const { data } = await supabase
        .from('student_tests')
        .select('id, status, share_token, total_questions, answered_count')
        .eq('student_id', studentId)
        .eq('teacher_id', teacherId)
        .eq('test_type', 'welcome')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!data || data.length === 0) {
        setStatus('no_test');
      } else {
        const test = data[0];
        setTestId(test.id);
        setTotalQuestions(test.total_questions || 0);
        setAnsweredCount((test as any).answered_count || 0);
        
        if (test.share_token) {
          setShareUrl(`${window.location.origin}/welcome-test/${test.share_token}`);
        }

        if (test.status === 'completed' || test.status === 'reviewed') {
          setStatus('completed');
        } else if (test.status === 'in_progress') {
          setStatus('in_progress');
        } else {
          setStatus('pending');
        }
      }
    } catch (err) {
      console.error('Error checking welcome test:', err);
      setStatus('no_test');
    }
  };

  const fetchProgress = useCallback(async () => {
    if (!testId) return;
    try {
      const { count } = await supabase
        .from('student_test_questions')
        .select('*', { count: 'exact', head: true })
        .eq('test_id', testId)
        .not('student_answer', 'is', null);

      if (count !== null) {
        setAnsweredCount(count);
        if (count > 0 && status === 'pending') {
          setStatus('in_progress');
        }
      }
    } catch (err) {
      // silent
    }
  }, [testId, status]);

  const handleCreateAndSend = async () => {
    setCreating(true);
    try {
      const test = await createTest({
        student_id: studentId,
        test_type: 'welcome',
        title: `Welcome Test - ${studentName}`,
        description: 'Comprehensive placement & learning profile assessment',
      });

      if (!test) throw new Error('Failed to create test');

      const questionsToAdd = ALL_WELCOME_TEST_QUESTIONS.map(q => ({
        question_type: q.question_type as any,
        question_text: q.question_text,
        question_data: (q.options ? { options: q.options } : {}) as any,
        correct_answer: (q.correct_answer || '') as any,
        explanation: q.description || undefined,
        element_type: q.element_type as any,
        difficulty_level: q.difficulty_level,
        skill_tags: q.nano_skill ? [q.nano_skill] : [],
      }));

      await addQuestions(test.id, questionsToAdd);

      const token = await generateShareToken(test.id);
      if (token) {
        const url = `${window.location.origin}/welcome-test/${token}`;
        setShareUrl(url);
        setTestId(test.id);
        setTotalQuestions(questionsToAdd.length);
        await navigator.clipboard.writeText(url);

        // Point 5: Auto-send email to student
        if (studentEmail) {
          try {
            // Get teacher name
            const { data: teacher } = await supabase
              .from('profiles')
              .select('first_name, last_name, email')
              .eq('id', teacherId)
              .single();

            const teacherName = teacher 
              ? [teacher.first_name, teacher.last_name].filter(Boolean).join(' ') || teacher.email || ''
              : '';

            await supabase.functions.invoke('send-test-email', {
              body: {
                shareToken: token,
                recipientEmail: studentEmail,
                testTitle: `Welcome Test - ${studentName}`,
                teacherName,
                testType: 'welcome',
              },
            });

            toast.success('Welcome Test created and sent to student!');
          } catch (emailErr) {
            console.error('Email send error:', emailErr);
            toast.success('Welcome Test created! Link copied. (Email send failed)');
          }
        } else {
          toast.success('Welcome Test created! Link copied to clipboard.');
        }

        setStatus('pending');
      }
    } catch (err) {
      console.error('Error creating welcome test:', err);
      toast.error('Failed to create Welcome Test');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  const handlePreview = () => {
    // Point 18: Navigate to Tests tab to preview
    navigate(`/student/${studentId}?tab=tests`);
  };

  const handleViewResults = () => {
    navigate(`/student/${studentId}?tab=tests`);
  };

  if (status === 'loading' || status === 'hidden') return null;

  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <Card className="border-primary/30 bg-primary/5 mb-6">
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            {status === 'no_test' && (
              <>
                <p className="font-medium">Send a Welcome Test to {studentName}</p>
                <p className="text-sm text-muted-foreground">
                  Understand their learning style, motivation, and actual English level with our comprehensive profiling test.
                </p>
              </>
            )}
            {status === 'pending' && (
              <>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Welcome Test sent</p>
                  <Badge variant="secondary">Waiting for student</Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{shareUrl}</p>
              </>
            )}
            {status === 'in_progress' && (
              <>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Student is taking the test</p>
                  <Badge variant="secondary">{answeredCount}/{totalQuestions} answered</Badge>
                </div>
                <Progress value={progressPercent} className="h-2 mt-2" />
              </>
            )}
            {status === 'completed' && (
              <>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Welcome Test completed!</p>
                  <Badge variant="default">Completed</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  View the learning profile and test results.
                </p>
              </>
            )}
          </div>
          <div className="flex-shrink-0 flex gap-2">
            {status === 'no_test' && (
              <>
                <Button variant="outline" size="sm" onClick={handlePreview}>
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button onClick={handleCreateAndSend} disabled={creating}>
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Welcome Test
                </Button>
              </>
            )}
            {(status === 'pending' || status === 'in_progress') && (
              <>
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy Link
                </Button>
                <Button variant="outline" size="sm" onClick={handlePreview}>
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
              </>
            )}
            {status === 'completed' && (
              <Button onClick={handleViewResults}>
                <BarChart3 className="h-4 w-4 mr-2" />
                View Results
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
