import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CalendarSlot } from '@/hooks/useCalendarSlots';
import { format, parseISO } from 'date-fns';
import { Check, X, Trash2, FileText, ExternalLink, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SlotDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: CalendarSlot | null;
  studentName?: string;
  onUpdate: (id: string, updates: Partial<CalendarSlot>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const STATUS_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  available: { label: 'Available', variant: 'outline' },
  booked: { label: 'Booked', variant: 'default' },
  completed: { label: 'Completed', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  no_show: { label: 'No Show', variant: 'destructive' },
};

export function SlotDetailModal({ open, onOpenChange, slot, studentName, onUpdate, onDelete }: SlotDetailModalProps) {
  const [notes, setNotes] = useState(slot?.notes || '');
  const [confirming, setConfirming] = useState(false);
  const navigate = useNavigate();

  if (!slot) return null;

  const isPending = slot.status === 'booked' && !slot.confirmed_at;
  const badge = STATUS_BADGES[slot.status] || STATUS_BADGES.available;

  const handleConfirm = async () => {
    await onUpdate(slot.id, { confirmed_at: new Date().toISOString() } as any);
  };

  const handleStatusChange = async (status: string) => {
    const updates: any = { status };
    if (status === 'cancelled') {
      updates.cancelled_at = new Date().toISOString();
      updates.cancelled_by = 'teacher';
    }
    await onUpdate(slot.id, updates);
    onOpenChange(false);
  };

  const handleSaveNotes = async () => {
    await onUpdate(slot.id, { notes } as any);
  };

  const handleDelete = async () => {
    if (confirming) {
      await onDelete(slot.id);
      onOpenChange(false);
    } else {
      setConfirming(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Slot Details
            <Badge variant={isPending ? 'outline' : badge.variant} className={isPending ? 'border-amber-400 text-amber-700 bg-amber-50' : ''}>
              {isPending ? 'Pending Confirmation' : badge.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium">{format(parseISO(slot.slot_date), 'EEEE, MMM d, yyyy')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time</span>
            <span className="font-medium">{slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}</span>
          </div>
          {studentName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Student</span>
              <span className="font-medium">{studentName}</span>
            </div>
          )}
          {slot.title && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Title</span>
              <span className="font-medium">{slot.title}</span>
            </div>
          )}
          {slot.worksheet_id && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Worksheet</span>
              <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => navigate(`/worksheet/${slot.worksheet_id}`)}>
                <FileText className="h-3 w-3 mr-1" /> Open <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}

          <div>
            <span className="text-muted-foreground">Notes</span>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="mt-1" />
            {notes !== (slot.notes || '') && (
              <Button size="sm" variant="outline" className="mt-1" onClick={handleSaveNotes}>Save Notes</Button>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* Pending confirmation */}
          {isPending && (
            <Button size="sm" onClick={handleConfirm} className="bg-green-600 hover:bg-green-700 text-white">
              <Check className="h-4 w-4 mr-1" /> Confirm
            </Button>
          )}

          {/* Status actions */}
          {slot.status === 'booked' && slot.confirmed_at && (
            <>
              <Button size="sm" variant="outline" onClick={() => handleStatusChange('completed')}>
                <Check className="h-4 w-4 mr-1" /> Complete
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleStatusChange('no_show')}>
                <AlertTriangle className="h-4 w-4 mr-1" /> No Show
              </Button>
            </>
          )}

          {slot.status !== 'cancelled' && slot.status !== 'completed' && (
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleStatusChange('cancelled')}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
          )}

          <Button size="sm" variant="ghost" className="text-destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-1" /> {confirming ? 'Confirm Delete?' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
