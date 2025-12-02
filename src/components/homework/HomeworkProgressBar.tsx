import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { HomeworkProgress } from '@/types/interactiveHomework';

interface HomeworkProgressBarProps {
  progress: HomeworkProgress;
  isSaving: boolean;
  lastSavedAt: Date | null;
  isSubmitted: boolean;
}

export const HomeworkProgressBar = ({
  progress,
  isSaving,
  lastSavedAt,
  isSubmitted
}: HomeworkProgressBarProps) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Progress info */}
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">
                  Progress: {progress.answeredExercises}/{progress.totalExercises} exercises
                </span>
                <span className="text-sm text-muted-foreground">
                  {progress.percentageComplete}%
                </span>
              </div>
              <Progress value={progress.percentageComplete} className="h-2" />
            </div>
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-2">
            {isSubmitted ? (
              <Badge className="bg-green-500 text-white">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Submitted
              </Badge>
            ) : (
              <>
                {isSaving ? (
                  <Badge variant="secondary" className="animate-pulse">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Saving...
                  </Badge>
                ) : lastSavedAt ? (
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    Saved at {formatTime(lastSavedAt)}
                  </Badge>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
