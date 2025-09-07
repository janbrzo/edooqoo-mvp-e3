
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import LanguageStyleSlider from "./LanguageStyleSlider";
import ExerciseSelector from "./ExerciseSelector";
import { useIsMobile } from "@/hooks/use-mobile";
import { LessonTime } from "./types";

interface AdvancedOptionsProps {
  languageStyle: number;
  onLanguageStyleChange: (value: number) => void;
  lessonTime: LessonTime;
  autoSelectExercises: boolean;
  onAutoSelectExercisesChange: (value: boolean) => void;
  selectedExerciseTypes: string[];
  onSelectedExerciseTypesChange: (types: string[]) => void;
}

const AdvancedOptions: React.FC<AdvancedOptionsProps> = ({
  languageStyle,
  onLanguageStyleChange,
  lessonTime,
  autoSelectExercises,
  onAutoSelectExercisesChange,
  selectedExerciseTypes,
  onSelectedExerciseTypesChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('advancedOptionsOpen');
    if (savedState) {
      setIsOpen(JSON.parse(savedState));
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('advancedOptionsOpen', JSON.stringify(isOpen));
  }, [isOpen]);

  return (
    <div className={`mb-6 ${isMobile ? 'w-full' : 'w-1/2'}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
          <span className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-700 group-hover:text-gray-900`}>
            Advanced Options
          </span>
          {isOpen ? (
            <ChevronUp className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-gray-500 group-hover:text-gray-700 transition-colors`} />
          ) : (
            <ChevronDown className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-gray-500 group-hover:text-gray-700 transition-colors`} />
          )}
        </CollapsibleTrigger>
        
        <CollapsibleContent className="pt-4">
          <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-6">
            <LanguageStyleSlider 
              value={languageStyle} 
              onChange={onLanguageStyleChange} 
            />
            
            <div className="border-t pt-6">
              <h4 className={`font-medium text-gray-700 mb-4 ${isMobile ? 'text-sm' : 'text-base'}`}>
                Exercise Selection
              </h4>
              <ExerciseSelector
                autoSelectExercises={autoSelectExercises}
                onAutoSelectChange={onAutoSelectExercisesChange}
                selectedExerciseTypes={selectedExerciseTypes}
                onSelectedExerciseTypesChange={onSelectedExerciseTypesChange}
                lessonTime={lessonTime}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default AdvancedOptions;
