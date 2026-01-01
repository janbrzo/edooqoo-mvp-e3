/**
 * AiEvaluationBadge - Displays AI evaluation result for open-ended answers
 * Shows quality score badge and feedback text
 */

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export interface AiEvaluation {
  is_acceptable: boolean;
  quality_score: number;
  feedback: string;
  question_index?: number;
}

interface AiEvaluationBadgeProps {
  evaluation: AiEvaluation;
  showFeedback?: boolean;
  compact?: boolean;
}

export function AiEvaluationBadge({ 
  evaluation, 
  showFeedback = true,
  compact = false 
}: AiEvaluationBadgeProps) {
  const { is_acceptable, quality_score, feedback } = evaluation;
  
  const scorePercent = Math.round(quality_score * 100);
  
  const getBadgeVariant = () => {
    if (is_acceptable) return "default";
    return "destructive";
  };
  
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

  if (compact) {
    return (
      <Badge className={`${getBadgeColor()} text-white text-xs`}>
        {getIcon()}
        {scorePercent}%
      </Badge>
    );
  }

  return (
    <div className="mt-3 space-y-2">
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
      </div>
      
      {showFeedback && feedback && (
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-muted-foreground">{feedback}</p>
        </div>
      )}
    </div>
  );
}

export default AiEvaluationBadge;
