import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { startOfWeek, endOfWeek, format, addDays, parseISO } from 'date-fns';

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
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const { toast } = useToast();

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  const fetchSlots = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const from = format(weekStart, 'yyyy-MM-dd');
      const to = format(weekEnd, 'yyyy-MM-dd');

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
  }, [teacherId, weekStart, weekEnd]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const createSlot = useCallback(async (input: CreateSlotInput) => {
    if (!teacherId) return null;
    try {
      // Check for overlapping slots
      const { data: existing } = await supabase
        .from('calendar_slots')
        .select('id')
        .eq('teacher_id', teacherId)
        .eq('slot_date', input.slot_date)
        .neq('status', 'cancelled')
        .lt('start_time', input.end_time)
        .gt('end_time', input.start_time);

      if (existing && existing.length > 0) {
        toast({ title: 'Time conflict', description: 'This slot overlaps with an existing one.', variant: 'destructive' });
        return null;
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
      toast({ title: 'Slot created' });
      return data;
    } catch (err: any) {
      toast({ title: 'Error creating slot', description: err.message, variant: 'destructive' });
      return null;
    }
  }, [teacherId, fetchSlots, toast]);

  const updateSlot = useCallback(async (slotId: string, updates: Partial<CalendarSlot>) => {
    try {
      const { error } = await supabase
        .from('calendar_slots')
        .update(updates as any)
        .eq('id', slotId);

      if (error) throw error;
      await fetchSlots();
      toast({ title: 'Slot updated' });
    } catch (err: any) {
      toast({ title: 'Error updating slot', description: err.message, variant: 'destructive' });
    }
  }, [fetchSlots, toast]);

  const deleteSlot = useCallback(async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('calendar_slots')
        .delete()
        .eq('id', slotId);

      if (error) throw error;
      await fetchSlots();
      toast({ title: 'Slot deleted' });
    } catch (err: any) {
      toast({ title: 'Error deleting slot', description: err.message, variant: 'destructive' });
    }
  }, [fetchSlots, toast]);

  const navigateWeek = useCallback((direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    } else {
      setWeekStart(prev => addDays(prev, direction === 'next' ? 7 : -7));
    }
  }, []);

  const getSlotsForDay = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return slots.filter(s => s.slot_date === dateStr);
  }, [slots]);

  return {
    slots,
    loading,
    weekStart,
    weekEnd,
    createSlot,
    updateSlot,
    deleteSlot,
    navigateWeek,
    getSlotsForDay,
    refetch: fetchSlots,
  };
}
