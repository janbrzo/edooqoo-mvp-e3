import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Brain, SkipForward, Undo2, AlertCircle } from "lucide-react";
import { NanoSkill } from "./NanoSkillBadge";

interface NanoSkillRating {
  name: string;
  reason: string;
  mastery: number | null; // null = no value set
  hasValue: boolean; // PROBLEM 1.2: Track if user has set a value
}

interface NanoSkillMasteryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ratings: NanoSkillRating[]) => void;
  onSkip?: () => void;
  nanoSkills: NanoSkill[];
  exerciseTitle: string;
  // PROBLEM 1.1: Student answers and exercise data for pre-filling
  studentAnswers?: Record<number, any>;
  exerciseData?: any;
}

// Undo Mark Done Modal
interface UndoMarkDoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deleteFromEvents: boolean) => void;
  exerciseTitle: string;
}

export const UndoMarkDoneModal: React.FC<UndoMarkDoneModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  exerciseTitle,
}) => {
  const [deleteFromEvents, setDeleteFromEvents] = useState(true);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Undo2 className="h-5 w-5 text-orange-500" />
            Undo Mark Done
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to unmark <span className="font-medium">"{exerciseTitle}"</span> as done?
          </p>

          <div className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/30">
            <Checkbox
              id="delete-events"
              checked={deleteFromEvents}
              onCheckedChange={(checked) => setDeleteFromEvents(checked === true)}
            />
            <label
              htmlFor="delete-events"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              Also delete mastery evaluation from student events
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              onConfirm(deleteFromEvents);
              onClose();
            }} 
            variant="destructive"
            className="gap-2"
          >
            <Undo2 className="h-4 w-4" />
            Confirm Undo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// PROBLEM 1: Helper to calculate initial mastery for SPECIFIC item index
// Each nano_skill corresponds to a specific item in the exercise
const calculateInitialMasteryForItem = (
  itemIndex: number,
  studentAnswers?: Record<number, any>,
  exerciseData?: any
): { mastery: number | null; hasValue: boolean } => {
  // No answers = slider starts with no value
  if (!studentAnswers || Object.keys(studentAnswers).length === 0) {
    return { mastery: null, hasValue: false };
  }
  
  // Get the student's answer for this specific item
  const studentAnswer = studentAnswers[itemIndex];
  
  // If no answer for this item, return no value
  if (studentAnswer === undefined || studentAnswer === null || studentAnswer === '') {
    return { mastery: null, hasValue: false };
  }
  
  // Try to determine correctness for this specific item
  let isCorrect: boolean | null = null;
  
  // Check questions array
  if (exerciseData?.questions && exerciseData.questions[itemIndex]) {
    const question = exerciseData.questions[itemIndex];
    
    // Multiple choice - check if answer matches correct option
    if (question.options && Array.isArray(question.options)) {
      const correctOption = question.options.find((o: any) => o.correct === true);
      if (correctOption) {
        isCorrect = studentAnswer === correctOption.text || 
                   studentAnswer === correctOption.label ||
                   studentAnswer === correctOption.value;
      }
    }
    
    // Reading/answer questions with expected answer
    if (question.answer || question.correct || question.expected) {
      const expected = question.answer || question.correct || question.expected;
      isCorrect = studentAnswer.toLowerCase().trim() === expected.toLowerCase().trim();
    }
  }
  
  // Check items array (matching, categorize, etc.)
  if (exerciseData?.items && exerciseData.items[itemIndex]) {
    const item = exerciseData.items[itemIndex];
    if (item.match) {
      isCorrect = studentAnswer === item.match;
    }
    if (item.category) {
      isCorrect = studentAnswer === item.category;
    }
  }
  
  // Check sentences array (fill in blanks, transformation, etc.)
  if (exerciseData?.sentences && exerciseData.sentences[itemIndex]) {
    const sentence = exerciseData.sentences[itemIndex];
    const correctAnswer = sentence.answer || sentence.correct || sentence.missing_word;
    if (correctAnswer) {
      isCorrect = studentAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    }
  }
  
  // Check statements array (true/false)
  if (exerciseData?.statements && exerciseData.statements[itemIndex]) {
    const statement = exerciseData.statements[itemIndex];
    if (statement.correct !== undefined) {
      isCorrect = studentAnswer === statement.correct || 
                 (studentAnswer === 'true' && statement.correct === true) ||
                 (studentAnswer === 'false' && statement.correct === false);
    }
  }
  
  // Return mastery based on correctness
  if (isCorrect === true) {
    return { mastery: 80, hasValue: true }; // Correct answer
  } else if (isCorrect === false) {
    return { mastery: 30, hasValue: true }; // Incorrect answer
  }
  
  // Answer exists but we can't verify correctness (open-ended questions)
  return { mastery: 50, hasValue: true }; // Neutral - needs teacher evaluation
};

