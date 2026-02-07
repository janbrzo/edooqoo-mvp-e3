// ============================================
// FAZA 3: Progress Bar for Shared Worksheet Study Mode
// ============================================

import { Progress } from '@/components/ui/progress';
import { CheckCircle, Loader2 } from 'lucide-react';
import { SharedWorksheetProgress } from '@/types/interactiveSharedWorksheet';

interface SharedWorksheetProgressBarProps {
  progress: SharedWorksheetProgress;
  isSaving: boolean;
  lastSavedAt: Date | null;
}

export const SharedWorksheetProgressBar = ({
  progress,
  isSaving,
  lastSavedAt
}: SharedWorksheetProgressBarProps) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">
              Progress: {progress.answeredExercises} / {progress.totalExercises} exercises
            </span>
            {progress.totalTasks > 0 && (
              <>
                <span className="text-xs text-gray-400">|</span>
                <span className="text-xs text-gray-500">
                  {progress.answeredTasks}/{progress.totalTasks} tasks
                </span>
              </>
            )}
            <span className="text-xs text-gray-400">|</span>
            <span className="text-sm text-worksheet-purple font-semibold">
              {progress.percentageComplete}%
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            {isSaving ? (
              <span className="flex items-center gap-1 text-amber-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : lastSavedAt ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                Saved at {formatTime(lastSavedAt)}
              </span>
            ) : null}
          </div>
        </div>
        
        <Progress 
          value={progress.percentageComplete} 
          className="h-2"
        />
      </div>
    </div>
  );
};
