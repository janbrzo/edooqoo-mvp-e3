import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarSlot } from '@/hooks/useCalendarSlots';
import { format, differenceInMinutes } from 'date-fns';
import { Check, X, Trash2, FileText, ExternalLink, AlertTriangle, Link2, Undo2, UserMinus, Repeat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Student {
  id: string;
  name: string;
}

interface SlotDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: CalendarSlot | null;
  studentName?: string;
  students: Student[];
  onUpdate: (id: string, updates: Partial<CalendarSlot>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onLinkWorksheet?: (slot: CalendarSlot) => void;
}

const STATUS_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  available: { label: 'Available', variant: 'outline' },
  booked: { label: 'Booked', variant: 'default' },
  completed: { label: 'Completed', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  no_show: { label: 'No Show', variant: 'destructive' },
};

export function SlotDetailModal({ open, onOpenChange, slot, studentName, students, onUpdate, onDelete, onLinkWorksheet }: SlotDetailModalProps) {
  const navigate = useNavigate();

  // Editable fields
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStudentId, setEditStudentId] = useState<string>('none');
  const [showStudentSelect, setShowStudentSelect] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset on slot change
  useEffect(() => {
    if (slot) {
      setEditDate(slot.slot_date);
      setEditStartTime(slot.start_time.slice(0, 5));
      setEditEndTime(slot.end_time.slice(0, 5));
      setEditTitle(slot.title || '');
      setEditNotes(slot.notes || '');
      setEditStudentId(slot.student_id || 'none');
      setShowStudentSelect(false);
      setConfirming(false);
    }
  }, [slot?.id, open]);

  if (!slot) return null;

  const isPending = slot.status === 'booked' && !slot.confirmed_at;
  const badge = STATUS_BADGES[slot.status] || STATUS_BADGES.available;
  const hasStudent = editStudentId !== 'none';
  const isRecurring = !!slot.recurrence_rule_id;

  const canUndoCancel = slot.status === 'cancelled' && slot.cancelled_at &&
    differenceInMinutes(new Date(), new Date(slot.cancelled_at)) < 30;

  const hasChanges = editDate !== slot.slot_date ||
    editStartTime !== slot.start_time.slice(0, 5) ||
    editEndTime !== slot.end_time.slice(0, 5) ||
    editTitle !== (slot.title || '') ||
    editNotes !== (slot.notes || '') ||
    editStudentId !== (slot.student_id || 'none');

  const resetChanges = () => {
    setEditDate(slot.slot_date);
    setEditStartTime(slot.start_time.slice(0, 5));
    setEditEndTime(slot.end_time.slice(0, 5));
    setEditTitle(slot.title || '');
    setEditNotes(slot.notes || '');
    setEditStudentId(slot.student_id || 'none');
    setShowStudentSelect(false);
  };

  const handleCancel = () => {
    resetChanges();
    onOpenChange(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const updates: any = {
      slot_date: editDate,
      start_time: editStartTime,
      end_time: editEndTime,
      title: editTitle || null,
      notes: editNotes || null,
    };

    // Handle student change
    if (editStudentId !== (slot.student_id || 'none')) {
      if (editStudentId === 'none') {
        updates.student_id = null;
        updates.status = 'available';
        updates.booked_at = null;
        updates.booked_by = null;
        updates.confirmed_at = null;
      } else {
        updates.student_id = editStudentId;
        updates.status = 'booked';
        updates.booked_at = new Date().toISOString();
        updates.booked_by = 'teacher';
        updates.confirmed_at = new Date().toISOString();
      }
    }

    await onUpdate(slot.id, updates);
    setSaving(false);
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    await onUpdate(slot.id, { confirmed_at: new Date().toISOString() } as any);
    onOpenChange(false);
  };

  const handleUndoCancel = async () => {
    await onUpdate(slot.id, {
      status: slot.student_id ? 'booked' : 'available',
      cancelled_at: null, cancelled_by: null, cancellation_reason: null,
    } as any);
    onOpenChange(false);
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

  const handleDelete = async () => {
    if (confirming) {
      await onDelete(slot.id);
      onOpenChange(false);
    } else {
      setConfirming(true);
    }
  };

  const handleEditSeries = async () => {
    if (!slot.recurrence_rule_id) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const updates: any = {
      start_time: editStartTime,
      end_time: editEndTime,
      title: editTitle || null,
      notes: editNotes || null,
    };
    if (editStudentId !== (slot.student_id || 'none')) {
      if (editStudentId === 'none') {
        updates.student_id = null;
        updates.status = 'available';
      } else {
        updates.student_id = editStudentId;
        updates.status = 'booked';
        updates.confirmed_at = new Date().toISOString();
      }
    }
    const { error } = await supabase
      .from('calendar_slots')
      .update(updates)
      .eq('recurrence_rule_id', slot.recurrence_rule_id)
      .gte('slot_date', today)
      .neq('status', 'completed');
    if (error) {
      toast.error('Failed to update series');
    } else {
      toast.success('Series updated');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {hasStudent ? `Lesson` : 'Available Slot'}
            <Badge variant={isPending ? 'outline' : badge.variant} className={isPending ? 'border-amber-400 text-amber-700 bg-amber-50' : ''}>
              {isPending ? 'Pending' : badge.label}
            </Badge>
            {isRecurring && (
              <Badge variant="outline" className="text-xs">
                <Repeat className="h-3 w-3 mr-0.5" /> Recurring
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Student section */}
          {hasStudent && !showStudentSelect ? (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <Label className="text-xs text-muted-foreground">Student</Label>
                <div className="font-medium text-sm truncate">{students.find(s => s.id === editStudentId)?.name || studentName}</div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowStudentSelect(true)}>
                  Change
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => setEditStudentId('none')}>
                  <UserMinus className="h-3 w-3 mr-0.5" /> Remove
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <Label className="text-xs">{hasStudent ? 'Change Student' : 'Assign Student'}</Label>
              <div className="flex gap-2">
                <Select value={editStudentId} onValueChange={v => { setEditStudentId(v); setShowStudentSelect(false); }}>
                  <SelectTrigger className="h-9 flex-1">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No student (Available)</SelectItem>
                    {students.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {showStudentSelect && (
                  <Button variant="ghost" size="sm" className="h-9" onClick={() => { setEditStudentId(slot.student_id || 'none'); setShowStudentSelect(false); }}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Date + Time */}
          <div>
            <Label className="text-xs">Date</Label>
            <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="h-9" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Start</Label>
              <Input type="time" value={editStartTime} onChange={e => setEditStartTime(e.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">End</Label>
              <Input type="time" value={editEndTime} onChange={e => setEditEndTime(e.target.value)} className="h-9" />
            </div>
          </div>

          {/* Title */}
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title (optional)" className="h-9" />
          </div>

          {/* Worksheet */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Worksheet</span>
            <div className="flex items-center gap-1">
              {slot.worksheet_id ? (
                <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => navigate(`/worksheet/${slot.worksheet_id}`)}>
                  <FileText className="h-3 w-3 mr-1" /> Open <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">None</span>
              )}
              {onLinkWorksheet && (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1" onClick={() => onLinkWorksheet(slot)}>
                  <Link2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* Status actions */}
          <div className="flex gap-1 flex-wrap w-full">
            {canUndoCancel && (
              <Button size="sm" variant="outline" onClick={handleUndoCancel} className="text-xs h-7">
                <Undo2 className="h-3 w-3 mr-1" /> Undo Cancel
              </Button>
            )}
            {isPending && (
              <Button size="sm" onClick={handleConfirm} className="bg-green-600 hover:bg-green-700 text-white text-xs h-7">
                <Check className="h-3 w-3 mr-1" /> Confirm
              </Button>
            )}
            {slot.status === 'booked' && slot.confirmed_at && (
              <>
                <Button size="sm" variant="outline" onClick={() => handleStatusChange('completed')} className="text-xs h-7">
                  <Check className="h-3 w-3 mr-1" /> Complete
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleStatusChange('no_show')} className="text-xs h-7">
                  <AlertTriangle className="h-3 w-3 mr-1" /> No Show
                </Button>
              </>
            )}
            {slot.status !== 'cancelled' && slot.status !== 'completed' && hasStudent && (
              <Button size="sm" variant="outline" className="text-destructive text-xs h-7" onClick={() => handleStatusChange('cancelled')}>
                <X className="h-3 w-3 mr-1" /> Cancel Lesson
              </Button>
            )}
          </div>

          {/* Edit Series */}
          {isRecurring && hasChanges && (
            <Button size="sm" variant="outline" className="w-full text-xs h-8" onClick={handleEditSeries}>
              <Repeat className="h-3 w-3 mr-1" /> Save for Entire Series
            </Button>
          )}

          {/* Bottom actions */}
          <div className="flex gap-2 w-full justify-end">
            <Button size="sm" variant="ghost" className="text-destructive text-xs h-8" onClick={handleDelete}>
              <Trash2 className="h-3 w-3 mr-1" /> {confirming ? 'Confirm Delete?' : 'Delete'}
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={handleCancel}>Cancel</Button>
            {hasChanges && (
              <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs h-8">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
