import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface StudentKnowledgeFABProps {
  onClick: () => void;
}

// Add Student Note button - shows animated label immediately for 10 seconds
export const StudentKnowledgeFAB = ({ onClick }: StudentKnowledgeFABProps) => {
  const [showLabel, setShowLabel] = useState(true); // Show immediately

  useEffect(() => {
    // Hide after 10 seconds
    const hideTimer = setTimeout(() => setShowLabel(false), 10000);
    return () => clearTimeout(hideTimer);
  }, []);

  return (
    <div className="fixed top-[calc(50%+5px)] right-6 z-[100] flex items-center gap-2">
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
        
      >
        <Plus className="h-5 w-5" />
      </Button>
    </div>
  );
};
