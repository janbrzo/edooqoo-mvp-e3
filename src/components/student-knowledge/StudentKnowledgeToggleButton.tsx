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
          <div className="relative">
            <Button
              onClick={onClick}
              size="icon"
              className="fixed top-[calc(50%+40px)] right-6 p-3 rounded-full shadow-lg bg-amber-500 text-white opacity-80 hover:opacity-100 transition-opacity z-40"
            >
              <StickyNote className="h-5 w-5" />
            </Button>
            {count > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute top-[calc(50%+20px)] right-3 h-6 w-6 flex items-center justify-center p-0 text-xs bg-red-500 text-white border-2 border-background shadow-md z-50"
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
