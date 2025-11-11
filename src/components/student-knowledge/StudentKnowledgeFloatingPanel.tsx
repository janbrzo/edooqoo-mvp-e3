import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  StudentKnowledgeEntry,
  UpdateKnowledgeEntry,
  NewKnowledgeEntry,
  KnowledgeCategory,
  KNOWLEDGE_CATEGORIES,
  parseTagsFromInput,
  formatTagForDisplay,
} from '@/types/studentKnowledge';
import { cn } from '@/lib/utils';

type PanelMode = 'add' | 'view' | 'edit';

interface StudentKnowledgeFloatingPanelProps {
  mode: PanelMode;
  isOpen: boolean;
  onClose: () => void;
  entry?: StudentKnowledgeEntry | null;
  studentId: string;
  teacherId: string;
  studentName: string;
  worksheetId?: string;
  onSave: (data: NewKnowledgeEntry | { entryId: string; updates: UpdateKnowledgeEntry }) => Promise<void>;
  suggestedTags?: string[];
  onEdit?: () => void;
}

export const StudentKnowledgeFloatingPanel = ({
  mode,
  isOpen,
  onClose,
  entry,
  studentId,
  teacherId,
  studentName,
  worksheetId,
  onSave,
  suggestedTags = [],
  onEdit,
}: StudentKnowledgeFloatingPanelProps) => {
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory>('Goals');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when entry changes or mode changes
  useEffect(() => {
    if (mode === 'edit' && entry) {
      setSelectedCategory(entry.category);
      setContent(entry.content);
      setTagsInput(entry.tags?.map(formatTagForDisplay).join(', ') || '');
    } else if (mode === 'view' && entry) {
      setSelectedCategory(entry.category);
      setContent(entry.content);
      setTagsInput(entry.tags?.map(formatTagForDisplay).join(', ') || '');
    } else if (mode === 'add') {
      setSelectedCategory('Goals');
      setContent('');
      setTagsInput('');
    }
  }, [mode, entry]);

  const handleSave = async () => {
    if (!content.trim()) return;

    setIsSaving(true);
    try {
      const tags = parseTagsFromInput(tagsInput);

      if (mode === 'edit' && entry) {
        await onSave({
          entryId: entry.id,
          updates: {
            category: selectedCategory,
            content: content.trim(),
            tags,
          },
        });
      } else if (mode === 'add') {
        const newEntry: NewKnowledgeEntry = {
          student_id: studentId,
          teacher_id: teacherId,
          category: selectedCategory,
          content: content.trim(),
          tags,
          worksheet_id: worksheetId || null,
          entry_source: worksheetId ? 'worksheet' : 'manual',
        };
        await onSave(newEntry);
      }

      onClose();
    } catch (error) {
      console.error('Error saving entry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  const isReadOnly = mode === 'view';
  const categoryMetadata = KNOWLEDGE_CATEGORIES.find((c) => c.id === selectedCategory);

  const getTitle = () => {
    if (mode === 'add') return `Add Note for ${studentName}`;
    if (mode === 'edit') return `Edit Note for ${studentName}`;
    return `Note for ${studentName}`;
  };

  const getDescription = () => {
    if (mode === 'add') return 'Add a new knowledge entry for this student';
    if (mode === 'edit') return 'Update the knowledge entry';
    return 'View knowledge entry details';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-[460px] max-h-[90vh] shadow-2xl border-2">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{getTitle()}</CardTitle>
              <CardDescription>{getDescription()}</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={isSaving}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <ScrollArea className="h-[calc(90vh-280px)]">
          <CardContent className="pt-6 space-y-6">
            {/* Category Selection */}
            <div className="space-y-3">
              <Label>Category</Label>
              <div className="grid grid-cols-3 gap-1">
                {KNOWLEDGE_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <Button
                      key={cat.id}
                      variant={isSelected ? 'default' : 'outline'}
                      className={cn(
                        'h-auto flex items-center gap-1 px-2 py-1.5',
                        isSelected && 'ring-2 ring-ring',
                        isReadOnly && 'pointer-events-none opacity-60'
                      )}
                      onClick={() => !isReadOnly && setSelectedCategory(cat.id)}
                      disabled={isReadOnly}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span className="text-[9px] font-medium leading-tight">
                        {cat.label}
                      </span>
                    </Button>
                  );
                })}
              </div>
              {categoryMetadata && (
                <p className="text-xs text-muted-foreground">
                  {categoryMetadata.description}
                </p>
              )}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your note here..."
                className="min-h-[100px] resize-none"
                disabled={isReadOnly}
                readOnly={isReadOnly}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">
                Tags <span className="text-xs text-muted-foreground">(comma separated)</span>
              </Label>
              <Textarea
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g., past simple, pronunciation, common mistakes"
                className="min-h-[40px] resize-none"
                disabled={isReadOnly}
                readOnly={isReadOnly}
              />
              {!isReadOnly && suggestedTags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Suggested tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {suggestedTags.slice(0, 8).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => {
                          const currentTags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
                          const displayTag = formatTagForDisplay(tag);
                          if (!currentTags.includes(displayTag)) {
                            setTagsInput(currentTags.length > 0 ? `${tagsInput}, ${displayTag}` : displayTag);
                          }
                        }}
                      >
                        {formatTagForDisplay(tag)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Metadata (for view/edit modes) */}
            {entry && mode !== 'add' && (
              <div className="space-y-2 pt-4 border-t">
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium">Created:</span>{' '}
                    {new Date(entry.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {entry.updated_at && entry.updated_at !== entry.created_at && (
                    <p>
                      <span className="font-medium">Updated:</span>{' '}
                      {new Date(entry.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Source:</span>{' '}
                    {entry.entry_source === 'worksheet' ? 'Added from worksheet' : 'Manually added'}
                  </p>
                  {entry.is_outdated && (
                    <p className="text-destructive">
                      <span className="font-medium">Status:</span> Outdated
                      {entry.outdated_reason && ` - ${entry.outdated_reason}`}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </ScrollArea>

        {/* Actions */}
        <div className="border-t p-4 bg-muted/30">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isSaving}>
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {mode === 'view' && onEdit && (
              <Button onClick={onEdit}>
                Edit Note
              </Button>
            )}
            {!isReadOnly && (
              <Button onClick={handleSave} disabled={isSaving || !content.trim()}>
                {isSaving ? 'Saving...' : 'Save Note'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
