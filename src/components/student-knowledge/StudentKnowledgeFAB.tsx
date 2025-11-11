import { StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StudentKnowledgeFABProps {
  onClick: () => void;
}

export const StudentKnowledgeFAB = ({ onClick }: StudentKnowledgeFABProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onClick}
          size="lg"
          className="fixed top-1/2 -translate-y-1/2 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50 bg-amber-500 hover:bg-amber-600 text-white"
        >
          <StickyNote className="h-6 w-6" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>Add Student Note</p>
      </TooltipContent>
    </Tooltip>
  );
};
