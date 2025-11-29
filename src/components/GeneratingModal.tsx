import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface GeneratingModalProps {
  isOpen: boolean;
  requiresAudio?: boolean;  // Whether audio is REQUIRED (not if it exists)
  requiresImage?: boolean;  // Whether image is REQUIRED (not if it exists)
  hasGrammar?: boolean;     // Whether grammar was selected in form
  streamProgress?: {        // Real-time streaming progress
    exercisesGenerated: number;
    expectedTotal: number;
  } | null;
  onCancel?: () => void;
}

// Section completion status
interface SectionStatus {
  label: string;
  icon: string;
  status: 'pending' | 'generating' | 'done';
}

// Dynamic generation sections based on selected media and grammar
const getGenerationSections = (
  requiresAudio: boolean, 
  requiresImage: boolean, 
  hasGrammar: boolean
): SectionStatus[] => {
  const sections: SectionStatus[] = [];
  
  // Media first (if required by exercises)
  if (requiresAudio) {
    sections.push({ label: 'Audio', icon: '🎵', status: 'pending' });
  }
  if (requiresImage) {
    sections.push({ label: 'Image', icon: '🖼️', status: 'pending' });
  }
  
  // Core sections
  sections.push({ label: 'Warmup', icon: '🔥', status: 'pending' });
  
  // Grammar Rules - only if selected in form
  if (hasGrammar) {
    sections.push({ label: 'Grammar Rules', icon: '📘', status: 'pending' });
  }
  
  sections.push(
    { label: 'Exercises', icon: '📝', status: 'pending' },
    { label: 'Vocabulary Sheet', icon: '📚', status: 'pending' }
  );
  
  return sections;
};

export default function GeneratingModal({ 
  isOpen, 
  requiresAudio = false, 
  requiresImage = false,
  hasGrammar = true,  // Default true for backward compatibility
  streamProgress = null,
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

    // Initialize sections with grammar condition
    setSections(getGenerationSections(requiresAudio, requiresImage, hasGrammar));

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
  }, [isOpen, requiresAudio, requiresImage, hasGrammar]);

  // Update sections based on streaming progress
  useEffect(() => {
    if (!streamProgress || sections.length === 0) return;

    setSections(prev => {
      const updated = [...prev];
      const exerciseIndex = updated.findIndex(s => s.label === 'Exercises');
      
      if (exerciseIndex !== -1 && streamProgress.exercisesGenerated > 0) {
        // FIXED: Only mark sections as done when streaming actually produces exercises
        // Mark all sections before exercises as done (media + warmup + grammar)
        for (let i = 0; i < exerciseIndex; i++) {
          if (updated[i].status !== 'done') {
            updated[i].status = 'done';
          }
        }
        // Mark exercises as generating
        updated[exerciseIndex].status = 'generating';
        
        // If exercises complete, mark vocabulary as generating
        if (streamProgress.exercisesGenerated >= streamProgress.expectedTotal) {
          updated[exerciseIndex].status = 'done';
          const vocabIndex = updated.findIndex(s => s.label === 'Vocabulary Sheet');
          if (vocabIndex !== -1) {
            updated[vocabIndex].status = 'generating';
          }
        }
      }
      
      return updated;
    });
  }, [streamProgress, sections.length]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-[480px] space-y-6">
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

        {/* Section Status */}
        <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
          {sections.map((section, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className={`text-2xl transition-all duration-300 ${
                section.status === 'done' 
                  ? 'scale-100 opacity-100' 
                  : section.status === 'generating'
                    ? 'animate-bounce scale-110'
                    : 'opacity-40 grayscale'
              }`}>
                {section.status === 'done' ? '✅' : section.icon}
              </div>
              <div className="flex-1">
                <div className={`font-medium text-sm ${
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
              {section.status === 'generating' && (
                <div className="text-xs text-primary animate-pulse">Generating...</div>
              )}
              {section.status === 'done' && (
                <div className="text-xs text-green-600">Done</div>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400">
          {(requiresAudio || requiresImage) 
            ? `Expected time: ~2:30 min (with ${requiresAudio && requiresImage ? 'audio & image' : requiresAudio ? 'audio' : 'image'})` 
            : "Expected time: ~1:30 min"}
        </p>
      </div>
    </div>
  );
}
