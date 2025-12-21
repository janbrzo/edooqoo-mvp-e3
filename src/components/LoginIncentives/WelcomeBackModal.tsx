import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpen, X } from 'lucide-react';

interface WelcomeBackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Incentive #5: Welcome Back Modal
 * Shows personalized message when returning anonymous user comes back
 */
export const WelcomeBackModal = ({ open, onOpenChange }: WelcomeBackModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Welcome back!
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Log in to see your previous worksheets and continue your work.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 pt-4">
          <Button asChild>
            <Link to="/signup">Create Free Account</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/login">I already have an account</Link>
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground">
            Continue as guest
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
