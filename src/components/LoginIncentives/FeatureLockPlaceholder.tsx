import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock, User } from 'lucide-react';

/**
 * Incentive #6 & #10: Feature Lock Placeholder
 * Shows locked student selector for anonymous users with CTA
 */
export const FeatureLockPlaceholder = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link 
          to="/signup"
          className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/50 text-muted-foreground cursor-pointer hover:bg-muted transition-colors w-full"
        >
          <Lock className="h-4 w-4" />
          <User className="h-4 w-4" />
          <span className="text-sm">Log in to track students →</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p>🔒 Log in to assign worksheets to students and track their progress</p>
      </TooltipContent>
    </Tooltip>
  );
};
