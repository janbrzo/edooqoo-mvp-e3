/**
 * StudentTestPage - Page for students to take tests via share link
 * Similar to HomeworkPage but for tests
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, AlertCircle, Loader2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useStudentTestSession } from '@/hooks/useStudentTests';
import { toast } from 'sonner';
import type { TestQuestion, MultipleChoiceData } from '@/types/studentTests';

export default function StudentTestPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const {
    test,
    questions,
    loading,
    error,
    currentIndex,
    setCurrentIndex,
    submitAnswer,
    completeTest,
    progress,
  } = useStudentTestSession(token || null);

  const [currentAnswer, setCurrentAnswer] = useState<string | string[] | boolean | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState<{ correct: number; total: number } | null>(null);

  const currentQuestion = questions[currentIndex] || null;

  // Reset answer when question changes
  useEffect(() => {
    setCurrentAnswer(currentQuestion?.student_answer as any || null);
    setStartTime(Date.now());
  }, [currentIndex, currentQuestion]);

  const handleAnswerChange = (value: string | boolean) => {
    setCurrentAnswer(value);
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || currentAnswer === null) return;

    setSubmitting(true);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    
    const success = await submitAnswer(currentQuestion.id, currentAnswer, timeSpent);
    
    if (success) {
      // Auto-advance to next question
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    } else {
      toast.error('Failed to save answer');
    }
    
    setSubmitting(false);
  };

  const handleCompleteTest = async () => {
    setSubmitting(true);
    const success = await completeTest();
    
    if (success) {
      // Calculate results
      const correct = questions.filter(q => q.is_correct === true).length;
      setResults({ correct, total: questions.length });
      setCompleted(true);
      toast.success('Test completed!');
    } else {
      toast.error('Failed to complete test');
    }
    
    setSubmitting(false);
  };

  const allAnswered = questions.every(q => q.student_answer !== null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading test...</p>
        </div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Test Not Available</h2>
            <p className="text-muted-foreground">
              {error || 'This test link may have expired or is invalid.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (completed && results) {
    const percentage = Math.round((results.correct / results.total) * 100);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <Trophy className="h-16 w-16 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl">Test Completed!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">{percentage}%</div>
              <p className="text-muted-foreground">
                You got {results.correct} out of {results.total} questions correct
              </p>
            </div>

            <Progress value={percentage} className="h-3" />

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{results.correct}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{results.total - results.correct}</div>
                <div className="text-sm text-muted-foreground">Incorrect</div>
              </div>
            </div>

            <p className="text-center text-muted-foreground text-sm">
              Your teacher will review your results and may provide feedback.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{test.title}</h1>
          <p className="text-muted-foreground">{test.description}</p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <Badge variant="secondary">
              {Math.round(progress)}% complete
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Question */}
        {currentQuestion && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="outline">{currentQuestion.question_type.replace('_', ' ')}</Badge>
                {currentQuestion.element_type && (
                  <Badge variant="secondary">{currentQuestion.element_type}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg">{currentQuestion.question_text}</p>

              {/* Render answer input based on question type */}
              {renderAnswerInput(currentQuestion, currentAnswer, handleAnswerChange)}

              {/* Answer status */}
              {currentQuestion.student_answer !== null && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Answer saved</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentAnswer !== null && currentAnswer !== currentQuestion?.student_answer && (
              <Button onClick={handleSubmitAnswer} disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save Answer'
                )}
              </Button>
            )}
          </div>

          {currentIndex < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentIndex(currentIndex + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleCompleteTest}
              disabled={!allAnswered || submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Test
                </>
              )}
            </Button>
          )}
        </div>

        {/* Question dots navigation */}
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                idx === currentIndex
                  ? 'bg-primary text-primary-foreground'
                  : q.student_answer !== null
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper function to render answer input based on question type
function renderAnswerInput(
  question: TestQuestion,
  currentAnswer: string | string[] | boolean | null,
  onAnswerChange: (value: string | boolean) => void
) {
  switch (question.question_type) {
    case 'multiple_choice':
      const mcData = question.question_data as MultipleChoiceData;
      return (
        <RadioGroup
          value={currentAnswer as string || ''}
          onValueChange={onAnswerChange}
        >
          {mcData?.options?.map((option, idx) => (
            <div key={idx} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value={option} id={`option-${idx}`} />
              <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );

    case 'true_false':
      return (
        <RadioGroup
          value={currentAnswer?.toString() || ''}
          onValueChange={(val) => onAnswerChange(val === 'true')}
        >
          <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="true" id="true" />
            <Label htmlFor="true" className="flex-1 cursor-pointer">True</Label>
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="false" id="false" />
            <Label htmlFor="false" className="flex-1 cursor-pointer">False</Label>
          </div>
        </RadioGroup>
      );

    case 'fill_blank':
      return (
        <Input
          value={currentAnswer as string || ''}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Type your answer..."
          className="text-lg"
        />
      );

    case 'open_ended':
      return (
        <textarea
          value={currentAnswer as string || ''}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Write your answer..."
          className="w-full min-h-[120px] p-3 rounded-lg border resize-none"
        />
      );

    default:
      return (
        <Input
          value={currentAnswer as string || ''}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Type your answer..."
        />
      );
  }
}
