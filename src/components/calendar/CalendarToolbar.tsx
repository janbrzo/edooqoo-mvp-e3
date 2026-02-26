import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Settings, Share2 } from 'lucide-react';
import { format } from 'date-fns';

interface CalendarToolbarProps {
  weekStart: Date;
  weekEnd: Date;
  onNavigate: (dir: 'prev' | 'next' | 'today') => void;
  onAddSlot: () => void;
  onSettings: () => void;
  onShare?: () => void;
}

export function CalendarToolbar({ weekStart, weekEnd, onNavigate, onAddSlot, onSettings, onShare }: CalendarToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onNavigate('prev')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onNavigate('today')}>
          Today
        </Button>
        <Button variant="outline" size="sm" onClick={() => onNavigate('next')}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium ml-2">
          {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {onShare && (
          <Button variant="outline" size="sm" onClick={onShare}>
            <Share2 className="h-4 w-4 mr-1" /> Share
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onSettings}>
          <Settings className="h-4 w-4 mr-1" /> Settings
        </Button>
        <Button size="sm" onClick={onAddSlot} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" /> Add Slot
        </Button>
      </div>
    </div>
  );
}
