import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight, Check, Plus } from 'lucide-react';
import { useFlashcardSets } from '@/hooks/useFlashcardSets';
import { useFlashcardCards } from '@/hooks/useFlashcardCards';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuickAddWordToFlashcardsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  teacherId: string;
  worksheetId?: string;
  nativeLanguage?: string;
  initialWord?: string; // Pre-filled word from selection
}

export const QuickAddWordToFlashcardsModal = ({
  open,
  onOpenChange,
  studentId,
  teacherId,
  worksheetId,
  nativeLanguage = 'Spanish',
  initialWord = ''
}: QuickAddWordToFlashcardsModalProps) => {
  const [step, setStep] = useState<'select-set' | 'enter-word' | 'confirm'>('select-set');
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [word, setWord] = useState(initialWord);
  const [translation, setTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { sets, loading: setsLoading, refetch: refetchSets } = useFlashcardSets(teacherId, studentId);
  const { addCard } = useFlashcardCards(selectedSetId || '');
  
  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep('select-set');
      setSelectedSetId(null);
      setWord(initialWord);
      setTranslation('');
    }
  }, [open, initialWord]);
  
  // Auto-translate when word is entered and set is selected
  useEffect(() => {
    const translateWord = async () => {
      if (!word.trim() || !selectedSetId) return;
      
      const selectedSet = sets.find(s => s.id === selectedSetId);
      if (!selectedSet) return;
      
      setIsTranslating(true);
      try {
        const { data, error } = await supabase.functions.invoke('translate-flashcard', {
          body: {
            word: word.trim(),
            targetLanguage: selectedSet.back_type === 'translation' ? nativeLanguage : 'English',
            mode: selectedSet.back_type === 'translation' ? 'translate' : 'define'
          }
        });
        
        if (error) throw error;
        setTranslation(data.translation || data.definition || '');
      } catch (error) {
        console.error('Translation error:', error);
        toast.error('Failed to auto-translate. Please enter manually.');
      } finally {
        setIsTranslating(false);
      }
    };
    
    if (step === 'confirm' && word && !translation) {
      translateWord();
    }
  }, [step, word, selectedSetId, sets, nativeLanguage]);
  
  const handleSelectSet = (setId: string) => {
    setSelectedSetId(setId);
    if (word.trim()) {
      setStep('confirm');
    } else {
      setStep('enter-word');
    }
  };
  
  const handleWordSubmit = () => {
    if (word.trim()) {
      setStep('confirm');
    }
  };
  
  const handleSave = async () => {
    if (!selectedSetId || !word.trim() || !translation.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsSaving(true);
    try {
      await addCard({
        set_id: selectedSetId,
        front_text: word.trim(),
        back_text: translation.trim(),
        source_type: 'manual',
        source_worksheet_id: worksheetId
      });
      
      toast.success('Word added to flashcards!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding card:', error);
      toast.error('Failed to add word to flashcards');
    } finally {
      setIsSaving(false);
    }
  };
  
  const selectedSet = sets.find(s => s.id === selectedSetId);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-600" />
            Quick Add Word to Flashcards
            <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Press F</span>
          </DialogTitle>
        </DialogHeader>
        
        {/* Step 1: Select Set */}
        {step === 'select-set' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Select a flashcard set:</p>
            
            {setsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : sets.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No flashcard sets found. Create one first.
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {sets.map(set => (
                  <Button
                    key={set.id}
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => handleSelectSet(set.id)}
                  >
                    <span className="truncate">{set.title}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {set.back_type === 'translation' ? `→ ${nativeLanguage}` : '→ Definition'}
                    </span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Step 2: Enter Word */}
        {step === 'enter-word' && (
          <div className="space-y-4">
            <div>
              <Label>Word or phrase</Label>
              <Textarea
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Enter the word or phrase..."
                className="mt-1"
                rows={2}
              />
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('select-set')}>
                Back
              </Button>
              <Button 
                onClick={handleWordSubmit}
                disabled={!word.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                Next <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Step 3: Confirm with Translation */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <div>
              <Label>Word</Label>
              <p className="mt-1 p-2 bg-muted rounded text-sm">{word}</p>
            </div>
            
            <div>
              <Label>
                {selectedSet?.back_type === 'translation' 
                  ? `Translation (${nativeLanguage})` 
                  : 'English Definition'}
              </Label>
              {isTranslating ? (
                <div className="flex items-center gap-2 mt-1 p-2 bg-muted rounded">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Translating...</span>
                </div>
              ) : (
                <Textarea
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value)}
                  placeholder="Enter or edit translation..."
                  className="mt-1"
                  rows={2}
                />
              )}
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('enter-word')}>
                Back
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isSaving || isTranslating || !translation.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSaving ? (
                  <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><Check className="mr-1 h-4 w-4" /> Add to Flashcards</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
