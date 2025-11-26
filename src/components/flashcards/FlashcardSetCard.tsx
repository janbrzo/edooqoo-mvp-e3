import { Edit, Share2, Trash2, BookOpen, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FlashcardSet } from '@/types/flashcards';
import { ShareFlashcardSetModal } from './ShareFlashcardSetModal';
import { useState } from 'react';

interface FlashcardSetCardProps {
  set: FlashcardSet;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => Promise<string | null>;
  onAddCard?: () => void;
}

export function FlashcardSetCard({ set, onEdit, onDelete, onShare, onAddCard }: FlashcardSetCardProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(set.share_token);

  const handleShare = async () => {
    if (!shareToken) {
      const token = await onShare();
      setShareToken(token);
    }
    setIsShareModalOpen(true);
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle 
                className="text-lg line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                onClick={onEdit}
              >
                {set.title}
              </CardTitle>
              {set.description && (
                <CardDescription className="line-clamp-2 mt-1">
                  {set.description}
                </CardDescription>
              )}
            </div>
            <BookOpen className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {set.cards_count || 0} cards
              </Badge>
              {set.is_bidirectional && (
                <Badge variant="outline">Bidirectional</Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="flex-1"
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex-1"
              >
                <Share2 className="w-3 h-3 mr-1" />
                Share
              </Button>
              {onAddCard && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddCard}
                  className="flex-1"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ShareFlashcardSetModal
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        shareToken={shareToken}
        setTitle={set.title}
      />
    </>
  );
}
