import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  NewKnowledgeEntry,
  KnowledgeCategory,
  KNOWLEDGE_CATEGORIES,
  parseTagsFromInput,
} from '@/types/studentKnowledge';

interface StudentKnowledgeQuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (entry: Omit<NewKnowledgeEntry, 'student_id' | 'teacher_id'>) => Promise<void>;
  suggestedTags: string[];
  worksheetId?: string;
}

export const StudentKnowledgeQuickAddModal = ({
  isOpen,
  onClose,
  onAdd,
  suggestedTags,
  worksheetId,
}: StudentKnowledgeQuickAddModalProps) => {
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | null>(null);
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTag = (tag: string) => {
    const currentTags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    if (!currentTags.includes(tag)) {
      const newTagsInput = currentTags.length > 0 
        ? `${tagsInput}, ${tag}`
        : tag;
      setTagsInput(newTagsInput);
    }
  };

  const handleAdd = async () => {
    if (!selectedCategory || !content.trim()) return;

    setIsAdding(true);
    try {
      const newEntry: Omit<NewKnowledgeEntry, 'student_id' | 'teacher_id'> = {
        category: selectedCategory,
        content: content.trim(),
        tags: parseTagsFromInput(tagsInput),
        worksheet_id: worksheetId || null,
        entry_source: worksheetId ? 'worksheet' : 'manual',
      };

      await onAdd(newEntry);
      
      // Reset form
      setSelectedCategory(null);
      setContent('');
      setTagsInput('');
      onClose();
    } catch (error) {
      console.error('Failed to add entry:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    if (!isAdding) {
      setSelectedCategory(null);
      setContent('');
      setTagsInput('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Add Note</DialogTitle>
          <DialogDescription>
            Add a quick note to this student's knowledge base.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Category Grid - 3x3 */}
          <div className="space-y-2">
            <Label>Category *</Label>
            <div className="grid grid-cols-3 gap-2">
              {KNOWLEDGE_CATEGORIES.map((cat) => (
                <Button
                  key={cat.id}
                  type="button"
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="h-auto py-3 flex flex-col items-center gap-1"
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs text-center leading-tight">{cat.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="quick-content">Content *</Label>
            <Textarea
              id="quick-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your note here..."
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Tags with Suggestions */}
          <div className="space-y-2">
            <Label htmlFor="quick-tags">Tags (comma-separated)</Label>
            
            {/* Suggested Tags */}
            {suggestedTags.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-muted-foreground mb-2">Suggested tags:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.slice(0, 10).map((tag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => handleAddTag(tag)}
                    >
                      {tag.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Textarea
              id="quick-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g., grammar, past_tense, needs_practice"
              rows={2}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Click suggested tags above or type your own (comma-separated).
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isAdding}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!selectedCategory || !content.trim() || isAdding}
          >
            {isAdding ? 'Adding...' : 'Add Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
