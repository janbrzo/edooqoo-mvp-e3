
import React from "react";
import { Eye, Database, Pencil, Star, User, Lightbulb, Clock, RefreshCw, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExerciseHeaderProps {
  icon: string;
  title: string;
  isEditing: boolean;
  time: number;
  onTitleChange: (value: string) => void;
  // Regeneration props
  canRegenerate?: boolean;
  isRegenerating?: boolean;
  onRegenerateClick?: () => void;
  // Exercise management props
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
}

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case "fa-book-open":
      return <Eye className="h-5 w-5" />;
    case "fa-link":
      return <Database className="h-5 w-5" />;
    case "fa-pencil-alt":
      return <Pencil className="h-5 w-5" />;
    case "fa-check-square":
      return <Star className="h-5 w-5" />;
    case "fa-comments":
      return <User className="h-5 w-5" />;
    case "fa-question-circle":
      return <Lightbulb className="h-5 w-5" />;
    default:
      return <Eye className="h-5 w-5" />;
  }
};

const ExerciseHeader: React.FC<ExerciseHeaderProps> = ({
  icon,
  title,
  isEditing,
  time,
  onTitleChange,
  canRegenerate = false,
  isRegenerating = false,
  onRegenerateClick,
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp,
  onMoveDown,
  onDelete
}) => (
  <div className="bg-worksheet-purple text-white p-2 flex justify-between items-center exercise-header">
    <div className="flex items-center">
      <div className="p-2 bg-white/20 rounded-full mr-3">
        {getIconComponent(icon)}
      </div>
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={e => onTitleChange(e.target.value)}
              className="bg-transparent border-b border-white/30 text-white w-full p-1"
            />
          ) : title}
        </h3>
        {canRegenerate && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRegenerateClick}
            disabled={isRegenerating}
            className="text-yellow-300 hover:bg-white/20 hover:text-yellow-200 h-8 px-2 gap-1 transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span className="text-xs">Regenerate</span>
          </Button>
        )}
      </div>
    </div>
    <div className="flex items-center gap-1">
      {/* Exercise management buttons - only visible in editing mode */}
      {isEditing && (
        <>
          {onMoveUp && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className="text-white hover:bg-white/20 h-8 w-8 p-0 transition-colors"
              title="Move up"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}
          {onMoveDown && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className="text-white hover:bg-white/20 h-8 w-8 p-0 transition-colors"
              title="Move down"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-red-300 hover:bg-red-500/20 hover:text-red-200 h-8 w-8 p-0 transition-colors"
              title="Delete exercise"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </>
      )}
      <div className="flex items-center bg-white/20 px-3 py-1 rounded-md ml-2">
        <Clock className="h-4 w-4 mr-1" />
        <span className="text-sm">{time} min</span>
      </div>
    </div>
  </div>
);

export default ExerciseHeader;
