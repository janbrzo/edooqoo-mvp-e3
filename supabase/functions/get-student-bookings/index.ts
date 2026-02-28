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

    // Handle actions
    if (action === 'cancel' && slotId) {
      // Check cancellation window
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

      if (settingsData.min_cancellation_hours) {
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

      // Notify teacher
      await supabase.from('calendar_notifications').insert({
        teacher_id: teacherId,
        notification_type: 'cancellation',
        message: `Student cancelled: ${email} on ${slot.slot_date} at ${slot.start_time.slice(0, 5)}`,
        student_name: email,
        slot_id: slotId,
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'reschedule' && slotId && newSlotId) {
      if (settingsData.allow_student_reschedule) {
        // Auto-reschedule: move booking to new slot
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

        // Revert old slot
        await supabase
          .from('calendar_slots')
          .update({
            student_id: null, status: 'available', booking_type: 'manual',
            booked_at: null, booked_by: null, confirmed_at: null, student_notes: null,
          })
          .eq('id', slotId);

        // Book new slot
        await supabase
          .from('calendar_slots')
          .update({
            student_id: oldSlot.student_id,
            status: 'booked',
            booking_type: 'student_booked',
            booked_at: new Date().toISOString(),
            booked_by: 'student',
            confirmed_at: oldSlot.confirmed_at ? new Date().toISOString() : null,
            student_notes: oldSlot.student_notes,
          })
          .eq('id', newSlotId)
          .eq('status', 'available');

        // Notify teacher
        await supabase.from('calendar_notifications').insert({
          teacher_id: teacherId,
          notification_type: 'reschedule',
          message: `Student rescheduled: ${email}`,
          student_name: email,
          slot_id: newSlotId,
        });
      } else {
        // Send reschedule request as notification
        await supabase.from('calendar_notifications').insert({
          teacher_id: teacherId,
          notification_type: 'reschedule_request',
          message: `Student ${email} requests to reschedule their lesson`,
          student_name: email,
          slot_id: slotId,
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
