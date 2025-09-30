import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RefreshCw } from 'lucide-react';

interface ExerciseRegenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  guidelines: string;
  onGuidelinesChange: (value: string) => void;
  exerciseType: string;
  exerciseTitle: string;
  sectionType?: 'exercise' | 'warmup' | 'grammar';
}

const ExerciseRegenerateModal: React.FC<ExerciseRegenerateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  guidelines,
  onGuidelinesChange,
  exerciseType,
  exerciseTitle,
  sectionType = 'exercise'
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm();
  };

  const getSectionLabel = () => {
    switch (sectionType) {
      case 'warmup':
        return 'Warmup Questions';
      case 'grammar':
        return 'Grammar Rules';
      default:
        return 'Exercise';
    }
  };

  const getPlaceholder = () => {
    switch (sectionType) {
      case 'warmup':
        return 'Add specific requirements for the warmup questions...';
      case 'grammar':
        return 'Add specific requirements for the grammar explanation...';
      default:
        return 'Add any specific requirements for the new exercise version...';
    }
  };

  const getExamples = () => {
    switch (sectionType) {
      case 'warmup':
        return 'Examples: "Make questions more personal", "Focus on past experiences", "Add hypothetical scenarios"';
      case 'grammar':
        return 'Examples: "Add more examples", "Simplify the explanation", "Include common mistakes"';
      default:
        return 'Examples: "Make it more challenging", "Focus on present perfect tense", "Use business vocabulary"';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-worksheet-purple" />
            Regenerate {getSectionLabel()}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>{getSectionLabel()}:</strong> {exerciseTitle}
            </p>
            {sectionType === 'exercise' && (
              <p className="text-sm text-gray-600 mt-1">
                <strong>Type:</strong> {exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1).replace(/-/g, ' ')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guidelines">
              Additional Guidelines (Optional)
            </Label>
            <Textarea
              id="guidelines"
              placeholder={getPlaceholder()}
              value={guidelines}
              onChange={(e) => onGuidelinesChange(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              {getExamples()}
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-worksheet-purple hover:bg-worksheet-purple/90"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate {getSectionLabel()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseRegenerateModal;