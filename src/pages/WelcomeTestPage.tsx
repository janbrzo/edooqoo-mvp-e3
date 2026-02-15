/**
 * WelcomeTestPage - Student-facing page for taking the Welcome Test
 * Supports: version selection, instructions, pause/resume, skip, I-don't-know,
 * blurred email modal, confetti on completion, reduced heights,
 * speaking recording, listening comprehension, translation toggle, section celebration,
 * teacher blocking (Issue 9), mobile-first (Issue 11), blur fix (Issue 12)
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { 
  ChevronLeft, ChevronRight, CheckCircle, Loader2, Sparkles,
  User, BookOpen, MessageSquare, PenTool, MessageCircle, Target,
  SkipForward, HelpCircle, Pause, Clock, Globe, PartyPopper,
  ShieldAlert, ExternalLink, Eye
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWelcomeTest } from '@/hooks/useWelcomeTest';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { VersionSelector } from '@/components/welcome-test/VersionSelector';
import { InstructionScreen } from '@/components/welcome-test/InstructionScreen';
import { SpeakingRecorder } from '@/components/welcome-test/SpeakingRecorder';
import { ListeningPlayer } from '@/components/welcome-test/ListeningPlayer';
import { TRANSLATION_LANGUAGES, getTranslation, hasTranslation } from '@/data/welcomeTestTranslations';
import { WELCOME_TEST_SECTIONS_WITH_QUESTIONS } from '@/data/welcomeTestQuestions';
import type { WelcomeTestQuestionDef } from '@/types/welcomeTest';

const SECTION_ICONS: Record<string, React.ReactNode> = {
  'User': <User className="h-4 w-4" />,
  'BookOpen': <BookOpen className="h-4 w-4" />,
  'MessageSquare': <MessageSquare className="h-4 w-4" />,
  'PenTool': <PenTool className="h-4 w-4" />,
  'MessageCircle': <MessageCircle className="h-4 w-4" />,
  'Target': <Target className="h-4 w-4" />,
};

type Stage = 'loading' | 'error' | 'email' | 'teacher_block' | 'version' | 'instructions' | 'test' | 'paused' | 'completed' | 'section_celebration';

export default function WelcomeTestPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const {
    loading, error, title, answers, sections, currentSection,
    currentQuestion, globalQuestionIndex, totalQuestions, answeredCount,
    progress, isLastQuestion, canComplete, completed, submitting,
    currentSectionIndex, currentQuestionIndex, testVersion, paused,
    estimatedMinutesRemaining, isTeacherMode, studentNativeLanguage,
    saveAnswer, saveIdontKnow, skipQuestion, goToNext, goToPrevious,
    goToSection, goToQuestionInSection, completeTest, setTestVersion,
    pauseTest, resumeTest, flushPendingAnswer,
    testId, studentId,
  } = useWelcomeTest({ shareToken: token || null });

  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [translationLang, setTranslationLang] = useState<string | null>(null);
  const [sectionCelebration, setSectionCelebration] = useState<{ fromSection: string; nextSection: string } | null>(null);
  const [teacherPreviewMode, setTeacherPreviewMode] = useState(false);

  // Track previous section for celebration
  const prevSectionRef = useState<number>(0);

  // Window size for confetti
  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-set translation language from student profile
  useEffect(() => {
    if (studentNativeLanguage && !translationLang) {
      // Map native language name to translation language
      const langMap: Record<string, string> = {
        'Polish': 'Polish', 'polski': 'Polish', 'pl': 'Polish',
        'Spanish': 'Spanish', 'español': 'Spanish', 'es': 'Spanish',
        'German': 'German', 'Deutsch': 'German', 'de': 'German',
        'French': 'French', 'français': 'French', 'fr': 'French',
        'Portuguese': 'Portuguese', 'português': 'Portuguese', 'pt': 'Portuguese',
        'Italian': 'Italian', 'italiano': 'Italian', 'it': 'Italian',
        'Turkish': 'Turkish', 'Türkçe': 'Turkish', 'tr': 'Turkish',
        'Russian': 'Russian', 'русский': 'Russian', 'ru': 'Russian',
        'Czech': 'Czech', 'čeština': 'Czech', 'cs': 'Czech',
        'Ukrainian': 'Ukrainian', 'українська': 'Ukrainian', 'uk': 'Ukrainian',
      };
      const matched = langMap[studentNativeLanguage] || 
        TRANSLATION_LANGUAGES.find(l => l.toLowerCase() === studentNativeLanguage.toLowerCase());
      if (matched) {
        setTranslationLang(matched);
      }
    }
  }, [studentNativeLanguage]);

  // Check localStorage for email
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

  // Auto-verify teacher
  useEffect(() => {
    if (isTeacherMode && !verifiedEmail) {
      setVerifiedEmail('teacher');
    }
  }, [isTeacherMode]);

  // Trigger confetti on completion
  useEffect(() => {
    if (completed) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [completed]);

  // Section celebration detection
  useEffect(() => {
    if (currentSectionIndex > prevSectionRef[0] && currentSectionIndex > 0 && !completed && testVersion) {
      const prevSection = sections[prevSectionRef[0]];
      const nextSection = sections[currentSectionIndex];
      if (prevSection && nextSection) {
        setSectionCelebration({
          fromSection: prevSection.title,
          nextSection: nextSection.title,
        });
        setTimeout(() => setSectionCelebration(null), 3000);
      }
    }
    prevSectionRef[0] = currentSectionIndex;
  }, [currentSectionIndex, sections, completed, testVersion]);

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

  // Determine stage
  const getStage = (): Stage => {
    if (loading) return 'loading';
    if (error) return 'error';
    if (isTeacherMode && !teacherPreviewMode) return 'teacher_block';
    if (!verifiedEmail && !isTeacherMode) return 'email';
    if (completed) return 'completed';
    if (paused) return 'paused';
    if (!testVersion) return 'version';
    if (showInstructions) return 'instructions';
    if (sectionCelebration) return 'section_celebration';
    return 'test';
  };

  // Check if instructions were shown before (resume flow)
  useEffect(() => {
    if (testVersion && !completed && !paused) {
      const instructionsSeen = localStorage.getItem(`wt_instructions_seen_${token}`);
      if (instructionsSeen) {
        setShowInstructions(false);
      } else if (Object.keys(answers).length === 0) {
        setShowInstructions(true);
      }
    }
  }, [testVersion, token, completed, paused, answers]);

  const handleStartTest = () => {
    if (token) {
      localStorage.setItem(`wt_instructions_seen_${token}`, 'true');
    }
    setShowInstructions(false);
  };

  // Translation data for current question
  const currentTranslation = useMemo(() => {
    if (!translationLang || !currentQuestion) return null;
    return getTranslation(currentQuestion.id, translationLang);
  }, [translationLang, currentQuestion]);

  const stage = getStage();

  // ===== LOADING =====
  if (stage === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading your Welcome Test...</p>
        </div>
      </div>
    );
  }

  // ===== ERROR =====
  if (stage === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <Card className="max-w-md">
          <CardContent className="py-6 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-2">Test Not Available</h2>
            <p className="text-muted-foreground text-sm">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== TEACHER BLOCK (Issue 9) =====
  if (stage === 'teacher_block') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center pb-3">
            <ShieldAlert className="h-10 w-10 text-primary mx-auto mb-2" />
            <CardTitle className="text-lg">Teacher Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              This is the student's test link. As a teacher, you cannot answer the test to avoid polluting the student's data.
            </p>
            <p className="text-sm text-muted-foreground">
              To view the student's answers, go to <strong>Student Profile → Tests tab</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {studentId && (
                <Button onClick={() => navigate(`/student/${studentId}?tab=tests`)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Go to Student Results
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => {
                  setTeacherPreviewMode(true);
                  setVerifiedEmail('teacher_preview');
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Test (Read-only)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== EMAIL (blurred background with real test content) =====
  if (stage === 'email') {
    const previewQuestions = WELCOME_TEST_SECTIONS_WITH_QUESTIONS[0]?.questions.slice(0, 2) || [];
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Blurred real test content behind modal */}
        <div className="absolute inset-0 filter blur-lg opacity-30 pointer-events-none overflow-hidden scale-105">
          <div className="max-w-2xl mx-auto p-4 mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">Welcome Test</span>
            </div>
            <div className="space-y-4">
              {previewQuestions.map((q, qi) => (
                <Card key={qi} className="p-4">
                  <p className="text-sm font-medium mb-3">{q.question_text.split('\n')[0]}</p>
                  <div className="space-y-2">
                    {(q.options || []).slice(0, 4).map((opt, i) => (
                      <div key={i} className="p-2.5 rounded-lg border text-sm text-muted-foreground">{opt}</div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
        {/* Modal overlay */}
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-xl">
            <CardHeader className="text-center pb-3">
              <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Welcome Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Enter your email to start. This helps your teacher track your results.
              </p>
              <Input
                type="email"
                placeholder="your.email@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyEmail()}
                className="text-base"
              />
              <Button onClick={handleVerifyEmail} className="w-full" disabled={!emailInput.trim()}>
                Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ===== COMPLETED (with confetti) =====
  if (stage === 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        {showConfetti && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={300}
            gravity={0.2}
          />
        )}
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center pb-3">
            <Sparkles className="h-14 w-14 text-primary mx-auto mb-3" />
            <CardTitle className="text-xl">Welcome Test Completed!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-center">
            <p className="text-muted-foreground text-sm">
              Thank you for completing the Welcome Test! Your teacher will review your results
              and use them to personalize your learning experience.
            </p>
            <div className="p-3 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">{answeredCount}/{totalQuestions}</div>
              <p className="text-xs text-muted-foreground">Questions answered</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== PAUSED =====
  if (stage === 'paused') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center space-y-4">
            <Pause className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-semibold">Test Paused</h2>
            <p className="text-sm text-muted-foreground">
              Your progress is saved ({answeredCount}/{totalQuestions} answered). 
              You can close this page and come back anytime.
            </p>
            <Button onClick={resumeTest} size="lg" className="min-h-[48px]">
              Resume Test
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== VERSION SELECTOR =====
  if (stage === 'version') {
    return <VersionSelector onSelect={setTestVersion} />;
  }

  // ===== INSTRUCTIONS =====
  if (stage === 'instructions') {
    return (
      <InstructionScreen
        version={testVersion!}
        totalQuestions={totalQuestions}
        onStart={handleStartTest}
      />
    );
  }

  // ===== SECTION CELEBRATION =====
  if (stage === 'section_celebration' && sectionCelebration) {
    const remainingSections = sections.length - currentSectionIndex;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <div className="text-center space-y-4 animate-in fade-in zoom-in duration-500">
          <PartyPopper className="h-16 w-16 text-primary mx-auto animate-bounce" />
          <h2 className="text-xl font-bold">Great job! 🎉</h2>
          <p className="text-sm text-muted-foreground">
            You completed <strong>{sectionCelebration.fromSection}</strong>!
          </p>
          <p className="text-xs text-muted-foreground">
            {remainingSections} more {remainingSections === 1 ? 'section' : 'sections'} to go → <strong>{sectionCelebration.nextSection}</strong>
          </p>
          <Button onClick={() => setSectionCelebration(null)} size="sm" className="mt-2">
            Continue
          </Button>
        </div>
      </div>
    );
  }

  // ===== MAIN TEST =====
  if (!currentSection || !currentQuestion) return null;

  const isSkillQuestion = !!currentQuestion.correct_answer;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 px-3 sm:px-4 py-3">
      <div className="max-w-2xl mx-auto">
        {/* Teacher preview banner */}
        {teacherPreviewMode && (
          <div className="mb-3 p-2 bg-primary/10 rounded-lg text-center text-xs text-primary font-medium">
            👁 Teacher Preview Mode — answers are not saved
          </div>
        )}

        {/* Header - compact, mobile-friendly */}
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center justify-between mb-1 gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm font-medium truncate">{title}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-xs text-muted-foreground items-center gap-1 hidden sm:flex">
                <Clock className="h-3 w-3" />
                ~{estimatedMinutesRemaining} min
              </span>
              {/* Translation toggle */}
              <Select value={translationLang || 'none'} onValueChange={(v) => setTranslationLang(v === 'none' ? null : v)}>
                <SelectTrigger className="h-7 gap-1 px-2 text-xs border rounded-md w-auto min-w-0">
                  <Globe className={`h-3.5 w-3.5 flex-shrink-0 ${translationLang ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="hidden sm:inline truncate max-w-[60px]">{translationLang || 'Translate'}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">English only</SelectItem>
                  {TRANSLATION_LANGUAGES.map(lang => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={pauseTest} className="h-7 text-xs px-2">
                <Pause className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Pause</span>
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">
              Question {globalQuestionIndex + 1} of {totalQuestions}
            </span>
            <Badge variant="secondary" className="text-xs">{progress}%</Badge>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Section tabs - compact, touch-friendly */}
        <div className="flex gap-1 mb-3 sm:mb-4 overflow-x-auto pb-1 -mx-1 px-1">
          {sections.map((section, idx) => {
            const sectionAnswered = section.questions.filter(q => answers[q.id] !== undefined).length;
            const sectionTotal = section.questions.length;
            const isActive = idx === currentSectionIndex;
            const isDone = sectionAnswered === sectionTotal;

            return (
              <button
                key={section.id}
                onClick={() => goToSection(idx)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors min-h-[32px] ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isDone
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {isDone && <CheckCircle className="h-2.5 w-2.5" />}
                <span className="hidden sm:inline">{section.title}</span>
                <span className="sm:hidden">{idx + 1}</span>
                <span className="opacity-60">{sectionAnswered}/{sectionTotal}</span>
              </button>
            );
          })}
        </div>

        {/* Section header - compact */}
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-0.5">
            {SECTION_ICONS[currentSection.icon]}
            <h2 className="text-base font-semibold">{currentSection.title}</h2>
          </div>
          <p className="text-xs text-muted-foreground">{currentSection.subtitle}</p>
        </div>

        {/* Question card - compact */}
        <Card className="mb-4">
          <CardContent className="pt-4 pb-4 space-y-4">
            <div>
              <p className="text-sm font-medium whitespace-pre-line leading-relaxed">{currentQuestion.question_text}</p>
              {currentQuestion.description && (
                <p className="text-xs text-muted-foreground mt-1">{currentQuestion.description}</p>
              )}
              {/* Translation */}
              {currentTranslation && !isSkillQuestion && (
                <div className="mt-2 p-2 bg-muted/30 rounded border-l-2 border-primary/30">
                  <p className="text-xs text-muted-foreground italic whitespace-pre-line">{currentTranslation.question}</p>
                  {currentTranslation.description && (
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5 italic">{currentTranslation.description}</p>
                  )}
                </div>
              )}
            </div>

            <QuestionInput
              question={currentQuestion}
              answer={answers[currentQuestion.id]}
              onAnswer={(val) => saveAnswer(currentQuestion.id, val)}
              translatedOptions={!isSkillQuestion ? currentTranslation?.options : undefined}
              disabled={teacherPreviewMode}
            />

            {/* Answer status + I don't know */}
            <div className="flex items-center justify-between">
              <div>
                {answers[currentQuestion.id] !== undefined && answers[currentQuestion.id] !== '__IDK__' && (
                  <div className="flex items-center gap-1.5 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Saved</span>
                  </div>
                )}
                {answers[currentQuestion.id] === '__IDK__' && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <HelpCircle className="h-3 w-3" />
                    <span>Marked as "I don't know"</span>
                  </div>
                )}
              </div>
              {isSkillQuestion && answers[currentQuestion.id] === undefined && !teacherPreviewMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 text-muted-foreground"
                  onClick={() => saveIdontKnow(currentQuestion.id)}
                >
                  <HelpCircle className="h-3 w-3 mr-1" />
                  I don't know
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation - compact, mobile-friendly */}
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={goToPrevious} disabled={globalQuestionIndex === 0} className="min-h-[40px]">
            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> <span className="hidden sm:inline">Previous</span><span className="sm:hidden">Prev</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={skipQuestion}
            className="text-xs text-muted-foreground min-h-[40px]"
            disabled={isLastQuestion}
          >
            <SkipForward className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Skip</span>
          </Button>

          {isLastQuestion ? (
            <Button
              size="sm"
              onClick={completeTest}
              disabled={!canComplete || submitting || teacherPreviewMode}
              className="bg-green-600 hover:bg-green-700 min-h-[40px]"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}
              Complete
            </Button>
          ) : (
            <Button size="sm" onClick={goToNext} className="min-h-[40px]">
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          )}
        </div>

        {/* Question progress - mobile: progress bar, desktop: dots */}
        <div className="mt-4">
          {/* Mobile: simple progress bar */}
          <div className="sm:hidden">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span>Section progress</span>
              <span>{currentSection.questions.filter(q => answers[q.id] !== undefined).length}/{currentSection.questions.length}</span>
            </div>
            <Progress 
              value={(currentSection.questions.filter(q => answers[q.id] !== undefined).length / currentSection.questions.length) * 100} 
              className="h-1.5" 
            />
          </div>
          {/* Desktop: dots */}
          <div className="hidden sm:flex flex-wrap gap-1.5 justify-center">
            {currentSection.questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => goToQuestionInSection(currentSectionIndex, idx)}
                className={`w-6 h-6 rounded-full text-[10px] font-medium transition-colors ${
                  idx === currentQuestionIndex
                    ? 'bg-primary text-primary-foreground'
                    : answers[q.id] === '__IDK__'
                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'
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
    </div>
  );
}

// =====================================================
// Question Input Renderer (with speaking, listening, translation support)
// =====================================================

function QuestionInput({
  question,
  answer,
  onAnswer,
  translatedOptions,
  disabled = false,
}: {
  question: WelcomeTestQuestionDef;
  answer: unknown;
  onAnswer: (val: unknown) => void;
  translatedOptions?: string[];
  disabled?: boolean;
}) {
  const displayAnswer = answer === '__IDK__' ? '' : answer;

  if (disabled) {
    // Read-only mode for teacher preview
    return (
      <div className="opacity-60 pointer-events-none">
        <QuestionInputInner question={question} answer={displayAnswer} onAnswer={() => {}} translatedOptions={translatedOptions} />
      </div>
    );
  }

  return <QuestionInputInner question={question} answer={displayAnswer} onAnswer={onAnswer} translatedOptions={translatedOptions} />;
}

function QuestionInputInner({
  question,
  answer,
  onAnswer,
  translatedOptions,
}: {
  question: WelcomeTestQuestionDef;
  answer: unknown;
  onAnswer: (val: unknown) => void;
  translatedOptions?: string[];
}) {
  switch (question.question_type) {
    case 'speaking_record':
      return (
        <SpeakingRecorder
          maxSeconds={question.max_recording_seconds || 60}
          answer={typeof answer === 'string' ? answer : undefined}
          onAnswer={(url) => onAnswer(url)}
        />
      );

    case 'listening_comprehension':
      return (
        <div className="space-y-4">
          {(question.audio_url !== undefined || question.audio_transcript) && (
            <ListeningPlayer
              audioUrl={question.audio_url || ''}
              transcript={question.audio_transcript}
            />
          )}
          {question.options && (
            <RadioGroup
              value={(answer as string) || ''}
              onValueChange={onAnswer}
            >
              {question.options.map((option, idx) => (
                <div key={idx} className="flex items-center space-x-2.5 p-2.5 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value={option} id={`opt-${question.id}-${idx}`} />
                  <Label htmlFor={`opt-${question.id}-${idx}`} className="flex-1 cursor-pointer text-sm leading-relaxed">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </div>
      );

    case 'self_assessment':
    case 'scenario_reaction':
    case 'multiple_choice':
      return (
        <RadioGroup
          value={(answer as string) || ''}
          onValueChange={onAnswer}
        >
          {question.options?.map((option, idx) => (
            <div key={idx} className="flex items-center space-x-2.5 p-2.5 rounded-lg border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value={option} id={`opt-${question.id}-${idx}`} />
              <Label htmlFor={`opt-${question.id}-${idx}`} className="flex-1 cursor-pointer text-sm leading-relaxed">
                {option}
                {translatedOptions?.[idx] && (
                  <span className="block text-xs text-muted-foreground italic mt-0.5">{translatedOptions[idx]}</span>
                )}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );

    case 'preference_choice':
      if (question.multi_select) {
        const selected = (answer as string[]) || [];
        return (
          <div className="space-y-1.5">
            {question.options?.map((option, idx) => {
              const isChecked = selected.includes(option);
              const atMax = question.max_selections ? selected.length >= question.max_selections : false;
              return (
                <div key={idx} className="flex items-center space-x-2.5 p-2.5 rounded-lg border hover:bg-muted/50 transition-colors">
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
                    {translatedOptions?.[idx] && (
                      <span className="block text-xs text-muted-foreground italic mt-0.5">{translatedOptions[idx]}</span>
                    )}
                  </Label>
                </div>
              );
            })}
            {question.max_selections && (
              <p className="text-[10px] text-muted-foreground">Select up to {question.max_selections}</p>
            )}
          </div>
        );
      }
      return (
        <RadioGroup value={(answer as string) || ''} onValueChange={onAnswer}>
          {question.options?.map((option, idx) => (
            <div key={idx} className="flex items-center space-x-2.5 p-2.5 rounded-lg border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value={option} id={`pref-${question.id}-${idx}`} />
              <Label htmlFor={`pref-${question.id}-${idx}`} className="flex-1 cursor-pointer text-sm">
                {option}
                {translatedOptions?.[idx] && (
                  <span className="block text-xs text-muted-foreground italic mt-0.5">{translatedOptions[idx]}</span>
                )}
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
          placeholder="Type your answer..."
          className="text-sm"
        />
      );

    case 'open_ended':
    case 'open_reflection':
      return (
        <Textarea
          value={(answer as string) || ''}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder={question.question_type === 'open_reflection' ? 'Share your thoughts...' : 'Write your answer...'}
          className="min-h-[90px] text-sm"
        />
      );

    case 'self_assessment_matrix':
      const matrixAnswers = (answer as Record<string, number>) || {};
      return (
        <div className="space-y-3">
          {question.matrix_items?.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{item}</span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {matrixAnswers[item] || '—'}
                </span>
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: (question.matrix_scale?.max || 5) - (question.matrix_scale?.min || 1) + 1 }, (_, i) => {
                  const val = (question.matrix_scale?.min || 1) + i;
                  const isSelected = matrixAnswers[item] === val;
                  return (
                    <button
                      key={val}
                      onClick={() => onAnswer({ ...matrixAnswers, [item]: val })}
                      className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors min-h-[36px] ${
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
              {question.matrix_scale?.labels && idx === 0 && (
                <div className="flex justify-between text-[9px] text-muted-foreground">
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
