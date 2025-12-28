/**
 * CreateTestModal - Modal for creating and generating tests
 * Integrates with AI to generate questions based on student data
 */

import { useState } from 'react';
import { Loader2, Sparkles, Target, TrendingUp, CheckCircle, FileText, Brain, BookOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useStudentTests } from '@/hooks/useStudentTests';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import { toast } from 'sonner';
import { TEST_TYPES, type TestType, type NewQuestionData } from '@/types/studentTests';
import type { Json } from '@/integrations/supabase/types';

interface CreateTestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  teacherId: string;
  studentName?: string;
  onTestCreated?: (testId: string) => void;
}

export function CreateTestModal({
  open,
  onOpenChange,
  studentId,
  teacherId,
  studentName,
  onTestCreated,
}: CreateTestModalProps) {
  const { createTest, addQuestions } = useStudentTests({ studentId, teacherId });
  const { goals, loading: goalsLoading } = useStudentProgress({ studentId, teacherId });
  
  const [step, setStep] = useState<'type' | 'options' | 'generating' | 'review'>('type');
  const [selectedType, setSelectedType] = useState<TestType>('progress_check');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questionCount, setQuestionCount] = useState([10]);
  const [focusOnWeaknesses, setFocusOnWeaknesses] = useState(true);
  const [includeFlashcards, setIncludeFlashcards] = useState(true);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<NewQuestionData[]>([]);
  const [generatedTitle, setGeneratedTitle] = useState('');

  const handleTypeSelect = (type: TestType) => {
    setSelectedType(type);
    setStep('options');
  };

  const handleGenerateQuestions = async () => {
    setStep('generating');
    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-test', {
        body: {
          studentId,
          teacherId,
          testType: selectedType,
          linkedGoalId: selectedGoalId,
          questionCount: questionCount[0],
          focusOnWeaknesses,
          includeFlashcards,
        },
      });

      if (error) throw error;

      if (data.success) {
        setGeneratedQuestions(data.questions);
        setGeneratedTitle(data.title || `Test for ${studentName}`);
        setTitle(data.title || `Test for ${studentName}`);
        setStep('review');
        toast.success(`Generated ${data.questions.length} questions`);
      } else {
        throw new Error(data.error || 'Failed to generate questions');
      }
    } catch (err) {
      console.error('Error generating test:', err);
      toast.error('Failed to generate test questions. Please try again.');
      setStep('options');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateTest = async () => {
    if (generatedQuestions.length === 0) {
      toast.error('No questions to save');
      return;
    }

    try {
      // Create the test
      const test = await createTest({
        student_id: studentId,
        test_type: selectedType,
        title: title || generatedTitle,
        description,
        linked_goal_id: selectedGoalId || undefined,
      });

      if (!test) {
        throw new Error('Failed to create test');
      }

      // Add questions to the test
      await addQuestions(test.id, generatedQuestions);

      toast.success('Test created successfully!');
      onTestCreated?.(test.id);
      handleClose();
    } catch (err) {
      console.error('Error creating test:', err);
      toast.error('Failed to create test');
    }
  };

  const handleClose = () => {
    setStep('type');
    setSelectedType('progress_check');
    setTitle('');
    setDescription('');
    setQuestionCount([10]);
    setFocusOnWeaknesses(true);
    setIncludeFlashcards(true);
    setSelectedGoalId(null);
    setGeneratedQuestions([]);
    setGeneratedTitle('');
    onOpenChange(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'placement': return <FileText className="h-6 w-6" />;
      case 'progress_check': return <TrendingUp className="h-6 w-6" />;
      case 'skill_verification': return <CheckCircle className="h-6 w-6" />;
      case 'goal_check': return <Target className="h-6 w-6" />;
      default: return <FileText className="h-6 w-6" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create AI-Powered Test
          </DialogTitle>
          <DialogDescription>
            Generate personalized test questions for {studentName || 'the student'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Select Test Type */}
        {step === 'type' && (
          <div className="space-y-4 mt-4">
            <h3 className="font-medium text-sm text-muted-foreground">Choose test type:</h3>
            <div className="grid grid-cols-2 gap-4">
              {TEST_TYPES.map((type) => (
                <Card
                  key={type.value}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    selectedType === type.value ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handleTypeSelect(type.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {getTypeIcon(type.value)}
                      </div>
                      <div>
                        <h4 className="font-semibold">{type.label}</h4>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Configure Options */}
        {step === 'options' && (
          <div className="space-y-6 mt-4">
            {/* Selected type badge */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {TEST_TYPES.find(t => t.value === selectedType)?.label}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => setStep('type')}>
                Change
              </Button>
            </div>

            {/* Question count */}
            <div className="space-y-3">
              <Label>Number of Questions: {questionCount[0]}</Label>
              <Slider
                value={questionCount}
                onValueChange={setQuestionCount}
                min={5}
                max={20}
                step={1}
              />
            </div>

            {/* Link to Goal */}
            {!goalsLoading && goals.length > 0 && (
              <div className="space-y-3">
                <Label>Link to Goal (optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {goals.map((goal) => (
                    <Badge
                      key={goal.id}
                      variant={selectedGoalId === goal.id ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setSelectedGoalId(
                        selectedGoalId === goal.id ? null : goal.id
                      )}
                    >
                      <Target className="h-3 w-3 mr-1" />
                      {goal.title}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Focus options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="weaknesses">Focus on weaknesses</Label>
                </div>
                <Switch
                  id="weaknesses"
                  checked={focusOnWeaknesses}
                  onCheckedChange={setFocusOnWeaknesses}
                />
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Include questions targeting documented weak points from Knowledge Base
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="flashcards">Include vocabulary from Flashcards</Label>
                </div>
                <Switch
                  id="flashcards"
                  checked={includeFlashcards}
                  onCheckedChange={setIncludeFlashcards}
                />
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Test vocabulary the student is currently learning
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep('type')}>
                Back
              </Button>
              <Button onClick={handleGenerateQuestions}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Questions
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Generating */}
        {step === 'generating' && (
          <div className="py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Generating Questions...</h3>
            <p className="text-muted-foreground">
              AI is analyzing student data and creating personalized questions
            </p>
          </div>
        )}

        {/* Step 4: Review & Save */}
        {step === 'review' && (
          <div className="space-y-6 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Test Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter test title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add notes about this test"
                  rows={2}
                />
              </div>
            </div>

            {/* Questions preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Generated Questions</Label>
                <Badge>{generatedQuestions.length} questions</Badge>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3">
                {generatedQuestions.map((q, index) => (
                  <div key={index} className="p-2 bg-muted/30 rounded text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {q.question_type}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {q.element_type}
                      </Badge>
                    </div>
                    <p className="text-sm">{q.question_text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('options')}>
                Regenerate
              </Button>
              <Button onClick={handleCreateTest}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Create Test
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
