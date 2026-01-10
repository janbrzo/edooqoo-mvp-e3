import React, { useState, useEffect, useRef } from 'react';
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
import { CheckCircle2, Brain, SkipForward, Undo2 } from "lucide-react";
import { NanoSkill } from "./NanoSkillBadge";

interface NanoSkillRating {
  name: string;
  reason: string;
  mastery: number; // 0-100
}

interface NanoSkillMasteryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ratings: NanoSkillRating[]) => void;
  onSkip?: () => void;
  nanoSkills: NanoSkill[];
  exerciseTitle: string;
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

const NanoSkillMasteryModal: React.FC<NanoSkillMasteryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSkip,
  nanoSkills,
  exerciseTitle,
}) => {
  const [ratings, setRatings] = useState<NanoSkillRating[]>([]);
  // FIX: Track if we've initialized to prevent slider reset
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isOpen && nanoSkills.length > 0 && !hasInitialized.current) {
      setRatings(
        nanoSkills.map((skill) => ({
          name: skill.name,
          reason: skill.reason,
          mastery: 70, // Default starting value
        }))
      );
      hasInitialized.current = true;
    }
    
    // Reset when modal closes
    if (!isOpen) {
      hasInitialized.current = false;
    }
  }, [isOpen, nanoSkills]);

  const handleMasteryChange = (index: number, value: number[]) => {
    setRatings(prevRatings => {
      const newRatings = [...prevRatings];
      newRatings[index] = { ...newRatings[index], mastery: value[0] };
      return newRatings;
    });
  };

  const handleSubmit = () => {
    onSubmit(ratings);
    onClose();
  };
  
  const handleSkip = () => {
    onSkip?.();
    onClose();
  };

  const formatSkillName = (name: string) => {
    // Convert ns.grammar.word_order_svo to "Word Order SVO"
    const parts = name.split('.');
    const skillPart = parts[parts.length - 1] || name;
    return skillPart
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 80) return 'text-green-600';
    if (mastery >= 60) return 'text-yellow-600';
    if (mastery >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getMasteryLabel = (mastery: number) => {
    if (mastery >= 90) return 'Excellent';
    if (mastery >= 75) return 'Good';
    if (mastery >= 60) return 'Satisfactory';
    if (mastery >= 40) return 'Needs Work';
    return 'Struggling';
  };

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

          {ratings.map((rating, index) => (
            <div key={index} className="space-y-3 p-4 border rounded-lg bg-muted/20">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <Badge variant="secondary" className="mb-2">
                    {formatSkillName(rating.name)}
                  </Badge>
                  <p className="text-sm text-muted-foreground italic">
                    "{rating.reason}"
                  </p>
                </div>
                <div className={`text-2xl font-bold ${getMasteryColor(rating.mastery)}`}>
                  {rating.mastery}%
                </div>
              </div>

              <div className="space-y-2">
                <Slider
                  value={[rating.mastery]}
                  onValueChange={(value) => handleMasteryChange(index, value)}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
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
              Save Evaluation
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NanoSkillMasteryModal;
