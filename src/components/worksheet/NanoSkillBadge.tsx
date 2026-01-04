import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X } from "lucide-react";

export interface NanoSkill {
  name: string;
  confidence: number;
  reason: string;
}

interface NanoSkillBadgeProps {
  nanoSkill: NanoSkill | null | undefined;
  isEditing?: boolean;
  onEdit?: (newSkill: NanoSkill) => void;
  className?: string;
}

const NanoSkillBadge: React.FC<NanoSkillBadgeProps> = ({
  nanoSkill,
  isEditing = false,
  onEdit,
  className = "",
}) => {
  const [isEditPopoverOpen, setIsEditPopoverOpen] = useState(false);
  const [editedSkill, setEditedSkill] = useState<NanoSkill | null>(null);

  if (!nanoSkill) return null;

  // Format: ns.grammar.third_person_s -> "third person s"
  const formatDisplayName = (name: string): string => {
    return name
      .replace(/^ns\.[a-z_]+\./, "") // remove prefix like "ns.grammar."
      .replace(/_/g, " ");
  };

  const displayName = formatDisplayName(nanoSkill.name);
  const confidencePercent = Math.round(nanoSkill.confidence * 100);

  // Color based on confidence
  const getBadgeColor = (confidence: number): string => {
    if (confidence >= 0.8) return "bg-green-50 text-green-700 border-green-200";
    if (confidence >= 0.5) return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-gray-50 text-gray-600 border-gray-200";
  };

  const handleEditStart = () => {
    setEditedSkill({ ...nanoSkill });
    setIsEditPopoverOpen(true);
  };

  const handleEditSave = () => {
    if (editedSkill && onEdit) {
      onEdit(editedSkill);
    }
    setIsEditPopoverOpen(false);
  };

  const handleEditCancel = () => {
    setEditedSkill(null);
    setIsEditPopoverOpen(false);
  };

  return (
    <TooltipProvider>
      <div className={`inline-flex items-center gap-1 ${className}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={`text-xs cursor-help ${getBadgeColor(nanoSkill.confidence)}`}
            >
              {displayName} ({confidencePercent}%)
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium text-xs">{nanoSkill.name}</p>
              <p className="text-xs">{nanoSkill.reason}</p>
              <p className="text-xs text-muted-foreground">
                Confidence: {confidencePercent}%
              </p>
            </div>
          </TooltipContent>
        </Tooltip>

        {isEditing && onEdit && (
          <Popover open={isEditPopoverOpen} onOpenChange={setIsEditPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={handleEditStart}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Edit Nano Skill</h4>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Skill Name</label>
                  <Input
                    value={editedSkill?.name || ""}
                    onChange={(e) =>
                      setEditedSkill((prev) =>
                        prev ? { ...prev, name: e.target.value } : null
                      )
                    }
                    placeholder="ns.grammar.example"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">
                    Confidence (0.0 - 1.0)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={editedSkill?.confidence || 0}
                    onChange={(e) =>
                      setEditedSkill((prev) =>
                        prev
                          ? { ...prev, confidence: parseFloat(e.target.value) || 0 }
                          : null
                      )
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Reason</label>
                  <Input
                    value={editedSkill?.reason || ""}
                    onChange={(e) =>
                      setEditedSkill((prev) =>
                        prev ? { ...prev, reason: e.target.value } : null
                      )
                    }
                    placeholder="Why this skill..."
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditCancel}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleEditSave}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </TooltipProvider>
  );
};

export default NanoSkillBadge;
