import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, email, action, slotId, newSlotId } = await req.json();

    if (!token || !email) {
      return new Response(JSON.stringify({ error: 'Token and email are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify token
    const { data: settingsData, error: settingsError } = await supabase
      .from('calendar_settings')
      .select('teacher_id, min_cancellation_hours, allow_student_reschedule')
      .eq('public_calendar_token', token)
      .eq('public_calendar_enabled', true)
      .maybeSingle();

    if (settingsError || !settingsData) {
      return new Response(JSON.stringify({ error: 'Invalid calendar token' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const teacherId = settingsData.teacher_id;

    // Find student by email
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('teacher_id', teacherId)
      .eq('student_email', email)
      .maybeSingle();

    // Helper: log an action
    const logAction = async (logSlotId: string, logAction: string, details: Record<string, unknown> = {}) => {
      try {
        await supabase.from('calendar_slot_logs').insert({
          slot_id: logSlotId,
          teacher_id: teacherId,
          action: logAction,
          actor: 'student',
          details: { student_email: email, ...details },
        });
      } catch (_) {}
    };

    // Handle CANCEL
    if (action === 'cancel' && slotId) {
      const { data: slot } = await supabase
        .from('calendar_slots')
        .select('*')
        .eq('id', slotId)
        .eq('teacher_id', teacherId)
        .single();

      if (!slot) {
        return new Response(JSON.stringify({ error: 'Slot not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Step 13: If pending (no confirmed_at), skip cancellation hours check
      const isPending = slot.status === 'booked' && !slot.confirmed_at;
      if (!isPending && settingsData.min_cancellation_hours) {
        const lessonTime = new Date(`${slot.slot_date}T${slot.start_time}`);
        const hoursUntil = (lessonTime.getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursUntil < settingsData.min_cancellation_hours) {
          return new Response(JSON.stringify({ error: `Cannot cancel less than ${settingsData.min_cancellation_hours} hours before the lesson` }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Revert slot to available
      await supabase
        .from('calendar_slots')
        .update({
          student_id: null,
          status: 'available',
          booking_type: 'manual',
          booked_at: null,
          booked_by: null,
          confirmed_at: null,
          student_notes: null,
          cancelled_at: new Date().toISOString(),
          cancelled_by: 'student',
          cancellation_reason: `Cancelled by student (${email})`,
        })
        .eq('id', slotId);

      // Log
      await logAction(slotId, 'cancelled_by_student', { slot_date: slot.slot_date, start_time: slot.start_time });

      // Notify teacher
      await supabase.from('calendar_notifications').insert({
        teacher_id: teacherId,
        notification_type: 'cancellation',
        message: `Student cancelled: ${email} on ${slot.slot_date} at ${slot.start_time.slice(0, 5)}`,
        student_name: email,
        slot_id: slotId,
        metadata: { student_email: email },
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle RESCHEDULE
    if (action === 'reschedule' && slotId && newSlotId) {
      const { data: oldSlot } = await supabase
        .from('calendar_slots')
        .select('*')
        .eq('id', slotId)
        .single();

      if (!oldSlot) {
        return new Response(JSON.stringify({ error: 'Original slot not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (settingsData.allow_student_reschedule) {
        // Auto-reschedule: move booking to new slot immediately
        // Revert old slot
        await supabase
          .from('calendar_slots')
          .update({
            student_id: null, status: 'available', booking_type: 'manual',
            booked_at: null, booked_by: null, confirmed_at: null, student_notes: null,
            cancelled_at: new Date().toISOString(), cancelled_by: 'student',
            cancellation_reason: `Rescheduled by student (${email}) to new slot`,
          })
          .eq('id', slotId);

        // Book new slot (confirmed since auto-reschedule)
        await supabase
          .from('calendar_slots')
          .update({
            student_id: oldSlot.student_id,
            status: 'booked',
            booking_type: 'student_booked',
            booked_at: new Date().toISOString(),
            booked_by: 'student',
            confirmed_at: new Date().toISOString(),
            student_notes: oldSlot.student_notes,
          })
          .eq('id', newSlotId)
          .eq('status', 'available');

        // Log both
        await logAction(slotId, 'rescheduled', { new_slot_id: newSlotId });
        await logAction(newSlotId, 'booked', { rescheduled_from: slotId, student_email: email });

        // Notify teacher
        await supabase.from('calendar_notifications').insert({
          teacher_id: teacherId,
          notification_type: 'reschedule',
          message: `Student rescheduled: ${email}`,
          student_name: email,
          slot_id: newSlotId,
          metadata: { old_slot_id: slotId, new_slot_id: newSlotId, student_email: email },
        });

        return new Response(JSON.stringify({ success: true, autoRescheduled: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // Step 12C: Reschedule requires confirmation — book new slot as PENDING
        await supabase
          .from('calendar_slots')
          .update({
            student_id: oldSlot.student_id,
            status: 'booked',
            booking_type: 'student_booked',
            booked_at: new Date().toISOString(),
            booked_by: 'student',
            confirmed_at: null, // PENDING
            student_notes: `Reschedule request from ${oldSlot.slot_date} ${oldSlot.start_time.slice(0, 5)}. ${oldSlot.student_notes || ''}`.trim(),
          })
          .eq('id', newSlotId)
          .eq('status', 'available');

        // Log
        await logAction(newSlotId, 'reschedule_requested', {
          old_slot_id: slotId,
          old_date: oldSlot.slot_date,
          old_time: oldSlot.start_time,
          student_email: email,
        });

        // Notify teacher — with metadata for clickable confirmation
        await supabase.from('calendar_notifications').insert({
          teacher_id: teacherId,
          notification_type: 'reschedule_request',
          message: `Student ${email} requests to reschedule from ${oldSlot.slot_date} ${oldSlot.start_time.slice(0, 5)}`,
          student_name: email,
          slot_id: newSlotId,
          metadata: { old_slot_id: slotId, new_slot_id: newSlotId, student_email: email },
        });

        return new Response(JSON.stringify({ success: true, autoRescheduled: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Default: fetch bookings
    let query = supabase
      .from('calendar_slots')
      .select('id, slot_date, start_time, end_time, status, confirmed_at, student_notes')
      .eq('teacher_id', teacherId)
      .in('status', ['booked', 'completed'])
      .gte('slot_date', new Date().toISOString().split('T')[0])
      .order('slot_date')
      .order('start_time');

    if (student?.id) {
      query = query.eq('student_id', student.id);
    } else {
      query = query.ilike('student_notes', `%${email}%`);
    }

    const { data: bookings, error: bookingsError } = await query;

    if (bookingsError) throw bookingsError;

    return new Response(JSON.stringify({ bookings: bookings || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error in get-student-bookings:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
