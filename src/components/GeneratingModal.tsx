import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface GeneratingModalProps {
  isOpen: boolean;
  hasAudio?: boolean;  // ✅ Nowy prop
  hasImage?: boolean;  // ✅ Nowy prop
}

// NEW: Dynamic generation steps based on selected media
const getGenerationSteps = (hasAudio: boolean, hasImage: boolean) => {
  const steps = ["Analyzing your requirements..."];
  
  // Add media steps only if media is selected
  if (hasAudio) {
    steps.push("🎵 Generating audio recording... (40-45s)");
  }
  if (hasImage) {
    steps.push("🎨 Creating custom AI image... (35-40s)");
  }
  
  // Always add exercise generation steps
  steps.push(
    "📝 Generating reading passage...",
    "✏️ Creating vocabulary exercises...",
    "📚 Developing grammar activities...",
    "🎯 Designing interactive tasks...",
    "👨‍🏫 Adding teacher guidance...",
    "⚙️ Optimizing content difficulty...",
    "📄 Finalizing worksheet layout...",
    "✅ Quality checking exercises...",
    "📦 Preparing downloadable content...",
    "🎉 Almost ready..."
  );
  
  return steps;
};

export default function GeneratingModal({ isOpen, hasAudio = false, hasImage = false }: GeneratingModalProps) {
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

    // Dynamic total duration: 150s with media, 90s without
    const totalDuration = (hasAudio || hasImage) ? 150 : 90;
    const progressIncrement = 100 / totalDuration; // Rozproszone na całkowity czas

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + progressIncrement;
        return Math.min(newProgress, 99); // Maksymalnie 99% do zakończenia
      });
    }, 1000); // Co sekundę

    // Get dynamic steps based on media selection
    const generationSteps = getGenerationSteps(hasAudio, hasImage);

    // Realistic step progression - varies between 3-8 seconds per step
    const stepInterval = setInterval(
      () => {
        setCurrentStep((prev) => {
          if (prev >= generationSteps.length - 1) {
            return Math.floor(Math.random() * 3) + generationSteps.length - 3; // Stay in last 3 steps
          }
          return prev + 1;
        });
      },
      Math.random() * 5000 + 3000,
    ); // Between 3-8 seconds

    // Timer - counts real time
    const timerInterval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      clearInterval(timerInterval);
    };
  }, [isOpen, hasAudio, hasImage]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
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
          {getGenerationSteps(hasAudio, hasImage)[currentStep]}
        </p>

        <p className="text-center text-xs text-gray-400">
          {(hasAudio || hasImage) 
            ? `It can take up to 2:30 min. (with ${hasAudio && hasImage ? 'audio & image' : hasAudio ? 'audio' : 'image'})` 
            : "It can take up to 1:30 min."}
        </p>
      </div>
    </div>
  );
}
