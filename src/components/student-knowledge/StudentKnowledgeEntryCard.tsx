import { Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { StudentKnowledgeEntry, getCategoryMetadata, formatTagForDisplay } from '@/types/studentKnowledge';
import { format } from 'date-fns';

interface StudentKnowledgeEntryCardProps {
  entry: StudentKnowledgeEntry;
  onEdit: (entry: StudentKnowledgeEntry) => void;
  onDelete: (entryId: string) => void;
  worksheetTitle?: string;
}

export const StudentKnowledgeEntryCard = ({
  entry,
  onEdit,
  onDelete,
  worksheetTitle,
}: StudentKnowledgeEntryCardProps) => {
  const categoryMeta = getCategoryMetadata(entry.category);

  const handleWorksheetClick = () => {
    if (entry.worksheet_id) {
      window.open(`/worksheet/${entry.worksheet_id}`, '_blank');
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header: Category + Actions */}
        <div className="flex items-start justify-between mb-3">
          <Badge
            variant="outline"
            className={`${categoryMeta?.color} border gap-1.5 px-2 py-1`}
          >
            <span className="text-sm">{categoryMeta?.icon}</span>
            <span className="text-xs font-medium">{categoryMeta?.label}</span>
          </Badge>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(entry)}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this note?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this knowledge entry.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(entry.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-foreground mb-3 whitespace-pre-wrap">{entry.content}</p>

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {entry.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                {formatTagForDisplay(tag)}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer: Worksheet Link + Timestamp */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
          <div className="flex items-center gap-2">
            {entry.worksheet_id && (
              <button
                onClick={handleWorksheetClick}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <span>From: {worksheetTitle || 'Worksheet'}</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            )}
          </div>
          <span>{format(new Date(entry.created_at), 'MMM d, yyyy')}</span>
        </div>
      </CardContent>
    </Card>
  );
};
