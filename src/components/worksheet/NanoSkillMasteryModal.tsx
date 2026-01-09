import React, { useState, useEffect } from 'react';
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
import { CheckCircle2, Brain } from "lucide-react";
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
  nanoSkills: NanoSkill[];
  exerciseTitle: string;
}

const NanoSkillMasteryModal: React.FC<NanoSkillMasteryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  nanoSkills,
  exerciseTitle,
}) => {
  const [ratings, setRatings] = useState<NanoSkillRating[]>([]);

  useEffect(() => {
    if (isOpen && nanoSkills.length > 0) {
      setRatings(
        nanoSkills.map((skill) => ({
          name: skill.name,
          reason: skill.reason,
          mastery: 70, // Default starting value
        }))
      );
    }
  }, [isOpen, nanoSkills]);

  const handleMasteryChange = (index: number, value: number[]) => {
    const newRatings = [...ratings];
    newRatings[index].mastery = value[0];
    setRatings(newRatings);
  };

  const handleSubmit = () => {
    onSubmit(ratings);
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

  if (nanoSkills.length === 0) {
    return null;
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

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Save Evaluation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NanoSkillMasteryModal;
