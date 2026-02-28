import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CalendarSlot } from '@/hooks/useCalendarSlots';
import { CalendarSettings } from '@/hooks/useCalendarSettings';
import { startOfWeek, endOfWeek, addDays, format } from 'date-fns';

export function usePublicBooking(token?: string) {
  const [settings, setSettings] = useState<CalendarSettings | null>(null);
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const { toast } = useToast();

  const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart]);

  const fetchSettings = useCallback(async () => {
    if (!token) return;
    try {
      const { data, error: err } = await supabase
        .from('calendar_settings')
        .select('*')
        .eq('public_calendar_token', token)
        .eq('public_calendar_enabled', true)
        .maybeSingle();

      if (err) throw err;
      if (!data) { setError('Calendar not found or not public.'); setLoading(false); return; }
      setSettings(data as unknown as CalendarSettings);
    } catch (err) { setError('Failed to load calendar.'); console.error(err); }
  }, [token]);

  const fetchSlots = useCallback(async () => {
    if (!settings) return;
    try {
      const from = format(weekStart, 'yyyy-MM-dd');
      const to = format(weekEnd, 'yyyy-MM-dd');

      const { data, error: err } = await supabase
        .from('calendar_slots')
        .select('*')
        .eq('teacher_id', settings.teacher_id)
        .eq('status', 'available')
        .is('student_id', null)
        .gte('slot_date', from)
        .lte('slot_date', to)
        .order('slot_date')
        .order('start_time');

      if (err) throw err;
      setSlots((data || []) as unknown as CalendarSlot[]);
    } catch (err) { console.error('Error fetching public slots:', err); }
    finally { setLoading(false); }
  }, [settings, weekStart, weekEnd]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);
  useEffect(() => { if (settings) fetchSlots(); }, [settings, fetchSlots]);

  const bookSlot = useCallback(async (slotId: string, studentName: string, studentEmail: string) => {
    if (!settings) return false;
    try {
      // Find existing student by email — use name from teacher's DB
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id, name')
        .eq('teacher_id', settings.teacher_id)
        .eq('student_email', studentEmail)
        .maybeSingle();

      const studentId = existingStudent?.id || null;
      const resolvedName = existingStudent?.name || studentName;
      const autoConfirm = settings.default_booking_mode === 'auto_confirm';

      const { error: err, count } = await supabase
        .from('calendar_slots')
        .update({
          student_id: studentId,
          status: 'booked',
          booking_type: 'student_booked',
          booked_at: new Date().toISOString(),
          booked_by: 'student',
          confirmed_at: autoConfirm ? new Date().toISOString() : null,
          student_notes: `Booked by: ${resolvedName} (${studentEmail})`,
        } as any)
        .eq('id', slotId)
        .eq('status', 'available');

      if (err) throw err;

      // New student notification
      if (!existingStudent) {
        await supabase.from('calendar_notifications').insert({
          teacher_id: settings.teacher_id,
          notification_type: 'new_student',
          message: `New student signed up: ${studentName} (${studentEmail})`,
          student_name: studentName,
          slot_id: slotId,
        } as any);
      }

      // Send email notifications (fire and forget)
      const slot = slots.find(s => s.id === slotId);
      if (slot) {
        const slotDate = slot.slot_date;
        const slotTime = slot.start_time.slice(0, 5);
        // Get teacher email
        const { data: teacherProfile } = await supabase.from('profiles').select('email').eq('id', settings.teacher_id).maybeSingle();
        
        // Email to student
        supabase.functions.invoke('send-calendar-notification-email', {
          body: {
            type: autoConfirm ? 'booking_confirmation' : 'booking_pending',
            studentEmail, studentName: resolvedName, slotDate, slotTime,
          },
        }).catch(console.error);

        // Email to teacher
        if (teacherProfile?.email) {
          supabase.functions.invoke('send-calendar-notification-email', {
            body: {
              type: 'new_booking_teacher',
              teacherEmail: teacherProfile.email, studentEmail,
              studentName: resolvedName, slotDate, slotTime,
            },
          }).catch(console.error);
        }
      }

      toast({
        title: autoConfirm ? 'Lesson booked!' : 'Booking request sent!',
        description: autoConfirm ? 'Your lesson is confirmed.' : 'The teacher will confirm your booking soon.',
      });
      await fetchSlots();
      return true;
    } catch (err: any) {
      toast({ title: 'Booking failed', description: err.message, variant: 'destructive' });
      return false;
    }
  }, [settings, toast, fetchSlots]);

  const navigateWeek = useCallback((direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    else setWeekStart(prev => addDays(prev, direction === 'next' ? 7 : -7));
  }, []);

  const getSlotsForDay = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return slots.filter(s => s.slot_date === dateStr);
  }, [slots]);

  return { settings, slots, loading, error, weekStart, weekEnd, bookSlot, navigateWeek, getSlotsForDay, refetchSlots: fetchSlots };
}
