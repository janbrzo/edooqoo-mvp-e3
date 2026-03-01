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
    const { type, teacherId, studentEmail, studentName, slotDate, slotTime, teacherEmail, teacherName, oldSlotDate, oldSlotTime, calendarUrl, bookUrl } = await req.json();

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      console.log('RESEND_API_KEY not configured, skipping email');
      return new Response(JSON.stringify({ skipped: true, reason: 'No RESEND_API_KEY' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let to: string;
    let subject: string;
    let html: string;

    const lessonInfo = `${slotDate} at ${slotTime}`;
    
    // Determine sender name: for student emails use teacher name, for teacher emails use EDOQOO
    const isStudentEmail = ['booking_confirmation', 'booking_pending', 'cancellation_student', 'reschedule_confirmation', 'reschedule_pending', 'lesson_reminder'].includes(type);
    const fromName = isStudentEmail
      ? `${teacherName || 'Your Teacher'} via EDOQOO`
      : 'EDOQOO';
    
    // Button HTML helper
    const teacherButton = calendarUrl 
      ? `<div style="margin-top: 20px;"><a href="${calendarUrl}" style="display: inline-block; padding: 10px 24px; background: #2563eb; color: white; border-radius: 6px; text-decoration: none; font-weight: 500;">Open Calendar</a></div>` 
      : '';
    const studentButton = bookUrl 
      ? `<div style="margin-top: 20px;"><a href="${bookUrl}" style="display: inline-block; padding: 10px 24px; background: #2563eb; color: white; border-radius: 6px; text-decoration: none; font-weight: 500;">View Bookings</a></div>` 
      : '';

    switch (type) {
      case 'booking_confirmation':
        to = studentEmail;
        subject = 'Your lesson is confirmed!';
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a;">Lesson Confirmed ✓</h2>
            <p>Hi ${studentName},</p>
            <p>Your English lesson has been confirmed:</p>
            <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 4px 0;"><strong>Date:</strong> ${slotDate}</p>
              <p style="margin: 4px 0;"><strong>Time:</strong> ${slotTime}</p>
            </div>
            <p>See you there!</p>
            ${studentButton}
          </div>
        `;
        break;

      case 'booking_pending':
        to = studentEmail;
        subject = 'Booking request received';
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a;">Booking Request Sent ⏳</h2>
            <p>Hi ${studentName},</p>
            <p>Your booking request for ${lessonInfo} has been sent to the teacher.</p>
            <p>You will receive a confirmation once the teacher approves your booking.</p>
            ${studentButton}
          </div>
        `;
        break;

      case 'new_booking_teacher':
        to = teacherEmail;
        subject = `New booking: ${studentName} — ${lessonInfo}`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a;">New Booking 📅</h2>
            <p>A student has booked a lesson:</p>
            <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 4px 0;"><strong>Student:</strong> ${studentName} (${studentEmail})</p>
              <p style="margin: 4px 0;"><strong>Date:</strong> ${slotDate}</p>
              <p style="margin: 4px 0;"><strong>Time:</strong> ${slotTime}</p>
            </div>
            <p>Check your calendar for details.</p>
            ${teacherButton}
          </div>
        `;
        break;

      case 'cancellation_teacher':
        to = teacherEmail;
        subject = `Lesson cancelled: ${studentName} — ${lessonInfo}`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a;">Lesson Cancelled ❌</h2>
            <p>${studentName} (${studentEmail}) has cancelled their lesson on ${lessonInfo}.</p>
            <p>The time slot is now available again.</p>
            ${teacherButton}
          </div>
        `;
        break;

      case 'cancellation_student':
        to = studentEmail;
        subject = `Lesson cancelled: ${lessonInfo}`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a;">Lesson Cancelled ❌</h2>
            <p>Hi ${studentName},</p>
            <p>Your lesson on ${lessonInfo} has been cancelled by the teacher.</p>
            <p>Please check the booking page for available alternative times.</p>
            ${studentButton}
          </div>
        `;
        break;

      case 'reschedule_confirmation':
        to = studentEmail;
        subject = `Lesson rescheduled to ${lessonInfo}`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a;">Lesson Rescheduled ✓</h2>
            <p>Hi ${studentName},</p>
            <p>Your lesson has been rescheduled to:</p>
            <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 4px 0;"><strong>Date:</strong> ${slotDate}</p>
              <p style="margin: 4px 0;"><strong>Time:</strong> ${slotTime}</p>
            </div>
            <p>See you there!</p>
            ${studentButton}
          </div>
        `;
        break;

      case 'reschedule_pending':
        to = studentEmail;
        subject = 'Reschedule request received';
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a;">Reschedule Request Sent ⏳</h2>
            <p>Hi ${studentName},</p>
            <p>Your reschedule request to ${lessonInfo} has been sent to the teacher.</p>
            <p>You will receive a confirmation once approved.</p>
            ${studentButton}
          </div>
        `;
        break;

      case 'reschedule_request_teacher':
        to = teacherEmail;
        subject = `Reschedule request: ${studentName}`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a;">Reschedule Request 🔄</h2>
            <p>${studentName} (${studentEmail}) requests to reschedule:</p>
            <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 4px 0;"><strong>From:</strong> ${oldSlotDate || 'N/A'} at ${oldSlotTime || 'N/A'}</p>
              <p style="margin: 4px 0;"><strong>To:</strong> ${slotDate} at ${slotTime}</p>
            </div>
            <p>Check your calendar to confirm or reject.</p>
            ${teacherButton}
          </div>
        `;
        break;

      case 'lesson_reminder':
        to = studentEmail;
        subject = `Reminder: Lesson tomorrow at ${slotTime}`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a;">Lesson Reminder 🔔</h2>
            <p>Hi ${studentName},</p>
            <p>This is a reminder that you have a lesson scheduled:</p>
            <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 4px 0;"><strong>Date:</strong> ${slotDate}</p>
              <p style="margin: 4px 0;"><strong>Time:</strong> ${slotTime}</p>
            </div>
            <p>See you soon!</p>
            ${studentButton}
          </div>
        `;
        break;

      default:
        return new Response(JSON.stringify({ error: 'Unknown notification type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const emailPayload: any = {
      from: `${fromName} <notifications@edooqoo.com>`,
      to: [to],
      subject,
      html,
    };

    // Reply-to teacher email for student emails
    if (isStudentEmail && teacherEmail) {
      emailPayload.reply_to = teacherEmail;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(emailPayload),
    });

    const result = await res.json();
    console.log('Email sent:', type, to, result);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error sending calendar email:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
