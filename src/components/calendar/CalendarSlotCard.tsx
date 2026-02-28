import React from 'react';
import { cn } from '@/lib/utils';
import { CalendarSlot } from '@/hooks/useCalendarSlots';
import { FileText, Clock, User, Check } from 'lucide-react';

interface CalendarSlotCardProps {
  slot: CalendarSlot;
  studentName?: string;
  onClick: (slot: CalendarSlot) => void;
  compact?: boolean;
  isSelected?: boolean;
  selectionMode?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200 dark:bg-green-900/40 dark:border-green-700 dark:text-green-300',
  booked: 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-300',
  completed: 'bg-muted border-border text-muted-foreground',
  cancelled: 'bg-red-50 border-red-200 text-red-400 line-through opacity-60 dark:bg-red-900/20 dark:border-red-800',
  no_show: 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/40 dark:border-red-700 dark:text-red-300',
};

export const CalendarSlotCard = React.memo(function CalendarSlotCard({ slot, studentName, onClick, compact, isSelected, selectionMode }: CalendarSlotCardProps) {
  const isPending = slot.status === 'booked' && !slot.confirmed_at;
  const style = isPending
    ? 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-300'
    : STATUS_STYLES[slot.status] || STATUS_STYLES.available;

  const startHH = slot.start_time.slice(0, 5);
  const endHH = slot.end_time.slice(0, 5);

  return (
    <button
      onClick={() => onClick(slot)}
      className={cn(
        'w-full h-full text-left rounded-md border px-1.5 py-0.5 text-[11px] transition-all cursor-pointer truncate relative',
        'hover:shadow-md hover:scale-[1.01]',
        style,
        isSelected && 'ring-2 ring-primary bg-primary/20'
      )}
    >
      {/* Selection checkbox overlay */}
      {selectionMode && !slot.student_id && (
        <div className="absolute top-0.5 right-0.5 z-10">
          <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center',
            isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/50 bg-background'
          )}>
            {isSelected && <Check className="h-3 w-3" />}
          </div>
        </div>
      )}
      <div className="flex items-center gap-1 font-medium leading-tight">
        <Clock className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">{startHH}–{endHH}</span>
        {slot.worksheet_id && <FileText className="h-3 w-3 flex-shrink-0 ml-auto" />}
      </div>
      {!compact && studentName && (
        <div className="flex items-center gap-0.5 truncate mt-0.5 text-[10px] opacity-80">
          <User className="h-2.5 w-2.5 flex-shrink-0" />
          <span className="truncate">{studentName}</span>
        </div>
      )}
      {!compact && !studentName && slot.title && (
        <div className="truncate mt-0.5 text-[10px] opacity-80">{slot.title}</div>
      )}
    </button>
  );
});
