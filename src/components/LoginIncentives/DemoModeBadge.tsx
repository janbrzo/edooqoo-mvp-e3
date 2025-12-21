import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Unlock } from 'lucide-react';

/**
 * Incentive #1: Demo Mode Badge with tooltip
 * Shows loss aversion message - what user loses by not signing up
 */
export const DemoModeBadge = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link to="/signup">
          <Badge variant="outline" className="cursor-pointer hover:bg-accent transition-colors gap-1">
            <Unlock className="h-3 w-3" />
            Demo Mode
          </Badge>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[200px]">
        <p className="text-sm">🔒 Log in to save your worksheets and get 2 free tokens!</p>
      </TooltipContent>
    </Tooltip>
  );
};
