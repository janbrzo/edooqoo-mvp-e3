import { Plus } from 'lucide-react';
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
          size="icon"
          className="fixed top-[calc(50%-40px)] right-6 p-3 rounded-full shadow-lg bg-amber-500 text-white opacity-80 hover:opacity-100 transition-opacity z-50"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>Add Student Note</p>
      </TooltipContent>
    </Tooltip>
  );
};
