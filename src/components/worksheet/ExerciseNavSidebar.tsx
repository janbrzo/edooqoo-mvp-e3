import React from 'react';
import { ChevronDown, ChevronUp, Menu, Clock, Eye, EyeOff } from 'lucide-react';
import { getIconComponent } from '@/utils/iconUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';
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
    <div className="h-full flex flex-col">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground font-medium">
            Exercise Navigation
          </SidebarGroupLabel>
          
          {/* Control buttons */}
          <div className="px-3 pb-3 flex gap-2">
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

          <SidebarGroupContent>
            <SidebarMenu>
              {exercises.map((exercise, index) => {
                const isActive = activeExercise === index;
                const isCollapsed = collapsedExercises.get(index);
                
                return (
                  <SidebarMenuItem key={index}>
                    <div className="w-full">
                      {/* Exercise item with scroll functionality */}
                      <SidebarMenuButton
                        onClick={() => onScrollToExercise(index)}
                        className={cn(
                          "w-full justify-start p-2 mb-1",
                          isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        )}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getIconComponent(exercise.icon)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">
                              {exercise.title || `Exercise ${index + 1}`}
                            </p>
                            {exercise.estimated_time && (
                              <div className="flex items-center gap-1 text-xs text-sidebar-foreground/60">
                                <Clock className="h-3 w-3" />
                                <span>{exercise.estimated_time}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </SidebarMenuButton>
                      
                      {/* Collapse toggle button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleExercise(index)}
                        className="w-full h-6 justify-center text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground"
                      >
                        {isCollapsed ? (
                          <>
                            <ChevronDown className="h-3 w-3 mr-1" />
                            Expand
                          </>
                        ) : (
                          <>
                            <ChevronUp className="h-3 w-3 mr-1" />
                            Collapse
                          </>
                        )}
                      </Button>
                    </div>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </div>
  );
};

export const ExerciseNavSidebar: React.FC<ExerciseNavSidebarProps> = (props) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    // Mobile: Use Sheet/Drawer
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="fixed top-4 right-4 z-50 shadow-lg"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="p-4 pb-0">
            <SheetTitle>Exercise Navigation</SheetTitle>
          </SheetHeader>
          <div className="p-4 pt-2">
            <ExerciseNavContent {...props} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Use floating Sidebar
  return (
    <>
      {/* Floating trigger button */}
      <SidebarTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed top-4 left-4 z-50 shadow-lg bg-background/95 backdrop-blur-sm"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </SidebarTrigger>

      {/* Floating sidebar */}
      <Sidebar
        variant="floating"
        className="fixed left-4 top-16 h-[calc(100vh-5rem)] w-80 z-40 shadow-lg border bg-sidebar/95 backdrop-blur-sm"
        collapsible="icon"
      >
        <ExerciseNavContent {...props} />
      </Sidebar>
    </>
  );
};