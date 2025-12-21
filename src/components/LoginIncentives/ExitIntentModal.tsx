import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpen, Check } from 'lucide-react';

interface ExitIntentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Incentive #9: Exit Intent Modal
 * Shows when user moves cursor to leave the page
 */
export const ExitIntentModal = ({ open, onOpenChange }: ExitIntentModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-6 w-6 text-primary" />
            Wait! Don't lose your progress
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Create a free account in 30 seconds and get:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span>2 free worksheet tokens</span>
          </div>
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span>Save all your worksheets</span>
          </div>
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span>Manage unlimited students</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <Button asChild size="lg">
            <Link to="/signup">Create Free Account</Link>
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground">
            No thanks, I'll continue browsing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