const NanoSkillMasteryModal: React.FC<NanoSkillMasteryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSkip,
  nanoSkills,
  exerciseTitle,
  studentAnswers,
  exerciseData,
}) => {
  const [ratings, setRatings] = useState<NanoSkillRating[]>([]);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isOpen && nanoSkills.length > 0 && !hasInitialized.current) {
      // PROBLEM 1: Initialize each skill with INDIVIDUAL value based on its corresponding item's answer
      setRatings(
        nanoSkills.map((skill, idx) => {
          // Each nano_skill at index idx corresponds to item at index idx
          const { mastery, hasValue } = calculateInitialMasteryForItem(idx, studentAnswers, exerciseData);
          return {
            name: skill.name,
            reason: skill.reason,
            mastery: mastery,
            hasValue: hasValue,
          };
        })
      );
      hasInitialized.current = true;
    }
    
    // Reset when modal closes
    if (!isOpen) {
      hasInitialized.current = false;
    }
  }, [isOpen, nanoSkills, studentAnswers, exerciseData]);

  const handleMasteryChange = (index: number, value: number[]) => {
    setRatings(prevRatings => {
      const newRatings = [...prevRatings];
      newRatings[index] = { 
        ...newRatings[index], 
        mastery: value[0],
        hasValue: true // User has now set a value
      };
      return newRatings;
    });
  };

  const handleSubmit = () => {
    // PROBLEM 1.2: Only submit ratings that have values set
    const ratingsWithValues = ratings.filter(r => r.hasValue && r.mastery !== null);
    onSubmit(ratingsWithValues);
    onClose();
  };
  
  const handleSkip = () => {
    onSkip?.();
    onClose();
  };

  const formatSkillName = (name: string) => {
    const parts = name.split('.');
    const skillPart = parts[parts.length - 1] || name;
    return skillPart
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getMasteryColor = (mastery: number | null) => {
    if (mastery === null) return 'text-gray-400';
    if (mastery >= 80) return 'text-green-600';
    if (mastery >= 60) return 'text-yellow-600';
    if (mastery >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getMasteryLabel = (mastery: number | null) => {
    if (mastery === null) return 'Not set';
    if (mastery >= 90) return 'Excellent';
    if (mastery >= 75) return 'Good';
    if (mastery >= 60) return 'Satisfactory';
    if (mastery >= 40) return 'Needs Work';
    return 'Struggling';
  };
  
  // Count how many ratings have values
  const ratingsWithValues = ratings.filter(r => r.hasValue && r.mastery !== null).length;

  // Show modal even without nano skills (with skip option)
  if (nanoSkills.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Mark Exercise Done
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              No nano skills detected for this exercise. Mark as done without evaluation?
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSkip} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Mark Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Evaluate Student Mastery
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Exercise: <span className="font-medium">{exerciseTitle}</span>
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <p className="text-sm text-muted-foreground">
            Rate how well the student demonstrated each skill during this exercise:
          </p>
          
          {/* PROBLEM 1.2: Info about unset values */}
          {ratings.some(r => !r.hasValue) && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              Skills without a set value won't be saved.
            </div>
          )}

          {ratings.map((rating, index) => (
            <div 
              key={index} 
              className={`space-y-3 p-4 border rounded-lg ${rating.hasValue ? 'bg-muted/20' : 'bg-gray-50 border-dashed'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <Badge variant={rating.hasValue ? "secondary" : "outline"} className="mb-2">
                    {formatSkillName(rating.name)}
                  </Badge>
                  <p className="text-sm text-muted-foreground italic">
                    "{rating.reason}"
                  </p>
                </div>
                <div className={`text-2xl font-bold ${getMasteryColor(rating.mastery)}`}>
                  {rating.mastery !== null ? `${rating.mastery}%` : '—'}
                </div>
              </div>

              <div className="space-y-2">
                <Slider
                  value={rating.mastery !== null ? [rating.mastery] : [50]}
                  onValueChange={(value) => handleMasteryChange(index, value)}
                  max={100}
                  min={0}
                  step={5}
                  className={`w-full ${!rating.hasValue ? 'opacity-50' : ''}`}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0% - Struggling</span>
                  <span className={`font-medium ${getMasteryColor(rating.mastery)}`}>
                    {getMasteryLabel(rating.mastery)}
                  </span>
                  <span>100% - Excellent</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 flex-wrap">
          <Button variant="ghost" onClick={handleSkip} className="gap-2 text-muted-foreground">
            <SkipForward className="h-4 w-4" />
            Skip (mark done without evaluation)
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Save Evaluation {ratingsWithValues > 0 && `(${ratingsWithValues})`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NanoSkillMasteryModal;
