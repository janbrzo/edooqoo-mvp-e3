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
    const { token, email, action, slotId, newSlotId, slotIds, studentName: reqStudentName } = await req.json();

    if (!token || !email) {
      return new Response(JSON.stringify({ error: 'Token and email are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify token
    const { data: settingsData, error: settingsError } = await supabase
      .from('calendar_settings')
      .select('teacher_id, min_cancellation_hours, allow_student_reschedule, timezone, public_calendar_token, default_booking_mode, notify_email_on_booking, notify_email_on_cancellation, notify_email_on_reschedule, notify_email_on_confirmation, notify_email_on_rejection')
      .eq('public_calendar_token', token)
      .eq('public_calendar_enabled', true)
      .maybeSingle();

    if (settingsError || !settingsData) {
      return new Response(JSON.stringify({ error: 'Invalid calendar token' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const teacherId = settingsData.teacher_id;
    const teacherTz = settingsData.timezone || 'Europe/Warsaw';

    // Find student by email
    const { data: student } = await supabase
      .from('students')
      .select('id, name')
      .eq('teacher_id', teacherId)
      .ilike('student_email', email.toLowerCase().trim())
      .maybeSingle();

    const studentName = student?.name || email;

    // Helper: get teacher info for emails
    const getTeacherInfo = async () => {
      const { data: p } = await supabase.from('profiles').select('email, first_name, last_name').eq('id', teacherId).maybeSingle();
      const name = [p?.first_name, p?.last_name].filter(Boolean).join(' ') || 'Your Teacher';
      return { teacherName: name, teacherEmail: p?.email || '' };
    };

    const bookUrl = `https://edooqoo-mvp-e3.lovable.app/book/${settingsData.public_calendar_token}`;
    const calendarUrl = 'https://edooqoo-mvp-e3.lovable.app/calendar';

    // Helper: send email
    const sendEmail = async (type: string, params: Record<string, any>) => {
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-calendar-notification-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, ...params }),
        });
      } catch (e) { console.error('Email send error:', e); }
    };

    // Helper: log action
    const logAction = async (logSlotId: string, logAct: string, details: Record<string, unknown> = {}) => {
      try {
        await supabase.from('calendar_slot_logs').insert({
          slot_id: logSlotId, teacher_id: teacherId, action: logAct, actor: 'student',
          details: { student_email: email, student_name: studentName, ...details },
        });
      } catch (_) {}
    };

    // Helper: resolve notifications
    const resolveNotifications = async (slotIds: string[], types: string[]) => {
      if (slotIds.length === 0) return;
      await supabase
        .from('calendar_notifications')
        .update({ is_resolved: true })
        .eq('teacher_id', teacherId)
        .in('slot_id', slotIds)
        .in('notification_type', types);
    };

    // Helper: calculate hours until lesson using teacher timezone
    const hoursUntilLesson = (slotDate: string, startTime: string): number => {
      // Build a date string in teacher timezone and compare to now
      // Simple approach: parse as local and calculate. For DST accuracy, we use the timezone info.
      const lessonStr = `${slotDate}T${startTime.slice(0, 5)}:00`;
      // We need to treat lessonStr as being in teacherTz
      // Since Deno doesn't have date-fns-tz, use a simpler approach:
      // Create date and use timezone offset
      const lessonDate = new Date(lessonStr);
      // Get the offset for teacher timezone
      const formatter = new Intl.DateTimeFormat('en-US', { timeZone: teacherTz, hour: 'numeric', timeZoneName: 'longOffset' });
      const parts = formatter.formatToParts(new Date());
      const offsetPart = parts.find(p => p.type === 'timeZoneName')?.value || '';
      // Parse UTC offset from format like "GMT+01:00"
      const offsetMatch = offsetPart.match(/GMT([+-])(\d{2}):(\d{2})/);
      let tzOffsetMinutes = 0;
      if (offsetMatch) {
        const sign = offsetMatch[1] === '+' ? 1 : -1;
        tzOffsetMinutes = sign * (parseInt(offsetMatch[2]) * 60 + parseInt(offsetMatch[3]));
      }
      // Adjust: lessonDate is interpreted as local, but we need UTC
      const lessonUtc = new Date(lessonDate.getTime() - tzOffsetMinutes * 60 * 1000);
      return (lessonUtc.getTime() - Date.now()) / (1000 * 60 * 60);
    };

    // Handle CANCEL
    if (action === 'cancel' && slotId) {
      const { data: slot } = await supabase
        .from('calendar_slots').select('*').eq('id', slotId).eq('teacher_id', teacherId).single();

      if (!slot) {
        return new Response(JSON.stringify({ error: 'Slot not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const isPending = slot.status === 'booked' && !slot.confirmed_at;
      if (!isPending && settingsData.min_cancellation_hours) {
        const hours = hoursUntilLesson(slot.slot_date, slot.start_time);
        if (hours < settingsData.min_cancellation_hours) {
          return new Response(JSON.stringify({ error: `Cannot cancel less than ${settingsData.min_cancellation_hours} hours before the lesson` }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Revert slot to available
      await supabase
        .from('calendar_slots')
        .update({
          student_id: null, status: 'available', booking_type: 'manual',
          booked_at: null, booked_by: null, confirmed_at: null,
          student_notes: null, title: null,
          cancelled_at: new Date().toISOString(), cancelled_by: 'student',
          cancellation_reason: `Cancelled by student (${email})`,
        })
        .eq('id', slotId);

      await logAction(slotId, 'cancelled_by_student', {
        slot_date: slot.slot_date, start_time: slot.start_time, end_time: slot.end_time,
      });

      // Resolve notifications
      await resolveNotifications([slotId], ['booking_pending', 'booking_confirmed']);

      // Notify teacher
      await supabase.from('calendar_notifications').insert({
        teacher_id: teacherId, notification_type: 'cancellation',
        message: `${studentName} cancelled lesson on ${slot.slot_date} at ${slot.start_time.slice(0, 5)}`,
        student_name: studentName, slot_id: slotId,
        metadata: { student_email: email },
      });

      // Send emails
      const { teacherName, teacherEmail } = await getTeacherInfo();
      await sendEmail('cancellation_teacher', {
        teacherEmail, studentEmail: email, studentName,
        slotDate: slot.slot_date, slotTime: slot.start_time.slice(0, 5),
        teacherName, bookUrl, calendarUrl,
      });
      await sendEmail('cancellation_confirmed_by_student', {
        studentEmail: email, studentName,
        slotDate: slot.slot_date, slotTime: slot.start_time.slice(0, 5),
        teacherName, teacherEmail, bookUrl, calendarUrl,
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle RESCHEDULE
    if (action === 'reschedule' && slotId && newSlotId) {
      const { data: oldSlot } = await supabase
        .from('calendar_slots').select('*').eq('id', slotId).single();

      if (!oldSlot) {
        return new Response(JSON.stringify({ error: 'Original slot not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch new slot info for notification message
      const { data: newSlotData } = await supabase
        .from('calendar_slots').select('slot_date, start_time, end_time').eq('id', newSlotId).single();

      const { teacherName, teacherEmail } = await getTeacherInfo();

      const oldIsPending = oldSlot.status === 'booked' && !oldSlot.confirmed_at;

      if (settingsData.allow_student_reschedule) {
        // AUTO RESCHEDULE
        // Revert old slot
        await supabase
          .from('calendar_slots')
          .update({
            student_id: null, status: 'available', booking_type: 'manual',
            booked_at: null, booked_by: null, confirmed_at: null,
            student_notes: null, title: null,
            cancelled_at: new Date().toISOString(), cancelled_by: 'student',
            cancellation_reason: `Rescheduled by student (${email}) to new slot`,
          })
          .eq('id', slotId);

        // Book new slot (confirmed)
        const { data: updateResult } = await supabase
          .from('calendar_slots')
          .update({
            student_id: oldSlot.student_id,
            status: 'booked', booking_type: 'student_booked',
            booked_at: new Date().toISOString(), booked_by: 'student',
            confirmed_at: new Date().toISOString(),
            student_notes: oldSlot.student_notes,
            title: `${studentName} — English lesson`,
          })
          .eq('id', newSlotId)
          .eq('status', 'available')
          .select();

        if (!updateResult || updateResult.length === 0) {
          return new Response(JSON.stringify({ success: false, error: 'Slot no longer available' }), {
            status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        await logAction(slotId, 'rescheduled', { new_slot_id: newSlotId, slot_date: oldSlot.slot_date, start_time: oldSlot.start_time });
        await logAction(newSlotId, 'booked', { rescheduled_from: slotId, student_email: email, slot_date: newSlotData?.slot_date, start_time: newSlotData?.start_time });

        // Resolve old notifications
        await resolveNotifications([slotId], ['booking_pending', 'booking_confirmed']);

        // Notify teacher
        await supabase.from('calendar_notifications').insert({
          teacher_id: teacherId, notification_type: 'reschedule',
          message: `${studentName} rescheduled: ${oldSlot.slot_date} ${oldSlot.start_time.slice(0, 5)} → ${newSlotData?.slot_date} ${newSlotData?.start_time?.slice(0, 5)}`,
          student_name: studentName, slot_id: newSlotId,
          metadata: { old_slot_id: slotId, new_slot_id: newSlotId, student_email: email },
        });

        // Emails
        await sendEmail('reschedule_confirmation', {
          studentEmail: email, studentName,
          slotDate: newSlotData?.slot_date, slotTime: newSlotData?.start_time?.slice(0, 5),
          teacherName, teacherEmail, bookUrl, calendarUrl,
          oldSlotDate: oldSlot.slot_date, oldSlotTime: oldSlot.start_time.slice(0, 5),
        });

        return new Response(JSON.stringify({ success: true, autoRescheduled: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // REQUIRES CONFIRMATION
        // If old slot was pending → free it immediately (student changed their mind)
        if (oldIsPending) {
          await supabase
            .from('calendar_slots')
            .update({
              student_id: null, status: 'available', booking_type: 'manual',
              booked_at: null, booked_by: null, confirmed_at: null,
              student_notes: null, title: null,
              cancelled_at: new Date().toISOString(), cancelled_by: 'student',
              cancellation_reason: `Replaced by reschedule request (${email})`,
            })
            .eq('id', slotId);

          // Resolve old pending notification
          await resolveNotifications([slotId], ['booking_pending']);
        } else {
          // Old slot was confirmed → mark it with reschedule pointer
          await supabase
            .from('calendar_slots')
            .update({ reschedule_request_to_slot_id: newSlotId })
            .eq('id', slotId);
        }

        // Book new slot as pending with reschedule link
        const { data: updateResult } = await supabase
          .from('calendar_slots')
          .update({
            student_id: oldSlot.student_id,
            status: 'booked', booking_type: 'student_booked',
            booked_at: new Date().toISOString(), booked_by: 'student',
            confirmed_at: null, // PENDING
            student_notes: `Reschedule from ${oldSlot.slot_date} ${oldSlot.start_time.slice(0, 5)}. ${oldSlot.student_notes || ''}`.trim(),
            title: `${studentName} — English lesson`,
            reschedule_request_from_slot_id: slotId,
          })
          .eq('id', newSlotId)
          .eq('status', 'available')
          .select();

        if (!updateResult || updateResult.length === 0) {
          // Revert old slot pointer if we set it
          if (!oldIsPending) {
            await supabase.from('calendar_slots').update({ reschedule_request_to_slot_id: null }).eq('id', slotId);
          }
          return new Response(JSON.stringify({ success: false, error: 'Slot no longer available' }), {
            status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        await logAction(newSlotId, 'reschedule_requested', {
          old_slot_id: slotId, old_date: oldSlot.slot_date, old_time: oldSlot.start_time,
          slot_date: newSlotData?.slot_date, start_time: newSlotData?.start_time,
        });

        // Notify teacher with From→To message
        await supabase.from('calendar_notifications').insert({
          teacher_id: teacherId, notification_type: 'reschedule_request',
          message: `${studentName} requests to reschedule: ${oldSlot.slot_date} ${oldSlot.start_time.slice(0, 5)} → ${newSlotData?.slot_date} ${newSlotData?.start_time?.slice(0, 5)}`,
          student_name: studentName, slot_id: newSlotId,
          metadata: { old_slot_id: slotId, new_slot_id: newSlotId, student_email: email, old_date: oldSlot.slot_date, old_time: oldSlot.start_time.slice(0, 5) },
        });

        // Emails
        await sendEmail('reschedule_pending', {
          studentEmail: email, studentName,
          slotDate: newSlotData?.slot_date, slotTime: newSlotData?.start_time?.slice(0, 5),
          teacherName, teacherEmail, bookUrl, calendarUrl,
        });
        await sendEmail('reschedule_request_teacher', {
          teacherEmail, studentEmail: email, studentName,
          slotDate: newSlotData?.slot_date, slotTime: newSlotData?.start_time?.slice(0, 5),
          teacherName, bookUrl, calendarUrl,
          oldSlotDate: oldSlot.slot_date, oldSlotTime: oldSlot.start_time.slice(0, 5),
        });

        return new Response(JSON.stringify({ success: true, autoRescheduled: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Handle BOOK_BATCH (weekly booking)
    if (action === 'book_batch' && Array.isArray(slotIds) && slotIds.length > 0) {
      const normalizedEmail = email.toLowerCase().trim();
      const batchStudentName = reqStudentName || studentName;
      const autoConfirm = settingsData.default_booking_mode === 'auto_confirm';
      const successIds: string[] = [];
      const failedIds: string[] = [];

      for (const sid of slotIds) {
        const { data: check } = await supabase
          .from('calendar_slots').select('status, slot_type').eq('id', sid).single();
        if (!check || check.status !== 'available' || check.slot_type === 'block') {
          failedIds.push(sid);
          continue;
        }

        const { error: bookErr } = await supabase
          .from('calendar_slots')
          .update({
            student_id: student?.id || null,
            status: 'booked',
            booking_type: 'student_booked',
            booked_at: new Date().toISOString(),
            booked_by: 'student',
            confirmed_at: autoConfirm ? new Date().toISOString() : null,
            student_notes: `Booked by: ${batchStudentName} (${normalizedEmail})`,
            title: `${batchStudentName} — English lesson`,
          })
          .eq('id', sid)
          .eq('status', 'available');

        if (!bookErr) {
          successIds.push(sid);
          await logAction(sid, 'booked', { student_email: normalizedEmail, student_name: batchStudentName, batch: true });
        } else {
          failedIds.push(sid);
        }
      }

      // One notification for all
      if (successIds.length > 0) {
        await supabase.from('calendar_notifications').insert({
          teacher_id: teacherId,
          notification_type: autoConfirm ? 'booking_confirmed' : 'booking_pending',
          message: `${batchStudentName} booked ${successIds.length} weekly lessons${autoConfirm ? ' (auto-confirmed)' : ' — awaiting confirmation'}`,
          student_name: batchStudentName,
          slot_id: successIds[0],
          metadata: { student_email: normalizedEmail, slot_ids: successIds, count: successIds.length, batch: true },
        });

        // Send batch emails
        const { teacherName, teacherEmail: tEmail } = await getTeacherInfo();
        if (settingsData.notify_email_on_booking) {
          await sendEmail('batch_booking_teacher', {
            teacherEmail: tEmail, studentEmail: normalizedEmail,
            studentName: batchStudentName, teacherName, bookUrl, calendarUrl,
          });
          await sendEmail('batch_booking_student', {
            studentEmail: normalizedEmail, studentName: batchStudentName,
            teacherName, teacherEmail: tEmail, bookUrl, calendarUrl,
          });
        }
      }

      return new Response(JSON.stringify({ success: true, booked: successIds.length, failed: failedIds.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Default: fetch bookings
    let query = supabase
      .from('calendar_slots')
      .select('id, slot_date, start_time, end_time, status, confirmed_at, student_notes')
      .eq('teacher_id', teacherId)
      .in('status', ['booked', 'completed', 'needs_review'])
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
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
