import React, { useState, useEffect } from 'react';
import { format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarSlot } from '@/hooks/useCalendarSlots';
import { CalendarSlotCard } from './CalendarSlotCard';

const ROW_HEIGHT = 22;
const START_HOUR = 7;
const END_HOUR = 22;
const TOTAL_HALF_HOURS = (END_HOUR - START_HOUR) * 2;

interface CalendarDayViewProps {
  date: Date;
  slots: CalendarSlot[];
  studentMap: Record<string, string>;
  onSlotClick: (slot: CalendarSlot) => void;
  onAddSlot: (date: Date, startTime?: string) => void;
}

function getSlotPosition(slot: CalendarSlot) {
  const [sh, sm] = slot.start_time.split(':').map(Number);
  const [eh, em] = slot.end_time.split(':').map(Number);
  const startMin = (sh - START_HOUR) * 60 + sm;
  const endMin = (eh - START_HOUR) * 60 + em;
  return {
    top: (startMin / 30) * ROW_HEIGHT,
    height: Math.max(((endMin - startMin) / 30) * ROW_HEIGHT, ROW_HEIGHT / 2),
  };
}

export const CalendarDayView = React.memo(function CalendarDayView({ date, slots, studentMap, onSlotClick, onAddSlot }: CalendarDayViewProps) {
  const [nowMinute, setNowMinute] = useState(() => {
    const n = new Date();
    return (n.getHours() - START_HOUR) * 60 + n.getMinutes();
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const n = new Date();
      setNowMinute((n.getHours() - START_HOUR) * 60 + n.getMinutes());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const nowTop = (nowMinute / 30) * ROW_HEIGHT;
  const showNowLine = isToday(date) && nowMinute >= 0 && nowMinute <= (END_HOUR - START_HOUR) * 60;

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const halfHourIdx = Math.floor(y / ROW_HEIGHT);
    const hour = START_HOUR + Math.floor(halfHourIdx / 2);
    const min = (halfHourIdx % 2) * 30;
    onAddSlot(date, `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      <div className={cn('text-center py-3 border-b border-border', isToday(date) && 'bg-primary/5')}>
        <div className="text-xs text-muted-foreground">{format(date, 'EEEE')}</div>
        <div className={cn('text-lg font-semibold', isToday(date) && 'text-primary')}>{format(date, 'MMMM d, yyyy')}</div>
      </div>

      <div className="flex overflow-y-auto" style={{ maxHeight: 600 }}>
        <div className="w-16 flex-shrink-0 border-r border-border">
          {Array.from({ length: TOTAL_HALF_HOURS }, (_, i) => {
            const hour = START_HOUR + Math.floor(i / 2);
            const isFullHour = i % 2 === 0;
            return (
              <div key={i} className={cn('border-b flex items-start justify-end pr-2 pt-0.5', isFullHour ? 'border-border/60' : 'border-border/10')} style={{ height: ROW_HEIGHT }}>
                {isFullHour && <span className="text-[10px] text-muted-foreground leading-none">{String(hour).padStart(2, '0')}:00</span>}
              </div>
            );
          })}
        </div>

        <div className="flex-1 relative cursor-pointer" onClick={handleGridClick} style={{ height: TOTAL_HALF_HOURS * ROW_HEIGHT }}>
          {Array.from({ length: TOTAL_HALF_HOURS }, (_, i) => (
            <div key={i} className={cn('absolute w-full border-b', i % 2 === 0 ? 'border-border/60' : 'border-border/10')} style={{ top: i * ROW_HEIGHT + ROW_HEIGHT - 1 }} />
          ))}

          {showNowLine && (
            <div className="absolute w-full z-20 flex items-center" style={{ top: nowTop }}>
              <div className="w-2.5 h-2.5 rounded-full bg-destructive -ml-1" />
              <div className="flex-1 h-0.5 bg-destructive" />
            </div>
          )}

          {slots.filter(s => s.status !== 'cancelled').map(slot => {
            const pos = getSlotPosition(slot);
            return (
              <div key={slot.id} className="absolute left-1 right-1 z-10" style={{ top: pos.top, height: pos.height }} onClick={e => e.stopPropagation()}>
                <CalendarSlotCard slot={slot} studentName={slot.student_id ? studentMap[slot.student_id] : undefined} onClick={onSlotClick} compact={pos.height < ROW_HEIGHT} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
