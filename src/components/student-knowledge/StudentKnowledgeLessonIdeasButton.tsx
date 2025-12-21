import { Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StudentKnowledgeLessonIdeasButtonProps {
  onClick: () => void;
}

// PROBLEM 4: Swapped positions - Add Lesson Idea is now at top-[calc(50%+55px)] (below Add Note)
export const StudentKnowledgeLessonIdeasButton = ({ onClick }: StudentKnowledgeLessonIdeasButtonProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onClick}
          size="icon"
          className="fixed top-[calc(50%+55px)] right-6 p-3 rounded-full shadow-lg bg-yellow-500 text-white opacity-80 hover:opacity-100 transition-opacity z-50"
        >
          <Lightbulb className="h-5 w-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>Add Lesson Idea (I)</p>
      </TooltipContent>
    </Tooltip>
  );
};
