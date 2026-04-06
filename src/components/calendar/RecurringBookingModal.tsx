import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AutoResizeTextarea } from '@/components/ui/AutoResizeTextarea';
import { CalendarNotification } from '@/hooks/useCalendarNotifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, Ban, Loader2, Calendar, Info } from 'lucide-react';
import { format } from 'date-fns';

interface Student {
  id: string;
  name: string;
}

interface RecurringBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notification: CalendarNotification;
  teacherId: string;
  students: Student[];
  onDone: () => void;
}

interface SlotInfo {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: string;
  confirmed_at: string | null;
  student_id: string | null;
}

export function RecurringBookingModal({ open, onOpenChange, notification, teacherId, students, onDone }: RecurringBookingModalProps) {
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');

  const slotIds = (notification.metadata as any)?.slot_ids || [];
  const studentName = notification.student_name || 'Student';
  const studentEmail = (notification.metadata as any)?.student_email || '';

  useEffect(() => {
    if (!open || slotIds.length === 0) return;
    setLoading(true);
    supabase.from('calendar_slots')
      .select('id, slot_date, start_time, end_time, status, confirmed_at, student_id')
      .in('id', slotIds)
      .order('slot_date', { ascending: true })
      .then(({ data }) => {
        setSlots((data || []) as SlotInfo[]);
        setLoading(false);
      });
  }, [open, notification.id]);

  const pendingSlots = slots.filter(s => s.status === 'booked' && !s.confirmed_at);
  const pendingIds = pendingSlots.map(s => s.id);

  const handleConfirmAll = async () => {
    if (pendingIds.length === 0) return;
    setActionInProgress(true);
    try {
      const { error } = await supabase.from('calendar_slots')
        .update({ confirmed_at: new Date().toISOString() } as any)
        .in('id', pendingIds)
        .eq('teacher_id', teacherId);
      if (error) throw error;

      // Log + GCal sync
      for (const id of pendingIds) {
        supabase.from('calendar_slot_logs').insert({
          slot_id: id, teacher_id: teacherId, action: 'confirmed', actor: 'teacher',
          details: { batch: true, recurring: true, comment: comment || undefined },
        } as any).then(() => {});
        supabase.functions.invoke('gcal-sync', {
          body: { teacherId, slotId: id, action: 'upsert' },
        }).catch(console.error);
      }

      // Resolve notification
      await supabase.from('calendar_notifications')
        .update({ is_resolved: true, resolved_action: 'approved' } as any)
        .eq('id', notification.id);

      // Send confirmation email
      try {
        const firstSlot = pendingSlots[0];
        if (firstSlot) {
          await supabase.functions.invoke('send-calendar-notification-email', {
            body: {
              teacherId,
              slotId: firstSlot.id,
              type: 'booking_confirmation',
              confirmationComment: comment || undefined,
            },
          });
        }
      } catch (_) {}

      toast.success(`Confirmed ${pendingIds.length} recurring lessons`);
      onDone();
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleRejectAll = async () => {
    if (pendingIds.length === 0) return;
    if (!window.confirm(`Reject all ${pendingIds.length} recurring bookings?`)) return;
    setActionInProgress(true);
    try {
      const { error } = await supabase.from('calendar_slots')
        .update({
          status: 'available', student_id: null, booked_at: null,
          booked_by: null, confirmed_at: null, student_notes: null, title: null,
        } as any)
        .in('id', pendingIds)
        .eq('teacher_id', teacherId);
      if (error) throw error;

      for (const id of pendingIds) {
        supabase.from('calendar_slot_logs').insert({
          slot_id: id, teacher_id: teacherId, action: 'rejected', actor: 'teacher',
          details: { batch: true, recurring: true, comment: comment || undefined },
        } as any).then(() => {});
        supabase.functions.invoke('gcal-sync', {
          body: { teacherId, slotId: id, action: 'cancel' },
        }).catch(console.error);
      }

      await supabase.from('calendar_notifications')
        .update({ is_resolved: true, resolved_action: 'rejected' } as any)
        .eq('id', notification.id);

      // Send rejection email
      try {
        const firstSlot = pendingSlots[0];
        if (firstSlot) {
          await supabase.functions.invoke('send-calendar-notification-email', {
            body: {
              teacherId,
              slotId: firstSlot.id,
              type: 'booking_rejected',
              rejectionReason: comment || undefined,
            },
          });
        }
      } catch (_) {}

      toast.success(`Rejected ${pendingIds.length} recurring bookings`);
      onDone();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject');
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Recurring Booking Request
          </DialogTitle>
          <DialogDescription>
            {studentName} {studentEmail && `(${studentEmail})`} requested {slotIds.length} recurring lessons.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Slot list */}
            <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2">
              {slots.map(s => {
                const isPending = s.status === 'booked' && !s.confirmed_at;
                const isConfirmed = s.status === 'booked' && !!s.confirmed_at;
                return (
                  <div key={s.id} className="flex items-center justify-between text-xs py-1 border-b last:border-b-0">
                    <span className="font-medium">
                      {format(new Date(s.slot_date), 'EEE, MMM d')} · {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                    </span>
                    <span className={isPending ? 'text-amber-600' : isConfirmed ? 'text-green-600' : 'text-muted-foreground'}>
                      {isPending ? 'Pending' : isConfirmed ? 'Confirmed' : s.status}
                    </span>
                  </div>
                );
              })}
            </div>

            {pendingIds.length < slotIds.length && pendingIds.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {slotIds.length - pendingIds.length} of {slotIds.length} lessons already confirmed or changed.
                Actions below apply to {pendingIds.length} pending lessons only.
              </p>
            )}

            {pendingIds.length === 0 && (
              <p className="text-xs text-muted-foreground">All lessons have already been confirmed or changed.</p>
            )}

            <div className="flex items-start gap-2 bg-muted/50 rounded-md p-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>You can also confirm or reject individual lessons by clicking on them in the calendar.</span>
            </div>

            {/* Inline comment */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="recurring-comment" checked={showComment} onChange={e => setShowComment(e.target.checked)} className="h-3.5 w-3.5 rounded" />
                <label htmlFor="recurring-comment" className="text-xs text-muted-foreground cursor-pointer">Add comment</label>
              </div>
              {showComment && (
                <AutoResizeTextarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Optional note for the student..." rows={2} className="text-xs" />
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button size="sm" onClick={handleConfirmAll} disabled={actionInProgress || pendingIds.length === 0} className="bg-green-600 hover:bg-green-700 text-white text-xs">
            <Check className="h-3 w-3 mr-1" /> {actionInProgress ? 'Processing...' : `Confirm All (${pendingIds.length})`}
          </Button>
          <Button size="sm" variant="outline" onClick={handleRejectAll} disabled={actionInProgress || pendingIds.length === 0} className="text-destructive text-xs">
            <Ban className="h-3 w-3 mr-1" /> Reject All ({pendingIds.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
