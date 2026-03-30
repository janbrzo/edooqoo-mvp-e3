/**
 * AiEvaluationBadge - Displays AI evaluation result for open-ended answers
 * Shows quality score badge and feedback text
 * In Live Session: also shows thumbs up/down feedback buttons for teachers
 */

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import { AiEvalFeedbackButtons } from "./AiEvalFeedbackButtons";

export interface AiEvaluation {
  is_acceptable: boolean;
  quality_score: number;
  feedback: string;
  question_index?: number;
  writing_score?: number;
  speaking_score?: number;
}

interface AiEvaluationBadgeProps {
  evaluation: AiEvaluation;
  showFeedback?: boolean;
  compact?: boolean;
  // Live Session feedback props (optional)
  isLiveSession?: boolean;
  worksheetId?: string;
  exerciseIndex?: number;
  exerciseType?: string;
  teacherId?: string;
}

export function AiEvaluationBadge({ 
  evaluation, 
  showFeedback = true,
  compact = false,
  isLiveSession = false,
  worksheetId,
  exerciseIndex,
  exerciseType,
  teacherId
}: AiEvaluationBadgeProps) {
  const { is_acceptable, quality_score, feedback } = evaluation;
  const questionIndex = evaluation.question_index ?? 0;
  
  // Pending state: quality_score < 0 means waiting for AI evaluation
  if (quality_score < 0) {
    return (
      <div className="mt-3">
        <Badge className="bg-gray-400 hover:bg-gray-500 text-white">
          <Clock className="h-3 w-3 mr-1 animate-pulse" />
          Waiting for AI evaluation...
        </Badge>
      </div>
    );
  }
  
  const scorePercent = Math.round(quality_score * 100);
  
  const getBadgeColor = () => {
    if (quality_score >= 0.8) return "bg-green-500 hover:bg-green-600";
    if (quality_score >= 0.7) return "bg-emerald-500 hover:bg-emerald-600";
    if (quality_score >= 0.5) return "bg-amber-500 hover:bg-amber-600";
    return "bg-red-500 hover:bg-red-600";
  };
  
  const getIcon = () => {
    if (is_acceptable) {
      return <CheckCircle2 className="h-3 w-3 mr-1" />;
    }
    return <XCircle className="h-3 w-3 mr-1" />;
  };

  const showThumbButtons = isLiveSession && worksheetId && exerciseIndex !== undefined && exerciseType && teacherId;

  if (compact) {
    return (
      <Badge className={`${getBadgeColor()} text-white text-xs`}>
        {getIcon()}
        {scorePercent}%
      </Badge>
    );
  }

  return (
    <div className="mt-2 space-y-0.5">
      <div className="flex items-center gap-2">
        <Badge className={`${getBadgeColor()} text-white`}>
          {getIcon()}
          AI Score: {scorePercent}%
        </Badge>
        {is_acceptable ? (
          <span className="text-xs text-green-600 dark:text-green-400">Acceptable</span>
        ) : (
          <span className="text-xs text-red-600 dark:text-red-400">Needs improvement</span>
        )}
        {/* Live Session: teacher feedback thumbs */}
        {showThumbButtons && (
          <AiEvalFeedbackButtons
            worksheetId={worksheetId}
            exerciseIndex={exerciseIndex}
            questionIndex={questionIndex}
            exerciseType={exerciseType}
            qualityScore={quality_score}
            teacherId={teacherId}
          />
        )}
      </div>
      
      {showFeedback && feedback && (
        <div className="flex items-start gap-1.5 px-1.5 pt-1 pb-0.5 bg-muted/50 rounded-lg text-xs">
          <AlertCircle className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
          <span className="text-muted-foreground leading-tight block">{feedback}</span>
        </div>
      )}
    </div>
  );
}

export default AiEvaluationBadge;
