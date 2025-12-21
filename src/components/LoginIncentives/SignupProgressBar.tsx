import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock, Check } from 'lucide-react';

/**
 * Incentive #2: Signup Progress Bar
 * Shows gamified path: Demo → Free Account → Side-Gig → Full-Time
 */
export const SignupProgressBar = () => {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4 mt-4">
      <div className="flex items-center justify-between text-xs sm:text-sm">
        {/* Current: Demo */}
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-3 w-3 text-primary-foreground" />
          </div>
          <span className="font-medium text-foreground">Demo</span>
        </div>
        
        {/* Progress line */}
        <div className="flex-1 h-1 mx-2 bg-muted rounded">
          <div className="w-0 h-full bg-primary rounded" />
        </div>
        
        {/* Free Account - clickable with tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/signup" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <div className="w-5 h-5 rounded-full border-2 border-muted flex items-center justify-center">
                <Lock className="h-2.5 w-2.5" />
              </div>
              <span className="hidden sm:inline">Free Account</span>
              <span className="sm:hidden">Free</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Create free account to unlock worksheet saving & get 2 free tokens</p>
          </TooltipContent>
        </Tooltip>
        
        {/* Progress line */}
        <div className="flex-1 h-1 mx-2 bg-muted rounded" />
        
        {/* Side-Gig */}
        <div className="flex items-center gap-1.5 text-muted-foreground/50">
          <div className="w-5 h-5 rounded-full border-2 border-muted/50 flex items-center justify-center">
            <Lock className="h-2.5 w-2.5" />
          </div>
          <span className="hidden sm:inline">Side-Gig</span>
        </div>
        
        {/* Progress line */}
        <div className="flex-1 h-1 mx-2 bg-muted rounded" />
        
        {/* Full-Time */}
        <div className="flex items-center gap-1.5 text-muted-foreground/50">
          <div className="w-5 h-5 rounded-full border-2 border-muted/50 flex items-center justify-center">
            <Lock className="h-2.5 w-2.5" />
          </div>
          <span className="hidden sm:inline">Full-Time</span>
        </div>
      </div>
    </div>
  );
};
