import React from 'react';
import { addDays } from 'date-fns';
import { CalendarSlot } from '@/hooks/useCalendarSlots';
import { CalendarDayColumn } from './CalendarDayColumn';

interface CalendarWeekViewProps {
  weekStart: Date;
  getSlotsForDay: (date: Date) => CalendarSlot[];
  studentMap: Record<string, string>;
  onSlotClick: (slot: CalendarSlot) => void;
  onAddSlot: (date: Date) => void;
}

export function CalendarWeekView({ weekStart, getSlotsForDay, studentMap, onSlotClick, onAddSlot }: CalendarWeekViewProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      <div className="flex overflow-x-auto">
        {days.map(date => (
          <CalendarDayColumn
            key={date.toISOString()}
            date={date}
            slots={getSlotsForDay(date)}
            studentMap={studentMap}
            onSlotClick={onSlotClick}
            onAddSlot={onAddSlot}
          />
        ))}
      </div>
    </div>
  );
}
