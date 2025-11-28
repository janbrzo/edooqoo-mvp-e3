import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useFlashcardSets } from '@/hooks/useFlashcardSets';
import { useFlashcardCards } from '@/hooks/useFlashcardCards';
import { toast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

interface QuickImportToFlashcardsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  teacherId: string;
  worksheetId: string;
  vocabularyItems: Array<{
    word: string;
    definition: string;
    example?: string;
  }>;
  nativeLanguage: string;
}

export function QuickImportToFlashcardsModal({
  open,
  onOpenChange,
  studentId,
  teacherId,
  worksheetId,
  vocabularyItems,
  nativeLanguage
}: QuickImportToFlashcardsModalProps) {
  const [step, setStep] = useState<'select-set' | 'select-items'>('select-set');
  const [selectedSetId, setSelectedSetId] = useState<string>('new');
  const [newSetTitle, setNewSetTitle] = useState('');
  const [importing, setImporting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  
  const { sets, refetch, createSet } = useFlashcardSets(teacherId, studentId);
  const { bulkAddFromVocabulary } = useFlashcardCards(selectedSetId);

  const studentSets = sets;

  useEffect(() => {
    if (open && teacherId) {
      refetch();
      // Pre-select all items when modal opens
      setSelectedItems(new Set(vocabularyItems.map((_, i) => i)));
    }
  }, [open, teacherId, vocabularyItems]);

  const toggleItem = (index: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleAll = () => {
    if (selectedItems.size === vocabularyItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(vocabularyItems.map((_, i) => i)));
    }
  };

  const handleSetSelected = () => {
    if (selectedSetId === 'new' && !newSetTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for the new flashcard set",
        variant: "destructive"
      });
      return;
    }

    // If single item, import immediately
    if (vocabularyItems.length === 1) {
      handleImport();
    } else {
      // Multiple items - show selection step
      setStep('select-items');
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      let targetSetId = selectedSetId;

      // Create new set if needed
      if (selectedSetId === 'new') {
        if (!newSetTitle.trim()) {
          toast({
            title: "Error",
            description: "Please enter a title for the new flashcard set",
            variant: "destructive"
          });
          setImporting(false);
          return;
        }

        const newSet = await createSet({
          student_id: studentId,
          title: newSetTitle,
          is_bidirectional: true,
          back_type: 'translation',
        });

        if (!newSet) {
          throw new Error('Failed to create flashcard set');
        }

        targetSetId = newSet.id;
      }

      // Filter selected items
      const itemsToImport = vocabularyItems.filter((_, index) => selectedItems.has(index));

      // Import vocabulary items
      await bulkAddFromVocabulary(
        targetSetId,
        worksheetId,
        itemsToImport
      );

      toast({
        title: "Success",
        description: `${itemsToImport.length} word(s) added to flashcards!`
      });

      onOpenChange(false);
      setSelectedSetId('new');
      setNewSetTitle('');
      setStep('select-set');
      setSelectedItems(new Set());
    } catch (error: any) {
      console.error('Error importing to flashcards:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to import vocabulary",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        setStep('select-set');
        setSelectedItems(new Set());
        setSelectedSetId('new');
        setNewSetTitle('');
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'select-set' ? 'Add to Flashcards' : 'Select Vocabulary Items'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select-set' 
              ? 'Choose a flashcard set or create a new one'
              : `Select which items to add (${selectedItems.size} of ${vocabularyItems.length} selected)`
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'select-set' ? (
          <div className="space-y-4 py-4">
            {/* Preview of selected words */}
            <div>
              <Label className="text-sm font-medium mb-2">
                Selected Words ({vocabularyItems.length})
              </Label>
              <div className="max-h-32 overflow-y-auto border rounded-md p-2 bg-muted/30">
                {vocabularyItems.map((item, idx) => (
                  <div key={idx} className="text-sm py-1">
                    <span className="font-medium">{item.word}</span>
                    {' → '}
                    <span className="text-muted-foreground">{item.definition}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Set selection */}
            <div className="space-y-2">
              <Label htmlFor="flashcard-set">Flashcard Set</Label>
              <Select value={selectedSetId} onValueChange={setSelectedSetId}>
                <SelectTrigger id="flashcard-set">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">
                    <div className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Set
                    </div>
                  </SelectItem>
                  {studentSets.map(set => (
                    <SelectItem key={set.id} value={set.id}>
                      {set.title} ({set.cards_count || 0} cards)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* New set title input */}
            {selectedSetId === 'new' && (
              <div className="space-y-2">
                <Label htmlFor="new-set-title">New Set Title</Label>
                <Input
                  id="new-set-title"
                  value={newSetTitle}
                  onChange={(e) => setNewSetTitle(e.target.value)}
                  placeholder="e.g. Past Simple Vocabulary"
                  autoFocus
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Select All / Deselect All */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAll}
              >
                {selectedItems.size === vocabularyItems.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {/* Vocabulary items with checkboxes */}
            <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
              {vocabularyItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleItem(index)}
                >
                  <Checkbox
                    checked={selectedItems.has(index)}
                    onCheckedChange={() => toggleItem(index)}
                    className="mt-1"
                  />
                  <div className="flex-1 text-sm">
                    <div className="font-medium">{item.word}</div>
                    <div className="text-muted-foreground">{item.definition}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'select-items' && (
            <Button
              variant="outline"
              onClick={() => setStep('select-set')}
            >
              Back
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importing}
          >
            Cancel
          </Button>
          <Button
            onClick={step === 'select-set' ? handleSetSelected : handleImport}
            disabled={importing || (step === 'select-items' && selectedItems.size === 0)}
          >
            {importing 
              ? 'Importing...' 
              : step === 'select-set'
                ? (vocabularyItems.length === 1 ? 'Add to Flashcards' : 'Next')
                : `Send ${selectedItems.size} Card${selectedItems.size !== 1 ? 's' : ''}`
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}