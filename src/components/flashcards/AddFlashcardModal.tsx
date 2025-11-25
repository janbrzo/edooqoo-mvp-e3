import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CreateFlashcardCard, UpdateFlashcardCard, FlashcardCard } from '@/types/flashcards';

interface AddFlashcardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setId: string;
  onAdd: (data: CreateFlashcardCard) => Promise<void>;
  studentNativeLanguage: string;
  editingCard?: FlashcardCard;
  onUpdate?: (updates: UpdateFlashcardCard) => Promise<void>;
  onCloseEdit?: () => void;
}

export function AddFlashcardModal({
  open,
  onOpenChange,
  setId,
  onAdd,
  studentNativeLanguage,
  editingCard,
  onUpdate,
  onCloseEdit,
}: AddFlashcardModalProps) {
  const [frontText, setFrontText] = useState('');
  const [frontExample, setFrontExample] = useState('');
  const [backText, setBackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!editingCard;

  useEffect(() => {
    if (editingCard) {
      setFrontText(editingCard.front_text);
      setFrontExample(editingCard.front_example || '');
      setBackText(editingCard.back_text);
    } else {
      setFrontText('');
      setFrontExample('');
      setBackText('');
    }
  }, [editingCard, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!frontText.trim() || !backText.trim()) return;

    setIsSubmitting(true);
    
    if (isEditMode && onUpdate) {
      await onUpdate({
        front_text: frontText.trim(),
        front_example: frontExample.trim() || undefined,
        back_text: backText.trim(),
      });
      onCloseEdit?.();
    } else {
      await onAdd({
        set_id: setId,
        front_text: frontText.trim(),
        front_example: frontExample.trim() || undefined,
        back_text: backText.trim(),
        source_type: 'manual',
      });
    }

    setFrontText('');
    setFrontExample('');
    setBackText('');
    onOpenChange(false);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (isEditMode) {
      onCloseEdit?.();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Flashcard' : 'Add Flashcard'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="front">English Term *</Label>
            <Input
              id="front"
              value={frontText}
              onChange={(e) => setFrontText(e.target.value)}
              placeholder="e.g., accomplish"
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="example">Example Sentence (optional)</Label>
            <Textarea
              id="example"
              value={frontExample}
              onChange={(e) => setFrontExample(e.target.value)}
              placeholder="e.g., She accomplished her goal of learning English."
              rows={2}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="back">{studentNativeLanguage} Translation *</Label>
            <Input
              id="back"
              value={backText}
              onChange={(e) => setBackText(e.target.value)}
              placeholder={`Translation in ${studentNativeLanguage}...`}
              required
              className="mt-1.5"
            />
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="text-sm font-medium mb-1">Preview:</div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Front:</span>{' '}
                <span className="font-medium">{frontText || '(empty)'}</span>
              </div>
              {frontExample && (
                <div className="text-xs italic text-muted-foreground">
                  "{frontExample}"
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Back:</span>{' '}
                <span>{backText || '(empty)'}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !frontText.trim() || !backText.trim()}
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Card' : 'Add Card'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
