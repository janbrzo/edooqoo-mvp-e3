import { StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StudentKnowledgeToggleButtonProps {
  count: number;
  isOpen: boolean;
  onClick: () => void;
}

export const StudentKnowledgeToggleButton = ({
  count,
  isOpen,
  onClick,
}: StudentKnowledgeToggleButtonProps) => {
  if (count === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="fixed top-[calc(50%+35px)] right-6 z-40">
            <Button
              onClick={onClick}
              size="icon"
              className="relative p-3 rounded-full shadow-lg bg-amber-500 text-white opacity-80 hover:opacity-100 transition-opacity"
            >
              <StickyNote className="h-5 w-5" />
            </Button>
            {count > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs bg-red-500 text-white border-2 border-background shadow-md z-10"
              >
                {count > 9 ? '9+' : count}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{isOpen ? 'Hide Recent Notes' : 'Show Recent Notes'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
