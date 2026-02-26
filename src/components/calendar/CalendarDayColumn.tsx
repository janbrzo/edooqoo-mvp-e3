import React from 'react';
import { format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarSlot } from '@/hooks/useCalendarSlots';
import { CalendarSlotCard } from './CalendarSlotCard';
import { Plus } from 'lucide-react';

interface CalendarDayColumnProps {
  date: Date;
  slots: CalendarSlot[];
  studentMap: Record<string, string>;
  onSlotClick: (slot: CalendarSlot) => void;
  onAddSlot: (date: Date) => void;
}

export function CalendarDayColumn({ date, slots, studentMap, onSlotClick, onAddSlot }: CalendarDayColumnProps) {
  const today = isToday(date);

  return (
    <div className={cn(
      'flex-1 min-w-[120px] border-r last:border-r-0 border-border',
      today && 'bg-primary/5'
    )}>
      {/* Day header */}
      <div className={cn(
        'text-center py-2 border-b border-border sticky top-0 z-10 bg-background',
        today && 'bg-primary/10'
      )}>
        <div className="text-xs text-muted-foreground">{format(date, 'EEE')}</div>
        <div className={cn(
          'text-sm font-semibold',
          today && 'text-primary'
        )}>
          {format(date, 'd MMM')}
        </div>
      </div>

      {/* Slots */}
      <div className="p-1 space-y-1 min-h-[200px]">
        {slots
          .sort((a, b) => a.start_time.localeCompare(b.start_time))
          .map(slot => (
            <CalendarSlotCard
              key={slot.id}
              slot={slot}
              studentName={slot.student_id ? studentMap[slot.student_id] : undefined}
              onClick={onSlotClick}
            />
          ))}

        {/* Add slot button */}
        <button
          onClick={() => onAddSlot(date)}
          className="w-full flex items-center justify-center gap-1 rounded-md border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 py-2 text-xs transition-colors"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>
    </div>
  );
}
