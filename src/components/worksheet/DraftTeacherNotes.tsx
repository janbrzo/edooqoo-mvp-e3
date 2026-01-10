import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FileText, X, Save, Minus, ChevronUp, ChevronDown } from "lucide-react";

interface DraftTeacherNotesProps {
  worksheetId?: string;
  isVisible: boolean;
  onClose?: () => void;
}

export const DraftTeacherNotes: React.FC<DraftTeacherNotesProps> = ({
  worksheetId,
  isVisible,
  onClose,
}) => {
  const storageKey = `draft-teacher-notes-${worksheetId || 'default'}`;
  const [notes, setNotes] = useState('');
  const [isSaved, setIsSaved] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (worksheetId) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setNotes(saved);
      }
    }
  }, [worksheetId, storageKey]);

  // Auto-save on change with debounce
  useEffect(() => {
    if (!worksheetId) return;
    
    setIsSaved(false);
    const timer = setTimeout(() => {
      localStorage.setItem(storageKey, notes);
      setIsSaved(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [notes, worksheetId, storageKey]);

  if (!isVisible) return null;
  
  // PROBLEM 7: Minimized state - show only a small button
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-20 z-[100]">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setIsMinimized(false)}
              size="icon"
              className="rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg h-12 w-12"
            >
              <FileText className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Open Draft Notes</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="fixed bottom-4 left-[440px] z-[100] bg-white border-2 border-amber-300 rounded-lg shadow-xl p-3 w-72">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-amber-700 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Draft Notes
              {!isSaved && <span className="text-xs text-muted-foreground">(saving...)</span>}
              {isSaved && notes && <Save className="h-3 w-3 text-green-500" />}
            </span>
            <div className="flex items-center gap-1">
              {/* PROBLEM 6B: Expand/collapse button */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="h-6 w-6 p-0"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
              {/* Minimize button */}
              <Button variant="ghost" size="sm" onClick={() => setIsMinimized(true)} className="h-6 w-6 p-0">
                <Minus className="h-4 w-4" />
              </Button>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* PROBLEM 6B: Dynamic height - single line by default, expandable */}
          {isExpanded ? (
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Personal notes for this lesson..."
              className="min-h-[100px] text-sm resize-none border-amber-200 focus:border-amber-400"
            />
          ) : (
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Personal notes for this lesson..."
              className="h-9 text-sm border-amber-200 focus:border-amber-400"
            />
          )}
        </div>
      </TooltipTrigger>
      {/* PROBLEM 6B: Tooltip shows the "saved locally" message */}
      <TooltipContent side="top" className="max-w-[250px]">
        <p>These notes are saved locally in your browser and won't be shared.</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default DraftTeacherNotes;
