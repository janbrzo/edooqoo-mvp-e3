import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getValidToken(supabase: any, teacherId: string): Promise<string | null> {
  const { data: tokenData } = await supabase
    .from('calendar_gcal_tokens')
    .select('*')
    .eq('teacher_id', teacherId)
    .maybeSingle();

  if (!tokenData) return null;

  const expiresAt = new Date(tokenData.token_expires_at);
  if (expiresAt > new Date(Date.now() + 60000)) {
    return tokenData.access_token;
  }

  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  if (!clientId || !clientSecret) return null;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokenData.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const newTokens = await res.json();
  if (newTokens.error) {
    console.error('Token refresh failed:', newTokens);
    return null;
  }

  await supabase.from('calendar_gcal_tokens').update({
    access_token: newTokens.access_token,
    token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('teacher_id', teacherId);

  return newTokens.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { teacherId, slotId, action, colorOverride } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const token = await getValidToken(supabase, teacherId);
    if (!token) {
      return new Response(JSON.stringify({ error: 'Not connected to Google Calendar' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: slot } = await supabase
      .from('calendar_slots')
      .select('*')
      .eq('id', slotId)
      .single();

    if (!slot) {
      return new Response(JSON.stringify({ error: 'Slot not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: settings } = await supabase
      .from('calendar_settings')
      .select('gcal_default_color, gcal_default_reminder_minutes, timezone, gcal_on_cancel_action, gcal_color_booked, gcal_color_available, gcal_color_pending, gcal_color_completed, gcal_color_no_show, gcal_sync_mode, auto_create_meet_link')
      .eq('teacher_id', teacherId)
      .single();

    const timezone = settings?.timezone || 'Europe/Warsaw';
    const calendarId = 'primary';

    if (action === 'delete' && slot.gcal_event_id) {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${slot.gcal_event_id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok || res.status === 404) {
        await supabase.from('calendar_slots').update({ gcal_event_id: null }).eq('id', slotId);
      }
      console.log('GCal delete:', res.status);
    } else if (action === 'cancel' && slot.gcal_event_id) {
      const cancelAction = settings?.gcal_on_cancel_action || 'update';
      if (cancelAction === 'delete') {
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${slot.gcal_event_id}`,
          { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok || res.status === 404) {
          await supabase.from('calendar_slots').update({ gcal_event_id: null }).eq('id', slotId);
        }
        console.log('GCal cancel-delete:', res.status);
      } else {
        const cancelSuffix = slot.cancelled_by === 'student' ? ' — Student Cancellation' : ' — Teacher Cancellation';
        const event = {
          summary: `Available Slot — English Lesson${cancelSuffix}`,
          colorId: settings?.gcal_color_available || '2',
          reminders: { useDefault: false, overrides: [] },
          start: { dateTime: `${slot.slot_date}T${slot.start_time}`, timeZone: timezone },
          end: { dateTime: `${slot.slot_date}T${slot.end_time}`, timeZone: timezone },
        };
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${slot.gcal_event_id}`,
          {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
          }
        );
        console.log('GCal cancel-update:', res.status);
      }
    } else if (action === 'upsert') {
      let summary = slot.title || 'English Lesson';
      if (slot.student_id) {
        const { data: student } = await supabase.from('students').select('name').eq('id', slot.student_id).maybeSingle();
        if (student?.name) summary = `${student.name} — English Lesson`;
      }

      // Add status suffix
      const isPendingSlot = slot.status === 'booked' && !slot.confirmed_at;
      const effectiveStatus = isPendingSlot ? 'pending' : (slot.status === 'needs_review' ? 'booked' : slot.status);
      const statusSuffixMap: Record<string, string> = {
        booked: ' — Booked',
        pending: ' — Pending',
        completed: ' — Complete',
        no_show: ' — No Show',
      };
      if (effectiveStatus === 'available' && slot.cancelled_by) {
        summary += slot.cancelled_by === 'student' ? ' — Student Cancellation' : ' — Teacher Cancellation';
      } else if (statusSuffixMap[effectiveStatus]) {
        summary += statusSuffixMap[effectiveStatus];
      }

      // Determine color based on status
      let eventColorId = settings?.gcal_default_color || '9';
      if (colorOverride) {
        eventColorId = colorOverride;
      } else {
        const statusColorMap: Record<string, string> = {
          booked: settings?.gcal_color_booked || '9',
          available: settings?.gcal_color_available || '2',
          pending: settings?.gcal_color_pending || '5',
          completed: settings?.gcal_color_completed || '10',
          no_show: settings?.gcal_color_no_show || '6',
        };
        const isPending = slot.status === 'booked' && !slot.confirmed_at;
        const effectiveStatus = isPending ? 'pending' : (slot.status === 'needs_review' ? 'booked' : slot.status);
        eventColorId = statusColorMap[effectiveStatus] || eventColorId;
      }

      // Determine reminders
      const isTerminalStatus = slot.status === 'completed' || slot.status === 'no_show';
      const reminders = (isTerminalStatus || !settings?.gcal_default_reminder_minutes)
        ? { useDefault: false, overrides: [] }
        : { useDefault: false, overrides: [{ method: 'popup', minutes: settings.gcal_default_reminder_minutes }] };

      const event: any = {
        summary,
        start: { dateTime: `${slot.slot_date}T${slot.start_time}`, timeZone: timezone },
        end: { dateTime: `${slot.slot_date}T${slot.end_time}`, timeZone: timezone },
        colorId: eventColorId,
        reminders,
      };

      // Google Meet auto-creation
      if (settings?.auto_create_meet_link && slot.student_id && !isTerminalStatus) {
        event.conferenceData = {
          createRequest: {
            requestId: slotId,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        };
      }

      const conferenceParam = settings?.auto_create_meet_link ? '?conferenceDataVersion=1' : '';

      if (slot.gcal_event_id) {
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${slot.gcal_event_id}${conferenceParam}`,
          {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
          }
        );
        if (res.ok) {
          const updated = await res.json();
          const meetLink = updated.hangoutLink || null;
          if (meetLink && meetLink !== slot.meeting_link) {
            await supabase.from('calendar_slots').update({ meeting_link: meetLink }).eq('id', slotId);
          }
        }
        console.log('GCal update:', res.status);
      } else {
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events${conferenceParam}`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
          }
        );
        if (res.ok) {
          const created = await res.json();
          const meetLink = created.hangoutLink || null;
          await supabase.from('calendar_slots').update({
            gcal_event_id: created.id,
            ...(meetLink ? { meeting_link: meetLink } : {}),
          }).eq('id', slotId);
          console.log('GCal created:', created.id, meetLink ? `Meet: ${meetLink}` : '');
        } else {
          console.error('GCal create failed:', res.status, await res.text());
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error in gcal-sync:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
