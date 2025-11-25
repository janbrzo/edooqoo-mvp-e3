
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useStudents } from '@/hooks/useStudents';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { Plus } from 'lucide-react';

const ENGLISH_LEVELS = [
  { value: 'A1', label: 'A1 (Beginner)' },
  { value: 'A2', label: 'A2 (Elementary)' },
  { value: 'B1', label: 'B1 (Intermediate)' },
  { value: 'B2', label: 'B2 (Upper-Intermediate)' },
  { value: 'C1', label: 'C1 (Advanced)' },
  { value: 'C2', label: 'C2 (Proficiency)' }
];

const MAIN_GOALS = [
  { value: 'business-communication', label: 'Business Communication & Presentations' },
  { value: 'academic-writing', label: 'Academic Writing & Research' },
  { value: 'conversation-speaking', label: 'Conversation & Speaking Fluency' },
  { value: 'exam-preparation', label: 'Exam Preparation (IELTS/TOEFL/Cambridge)' },
  { value: 'grammar-structure', label: 'Grammar & Language Structure' },
  { value: 'vocabulary-building', label: 'Vocabulary Building & Usage' },
  { value: 'reading-comprehension', label: 'Reading Comprehension & Analysis' },
  { value: 'listening-skills', label: 'Listening Skills & Understanding' },
  { value: 'travel-practical', label: 'Travel & Practical English' },
  { value: 'custom', label: 'Custom Goal (enter below)' }
];

const ADD_STUDENT_DRAFT_KEY = 'add-student-dialog-draft';

interface AddStudentDialogProps {
  onStudentAdded?: () => void;
  triggerButton?: boolean;  // New: controls if trigger button should be rendered
  open?: boolean;            // New: for external control of dialog state
  onOpenChange?: (open: boolean) => void; // New: callback for external state changes
  size?: 'sm' | 'default';   // For trigger button size
  variant?: 'default' | 'outline'; // For trigger button variant
}

