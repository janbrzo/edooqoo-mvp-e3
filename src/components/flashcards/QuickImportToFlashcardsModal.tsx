import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useFlashcardSets } from '@/hooks/useFlashcardSets';
import { useFlashcardCards } from '@/hooks/useFlashcardCards';
import { toast } from '@/hooks/use-toast';
import { Plus, Globe, BookOpen } from 'lucide-react';
import { NATIVE_LANGUAGES } from '@/types/flashcards';

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
  const [step, setStep] = useState<'select-set' | 'create-set' | 'select-items'>('select-set');
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  
  // New set creation fields
  const [newSetTitle, setNewSetTitle] = useState('');
  const [newSetDescription, setNewSetDescription] = useState('');
  const [newSetBackType, setNewSetBackType] = useState<'translation' | 'definition'>('translation');
  const [newSetBidirectional, setNewSetBidirectional] = useState(true);
  
  const { sets, refetch, createSet } = useFlashcardSets(teacherId, studentId);
  const { bulkAddFromVocabulary } = useFlashcardCards(selectedSetId || undefined);

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

  const handleSetSelected = (setId: string) => {
    setSelectedSetId(setId);
    
    // If single item, import immediately
    if (vocabularyItems.length === 1) {
      handleImport(setId);
    } else {
      // Multiple items - show selection step
      setStep('select-items');
    }
  };

  const handleNewSetClick = () => {
    setStep('create-set');
  };

  const handleCreateSet = async () => {
    if (!newSetTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for the new flashcard set",
        variant: "destructive"
      });
      return;
    }

    const newSet = await createSet({
      student_id: studentId,
      title: newSetTitle.trim(),
      description: newSetDescription.trim() || undefined,
      is_bidirectional: newSetBidirectional,
      back_type: newSetBackType,
    });

    if (!newSet) {
      toast({
        title: "Error",
        description: "Failed to create flashcard set",
        variant: "destructive"
      });
      return;
    }

    setSelectedSetId(newSet.id);
    
    // If single item, import immediately
    if (vocabularyItems.length === 1) {
      handleImport(newSet.id);
    } else {
      // Multiple items - show selection step
      setStep('select-items');
    }
  };

  const handleImport = async (targetSetId?: string) => {
    const setIdToUse = targetSetId || selectedSetId;
    if (!setIdToUse) return;
    
    setImporting(true);
    try {
      // Filter selected items
      const itemsToImport = vocabularyItems.filter((_, index) => selectedItems.has(index));

      // Import vocabulary items
      await bulkAddFromVocabulary(
        setIdToUse,
        worksheetId,
        itemsToImport
      );

      toast({
        title: "Success",
        description: `${itemsToImport.length} word(s) added to flashcards!`
      });

      onOpenChange(false);
      resetModal();
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

  const resetModal = () => {
    setStep('select-set');
    setSelectedSetId(null);
    setSelectedItems(new Set());
    setNewSetTitle('');
    setNewSetDescription('');
    setNewSetBackType('translation');
    setNewSetBidirectional(true);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        resetModal();
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'select-set' && 'Add to Flashcards'}
            {step === 'create-set' && 'Create New Flashcard Set'}
            {step === 'select-items' && 'Select Vocabulary Items'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select-set' && 'Choose an existing flashcard set or create a new one'}
            {step === 'create-set' && 'Set up your new flashcard set'}
            {step === 'select-items' && `Select which items to add (${selectedItems.size} of ${vocabularyItems.length} selected)`}
          </DialogDescription>
        </DialogHeader>

        {step === 'select-set' && (
          <div className="space-y-4 py-4">
            <Label className="text-base font-semibold">Select a Flashcard Set</Label>
            
            {/* Existing sets as tiles */}
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {studentSets.map(set => (
                <button
                  key={set.id}
                  onClick={() => handleSetSelected(set.id)}
                  className="flex flex-col items-start p-4 border-2 rounded-lg hover:border-primary hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="font-semibold text-sm mb-1 line-clamp-2">{set.title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{set.cards_count || 0} cards</span>
                    <span>•</span>
                    {set.back_type === 'translation' ? (
                      <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Native</span>
                    ) : (
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> Definition</span>
                    )}
                  </div>
                </button>
              ))}
              
              {/* New Set Button */}
              <button
                onClick={handleNewSetClick}
                className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg hover:border-primary hover:bg-accent/50 transition-colors min-h-[90px]"
              >
                <Plus className="w-6 h-6 mb-2 text-muted-foreground" />
                <span className="text-sm font-medium">New Set</span>
              </button>
            </div>
          </div>
        )}

        {step === 'create-set' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-title">Title *</Label>
              <Input
                id="new-title"
                value={newSetTitle}
                onChange={(e) => setNewSetTitle(e.target.value)}
                placeholder="e.g., Business English Vocabulary"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-description">Description (optional)</Label>
              <Textarea
                id="new-description"
                value={newSetDescription}
                onChange={(e) => setNewSetDescription(e.target.value)}
                placeholder="What topics does this set cover?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Back Side Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setNewSetBackType('translation')}
                  className={`flex items-center gap-2 p-3 border-2 rounded-lg transition-colors ${
                    newSetBackType === 'translation' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Globe className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium text-sm">Translation</div>
                    <div className="text-xs text-muted-foreground">Native language</div>
                  </div>
                </button>
                <button
                  onClick={() => setNewSetBackType('definition')}
                  className={`flex items-center gap-2 p-3 border-2 rounded-lg transition-colors ${
                    newSetBackType === 'definition' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <BookOpen className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium text-sm">Definition</div>
                    <div className="text-xs text-muted-foreground">English only</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label htmlFor="bidirectional" className="cursor-pointer">Bidirectional Learning</Label>
                <p className="text-xs text-muted-foreground">Practice both EN→{nativeLanguage} and {nativeLanguage}→EN</p>
              </div>
              <Switch
                id="bidirectional"
                checked={newSetBidirectional}
                onCheckedChange={setNewSetBidirectional}
              />
            </div>
          </div>
        )}

        {step === 'select-items' && (
          <div className="space-y-4 py-4">
            {/* Select All / Deselect All */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  toggleAll();
                }}
              >
                {selectedItems.size === vocabularyItems.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {/* Vocabulary items with checkboxes - REDUCED HEIGHT */}
            <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
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

        <div className="flex justify-end gap-2 pt-4 border-t">
          {step === 'create-set' && (
            <Button
              variant="outline"
              onClick={() => setStep('select-set')}
            >
              Back
            </Button>
          )}
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
          {step === 'select-set' && null}
          {step === 'create-set' && (
            <Button
              onClick={handleCreateSet}
              disabled={!newSetTitle.trim()}
            >
              Create & Continue
            </Button>
          )}
          {step === 'select-items' && (
            <Button
              onClick={() => handleImport()}
              disabled={importing || selectedItems.size === 0}
            >
              {importing 
                ? 'Importing...' 
                : `Send ${selectedItems.size} Card${selectedItems.size !== 1 ? 's' : ''}`
              }
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
