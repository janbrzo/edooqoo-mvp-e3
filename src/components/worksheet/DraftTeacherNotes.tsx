import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, X, Save } from "lucide-react";

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

  return (
    <div className="fixed bottom-4 left-[340px] z-[100] bg-white border-2 border-amber-300 rounded-lg shadow-xl p-3 w-72">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-amber-700 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Draft Notes
          {!isSaved && <span className="text-xs text-muted-foreground">(saving...)</span>}
          {isSaved && notes && <Save className="h-3 w-3 text-green-500" />}
        </span>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Notes area */}
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Personal notes for this lesson... (auto-saved locally)"
        className="min-h-[100px] text-sm resize-none border-amber-200 focus:border-amber-400"
      />
      
      <p className="text-xs text-muted-foreground mt-2">
        These notes are saved locally in your browser and won't be shared.
      </p>
    </div>
  );
};

export default DraftTeacherNotes;