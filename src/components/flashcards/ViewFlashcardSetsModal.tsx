import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, Layers, BookOpen } from 'lucide-react';
import { useFlashcardSets } from '@/hooks/useFlashcardSets';
import { Badge } from '@/components/ui/badge';

interface ViewFlashcardSetsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  teacherId: string;
  studentName?: string;
}

export const ViewFlashcardSetsModal = ({
  open,
  onOpenChange,
  studentId,
  teacherId,
  studentName
}: ViewFlashcardSetsModalProps) => {
  const { sets, loading } = useFlashcardSets(studentId, teacherId);
  
  const handleOpenInNewTab = () => {
    window.open(`/student/${studentId}?tab=flashcards`, '_blank');
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-green-600" />
            Flashcard Sets {studentName && <span className="text-muted-foreground font-normal">for {studentName}</span>}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : sets.length === 0 ? (
            <div className="text-center py-8">
              <Layers className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No flashcard sets yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create one from the Vocabulary Sheet or student's profile
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {sets.map(set => (
                <div
                  key={set.id}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{set.title}</h4>
                      {set.description && (
                        <p className="text-sm text-muted-foreground truncate">{set.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Badge variant="secondary" className="text-xs">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {set.cards_count || 0}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {set.back_type === 'translation' ? 'Native' : 'Definition'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <Button 
            onClick={handleOpenInNewTab}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Flashcards Page in New Tab
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
