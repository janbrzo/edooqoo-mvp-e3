import { Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface StudentKnowledgeLessonIdeasButtonProps {
  onClick: () => void;
}

// Add Lesson Idea button - shows animated label immediately for 10 seconds
export const StudentKnowledgeLessonIdeasButton = ({ onClick }: StudentKnowledgeLessonIdeasButtonProps) => {
  const [showLabel, setShowLabel] = useState(true); // Show immediately

  useEffect(() => {
    // Hide after 10 seconds
    const hideTimer = setTimeout(() => setShowLabel(false), 10000);
    return () => clearTimeout(hideTimer);
  }, []);

  return (
    <div className="fixed top-[calc(50%+55px)] right-6 z-50 flex items-center gap-2">
      {/* Animated label */}
      <div 
        className={`bg-yellow-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg transition-all duration-300 whitespace-nowrap ${
          showLabel ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
        }`}
      >
        Add Lesson Idea (I)
      </div>
      
      {/* Button */}
      <Button
        onClick={onClick}
        size="icon"
        className="p-3 rounded-full shadow-lg bg-yellow-500 text-white opacity-80 hover:opacity-100 transition-opacity"
        title="Add Lesson Idea (I)"
      >
        <Lightbulb className="h-5 w-5" />
      </Button>
    </div>
  );
};
