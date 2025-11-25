import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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
  const [selectedSetId, setSelectedSetId] = useState<string>('new');
  const [newSetTitle, setNewSetTitle] = useState('');
  const [importing, setImporting] = useState(false);
  
  const { sets, refetch, createSet } = useFlashcardSets(teacherId, studentId);
  const { bulkAddFromVocabulary } = useFlashcardCards(selectedSetId);

  // Filter sets for current student (already filtered by hook)
  const studentSets = sets;

  useEffect(() => {
    if (open && teacherId) {
      refetch();
    }
  }, [open, teacherId]);

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
          is_bidirectional: true
        });

        if (!newSet) {
          throw new Error('Failed to create flashcard set');
        }

        targetSetId = newSet.id;
      }

      // Import vocabulary items
      await bulkAddFromVocabulary(
        targetSetId,
        worksheetId,
        vocabularyItems
      );

      toast({
        title: "Success",
        description: `${vocabularyItems.length} word(s) added to flashcards!`
      });

      onOpenChange(false);
      setSelectedSetId('new');
      setNewSetTitle('');
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add to Flashcards</DialogTitle>
        </DialogHeader>

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

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing || (selectedSetId === 'new' && !newSetTitle.trim())}
          >
            {importing ? 'Importing...' : 'Add to Flashcards'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
