import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  const fetchingRef = useRef(false);
  const pendingRefetch = useRef(false);

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
    if (fetchingRef.current) { pendingRefetch.current = true; return; }
    fetchingRef.current = true;
    try {
      const from = format(weekStart, 'yyyy-MM-dd');
      const to = format(weekEnd, 'yyyy-MM-dd');

      const { data, error: err } = await supabase
        .from('calendar_slots')
        .select('*')
        .eq('teacher_id', settings.teacher_id)
        .neq('slot_type', 'block')
        .gte('slot_date', from)
        .lte('slot_date', to)
        .or('status.eq.available,and(status.eq.booked,confirmed_at.is.null)')
        .order('slot_date')
        .order('start_time');

      if (err) throw err;
      setSlots((data || []) as unknown as CalendarSlot[]);
    } catch (err) { console.error('Error fetching public slots:', err); }
    finally {
      setLoading(false);
      fetchingRef.current = false;
      if (pendingRefetch.current) {
        pendingRefetch.current = false;
        fetchSlots();
      }
    }
  }, [settings, weekStart, weekEnd]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);
  useEffect(() => { if (settings) fetchSlots(); }, [settings, fetchSlots]);

  // Supabase Realtime for instant updates
  useEffect(() => {
    if (!settings) return;
    const channel = supabase
      .channel(`public-slots-${settings.teacher_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_slots', filter: `teacher_id=eq.${settings.teacher_id}` },
        () => { fetchSlots(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [settings, fetchSlots]);

  // Polling fallback every 3s
  useEffect(() => {
    if (!settings) return;
    const interval = setInterval(() => { fetchSlots(); }, 2000);
    return () => clearInterval(interval);
  }, [settings, fetchSlots]);

  const bookSlot = useCallback(async (slotId: string, studentName: string, studentEmail: string) => {
    if (!settings) return false;
    try {
      const { data: check } = await supabase
        .from('calendar_slots').select('status, slot_type').eq('id', slotId).single();
      if (!check || check.status !== 'available' || check.slot_type === 'block') {
        toast({ title: 'Slot no longer available', description: 'Please select another time.', variant: 'destructive', duration: 6000 });
        await fetchSlots();
        return false;
      }

      const normalizedEmail = studentEmail.toLowerCase().trim();

      const { data: existingStudent } = await supabase
        .from('students')
        .select('id, name')
        .eq('teacher_id', settings.teacher_id)
        .ilike('student_email', normalizedEmail)
        .maybeSingle();

      const studentId = existingStudent?.id || null;
      const resolvedName = existingStudent?.name || studentName;
      const autoConfirm = settings.default_booking_mode === 'auto_confirm';

      const slot = slots.find(s => s.id === slotId);

      const { error: err } = await supabase
        .from('calendar_slots')
        .update({
          student_id: studentId,
          status: 'booked',
          booking_type: 'student_booked',
          booked_at: new Date().toISOString(),
          booked_by: 'student',
          confirmed_at: autoConfirm ? new Date().toISOString() : null,
          student_notes: `Booked by: ${resolvedName} (${normalizedEmail})`,
          title: `${resolvedName} — English lesson`,
        } as any)
        .eq('id', slotId)
        .eq('status', 'available');

      if (err) throw err;

      // Notification for teacher — new student
      if (!existingStudent) {
        try {
          await supabase.from('calendar_notifications').insert({
            teacher_id: settings.teacher_id,
            notification_type: 'new_student',
            message: `New student signed up: ${studentName} (${normalizedEmail})`,
            student_name: studentName,
            slot_id: slotId,
            metadata: {
              student_email: normalizedEmail,
              student_name_raw: studentName,
              slot_date: slot?.slot_date,
              start_time: slot?.start_time?.slice(0, 5),
              end_time: slot?.end_time?.slice(0, 5),
            },
          } as any);
        } catch (e) { console.error(e); }
      }

      // Booking notification — Problem 8A: updated message format
      try {
        const messageText = autoConfirm
          ? `${resolvedName} booked a lesson ${slot?.slot_date} at ${slot?.start_time?.slice(0,5)}–${slot?.end_time?.slice(0,5)} (auto-confirmed)`
          : `${resolvedName} requested a lesson ${slot?.slot_date} at ${slot?.start_time?.slice(0,5)}–${slot?.end_time?.slice(0,5)} — awaiting confirmation`;
        await supabase.from('calendar_notifications').insert({
          teacher_id: settings.teacher_id,
          notification_type: autoConfirm ? 'booking_confirmed' : 'booking_pending',
          message: messageText,
          student_name: resolvedName,
          slot_id: slotId,
          metadata: {
            student_email: normalizedEmail,
            slot_date: slot?.slot_date,
            start_time: slot?.start_time?.slice(0, 5),
            end_time: slot?.end_time?.slice(0, 5),
          },
        } as any);
      } catch (e) { console.error(e); }

      // Send email notifications
      if (slot && settings.notify_email_on_booking) {
        const slotDate = slot.slot_date;
        const slotTime = slot.start_time.slice(0, 5);
        const { data: teacherProfile } = await supabase.from('profiles').select('email, first_name, last_name').eq('id', settings.teacher_id).maybeSingle();
        const teacherName = [teacherProfile?.first_name, teacherProfile?.last_name].filter(Boolean).join(' ') || 'Your Teacher';
        const teacherEmail = teacherProfile?.email || '';
        const bookUrl = `${window.location.origin}/book/${settings.public_calendar_token}`;
        const calendarUrl = `${window.location.origin}/calendar`;

        // Get worksheet shared link if available
        let worksheetUrl: string | undefined;
        let sharedWorksheetUrl: string | undefined;
        if (slot.worksheet_id) {
          worksheetUrl = `${window.location.origin}/worksheet/${slot.worksheet_id}`;
          const { data: ws } = await supabase.from('worksheets').select('share_token').eq('id', slot.worksheet_id).maybeSingle();
          if (ws?.share_token) {
            sharedWorksheetUrl = `${window.location.origin}/shared/${ws.share_token}`;
          }
        }
        
        supabase.functions.invoke('send-calendar-notification-email', {
          body: {
            type: autoConfirm ? 'booking_confirmation' : 'booking_pending',
            studentEmail: normalizedEmail, studentName: resolvedName, slotDate, slotTime,
            teacherName, teacherEmail, bookUrl, calendarUrl,
            worksheetUrl, sharedWorksheetUrl,
          },
        }).catch(console.error);

        if (teacherEmail) {
          supabase.functions.invoke('send-calendar-notification-email', {
            body: {
              type: 'new_booking_teacher',
              teacherEmail, studentEmail: normalizedEmail,
              studentName: resolvedName, slotDate, slotTime,
              teacherName, bookUrl, calendarUrl,
              worksheetUrl,
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
  }, [settings, toast, fetchSlots, slots]);

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
