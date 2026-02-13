/**
 * WelcomeTestSuggestion - Banner suggesting teacher to send Welcome Test to new student
 * Shows on StudentPage overview tab when no Welcome Test has been completed
 */

import { useState, useEffect } from 'react';
import { Sparkles, Send, Loader2, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useStudentTests } from '@/hooks/useStudentTests';
import { ALL_WELCOME_TEST_QUESTIONS } from '@/data/welcomeTestQuestions';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface WelcomeTestSuggestionProps {
  studentId: string;
  teacherId: string;
  studentName: string;
  studentEmail?: string | null;
}

export function WelcomeTestSuggestion({ studentId, teacherId, studentName, studentEmail }: WelcomeTestSuggestionProps) {
  const [status, setStatus] = useState<'loading' | 'no_test' | 'pending' | 'completed' | 'hidden'>('loading');
  const [creating, setCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const { createTest, addQuestions, generateShareToken } = useStudentTests({ studentId, teacherId });

  useEffect(() => {
    checkWelcomeTest();
  }, [studentId, teacherId]);

  const checkWelcomeTest = async () => {
    try {
      const { data } = await supabase
        .from('student_tests')
        .select('id, status, share_token')
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
        if (test.status === 'completed' || test.status === 'reviewed') {
          setStatus('completed');
        } else {
          if (test.share_token) {
            setShareUrl(`${window.location.origin}/welcome-test/${test.share_token}`);
          }
          setStatus('pending');
        }
      }
    } catch (err) {
      console.error('Error checking welcome test:', err);
      setStatus('no_test');
    }
  };

  const handleCreateAndSend = async () => {
    setCreating(true);
    try {
      // 1. Create test
      const test = await createTest({
        student_id: studentId,
        test_type: 'welcome',
        title: `Welcome Test - ${studentName}`,
        description: 'Comprehensive placement & learning profile assessment',
      });

      if (!test) throw new Error('Failed to create test');

      // 2. Add predefined questions
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

      // 3. Generate share token
      const token = await generateShareToken(test.id);
      if (token) {
        const url = `${window.location.origin}/welcome-test/${token}`;
        setShareUrl(url);
        await navigator.clipboard.writeText(url);
        toast.success('Welcome Test created! Link copied to clipboard.');
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

  if (status === 'loading' || status === 'completed' || status === 'hidden') return null;

  return (
    <Card className="border-primary/30 bg-primary/5 mb-6">
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            {status === 'no_test' ? (
              <>
                <p className="font-medium">Send a Welcome Test to {studentName}</p>
                <p className="text-sm text-muted-foreground">
                  Understand their learning style, motivation, and actual English level with our comprehensive profiling test.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Welcome Test sent</p>
                  <Badge variant="secondary">Waiting for student</Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {shareUrl}
                </p>
              </>
            )}
          </div>
          <div className="flex-shrink-0 flex gap-2">
            {status === 'no_test' ? (
              <Button onClick={handleCreateAndSend} disabled={creating}>
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Welcome Test
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy Link
                </Button>
                {shareUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Preview
                    </a>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
