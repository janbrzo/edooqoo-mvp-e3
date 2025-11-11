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
          <Button
            onClick={onClick}
            size="icon"
            className="fixed bottom-40 right-6 h-12 w-12 rounded-full shadow-lg z-40 bg-amber-100 hover:bg-amber-200 text-amber-700 border-2 border-amber-300"
          >
            <div className="relative">
              <StickyNote className="h-5 w-5" />
              {count > 0 && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-amber-500 text-white border-2 border-background"
                >
                  {count > 9 ? '9+' : count}
                </Badge>
              )}
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{isOpen ? 'Hide Recent Notes' : 'Show Recent Notes'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
