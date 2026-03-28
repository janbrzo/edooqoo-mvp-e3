/**
 * Student Tests Tab - Main component for viewing and managing tests
 * Round 8: Removed Create AI-Powered Test - only Welcome Test remains
 */

import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Loader2, Eye, Sparkles, BookOpen, ExternalLink, BarChart3, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStudentTests } from '@/hooks/useStudentTests';
import { TEST_STATUS_CONFIG } from '@/types/studentTests';
import type { StudentTest } from '@/types/studentTests';
import { TestDetailsView } from './TestDetailsView';
import { ALL_WELCOME_TEST_QUESTIONS, WELCOME_TEST_SECTIONS_WITH_QUESTIONS } from '@/data/welcomeTestQuestions';

interface StudentTestsTabProps {
  studentId: string;
  teacherId: string;
  studentName?: string;
}

export function StudentTestsTab({ studentId, teacherId, studentName }: StudentTestsTabProps) {
  const { tests, loading, getTestStats, refetch, createTest, addQuestions, generateShareToken } = useStudentTests({ studentId, teacherId });
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [showWelcomePreview, setShowWelcomePreview] = useState(false);
  const [creatingPreview, setCreatingPreview] = useState(false);
  const stats = getTestStats();

  const welcomeTest = useMemo(() => tests.find(t => t.test_type === 'welcome'), [tests]);
  const hasWelcomeTest = !!welcomeTest;

  // FIX 2.2: Create draft test + share token and open preview in new tab
  const handlePreviewTest = async () => {
    setCreatingPreview(true);
    try {
      let testToPreview = welcomeTest;
      if (!testToPreview) {
        // Create draft test
        const { data: student } = await supabase
          .from('students')
          .select('name')
          .eq('id', studentId)
          .maybeSingle();

        testToPreview = await createTest({
          student_id: studentId,
          test_type: 'welcome',
          title: `Welcome Test - ${student?.name || studentName || 'Student'}`,
          description: 'Comprehensive placement & learning profile assessment',
        });

        if (testToPreview) {
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
          await addQuestions(testToPreview.id, questionsToAdd);
          refetch();
        }
      }
      
      if (testToPreview) {
        let token = testToPreview.share_token;
        if (!token) {
          token = await generateShareToken(testToPreview.id);
          refetch();
        }
        if (token) {
          window.open(`${window.location.origin}/welcome-test/${token}`, '_blank');
        }
      }
    } catch (err) {
      console.error('Error creating preview:', err);
    } finally {
      setCreatingPreview(false);
    }
  };

  const sortedTests = [...tests].sort((a, b) => {
    if (a.test_type === 'welcome' && b.test_type !== 'welcome') return -1;
    if (a.test_type !== 'welcome' && b.test_type === 'welcome') return 1;
    return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading tests...</span>
      </div>
    );
  }

  if (selectedTestId) {
    return (
      <TestDetailsView
        testId={selectedTestId}
        teacherId={teacherId}
        studentId={studentId}
        onBack={() => {
          setSelectedTestId(null);
          refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Tests</h2>
        <p className="text-muted-foreground">
          {stats.total} tests • {stats.completed} completed
        </p>
      </div>

      {/* Welcome Test Placeholder - always visible if no welcome test exists */}
      {!hasWelcomeTest && (
        <Card className="border-primary/30 border-dashed">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Welcome Test</h3>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive placement & learning profile • {ALL_WELCOME_TEST_QUESTIONS.length} questions
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Not sent yet</Badge>
                <Button variant="ghost" size="sm" onClick={handlePreviewTest} disabled={creatingPreview} title="Preview test in student view">
                  {creatingPreview ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowWelcomePreview(!showWelcomePreview)} title="Show question list">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {showWelcomePreview && (
              <div className="mt-4 border-t pt-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground">Preview: {WELCOME_TEST_SECTIONS_WITH_QUESTIONS.length} sections</p>
                {WELCOME_TEST_SECTIONS_WITH_QUESTIONS.map((section) => (
                  <div key={section.id} className="space-y-1">
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-primary" />
                      {section.title} ({section.questions.length} questions)
                    </p>
                    <div className="pl-5 space-y-0.5">
                      {section.questions.slice(0, 3).map((q, i) => (
                        <p key={q.id} className="text-xs text-muted-foreground truncate">
                          {i + 1}. {q.question_text.split('\n')[0]}
                        </p>
                      ))}
                      {section.questions.length > 3 && (
                        <p className="text-xs text-muted-foreground italic">
                          +{section.questions.length - 3} more questions
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Existing Welcome Test - show Results & Preview buttons */}
      {welcomeTest && (
        <Card className="border-primary/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedTestId(welcomeTest.id)}>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{welcomeTest.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Welcome Test • {welcomeTest.total_questions || ALL_WELCOME_TEST_QUESTIONS.length} questions
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {welcomeTest.score_percentage !== null && (
                  <div className="text-right mr-2">
                    <div className="text-lg font-bold">{welcomeTest.answered_count || 0}/{welcomeTest.total_questions}</div>
                    <div className="text-xs text-muted-foreground">answered</div>
                  </div>
                )}
                <Badge className={`${TEST_STATUS_CONFIG[welcomeTest.status]?.bgColor} ${TEST_STATUS_CONFIG[welcomeTest.status]?.color}`}>
                  {TEST_STATUS_CONFIG[welcomeTest.status]?.label}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => setSelectedTestId(welcomeTest.id)}>
                  <BarChart3 className="h-4 w-4 mr-1.5" />
                  View Results
                </Button>
                <Button variant="outline" size="sm" onClick={handlePreviewTest} disabled={creatingPreview}>
                  {creatingPreview ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-1.5" />}
                  Preview Test
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tests list (non-welcome) */}
      {sortedTests.filter(t => t.test_type !== 'welcome').length === 0 && !hasWelcomeTest ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tests yet</h3>
            <p className="text-muted-foreground">
              Send the Welcome Test to this student to get started with placement & profiling.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedTests.filter(t => t.test_type !== 'welcome').map((test) => (
            <TestCard 
              key={test.id} 
              test={test} 
              onClick={() => setSelectedTestId(test.id)}
            />
          ))}
        </div>
      )}

      {/* Info about Welcome Test */}
      <Card className="bg-muted/30 border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Welcome Test
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• <strong>Comprehensive Placement</strong> - estimates CEFR level from grammar, vocabulary, reading & writing tasks</p>
          <p>• <strong>Learning Profile</strong> - discovers motivation, anxiety, learning style & preferences</p>
          <p>• <strong>AI Analysis</strong> - generates teaching recommendations from open-ended answers</p>
        </CardContent>
      </Card>
    </div>
  );
}

interface TestCardProps {
  test: StudentTest;
  onClick: () => void;
}

function TestCard({ test, onClick }: TestCardProps) {
  const statusConfig = TEST_STATUS_CONFIG[test.status];
  const isWelcome = test.test_type === 'welcome';

  return (
    <Card 
      className={`hover:shadow-md transition-shadow cursor-pointer ${isWelcome ? 'border-primary/30' : ''}`}
      onClick={onClick}
    >
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {isWelcome ? <Sparkles className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-semibold">{test.title}</h3>
              <p className="text-sm text-muted-foreground">
                {isWelcome ? 'Welcome Test' : test.test_type} • {test.total_questions || 0} questions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {test.score_percentage !== null && (
              <div className="text-right">
                {isWelcome ? (
                  <>
                    <div className="text-lg font-bold">{test.answered_count || test.correct_answers || 0}/{test.total_questions}</div>
                    <div className="text-xs text-muted-foreground">answered</div>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{test.score_percentage.toFixed(0)}%</div>
                    <div className="text-xs text-muted-foreground">
                      {test.correct_answers}/{test.total_questions} correct
                    </div>
                  </>
                )}
              </div>
            )}
            <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.label}
            </Badge>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
