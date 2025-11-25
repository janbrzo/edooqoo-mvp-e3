import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, ExternalLink, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareFlashcardSetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareToken: string | null;
  setTitle: string;
}

export function ShareFlashcardSetModal({
  open,
  onOpenChange,
  shareToken,
  setTitle,
}: ShareFlashcardSetModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareUrl = shareToken 
    ? `${window.location.origin}/flashcards/${shareToken}`
    : '';

  const handleCopy = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'Share link has been copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  const handleOpenInNewTab = () => {
    if (!shareUrl) return;
    window.open(shareUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Flashcard Set</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Share this link with your student to practice "{setTitle}"
            </p>

            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                title="Copy link"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleOpenInNewTab}
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
            <p className="font-medium mb-1">📌 Note:</p>
            <ul className="space-y-1 text-xs">
              <li>• Link is valid for 1 year</li>
              <li>• Student will need to enter their email to track progress</li>
              <li>• Uses spaced repetition (SM-2 algorithm) for optimal learning</li>
            </ul>
          </div>

          <Button
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
