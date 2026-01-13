import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Circle, Loader2, CheckCircle2 } from "lucide-react";

interface GeneratingModalProps {
  isOpen: boolean;
  requiresAudio?: boolean;  // Whether audio is REQUIRED (not if it exists)
  requiresImage?: boolean;  // Whether image is REQUIRED (not if it exists)
  hasGrammar?: boolean;     // Whether grammar was selected in form
  streamProgress?: {        // Real-time streaming progress
    exercisesGenerated: number;
    expectedTotal: number;
  } | null;
  mediaGenerating?: boolean; // NEW: Whether media is currently being generated
  onCancel?: () => void;
  selectedExercises?: string[]; // PROBLEM 5: List of selected exercise types
}

// Section completion status
interface SectionStatus {
  label: string;
  status: 'pending' | 'generating' | 'done';
  isExerciseItem?: boolean; // PROBLEM 5: Flag for individual exercise items
  exerciseIndex?: number;    // PROBLEM 5: Exercise number (1-8)
}

// Format exercise type to readable name
const formatExerciseType = (type: string): string => {
  return type
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Dynamic generation sections based on selected media and grammar
const getGenerationSections = (
  requiresAudio: boolean, 
  requiresImage: boolean, 
  hasGrammar: boolean,
  selectedExercises?: string[]
): SectionStatus[] => {
  const sections: SectionStatus[] = [];
  
  // Media first (if required by exercises)
  if (requiresAudio) {
    sections.push({ label: 'Audio', status: 'pending' });
  }
  if (requiresImage) {
    sections.push({ label: 'Image', status: 'pending' });
  }
  
  // Core sections
  sections.push({ label: 'Warmup', status: 'pending' });
  
  // Grammar Rules - only if selected in form
  if (hasGrammar) {
    sections.push({ label: 'Grammar Rules', status: 'pending' });
  }
  
  // PROBLEM 5: Add individual exercise items if we have selectedExercises
  if (selectedExercises && selectedExercises.length > 0) {
    sections.push({ label: 'Exercises', status: 'pending' });
    
    // Add each exercise as a sub-item
    selectedExercises.forEach((exerciseType, idx) => {
      sections.push({
        label: `Exercise ${idx + 1}: ${formatExerciseType(exerciseType)}`,
        status: 'pending',
        isExerciseItem: true,
        exerciseIndex: idx
      });
    });
  } else {
    // Fallback if no selectedExercises provided
    sections.push({ label: 'Exercises', status: 'pending' });
  }
  
  sections.push({ label: 'Vocabulary Sheet', status: 'pending' });
  
  return sections;
};

export default function GeneratingModal({ 
  isOpen, 
  requiresAudio = false, 
  requiresImage = false,
  hasGrammar = true,  // Default true for backward compatibility
  streamProgress = null,
  mediaGenerating = false,
  selectedExercises,
}: GeneratingModalProps) {
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sections, setSections] = useState<SectionStatus[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setElapsedTime(0);
      setSections([]);
      return;
    }

    // Initialize sections with grammar condition and selected exercises
    setSections(getGenerationSections(requiresAudio, requiresImage, hasGrammar, selectedExercises));

    // Dynamic total duration: 150s with media, 90s without
    const totalDuration = (requiresAudio || requiresImage) ? 150 : 90;
    const progressIncrement = 100 / totalDuration;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + progressIncrement;
        return Math.min(newProgress, 99);
      });
    }, 1000);

    // Timer - counts real time
    const timerInterval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(timerInterval);
    };
  }, [isOpen, requiresAudio, requiresImage, hasGrammar, selectedExercises]);

  // Update sections based on progress - SEQUENTIAL ACTIVATION with exercise details
  useEffect(() => {
    if (sections.length === 0) return;

    setSections(prev => {
      const updated = [...prev];
      const hasMedia = requiresAudio || requiresImage;
      const warmupIndex = updated.findIndex(s => s.label === 'Warmup');
      const grammarIndex = updated.findIndex(s => s.label === 'Grammar Rules');
      const exercisesHeaderIndex = updated.findIndex(s => s.label === 'Exercises');
      const vocabIndex = updated.findIndex(s => s.label === 'Vocabulary Sheet');
      
      // PHASE 1: Media generating
      if (hasMedia && mediaGenerating) {
        for (let i = 0; i < updated.length; i++) {
          if (updated[i].label === 'Audio' || updated[i].label === 'Image') {
            updated[i].status = 'generating';
          }
        }
        return updated;
      }
      
      // PHASE 2A: Media done OR no media - Warmup+Grammar generating
      // (before first exercise)
      if ((!hasMedia || !mediaGenerating) && (!streamProgress || streamProgress.exercisesGenerated === 0)) {
        // Mark media as done (if exists)
        for (let i = 0; i < updated.length; i++) {
          if (updated[i].label === 'Audio' || updated[i].label === 'Image') {
            updated[i].status = 'done';
          }
        }
        // Activate Warmup + Grammar (they generate before exercises)
        if (warmupIndex !== -1) updated[warmupIndex].status = 'generating';
        if (grammarIndex !== -1) updated[grammarIndex].status = 'generating';
        return updated;
      }
      
      // PHASE 3: Exercises generating (exercisesGenerated > 0)
      if (streamProgress && streamProgress.exercisesGenerated > 0) {
        // All prior sections done
        for (let i = 0; i < updated.length; i++) {
          if (['Audio', 'Image', 'Warmup', 'Grammar Rules'].includes(updated[i].label)) {
            updated[i].status = 'done';
          }
        }
        
        // Exercises header - generating while any exercise is in progress
        if (exercisesHeaderIndex !== -1) {
          if (streamProgress.exercisesGenerated >= streamProgress.expectedTotal) {
            updated[exercisesHeaderIndex].status = 'done';
          } else {
            updated[exercisesHeaderIndex].status = 'generating';
          }
        }
        
        // PROBLEM 5: Update individual exercise statuses
        updated.forEach((section, idx) => {
          if (section.isExerciseItem && section.exerciseIndex !== undefined) {
            const exIdx = section.exerciseIndex;
            if (exIdx < streamProgress.exercisesGenerated - 1) {
              // Completed exercises
              updated[idx].status = 'done';
            } else if (exIdx === streamProgress.exercisesGenerated - 1) {
              // Current exercise just completed
              updated[idx].status = 'done';
            } else if (exIdx === streamProgress.exercisesGenerated) {
              // Currently generating
              updated[idx].status = 'generating';
            }
            // else: still pending
          }
        });
        
        // If all exercises done - Vocabulary generating
        if (streamProgress.exercisesGenerated >= streamProgress.expectedTotal) {
          if (vocabIndex !== -1) updated[vocabIndex].status = 'generating';
        }
      }
      
      return updated;
    });
  }, [streamProgress, mediaGenerating, sections.length, requiresAudio, requiresImage]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-[520px] space-y-6">
        <h2 className="text-2xl font-semibold text-center bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
          Generating Your Worksheet
        </h2>

        <Progress
          value={progress}
          className="h-3 bg-gray-200"
          indicatorClassName="bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500"
        />

        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Time: {formatTime(elapsedTime)}</span>
          <span>{Math.round(progress)}%</span>
        </div>

        {/* Section Status - PROBLEM 5: Enhanced with exercise list */}
        <div className="space-y-2 bg-muted/30 p-4 rounded-lg max-h-[400px] overflow-y-auto">
          {sections.map((section, index) => (
            <div 
              key={index} 
              className={`flex items-center gap-3 ${section.isExerciseItem ? 'ml-6' : ''}`}
            >
              {/* Status Icon: Circle (pending), Loader2 (generating), CheckCircle2 (done) */}
              <div className={`flex items-center justify-center ${section.isExerciseItem ? 'w-6 h-6' : 'w-8 h-8'}`}>
                {section.status === 'pending' && (
                  <Circle className={`${section.isExerciseItem ? 'h-4 w-4' : 'h-6 w-6'} text-muted-foreground stroke-[1.5]`} />
                )}
                {section.status === 'generating' && (
                  <Loader2 className={`${section.isExerciseItem ? 'h-4 w-4' : 'h-6 w-6'} text-primary animate-spin`} />
                )}
                {section.status === 'done' && (
                  <CheckCircle2 className={`${section.isExerciseItem ? 'h-4 w-4' : 'h-6 w-6'} text-green-600`} />
                )}
              </div>
              <div className="flex-1">
                <div className={`font-medium ${section.isExerciseItem ? 'text-xs' : 'text-sm'} ${
                  section.status === 'generating' 
                    ? 'text-primary' 
                    : section.status === 'done'
                      ? 'text-green-600'
                      : 'text-muted-foreground'
                }`}>
                  {section.label}
                  {section.label === 'Exercises' && streamProgress && (
                    <span className="ml-2 font-bold">
                      ({streamProgress.exercisesGenerated}/{streamProgress.expectedTotal})
                    </span>
                  )}
                </div>
              </div>
              {section.status === 'generating' && !section.isExerciseItem && (
                <div className="text-xs text-primary animate-pulse">Generating...</div>
              )}
              {section.status === 'done' && !section.isExerciseItem && (
                <div className="text-xs text-green-600">Done</div>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400">
          {(requiresAudio || requiresImage) 
            ? `Expected time: ~1:30 min (with ${requiresAudio && requiresImage ? 'audio & image' : requiresAudio ? 'audio' : 'image'})` 
            : "Expected time: ~60s"}
        </p>
      </div>
    </div>
  );
}
