/**
 * WelcomeTestPage - Student-facing page for taking the Welcome Test
 * Conversational, section-based layout with progress tracking
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, CheckCircle, Loader2, Sparkles,
  User, BookOpen, MessageSquare, PenTool, MessageCircle, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useWelcomeTest } from '@/hooks/useWelcomeTest';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { WelcomeTestQuestionDef } from '@/types/welcomeTest';

const SECTION_ICONS: Record<string, React.ReactNode> = {
  'User': <User className="h-5 w-5" />,
  'BookOpen': <BookOpen className="h-5 w-5" />,
  'MessageSquare': <MessageSquare className="h-5 w-5" />,
  'PenTool': <PenTool className="h-5 w-5" />,
  'MessageCircle': <MessageCircle className="h-5 w-5" />,
  'Target': <Target className="h-5 w-5" />,
};

export default function WelcomeTestPage() {
  const { token } = useParams<{ token: string }>();
  const {
    loading, error, title, answers, sections, currentSection,
    currentQuestion, globalQuestionIndex, totalQuestions, answeredCount,
    progress, isLastQuestion, canComplete, completed, submitting,
    currentSectionIndex, currentQuestionIndex,
    saveAnswer, goToNext, goToPrevious, goToSection, completeTest,
    testId,
  } = useWelcomeTest({ shareToken: token || null });

  // Email verification
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [isTeacher, setIsTeacher] = useState(false);

  // Check localStorage
  useEffect(() => {
    if (!token) return;
    const stored = localStorage.getItem(`wt_email_${token}`);
    if (stored) {
      try {
        const { email, expiresAt } = JSON.parse(stored);
        if (new Date(expiresAt) > new Date()) {
          setVerifiedEmail(email);
        } else {
          localStorage.removeItem(`wt_email_${token}`);
        }
      } catch { localStorage.removeItem(`wt_email_${token}`); }
    }
  }, [token]);

  // Check if teacher
  useEffect(() => {
    if (!testId) return;
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsTeacher(true);
        setVerifiedEmail('teacher');
      }
    };
    check();
  }, [testId]);

  const handleVerifyEmail = () => {
    if (!emailInput.trim()) { toast.error('Please enter your email'); return; }
    const email = emailInput.trim().toLowerCase();
    if (token) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      localStorage.setItem(`wt_email_${token}`, JSON.stringify({ email, expiresAt: expiresAt.toISOString() }));
    }
    setVerifiedEmail(email);
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your Welcome Test...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Test Not Available</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Email verification
  if (!verifiedEmail && !isTeacher) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Sparkles className="h-10 w-10 text-primary mx-auto mb-2" />
            <CardTitle className="text-xl">Welcome Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Enter your email to start. This helps your teacher track your results.
            </p>
            <Input
              type="email"
              placeholder="your.email@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyEmail()}
            />
            <Button onClick={handleVerifyEmail} className="w-full" disabled={!emailInput.trim()}>
              Start Welcome Test
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Completed
  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl">Welcome Test Completed!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Thank you for completing the Welcome Test! Your teacher will review your results
              and use them to personalize your learning experience.
            </p>
            <div className="p-4 bg-primary/5 rounded-lg">
              <div className="text-3xl font-bold text-primary">{answeredCount}/{totalQuestions}</div>
              <p className="text-sm text-muted-foreground">Questions answered</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentSection || !currentQuestion) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">{title}</h1>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Question {globalQuestionIndex + 1} of {totalQuestions}
            </span>
            <Badge variant="secondary">{progress}% complete</Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {sections.map((section, idx) => {
            const sectionAnswered = section.questions.filter(q => answers[q.id] !== undefined).length;
            const sectionTotal = section.questions.length;
            const isActive = idx === currentSectionIndex;
            const isDone = sectionAnswered === sectionTotal;

            return (
              <button
                key={section.id}
                onClick={() => goToSection(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isDone
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {isDone && <CheckCircle className="h-3 w-3" />}
                {section.title}
                <span className="opacity-60">{sectionAnswered}/{sectionTotal}</span>
              </button>
            );
          })}
        </div>

        {/* Section header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            {SECTION_ICONS[currentSection.icon]}
            <h2 className="text-lg font-semibold">{currentSection.title}</h2>
          </div>
          <p className="text-sm text-muted-foreground">{currentSection.subtitle}</p>
        </div>

        {/* Question */}
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-6">
            <div>
              <p className="text-base font-medium whitespace-pre-line">{currentQuestion.question_text}</p>
              {currentQuestion.description && (
                <p className="text-sm text-muted-foreground mt-1">{currentQuestion.description}</p>
              )}
            </div>

            <QuestionInput
              question={currentQuestion}
              answer={answers[currentQuestion.id]}
              onAnswer={(val) => saveAnswer(currentQuestion.id, val)}
            />

            {answers[currentQuestion.id] !== undefined && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Answer saved</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={goToPrevious} disabled={globalQuestionIndex === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={completeTest}
              disabled={!canComplete || submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Complete Test
            </Button>
          ) : (
            <Button onClick={goToNext}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Question dots for current section */}
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {currentSection.questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => {
                // Navigate within section
                goToSection(currentSectionIndex);
                // Small hack - set question index via goToSection + sequential goToNext
                // Instead, we expose a way to navigate directly
              }}
              className={`w-7 h-7 rounded-full text-xs font-medium transition-colors ${
                idx === currentQuestionIndex
                  ? 'bg-primary text-primary-foreground'
                  : answers[q.id] !== undefined
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

// =====================================================
// Question Input Renderer
// =====================================================

function QuestionInput({
  question,
  answer,
  onAnswer,
}: {
  question: WelcomeTestQuestionDef;
  answer: unknown;
  onAnswer: (val: unknown) => void;
}) {
  switch (question.question_type) {
    case 'self_assessment':
    case 'scenario_reaction':
    case 'multiple_choice':
      return (
        <RadioGroup
          value={(answer as string) || ''}
          onValueChange={onAnswer}
        >
          {question.options?.map((option, idx) => (
            <div key={idx} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value={option} id={`opt-${question.id}-${idx}`} />
              <Label htmlFor={`opt-${question.id}-${idx}`} className="flex-1 cursor-pointer text-sm">
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );

    case 'preference_choice':
      if (question.multi_select) {
        const selected = (answer as string[]) || [];
        return (
          <div className="space-y-2">
            {question.options?.map((option, idx) => {
              const isChecked = selected.includes(option);
              const atMax = question.max_selections ? selected.length >= question.max_selections : false;
              return (
                <div key={idx} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <Checkbox
                    id={`pref-${question.id}-${idx}`}
                    checked={isChecked}
                    disabled={!isChecked && atMax}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onAnswer([...selected, option]);
                      } else {
                        onAnswer(selected.filter(s => s !== option));
                      }
                    }}
                  />
                  <Label htmlFor={`pref-${question.id}-${idx}`} className="flex-1 cursor-pointer text-sm">
                    {option}
                  </Label>
                </div>
              );
            })}
            {question.max_selections && (
              <p className="text-xs text-muted-foreground">Select up to {question.max_selections}</p>
            )}
          </div>
        );
      }
      // Single select preference = radio
      return (
        <RadioGroup value={(answer as string) || ''} onValueChange={onAnswer}>
          {question.options?.map((option, idx) => (
            <div key={idx} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value={option} id={`pref-${question.id}-${idx}`} />
              <Label htmlFor={`pref-${question.id}-${idx}`} className="flex-1 cursor-pointer text-sm">
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );

    case 'fill_blank':
      return (
        <Input
          value={(answer as string) || ''}
          onChange={(e) => onAnswer(e.target.value)}
          onBlur={() => { if (answer) onAnswer(answer); }} // trigger save on blur
          placeholder="Type your answer..."
          className="text-base"
        />
      );

    case 'open_ended':
    case 'open_reflection':
      return (
        <Textarea
          value={(answer as string) || ''}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder={question.question_type === 'open_reflection' ? 'Share your thoughts...' : 'Write your answer...'}
          className="min-h-[120px] text-sm"
        />
      );

    case 'self_assessment_matrix':
      const matrixAnswers = (answer as Record<string, number>) || {};
      return (
        <div className="space-y-4">
          {question.matrix_items?.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm">{item}</span>
                <span className="text-xs text-muted-foreground font-medium">
                  {matrixAnswers[item] || '—'}
                </span>
              </div>
              <div className="flex gap-2">
                {Array.from({ length: (question.matrix_scale?.max || 5) - (question.matrix_scale?.min || 1) + 1 }, (_, i) => {
                  const val = (question.matrix_scale?.min || 1) + i;
                  const isSelected = matrixAnswers[item] === val;
                  return (
                    <button
                      key={val}
                      onClick={() => onAnswer({ ...matrixAnswers, [item]: val })}
                      className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                      }`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
              {question.matrix_scale?.labels && (
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{question.matrix_scale.labels[question.matrix_scale.min]}</span>
                  <span>{question.matrix_scale.labels[question.matrix_scale.max]}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      );

    default:
      return (
        <Input
          value={(answer as string) || ''}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder="Type your answer..."
        />
      );
  }
}
