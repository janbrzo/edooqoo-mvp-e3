/**
 * TestDetailsView - Detailed view of a test with questions and results
 * Used by teachers to review tests and apply results to Progress
 */

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Share2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Target,
  TrendingUp,
  Loader2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useStudentTests } from '@/hooks/useStudentTests';
import { toast } from 'sonner';
import { ShareTestModal } from './ShareTestModal';
import { supabase } from '@/integrations/supabase/client';
import { 
  TEST_STATUS_CONFIG, 
  TEST_TYPES, 
  ELEMENT_TYPES,
  type StudentTest, 
  type TestQuestion,
  type TestSkillResult 
} from '@/types/studentTests';

interface TestDetailsViewProps {
  testId: string;
  teacherId: string;
  studentId: string;
  onBack: () => void;
}

export function TestDetailsView({ testId, teacherId, studentId, onBack }: TestDetailsViewProps) {
  const { fetchTestWithQuestions, generateShareToken, applyResultsToProgress, calculateResults } = 
    useStudentTests({ studentId, teacherId });
  
  const [test, setTest] = useState<StudentTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [studentEmail, setStudentEmail] = useState<string>('');
  const [teacherName, setTeacherName] = useState<string>('');

  useEffect(() => {
    loadTest();
    loadStudentAndTeacherInfo();
  }, [testId]);

  const loadTest = async () => {
    setLoading(true);
    const data = await fetchTestWithQuestions(testId);
    setTest(data);
    setLoading(false);
  };

  // Load student email and teacher name for ShareTestModal
  const loadStudentAndTeacherInfo = async () => {
    try {
      // Get student email
      const { data: student } = await supabase
        .from('students')
        .select('student_email')
        .eq('id', studentId)
        .single();
      
      if (student?.student_email) {
        setStudentEmail(student.student_email);
      }
      
      // Get teacher name
      const { data: teacher } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', teacherId)
        .single();
      
      if (teacher) {
        const name = [teacher.first_name, teacher.last_name].filter(Boolean).join(' ');
        setTeacherName(name || teacher.email || '');
      }
    } catch (error) {
      console.error('Error loading student/teacher info:', error);
    }
  };

  const handleGenerateShareLink = async () => {
    setSharingLoading(true);
    const token = await generateShareToken(testId);
    if (token) {
      const url = `${window.location.origin}/test/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Share link copied to clipboard!');
      loadTest(); // Refresh to get updated status
    }
    setSharingLoading(false);
  };

  const handleApplyResults = async () => {
    if (!test?.skill_results) return;
    
    const success = await applyResultsToProgress(testId, test.skill_results);
    if (success) {
      loadTest();
    }
  };

  const handleCalculateResults = async () => {
    const success = await calculateResults(testId);
    if (success) {
      loadTest();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Test not found</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tests
        </Button>
      </div>
    );
  }

  const statusConfig = TEST_STATUS_CONFIG[test.status];
  const testTypeInfo = TEST_TYPES.find(t => t.value === test.test_type);
  const questions = test.questions || [];
  const answeredQuestions = questions.filter(q => q.student_answer !== null);
  const correctQuestions = questions.filter(q => q.is_correct === true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tests
        </Button>
        <div className="flex items-center gap-2">
          {test.status === 'draft' && !test.share_token && (
            <Button onClick={handleGenerateShareLink} disabled={sharingLoading}>
              {sharingLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Generate Share Link
                </>
              )}
            </Button>
          )}
          {test.share_token && (
            <Button 
              variant="default"
              onClick={() => setShareModalOpen(true)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Test
            </Button>
          )}
        </div>
      </div>

      {/* Share Test Modal */}
      <ShareTestModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        shareToken={test.share_token}
        testTitle={test.title}
        studentEmail={studentEmail}
        teacherName={teacherName}
      />

      {/* Test Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{test.title}</CardTitle>
              <p className="text-muted-foreground">{test.description}</p>
            </div>
            <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold">{questions.length}</div>
              <div className="text-sm text-muted-foreground">Questions</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold">{answeredQuestions.length}</div>
              <div className="text-sm text-muted-foreground">Answered</div>
            </div>
            {test.score_percentage !== null && (
              <>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(test.score_percentage)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Score</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold">
                    {correctQuestions.length}/{questions.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Correct</div>
                </div>
              </>
            )}
          </div>

          {/* Score progress bar */}
          {test.score_percentage !== null && (
            <div className="mt-4">
              <Progress value={test.score_percentage} className="h-3" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions for completed tests */}
      {test.status === 'completed' && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Apply Results to Progress</p>
                  <p className="text-sm text-muted-foreground">
                    Update student's skill ratings based on test performance
                  </p>
                </div>
              </div>
              <Button onClick={handleApplyResults}>
                Apply to Progress
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* In-progress test - calculate results button */}
      {test.status === 'in_progress' && answeredQuestions.length === questions.length && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium">All Questions Answered</p>
                  <p className="text-sm text-muted-foreground">
                    Calculate final results and mark test as completed
                  </p>
                </div>
              </div>
              <Button onClick={handleCalculateResults}>
                Calculate Results
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skill Results */}
      {test.skill_results && test.skill_results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Results by Skill
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {test.skill_results.map((result) => {
                const elementLabel = ELEMENT_TYPES.find(e => e.value === result.element_type)?.label;
                const scorePercent = result.score_percentage || 0;
                
                return (
                  <div key={result.id} className="flex items-center gap-4">
                    <div className="w-32">
                      <Badge variant="outline">{elementLabel || result.element_type}</Badge>
                    </div>
                    <div className="flex-1">
                      <Progress value={scorePercent} className="h-2" />
                    </div>
                    <div className="w-24 text-right">
                      <span className="font-medium">{Math.round(scorePercent)}%</span>
                      <span className="text-muted-foreground text-sm ml-2">
                        ({result.correct_answers}/{result.total_questions})
                      </span>
                    </div>
                    {result.applied_at && (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Applied
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {questions.map((question, index) => (
              <QuestionCard key={question.id} question={question} index={index} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuestionCard({ question, index }: { question: TestQuestion; index: number }) {
  const hasAnswer = question.student_answer !== null;
  
  return (
    <div className={`p-4 rounded-lg border ${
      question.is_correct === true 
        ? 'border-green-200 bg-green-50/50 dark:bg-green-900/10' 
        : question.is_correct === false
        ? 'border-red-200 bg-red-50/50 dark:bg-red-900/10'
        : 'bg-muted/30'
    }`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
          {index + 1}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {question.question_type.replace('_', ' ')}
            </Badge>
            {question.element_type && (
              <Badge variant="secondary" className="text-xs">
                {question.element_type}
              </Badge>
            )}
            {question.is_correct !== null && (
              question.is_correct ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )
            )}
          </div>
          <p className="mb-2">{question.question_text}</p>
          
          {hasAnswer && (
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Student's answer:</span>
                <span className={question.is_correct ? 'text-green-600 font-medium' : 'text-red-600'}>
                  {formatAnswer(question.student_answer)}
                </span>
              </div>
              {!question.is_correct && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Correct answer:</span>
                  <span className="text-green-600 font-medium">
                    {formatAnswer(question.correct_answer)}
                  </span>
                </div>
              )}
              {question.explanation && (
                <p className="text-muted-foreground italic mt-2">
                  {question.explanation}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatAnswer(answer: any): string {
  if (typeof answer === 'boolean') {
    return answer ? 'True' : 'False';
  }
  if (Array.isArray(answer)) {
    return answer.join(', ');
  }
  if (typeof answer === 'object') {
    return JSON.stringify(answer);
  }
  return String(answer);
}
