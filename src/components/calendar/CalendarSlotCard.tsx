import React from 'react';
import { cn } from '@/lib/utils';
import { CalendarSlot } from '@/hooks/useCalendarSlots';
import { FileText, Clock } from 'lucide-react';

interface CalendarSlotCardProps {
  slot: CalendarSlot;
  studentName?: string;
  onClick: (slot: CalendarSlot) => void;
  compact?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200',
  booked: 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200',
  completed: 'bg-muted border-border text-muted-foreground',
  cancelled: 'bg-red-50 border-red-200 text-red-400 line-through opacity-60',
  no_show: 'bg-red-100 border-red-300 text-red-700',
};

export function CalendarSlotCard({ slot, studentName, onClick, compact }: CalendarSlotCardProps) {
  const isPending = slot.status === 'booked' && !slot.confirmed_at;
  const style = isPending
    ? 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200'
    : STATUS_STYLES[slot.status] || STATUS_STYLES.available;

  const startHH = slot.start_time.slice(0, 5);
  const endHH = slot.end_time.slice(0, 5);

  return (
    <button
      onClick={() => onClick(slot)}
      className={cn(
        'w-full text-left rounded-md border px-2 py-1 text-xs transition-colors cursor-pointer truncate',
        style
      )}
    >
      <div className="flex items-center gap-1 font-medium">
        <Clock className="h-3 w-3 flex-shrink-0" />
        <span>{startHH}–{endHH}</span>
        {slot.worksheet_id && <FileText className="h-3 w-3 flex-shrink-0 ml-auto" />}
      </div>
      {!compact && studentName && (
        <div className="truncate mt-0.5 text-[10px] opacity-80">{studentName}</div>
      )}
      {!compact && slot.title && (
        <div className="truncate mt-0.5 text-[10px] opacity-80">{slot.title}</div>
      )}
    </button>
  );
}
