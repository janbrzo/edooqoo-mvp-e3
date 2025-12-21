import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface StudentKnowledgeFABProps {
  onClick: () => void;
}

// PROBLEM 4: Swapped positions - Add Student Note is now at top-[calc(50%+5px)] (above Lesson Ideas)
// Animation: Shows tooltip after 5 seconds
export const StudentKnowledgeFAB = ({ onClick }: StudentKnowledgeFABProps) => {
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setShowLabel(true);
      const hideTimer = setTimeout(() => setShowLabel(false), 2500);
      return () => clearTimeout(hideTimer);
    }, 5000);
    return () => clearTimeout(showTimer);
  }, []);

  return (
    <div className="fixed top-[calc(50%+5px)] right-6 z-50 flex items-center gap-2">
      {/* Animated label */}
      <div 
        className={`bg-amber-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg transition-all duration-300 whitespace-nowrap ${
          showLabel ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
        }`}
      >
        Add Student Note (N)
      </div>
      
      {/* Button */}
      <Button
        onClick={onClick}
        size="icon"
        className="p-3 rounded-full shadow-lg bg-amber-500 text-white opacity-80 hover:opacity-100 transition-opacity"
        title="Add Student Note (N)"
      >
        <Plus className="h-5 w-5" />
      </Button>
    </div>
  );
};