export const AddStudentDialog = ({ 
  onStudentAdded, 
  triggerButton = true,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  size = 'default',
  variant = 'default'
}: AddStudentDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  const [name, setName] = useState('');
  const [englishLevel, setEnglishLevel] = useState('');
  const [mainGoal, setMainGoal] = useState('');
  const [customGoal, setCustomGoal] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [sendOverdueEmails, setSendOverdueEmails] = useState(true);
  const [loading, setLoading] = useState(false);
  const { addStudent, refetch } = useStudents();
  const { refreshProgress } = useOnboardingProgress();

  // Load draft from sessionStorage on mount so data survives tab switches / remounts
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(ADD_STUDENT_DRAFT_KEY);
      if (!stored) return;
      const draft = JSON.parse(stored) as {
        name?: string;
        englishLevel?: string;
        mainGoal?: string;
        customGoal?: string;
        studentEmail?: string;
        sendOverdueEmails?: boolean;
      };

      if (draft.name) setName(draft.name);
      if (draft.englishLevel) setEnglishLevel(draft.englishLevel);
      if (draft.mainGoal) setMainGoal(draft.mainGoal);
      if (draft.customGoal) setCustomGoal(draft.customGoal);
      if (draft.studentEmail) setStudentEmail(draft.studentEmail);
      if (typeof draft.sendOverdueEmails === 'boolean') {
        setSendOverdueEmails(draft.sendOverdueEmails);
      }
    } catch (error) {
      console.error('[AddStudentDialog] Failed to load draft from sessionStorage', error);
    }
  }, []);

  // Persist draft to sessionStorage whenever fields change
  useEffect(() => {
    try {
      const isPristine =
        !name &&
        !englishLevel &&
        !mainGoal &&
        !customGoal &&
        !studentEmail &&
        sendOverdueEmails === true;

      if (isPristine) {
        sessionStorage.removeItem(ADD_STUDENT_DRAFT_KEY);
        return;
      }

      const draft = {
        name,
        englishLevel,
        mainGoal,
        customGoal,
        studentEmail,
        sendOverdueEmails,
      };

      sessionStorage.setItem(ADD_STUDENT_DRAFT_KEY, JSON.stringify(draft));
    } catch (error) {
      console.error('[AddStudentDialog] Failed to save draft to sessionStorage', error);
    }
  }, [name, englishLevel, mainGoal, customGoal, studentEmail, sendOverdueEmails]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalGoal = mainGoal === 'custom' ? customGoal : mainGoal;
    if (!name || !englishLevel || !finalGoal) return;

    setLoading(true);
    try {
      await addStudent(name, englishLevel, finalGoal, studentEmail || undefined, sendOverdueEmails);
      // Reset form and close dialog
      setName('');
      setEnglishLevel('');
      setMainGoal('');
      setCustomGoal('');
      setStudentEmail('');
      setSendOverdueEmails(true);
      sessionStorage.removeItem(ADD_STUDENT_DRAFT_KEY);
      setOpen(false);
      
      // MAXIMUM-ENHANCED: Extreme aggressive refresh for INSTANT onboarding update
      console.log('[AddStudentDialog] Force refreshing students hook and onboarding - MAXIMUM MODE');
      
      // Immediate multiple refresh bursts
      refreshProgress();
      refreshProgress(); // Double immediate
      
      // Force refresh students hook MULTIPLE TIMES to ensure update
      const performRefreshCycle = async () => {
        try {
          console.log('[AddStudentDialog] Starting refresh cycle...');
          await refetch();  // Force refresh students
          
          console.log('[AddStudentDialog] Students refreshed, now triggering EXTREME onboarding refreshes');
          
          // EXTREME refresh pattern for maximum responsiveness
          refreshProgress();                              // 0ms - Immediate
          setTimeout(refreshProgress, 50);               // 50ms - Super fast
          setTimeout(refreshProgress, 100);              // 100ms - Fast
          setTimeout(refreshProgress, 200);              // 200ms - Quick
          setTimeout(refreshProgress, 400);              // 400ms - Medium
          setTimeout(refreshProgress, 800);              // 800ms - Delayed
          setTimeout(refreshProgress, 1500);             // 1.5s - Final
          
        } catch (error) {
          console.error('[AddStudentDialog] Error refreshing students:', error);
          // STILL try multiple onboarding refreshes even on error
          refreshProgress();
          setTimeout(refreshProgress, 100);
          setTimeout(refreshProgress, 300);
          setTimeout(refreshProgress, 1000);
        }
      };
      
      // Start refresh immediately AND with small delay
      performRefreshCycle();
      setTimeout(performRefreshCycle, 100);  // Backup refresh cycle
      
      // Notify parent component that student was added
      if (onStudentAdded) {
        console.log('🔄 Calling onStudentAdded callback...');
        onStudentAdded();
      }
    } catch (error) {
      // Error handled in hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerButton && (
        <DialogTrigger asChild>
          <Button size={size} variant={variant}>
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Add a new student to your class. You can update their information later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Student Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter student's name"
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="level">English Level (CEFR)</Label>
            <Select value={englishLevel} onValueChange={setEnglishLevel} required>
              <SelectTrigger>
                <SelectValue placeholder="Select English level" />
              </SelectTrigger>
              <SelectContent>
                {ENGLISH_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="native-language">Native Language</Label>
          <Select value={nativeLanguage} onValueChange={setNativeLanguage}>
            <SelectTrigger id="native-language" className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NATIVE_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
          <div className="space-y-2">
            <Label htmlFor="goal">Main Goal</Label>
            <Select value={mainGoal} onValueChange={setMainGoal} required>
              <SelectTrigger>
                <SelectValue placeholder="Select main learning goal" />
              </SelectTrigger>
              <SelectContent>
                {MAIN_GOALS.map((goal) => (
                  <SelectItem key={goal.value} value={goal.value}>
                    {goal.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mainGoal === 'custom' && (
              <Input
                placeholder="Enter custom learning goal"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                required={mainGoal === 'custom'}
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Student Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              placeholder="student@example.com"
            />
            <p className="text-xs text-muted-foreground">
              Email will be used for homework notifications
            </p>
          </div>
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="send-overdue-new">Send overdue homework emails</Label>
              <p className="text-xs text-muted-foreground">
                Automatically send reminders when homework is overdue
              </p>
            </div>
            <Switch 
              id="send-overdue-new" 
              checked={sendOverdueEmails} 
              onCheckedChange={setSendOverdueEmails} 
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name || !englishLevel || !mainGoal || (mainGoal === 'custom' && !customGoal)}>
              {loading ? 'Adding...' : 'Add Student'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
