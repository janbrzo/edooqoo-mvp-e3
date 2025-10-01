import { useState, useEffect, useRef, useCallback } from 'react';

interface Exercise {
  title: string;
  icon: string;
  estimated_time?: string;
}

export interface UseWorksheetNavigationProps {
  exercises: Exercise[];
}

export interface UseWorksheetNavigationReturn {
  collapsedExercises: Map<number, boolean>;
  activeExercise: number | null;
  exerciseRefs: React.MutableRefObject<(HTMLElement | null)[]>;
  toggleExercise: (index: number) => void;
  collapseAll: () => void;
  expandAll: () => void;
  scrollToExercise: (index: number) => void;
  isAllCollapsed: boolean;
  isAllExpanded: boolean;
}

export const useWorksheetNavigation = ({ exercises }: UseWorksheetNavigationProps): UseWorksheetNavigationReturn => {
  const [collapsedExercises, setCollapsedExercises] = useState<Map<number, boolean>>(new Map());
  const [activeExercise, setActiveExercise] = useState<number | null>(null);
  const exerciseRefs = useRef<(HTMLElement | null)[]>(Array(exercises.length).fill(null));

  // Initialize refs array when exercises length changes
  useEffect(() => {
    exerciseRefs.current = Array(exercises.length).fill(null);
  }, [exercises.length]);

  // Toggle individual exercise collapse state
  const toggleExercise = useCallback((index: number) => {
    setCollapsedExercises(prev => {
      const newMap = new Map(prev);
      newMap.set(index, !newMap.get(index));
      return newMap;
    });
  }, []);

  // Collapse all exercises
  const collapseAll = useCallback(() => {
    setCollapsedExercises(prev => {
      const newMap = new Map(prev);
      exercises.forEach((_, index) => {
        newMap.set(index, true);
      });
      return newMap;
    });
  }, [exercises]);

  // Expand all exercises
  const expandAll = useCallback(() => {
    setCollapsedExercises(new Map());
  }, []);

  // Smooth scroll to specific exercise
  const scrollToExercise = useCallback((index: number) => {
    const element = exerciseRefs.current[index];
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }
  }, []);

  // Intersection Observer for tracking active exercise
  useEffect(() => {
    // Delay observer setup to ensure all refs are populated
    const timeoutId = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const index = exerciseRefs.current.findIndex(ref => ref === entry.target);
              if (index !== -1) {
                setActiveExercise(index);
              }
            }
          });
        },
        {
          rootMargin: '-10% 0px -70% 0px',
          threshold: 0.1
        }
      );

      // Observe all current refs
      exerciseRefs.current.forEach((ref) => {
        if (ref) {
          observer.observe(ref);
        }
      });

      return () => {
        observer.disconnect();
      };
    }, 100); // Small delay to ensure DOM is ready

    return () => {
      clearTimeout(timeoutId);
    };
  }, [exercises.length, exerciseRefs.current]);

  // Helper computed values
  const isAllCollapsed = exercises.every((_, index) => collapsedExercises.get(index) === true);
  const isAllExpanded = exercises.every((_, index) => !collapsedExercises.get(index));

  return {
    collapsedExercises,
    activeExercise,
    exerciseRefs,
    toggleExercise,
    collapseAll,
    expandAll,
    scrollToExercise,
    isAllCollapsed,
    isAllExpanded
  };
};