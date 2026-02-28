import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, addDays, addMonths } from 'date-fns';

export type ViewMode = 'day' | 'week' | 'month';

export interface CalendarSlot {
  id: string;
  teacher_id: string;
  student_id: string | null;
  title: string | null;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'booked' | 'completed' | 'cancelled' | 'no_show';
  booking_type: 'manual' | 'student_booked' | 'recurring_instance';
  recurrence_rule_id: string | null;
  worksheet_id: string | null;
  notes: string | null;
  student_notes: string | null;
  booked_at: string | null;
  booked_by: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSlotInput {
  slot_date: string;
  start_time: string;
  end_time: string;
  student_id?: string | null;
  title?: string;
  notes?: string;
  booking_type?: string;
  status?: string;
  worksheet_id?: string | null;
}

export function useCalendarSlots(teacherId?: string) {
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const { toast } = useToast();

  const dateRange = useMemo(() => {
    if (viewMode === 'day') return { from: currentDate, to: currentDate };
    if (viewMode === 'week') {
      return { from: startOfWeek(currentDate, { weekStartsOn: 1 }), to: endOfWeek(currentDate, { weekStartsOn: 1 }) };
    }
    const ms = startOfMonth(currentDate);
    const me = endOfMonth(currentDate);
    return { from: startOfWeek(ms, { weekStartsOn: 1 }), to: endOfWeek(me, { weekStartsOn: 1 }) };
  }, [viewMode, currentDate]);

  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekEnd = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);

