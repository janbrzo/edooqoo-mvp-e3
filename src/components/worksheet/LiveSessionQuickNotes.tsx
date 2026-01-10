import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Send, 
  User, 
  Target, 
  StickyNote, 
  Lightbulb, 
  MoreHorizontal,
  X,
  Minus,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudentKnowledge } from "@/hooks/useStudentKnowledge";
import { toast } from "sonner";
import { KnowledgeCategory, KNOWLEDGE_CATEGORIES } from "@/types/studentKnowledge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LiveSessionQuickNotesProps {
  studentId: string;
  teacherId: string;
  worksheetId?: string;
  studentName?: string;
  isVisible: boolean;
  onClose?: () => void;
}

// Quick category buttons to show (using IDs that match KnowledgeCategory type)
const QUICK_CATEGORIES: { category: KnowledgeCategory; icon: React.ReactNode; label: string }[] = [
  { category: 'Personal Info', icon: <User className="h-4 w-4" />, label: 'Personal' },
  { category: 'To Practice', icon: <Target className="h-4 w-4" />, label: 'To Practice' },
  { category: 'Notes', icon: <StickyNote className="h-4 w-4" />, label: 'Notes' },
  { category: 'Next Lesson Ideas', icon: <Lightbulb className="h-4 w-4" />, label: 'Next Lesson' },
];

// Remaining categories for dropdown (exclude quick categories)
const QUICK_CATEGORY_IDS = QUICK_CATEGORIES.map(qc => qc.category);
const REMAINING_CATEGORIES = KNOWLEDGE_CATEGORIES.filter(
  cat => !QUICK_CATEGORY_IDS.includes(cat.id)
);

export const LiveSessionQuickNotes: React.FC<LiveSessionQuickNotesProps> = ({
  studentId,
  teacherId,
  worksheetId,
  studentName,
  isVisible,
  onClose,
}) => {
  const [noteText, setNoteText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory>('Notes');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const { addEntry } = useStudentKnowledge({ studentId, teacherId });

  const handleSubmit = async () => {
    if (!noteText.trim()) {
      toast.error('Please enter a note');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addEntry({
        content: noteText.trim(),
        category: selectedCategory,
        worksheet_id: worksheetId,
        entry_source: 'worksheet',
      });
      
      toast.success(`Added to ${selectedCategory}`);
      setNoteText('');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isVisible) return null;
  
  // PROBLEM 7: Minimized state - show only a small button
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 z-[100]">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setIsMinimized(false)}
              size="icon"
              className="rounded-full bg-primary text-primary-foreground shadow-lg h-12 w-12"
            >
              <StickyNote className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Open Quick Notes</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-[100] bg-white border-2 border-primary/30 rounded-lg shadow-xl p-3 w-[420px]">
      {/* Header with minimize and close buttons */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-primary flex items-center gap-2">
          <StickyNote className="h-4 w-4" />
          Quick Note {studentName && <span className="text-muted-foreground text-xs">for {studentName}</span>}
        </span>
        <div className="flex items-center gap-1">
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
      
      {/* PROBLEM 6A: Horizontal layout - icons next to input */}
      <div className="flex items-center gap-1">
        {/* Quick Category Buttons */}
        {QUICK_CATEGORIES.map(({ category, icon, label }) => (
          <Tooltip key={category}>
            <TooltipTrigger asChild>
              <Button
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "h-9 w-9 p-0 flex-shrink-0",
                  selectedCategory === category && "bg-primary text-primary-foreground"
                )}
              >
                {icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {/* More categories dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 w-9 p-0 flex-shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {REMAINING_CATEGORIES.map((cat) => (
              <DropdownMenuItem
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(selectedCategory === cat.id && "bg-accent")}
              >
                {cat.icon} {cat.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Input */}
        <Input
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`Add ${selectedCategory.toLowerCase()} note...`}
          className="flex-1 h-9 text-sm min-w-0"
          disabled={isSubmitting}
        />
        
        {/* Send button */}
        <Button 
          onClick={handleSubmit} 
          size="sm" 
          className="h-9 w-9 p-0 flex-shrink-0"
          disabled={isSubmitting || !noteText.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default LiveSessionQuickNotes;
