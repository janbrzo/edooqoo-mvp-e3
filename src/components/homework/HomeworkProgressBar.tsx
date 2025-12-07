import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Loader2, Unlock, Save, RotateCcw, ArrowLeft, Home, User } from 'lucide-react';
import { HomeworkProgress } from '@/types/interactiveHomework';
import { Link, useNavigate } from 'react-router-dom';

interface HomeworkProgressBarProps {
  progress: HomeworkProgress;
  isSaving: boolean;
  lastSavedAt: Date | null;
  isSubmitted: boolean;
  // Teacher edit mode props
  isTeacher?: boolean;
  teacherEditMode?: boolean;
  isSavingTeacherEdits?: boolean;
  onUnlockEdit?: () => void;
  onSaveChanges?: () => void;
  onDiscardChanges?: () => void;
  // Navigation props (Problem 3)
  studentName?: string;
  studentId?: string;
}

export const HomeworkProgressBar = ({
  progress,
  isSaving,
  lastSavedAt,
  isSubmitted,
  // Teacher edit mode
  isTeacher = false,
  teacherEditMode = false,
  isSavingTeacherEdits = false,
  onUnlockEdit,
  onSaveChanges,
  onDiscardChanges,
  // Navigation props (Problem 3)
  studentName,
  studentId
}: HomeworkProgressBarProps) => {
  const navigate = useNavigate();
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

          {/* Teacher Navigation Buttons (Problem 3) */}
          {isTeacher && (
            <div className="flex items-center gap-2 mr-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
              >
                <Link to="/dashboard">
                  <Home className="h-4 w-4 mr-1" />
                  Dashboard
                </Link>
              </Button>
              {studentId && studentName && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <Link to={`/student/${studentId}`}>
                    <User className="h-4 w-4 mr-1" />
                    {studentName}
                  </Link>
                </Button>
              )}
            </div>
          )}

          {/* Teacher Edit Mode Buttons */}
          {isTeacher && (
            <div className="flex items-center gap-2">
              {!teacherEditMode ? (
                <Button 
                  onClick={onUnlockEdit}
                  variant="outline"
                  size="sm"
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  <Unlock className="h-3 w-3 mr-1" />
                  Unlock Editing
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={onSaveChanges}
                    disabled={isSavingTeacherEdits}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isSavingTeacherEdits ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3 mr-1" />
                    )}
                    Save
                  </Button>
                  <Button 
                    onClick={onDiscardChanges}
                    disabled={isSavingTeacherEdits}
                    variant="outline"
                    size="sm"
                    className="border-red-500 text-red-600 hover:bg-red-50"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Discard
                  </Button>
                </>
              )}
            </div>
          )}

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