  const fetchSlots = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const from = format(dateRange.from, 'yyyy-MM-dd');
      const to = format(dateRange.to, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('calendar_slots')
        .select('*')
        .eq('teacher_id', teacherId)
        .gte('slot_date', from)
        .lte('slot_date', to)
        .order('slot_date')
        .order('start_time');
      if (error) throw error;
      setSlots((data || []) as unknown as CalendarSlot[]);
    } catch (err) {
      console.error('Error fetching slots:', err);
    } finally {
      setLoading(false);
    }
  }, [teacherId, dateRange]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  // Auto-refetch every 30 seconds
  useEffect(() => {
    if (!teacherId) return;
    const interval = setInterval(fetchSlots, 30000);
    return () => clearInterval(interval);
  }, [teacherId, fetchSlots]);

  const normalizeTimeForQuery = (t: string) => {
    // Ensure HH:MM:SS format for consistent DB comparison
    return t.length === 5 ? t + ':00' : t;
  };

  const createSlot = useCallback(async (input: CreateSlotInput) => {
    if (!teacherId) return null;
    try {
      // Check for overlapping lessons
      const { data: existing } = await supabase
        .from('calendar_slots')
        .select('id, student_id')
        .eq('teacher_id', teacherId)
        .eq('slot_date', input.slot_date)
        .neq('status', 'cancelled')
        .lt('start_time', normalizeTimeForQuery(input.end_time))
        .gt('end_time', normalizeTimeForQuery(input.start_time));

      if (existing && existing.length > 0) {
        const hasLessonConflict = existing.some((e: any) => e.student_id && input.student_id);
        const hasBlockedByLesson = existing.some((e: any) => e.student_id) && !input.student_id;
        if (hasLessonConflict || hasBlockedByLesson) {
          toast({ title: 'Time conflict', description: 'This slot overlaps with an existing lesson.', variant: 'destructive' });
          return null;
        }
        // Auto-replace available slots when adding a lesson
        if (input.student_id) {
          for (const e of existing.filter((e: any) => !e.student_id)) {
            await supabase.from('calendar_slots').delete().eq('id', e.id);
          }
        }
      }

      const { data, error } = await supabase
        .from('calendar_slots')
        .insert({
          teacher_id: teacherId,
          slot_date: input.slot_date,
          start_time: input.start_time,
          end_time: input.end_time,
          student_id: input.student_id || null,
          title: input.title || null,
          notes: input.notes || null,
          booking_type: input.booking_type || 'manual',
          status: input.student_id ? 'booked' : (input.status || 'available'),
          worksheet_id: input.worksheet_id || null,
          confirmed_at: input.student_id ? new Date().toISOString() : null,
          booked_at: input.student_id ? new Date().toISOString() : null,
          booked_by: input.student_id ? 'teacher' : null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      await fetchSlots();
      toast({ title: input.student_id ? 'Lesson created' : 'Slot created' });
      return data;
    } catch (err: any) {
      toast({ title: 'Error creating slot', description: err.message, variant: 'destructive' });
      return null;
    }
  }, [teacherId, fetchSlots, toast]);

  const createSlotsBatch = useCallback(async (inputs: CreateSlotInput[]) => {
    if (!teacherId || inputs.length === 0) return null;
    try {
      // Conflict check for each slot in the batch
      for (const input of inputs) {
        const { data: existing } = await supabase
          .from('calendar_slots')
          .select('id, student_id')
          .eq('teacher_id', teacherId)
          .eq('slot_date', input.slot_date)
          .neq('status', 'cancelled')
          .lt('start_time', normalizeTimeForQuery(input.end_time))
          .gt('end_time', normalizeTimeForQuery(input.start_time));

        if (existing && existing.length > 0) {
          // Block lesson-on-lesson
          if (existing.some((e: any) => e.student_id && input.student_id)) {
            toast({ title: 'Overbooking blocked', description: `Lesson conflict on ${input.slot_date} ${input.start_time}`, variant: 'destructive' });
            return null;
          }
          // Block available-on-lesson
          if (existing.some((e: any) => e.student_id) && !input.student_id) {
            toast({ title: 'Conflict', description: `Cannot add available slot over existing lesson on ${input.slot_date}`, variant: 'destructive' });
            return null;
          }
          // Auto-replace available slots when adding lesson
          if (input.student_id) {
            for (const e of existing.filter((e: any) => !e.student_id)) {
              await supabase.from('calendar_slots').delete().eq('id', e.id);
            }
          }
        }
      }

      const rows = inputs.map(input => ({
        teacher_id: teacherId,
        slot_date: input.slot_date,
        start_time: input.start_time,
        end_time: input.end_time,
        student_id: input.student_id || null,
        title: input.title || null,
        notes: input.notes || null,
        booking_type: input.booking_type || 'manual',
        status: input.student_id ? 'booked' : (input.status || 'available'),
        worksheet_id: input.worksheet_id || null,
        confirmed_at: input.student_id ? new Date().toISOString() : null,
        booked_at: input.student_id ? new Date().toISOString() : null,
        booked_by: input.student_id ? 'teacher' : null,
      }));

      const { error } = await supabase.from('calendar_slots').insert(rows as any);
      if (error) throw error;
      await fetchSlots();
      const hasStudents = inputs.some(i => i.student_id);
      toast({ title: `${inputs.length} ${hasStudents ? 'lessons' : 'slots'} created` });
      return true;
    } catch (err: any) {
      toast({ title: 'Error creating slots', description: err.message, variant: 'destructive' });
      return null;
    }
  }, [teacherId, fetchSlots, toast]);

  const updateSlot = useCallback(async (slotId: string, updates: Partial<CalendarSlot>) => {
    try {
      const { error } = await supabase.from('calendar_slots').update(updates as any).eq('id', slotId);
      if (error) throw error;
      await fetchSlots();
      toast({ title: 'Slot updated' });
    } catch (err: any) {
      toast({ title: 'Error updating slot', description: err.message, variant: 'destructive' });
    }
  }, [fetchSlots, toast]);

  const deleteSlot = useCallback(async (slotId: string) => {
    try {
      const { error } = await supabase.from('calendar_slots').delete().eq('id', slotId);
      if (error) throw error;
      await fetchSlots();
      toast({ title: 'Slot deleted' });
    } catch (err: any) {
      toast({ title: 'Error deleting slot', description: err.message, variant: 'destructive' });
    }
  }, [fetchSlots, toast]);

  const deleteSlotsBatch = useCallback(async (slotIds: string[]) => {
    if (slotIds.length === 0) return;
    try {
      const { error } = await supabase.from('calendar_slots').delete().in('id', slotIds);
      if (error) throw error;
      await fetchSlots();
      toast({ title: `${slotIds.length} slots deleted` });
    } catch (err: any) {
      toast({ title: 'Error deleting slots', description: err.message, variant: 'destructive' });
    }
  }, [fetchSlots, toast]);

  const navigate = useCallback((direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') { setCurrentDate(new Date()); return; }
    setCurrentDate(prev => {
      if (viewMode === 'day') return addDays(prev, direction === 'next' ? 1 : -1);
      if (viewMode === 'week') return addDays(prev, direction === 'next' ? 7 : -7);
      return addMonths(prev, direction === 'next' ? 1 : -1);
    });
  }, [viewMode]);

  const getSlotsForDay = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return slots.filter(s => s.slot_date === dateStr);
  }, [slots]);

  return {
    slots, loading, viewMode, setViewMode, currentDate, setCurrentDate,
    weekStart, weekEnd, dateRange,
    createSlot, createSlotsBatch, updateSlot, deleteSlot, deleteSlotsBatch,
    navigate, getSlotsForDay, refetch: fetchSlots,
  };
}
