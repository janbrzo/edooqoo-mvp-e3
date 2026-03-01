import React, { useState, useEffect } from 'react';
import { DraggableDialog, DraggableDialogContent, DraggableDialogHeader, DraggableDialogTitle, DraggableDialogFooter } from '@/components/ui/draggable-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AutoResizeTextarea } from '@/components/ui/AutoResizeTextarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CalendarSlot } from '@/hooks/useCalendarSlots';
import { format, differenceInMinutes } from 'date-fns';
import { Check, X, Trash2, FileText, ExternalLink, AlertTriangle, Link2, Undo2, UserMinus, Repeat, Ban, ChevronsUpDown, History, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Student {
  id: string;
  name: string;
}

interface SlotLog {
  id: string;
  action: string;
  actor: string;
  details: any;
  created_at: string;
}

interface SlotDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: CalendarSlot | null;
  studentName?: string;
  students: Student[];
  onUpdate: (id: string, updates: Partial<CalendarSlot>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onLinkWorksheet?: (slot: CalendarSlot, studentId?: string | null) => void;
}

const STATUS_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  available: { label: 'Available', variant: 'outline' },
  booked: { label: 'Booked', variant: 'default' },
  completed: { label: 'Completed', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  no_show: { label: 'No Show', variant: 'destructive' },
  deleted: { label: 'Deleted', variant: 'destructive' },
};

export function SlotDetailModal({ open, onOpenChange, slot, studentName, students, onUpdate, onDelete, onLinkWorksheet }: SlotDetailModalProps) {
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStudentId, setEditStudentId] = useState<string>('none');
  const [showStudentSelect, setShowStudentSelect] = useState(false);
  const [studentComboOpen, setStudentComboOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slotLogs, setSlotLogs] = useState<SlotLog[]>([]);

  useEffect(() => {
    if (slot) {
      setEditDate(slot.slot_date);
      setEditStartTime(slot.start_time.slice(0, 5));
      setEditEndTime(slot.end_time.slice(0, 5));
      setEditNotes(slot.notes || '');
      setEditStudentId(slot.student_id || 'none');
      setShowStudentSelect(false);
      setConfirming(false);
      // Fetch logs for this slot
      supabase.from('calendar_slot_logs').select('*').eq('slot_id', slot.id).order('created_at', { ascending: false }).limit(20)
        .then(({ data }) => setSlotLogs((data || []) as SlotLog[]));
    }
  }, [slot?.id, open]);

  if (!slot) return null;

  const isBlock = (slot as any).slot_type === 'block';
  const isPending = slot.status === 'booked' && !slot.confirmed_at;
  const badge = STATUS_BADGES[slot.status] || STATUS_BADGES.available;
  const hasStudent = editStudentId !== 'none';
  const isRecurring = !!slot.recurrence_rule_id;
  const isBooked = !!slot.student_id && slot.status === 'booked';

  const canUndoCancel = slot.status === 'cancelled' && slot.cancelled_at &&
    differenceInMinutes(new Date(), new Date(slot.cancelled_at)) < 30;

  const hasChanges = editDate !== slot.slot_date ||
    editStartTime !== slot.start_time.slice(0, 5) ||
    editEndTime !== slot.end_time.slice(0, 5) ||
    editNotes !== (slot.notes || '') ||
    editStudentId !== (slot.student_id || 'none');

  const resetChanges = () => {
    setEditDate(slot.slot_date);
    setEditStartTime(slot.start_time.slice(0, 5));
    setEditEndTime(slot.end_time.slice(0, 5));
    setEditNotes(slot.notes || '');
    setEditStudentId(slot.student_id || 'none');
    setShowStudentSelect(false);
  };

  const handleCancel = () => { resetChanges(); onOpenChange(false); };

  const handleSave = async () => {
    setSaving(true);
    const updates: any = {
      slot_date: editDate, start_time: editStartTime, end_time: editEndTime, notes: editNotes || null,
    };
    if (editStudentId !== (slot.student_id || 'none')) {
      if (editStudentId === 'none') {
        updates.student_id = null; updates.status = 'available'; updates.booked_at = null; updates.booked_by = null; updates.confirmed_at = null;
      } else {
        updates.student_id = editStudentId; updates.status = 'booked';
        updates.booked_at = new Date().toISOString(); updates.booked_by = 'teacher'; updates.confirmed_at = new Date().toISOString();
      }
    }
    await onUpdate(slot.id, updates);
    // Log update
    try {
      await supabase.from('calendar_slot_logs').insert({
        slot_id: slot.id, teacher_id: slot.teacher_id, action: 'updated', actor: 'teacher',
        details: { changes: updates },
      } as any);
    } catch (_) {}
    setSaving(false);
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    await onUpdate(slot.id, { confirmed_at: new Date().toISOString() } as any);
    try {
      await supabase.from('calendar_slot_logs').insert({
        slot_id: slot.id, teacher_id: slot.teacher_id, action: 'confirmed', actor: 'teacher',
        details: { student_name: studentName },
      } as any);
    } catch (_) {}
    onOpenChange(false);
  };

  const handleReject = async () => {
    await onUpdate(slot.id, {
      status: 'available', student_id: null, booked_at: null, booked_by: null, confirmed_at: null, student_notes: null,
    } as any);
    try {
      await supabase.from('calendar_slot_logs').insert({
        slot_id: slot.id, teacher_id: slot.teacher_id, action: 'rejected', actor: 'teacher',
        details: { student_name: studentName },
      } as any);
    } catch (_) {}
    toast.success('Booking rejected, slot is available again');
    onOpenChange(false);
  };

  const handleUndoCancel = async () => {
    await onUpdate(slot.id, { status: slot.student_id ? 'booked' : 'available', cancelled_at: null, cancelled_by: null, cancellation_reason: null } as any);
    onOpenChange(false);
  };

  // Step 10: Teacher Cancellation
  const handleTeacherCancellation = async () => {
    if (!window.confirm('Cancel this lesson as teacher cancellation? The slot will become available again.')) return;
    const cancelledStudentName = students.find(s => s.id === slot.student_id)?.name || studentName || 'unknown';
    await onUpdate(slot.id, {
      status: 'available', student_id: null,
      cancelled_at: new Date().toISOString(), cancelled_by: 'teacher',
      cancellation_reason: `Teacher cancellation. Student was: ${cancelledStudentName}`,
      booked_at: null, booked_by: null, confirmed_at: null, student_notes: null,
    } as any);
    try {
      await supabase.from('calendar_slot_logs').insert({
        slot_id: slot.id, teacher_id: slot.teacher_id, action: 'cancelled_by_teacher', actor: 'teacher',
        details: { student_name: cancelledStudentName, student_id: slot.student_id },
      } as any);
    } catch (_) {}
    onOpenChange(false);
  };

  // Step 10: Student Cancellation
  const handleStudentCancellation = async () => {
    if (!window.confirm('Cancel this lesson as student cancellation? The slot will become available again.')) return;
    const cancelledStudentName = students.find(s => s.id === slot.student_id)?.name || studentName || 'unknown';
    await onUpdate(slot.id, {
      status: 'available', student_id: null,
      cancelled_at: new Date().toISOString(), cancelled_by: 'student',
      cancellation_reason: `Student cancellation. Student was: ${cancelledStudentName}`,
      booked_at: null, booked_by: null, confirmed_at: null, student_notes: null,
    } as any);
    try {
      await supabase.from('calendar_slot_logs').insert({
        slot_id: slot.id, teacher_id: slot.teacher_id, action: 'cancelled_by_student', actor: 'teacher',
        details: { student_name: cancelledStudentName, student_id: slot.student_id },
      } as any);
    } catch (_) {}
    onOpenChange(false);
  };

  const handleStatusChange = async (status: string) => {
    const updates: any = { status };
    if (status === 'cancelled') { updates.cancelled_at = new Date().toISOString(); updates.cancelled_by = 'teacher'; }
    await onUpdate(slot.id, updates);
    try {
      await supabase.from('calendar_slot_logs').insert({
        slot_id: slot.id, teacher_id: slot.teacher_id, action: 'status_changed', actor: 'teacher',
        details: { new_status: status },
      } as any);
    } catch (_) {}
    onOpenChange(false);
  };

  // Soft delete
  const handleDelete = async () => {
    if (confirming) {
      await onUpdate(slot.id, { status: 'deleted' } as any);
      try {
        await supabase.from('calendar_slot_logs').insert({
          slot_id: slot.id, teacher_id: slot.teacher_id, action: 'deleted', actor: 'teacher', details: {},
        } as any);
      } catch (_) {}
      onOpenChange(false);
    } else setConfirming(true);
  };

  const handleEditSeries = async () => {
    if (!slot.recurrence_rule_id) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const updates: any = { start_time: editStartTime, end_time: editEndTime, notes: editNotes || null };
    if (editStudentId !== (slot.student_id || 'none')) {
      if (editStudentId === 'none') { updates.student_id = null; updates.status = 'available'; }
      else { updates.student_id = editStudentId; updates.status = 'booked'; updates.confirmed_at = new Date().toISOString(); }
    }
    const { error } = await supabase.from('calendar_slots').update(updates).eq('recurrence_rule_id', slot.recurrence_rule_id).gte('slot_date', today).neq('status', 'completed');
    if (error) toast.error('Failed to update series'); else toast.success('Series updated');
    onOpenChange(false);
  };

  // 3A: Save student FIRST before opening link worksheet
  const handleLinkWorksheetClick = async () => {
    if (editStudentId !== (slot.student_id || 'none')) {
      const updates: any = {};
      if (editStudentId === 'none') {
        updates.student_id = null; updates.status = 'available';
      } else {
        updates.student_id = editStudentId; updates.status = 'booked';
        updates.booked_at = new Date().toISOString();
        updates.booked_by = 'teacher';
        updates.confirmed_at = new Date().toISOString();
      }
      await onUpdate(slot.id, updates);
    }
    onLinkWorksheet?.(slot, editStudentId !== 'none' ? editStudentId : null);
  };

  const selectedStudentName = students.find(s => s.id === editStudentId)?.name || '';

  return (
    <DraggableDialog open={open} onOpenChange={onOpenChange}>
      <DraggableDialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DraggableDialogHeader>
          <DraggableDialogTitle className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2 flex-wrap">
            {isBlock ? '🔒 Block' : hasStudent ? 'Lesson' : 'Available Slot'}
            <Badge variant={isPending ? 'outline' : badge.variant} className={isPending ? 'border-amber-400 text-amber-700 bg-amber-50' : ''}>
              {isPending ? 'Pending' : badge.label}
            </Badge>
            {isRecurring && <Badge variant="outline" className="text-xs"><Repeat className="h-3 w-3 mr-0.5" /> Recurring</Badge>}
          </DraggableDialogTitle>
        </DraggableDialogHeader>

        <div className="space-y-3">
          {/* Student section — Combobox with search */}
          {!isBlock && (
            <>
              {hasStudent && !showStudentSelect ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <Label className="text-xs text-muted-foreground">Student</Label>
                    <div className="font-medium text-sm truncate">{selectedStudentName || studentName}</div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowStudentSelect(true)}>Change</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => setEditStudentId('none')}>
                      <UserMinus className="h-3 w-3 mr-0.5" /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <Label className="text-xs">{hasStudent ? 'Change Student' : 'Assign Student'}</Label>
                  <div className="flex gap-2">
                    <Popover open={studentComboOpen} onOpenChange={setStudentComboOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={studentComboOpen} className="flex-1 h-9 justify-between text-sm font-normal">
                          {editStudentId !== 'none' ? selectedStudentName : 'Select a student...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search students..." />
                          <CommandList>
                            <CommandEmpty>No student found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem value="__none__" onSelect={() => { setEditStudentId('none'); setStudentComboOpen(false); setShowStudentSelect(false); }} onPointerDown={e => e.preventDefault()}>
                                <Check className={cn("mr-2 h-4 w-4", editStudentId === 'none' ? "opacity-100" : "opacity-0")} />
                                No student (Available)
                              </CommandItem>
                              {students.map(s => (
                                <CommandItem key={s.id} value={`${s.name}__${s.id}`} onSelect={() => { setEditStudentId(s.id); setStudentComboOpen(false); setShowStudentSelect(false); }} onPointerDown={e => e.preventDefault()}>
                                  <Check className={cn("mr-2 h-4 w-4", editStudentId === s.id ? "opacity-100" : "opacity-0")} />
                                  {s.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {showStudentSelect && (
                      <Button variant="ghost" size="sm" className="h-9" onClick={() => { setEditStudentId(slot.student_id || 'none'); setShowStudentSelect(false); }}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Date + Time */}
          <div><Label className="text-xs">Date</Label><Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="h-9" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Start</Label><Input type="time" value={editStartTime} onChange={e => setEditStartTime(e.target.value)} className="h-9" /></div>
            <div><Label className="text-xs">End</Label><Input type="time" value={editEndTime} onChange={e => setEditEndTime(e.target.value)} className="h-9" /></div>
          </div>

          {/* Worksheet — 3B: disabled linking without student */}
          {!isBlock && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Worksheet</span>
              <div className="flex items-center gap-1">
                {slot.worksheet_id ? (
                  <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => window.open(`/worksheet/${slot.worksheet_id}`, '_blank')}>
                    <FileText className="h-3 w-3 mr-1" /> Open <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
                {onLinkWorksheet && (
                  <Button
                    variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1"
                    disabled={!hasStudent}
                    onClick={handleLinkWorksheetClick}
                  >
                    <Link2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Notes — AutoResizeTextarea */}
          <div><Label className="text-xs">Notes</Label><AutoResizeTextarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={1} /></div>

          {/* Student notes (from booking) */}
          {slot.student_notes && (
            <div className="bg-muted/50 rounded-md px-3 py-2">
              <Label className="text-xs text-muted-foreground">Student booking info</Label>
              <p className="text-xs mt-0.5">{slot.student_notes}</p>
            </div>
          )}

          {/* Cancelled slot info */}
          {slot.status === 'cancelled' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2 text-xs space-y-1">
              <p className="font-medium text-red-700 dark:text-red-400">Cancelled</p>
              {slot.cancelled_at && <p>When: {format(new Date(slot.cancelled_at), 'MMM d, yyyy HH:mm')}</p>}
              {slot.cancelled_by && <p>By: {slot.cancelled_by}</p>}
              {slot.cancellation_reason && <p>{slot.cancellation_reason}</p>}
            </div>
          )}

          {/* Badge C info — available slot with cancellation history */}
          {slot.status === 'available' && slot.cancelled_at && slot.cancelled_by && (
            <div className={cn(
              "border rounded-md px-3 py-2 text-xs space-y-1",
              slot.cancelled_by === 'student' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200'
            )}>
              <p className="font-medium">Previous lesson was cancelled</p>
              {slot.cancelled_at && <p>When: {format(new Date(slot.cancelled_at), 'MMM d, yyyy HH:mm')}</p>}
              <p>By: {slot.cancelled_by}</p>
              {slot.cancellation_reason && <p>{slot.cancellation_reason}</p>}
            </div>
          )}

          {/* History — Collapsible log */}
          {slotLogs.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors w-full">
                <History className="h-3 w-3" /> History ({slotLogs.length})
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {slotLogs.map(log => (
                  <div key={log.id} className="text-xs border-l-2 border-border pl-2 py-1">
                    <span className="font-medium">{log.action}</span>
                    <span className="text-muted-foreground ml-1">by {log.actor}</span>
                    <span className="text-muted-foreground ml-1">{format(new Date(log.created_at), 'MMM d HH:mm')}</span>
                    {log.details?.student_name && <span className="text-muted-foreground"> — {log.details.student_name}</span>}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        <DraggableDialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-1 flex-wrap w-full">
            {canUndoCancel && (
              <Button size="sm" variant="outline" onClick={handleUndoCancel} className="text-xs h-7"><Undo2 className="h-3 w-3 mr-1" /> Undo Cancel</Button>
            )}
            {isPending && (
              <>
                <Button size="sm" onClick={handleConfirm} className="bg-green-600 hover:bg-green-700 text-white text-xs h-7">
                  <Check className="h-3 w-3 mr-1" /> Confirm
                </Button>
                <Button size="sm" variant="outline" onClick={handleReject} className="text-destructive text-xs h-7">
                  <Ban className="h-3 w-3 mr-1" /> Reject
                </Button>
              </>
            )}
            {slot.status === 'booked' && slot.confirmed_at && (
              <>
                <Button size="sm" variant="outline" onClick={() => handleStatusChange('completed')} className="text-xs h-7"><Check className="h-3 w-3 mr-1" /> Complete</Button>
                <Button size="sm" variant="outline" onClick={() => handleStatusChange('no_show')} className="text-xs h-7"><AlertTriangle className="h-3 w-3 mr-1" /> No Show</Button>
              </>
            )}
            {/* Step 10: Teacher/Student Cancellation buttons — only for booked lessons */}
            {isBooked && !isPending && slot.status !== 'cancelled' && (
              <>
                <Button size="sm" variant="outline" className="text-blue-600 text-xs h-7" onClick={handleTeacherCancellation}>
                  Teacher Cancellation
                </Button>
                <Button size="sm" variant="outline" className="text-amber-600 text-xs h-7" onClick={handleStudentCancellation}>
                  Student Cancellation
                </Button>
              </>
            )}
          </div>
          {isRecurring && hasChanges && (
            <Button size="sm" variant="outline" className="w-full text-xs h-8" onClick={handleEditSeries}>
              <Repeat className="h-3 w-3 mr-1" /> Save for Entire Series
            </Button>
          )}
          <div className="flex gap-2 w-full justify-end">
            {/* Delete Slot — ONLY for available slots (no student), not for booked lessons */}
            {!isBooked && slot.status !== 'completed' && (
              <Button size="sm" variant="ghost" className="text-destructive text-xs h-8" onClick={handleDelete}>
                <Trash2 className="h-3 w-3 mr-1" /> {confirming ? 'Confirm Delete?' : 'Delete Slot'}
              </Button>
            )}
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={handleCancel}>Cancel</Button>
            {hasChanges && (
              <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs h-8">{saving ? 'Saving...' : 'Save Changes'}</Button>
            )}
          </div>
        </DraggableDialogFooter>
      </DraggableDialogContent>
    </DraggableDialog>
  );
}
