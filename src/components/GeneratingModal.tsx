
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { StreamingProgress } from "@/hooks/useWorksheetGeneration";

interface GeneratingModalProps {
  isOpen: boolean;
  streamingProgress?: StreamingProgress | null;
}

const generationSteps = [
  "Analyzing your requirements...",
  "Researching topic-specific content...", 
  "Creating exercise structure...",
  "🎨 Generating custom AI image...", // NEW: Image generation step
  "Generating reading comprehension...",
  "Creating vocabulary exercises...",
  "Developing grammar activities...",
  "Designing interactive tasks...",
  "Adding teacher guidance...",
  "Optimizing content difficulty...",
  "Finalizing worksheet layout...",
  "Quality checking exercises...",
  "Preparing downloadable content...",
  "Almost ready..."
];

export default function GeneratingModal({ isOpen, streamingProgress }: GeneratingModalProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setCurrentStep(0);
      setElapsedTime(0);
      return;
    }

    // If we have real streaming progress, use it
    if (streamingProgress) {
      const { elapsedTime: realTime, estimatedExercise, totalExercises } = streamingProgress;
      
      // Update elapsed time from real data
      setElapsedTime(realTime);
      
      // Calculate progress based on exercise completion
      if (totalExercises && totalExercises > 0) {
        const exerciseProgress = (estimatedExercise / totalExercises) * 100;
        setProgress(Math.min(exerciseProgress, 95)); // Cap at 95%
      }
      
      // Update current step based on progress
      const stepIndex = Math.min(
        Math.floor((estimatedExercise / (totalExercises || 8)) * generationSteps.length),
        generationSteps.length - 1
      );
      setCurrentStep(stepIndex);
      
      return; // Don't run fake timers when we have real data
    }

    // Fallback: Use fake progress animation (when streaming not available)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          return Math.min(prev + Math.random() * 0.5, 99);
        } else if (prev >= 80) {
          return prev + Math.random() * 1;
        } else if (prev >= 60) {
          return prev + Math.random() * 2;
        } else {
          return prev + Math.random() * 3;
        }
      });
    }, 800);

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= generationSteps.length - 1) {
          return Math.floor(Math.random() * 3) + generationSteps.length - 3;
        }
        return prev + 1;
      });
    }, Math.random() * 5000 + 3000);

    const timerInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      clearInterval(timerInterval);
    };
  }, [isOpen, streamingProgress]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-[450px] space-y-6">
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
        
        <p className="text-center min-h-[24px] animate-pulse font-normal text-sky-400">
          {streamingProgress && streamingProgress.totalExercises 
            ? `Generating exercise ${streamingProgress.estimatedExercise + 1} of ${streamingProgress.totalExercises}...`
            : generationSteps[currentStep]
          }
        </p>
        
        <p className="text-center text-xs text-gray-400">
          It can take up to 1:30 min
        </p>
      </div>
    </div>
  );
}
