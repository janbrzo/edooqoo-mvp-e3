import React, { useState } from 'react';
import { Menu, Clock, Eye, EyeOff } from 'lucide-react';
import { getIconComponent } from '@/utils/iconUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Exercise {
  title: string;
  icon: string;
  estimated_time?: string;
}

interface ExerciseNavSidebarProps {
  exercises: Exercise[];
  activeExercise: number | null;
  collapsedExercises: Map<number, boolean>;
  onScrollToExercise: (index: number) => void;
  onToggleExercise: (index: number) => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  isAllCollapsed: boolean;
  isAllExpanded: boolean;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

const ExerciseNavContent: React.FC<ExerciseNavSidebarProps> = ({
  exercises,
  activeExercise,
  collapsedExercises,
  onScrollToExercise,
  onToggleExercise,
  onCollapseAll,
  onExpandAll,
  isAllCollapsed,
  isAllExpanded
}) => {
  return (
    <div className="h-full flex flex-col p-4">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-foreground mb-2">
          Exercise Navigation
        </h3>
        
        {/* Control buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={isAllExpanded ? onCollapseAll : onExpandAll}
            className="flex-1 h-8 text-xs"
          >
            {isAllExpanded ? (
              <>
                <EyeOff className="h-3 w-3 mr-1" />
                Collapse All
              </>
            ) : (
              <>
                <Eye className="h-3 w-3 mr-1" />
                Expand All
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {exercises.map((exercise, index) => {
            const isActive = activeExercise === index;
            
            return (
              <Button
                key={index}
                variant={isActive ? "secondary" : "ghost"}
                onClick={() => onScrollToExercise(index)}
                className="w-full justify-start p-2 h-auto"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getIconComponent(exercise.icon)}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm truncate">
                      {exercise.title || `Exercise ${index + 1}`}
                    </p>
                    {exercise.estimated_time && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{exercise.estimated_time}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const ExerciseNavSidebar: React.FC<ExerciseNavSidebarProps> = (props) => {
  const isMobile = useIsMobile();
  const [localIsOpen, setLocalIsOpen] = useState(false);
  
  // Use controlled state if provided, otherwise use local state
  const isOpen = props.isOpen !== undefined ? props.isOpen : localIsOpen;
  const setIsOpen = props.setIsOpen || setLocalIsOpen;

  // Close sidebar when clicking outside (desktop only)
  React.useEffect(() => {
    if (!isMobile && isOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element;
        if (target && !target.closest('.nav-sidebar') && !target.closest('.nav-menu-button')) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, isMobile, setIsOpen]);

  // Eye icon + Numbered scroll buttons - always visible above menu (vertical layout)
  const NumberedScrollButtons = () => (
    <div className="fixed top-16 left-4 z-50 flex flex-col gap-1">
      {/* Eye icon for Expand/Collapse All */}
      <Button
        variant="outline"
        size="sm"
        onClick={props.isAllExpanded ? props.onCollapseAll : props.onExpandAll}
        className={cn(
          "w-8 h-8 p-0 shadow-lg bg-background/95 backdrop-blur-sm",
          "hover:bg-worksheet-purple hover:text-white"
        )}
        title={props.isAllExpanded ? "Collapse All" : "Expand All"}
      >
        {props.isAllExpanded ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </Button>
      
      {/* Numbered buttons for each exercise */}
      {props.exercises.map((_, index) => (
        <Button
          key={index}
          variant={props.activeExercise === index ? "default" : "outline"}
          size="sm"
          onClick={() => props.onScrollToExercise(index)}
          className={cn(
            "w-8 h-8 p-0 text-xs font-medium shadow-lg bg-background/95 backdrop-blur-sm",
            props.activeExercise === index && "bg-worksheet-purple hover:bg-worksheet-purpleDark text-white"
          )}
        >
          {index + 1}
        </Button>
      ))}
    </div>
  );

  if (isMobile) {
    // Mobile: Use Sheet/Drawer + numbered buttons
    return (
      <>
        <NumberedScrollButtons />
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="fixed top-4 left-4 z-50 shadow-lg"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <SheetHeader className="p-4 pb-0">
              <SheetTitle>Exercise Navigation</SheetTitle>
            </SheetHeader>
            <ExerciseNavContent {...props} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop: Use floating div with manual state + numbered buttons
  return (
    <>
      <NumberedScrollButtons />
      
      {/* Floating trigger button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 shadow-lg bg-background/95 backdrop-blur-sm nav-menu-button"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Floating sidebar */}
      {isOpen && (
        <div className="fixed left-4 top-16 h-[calc(100vh-5rem)] w-80 z-40 shadow-lg border bg-background/95 backdrop-blur-sm rounded-lg nav-sidebar">
          <ExerciseNavContent {...props} />
        </div>
      )}
    </>
  );
};