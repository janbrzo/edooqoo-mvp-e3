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

  // Refresh token
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
    const { teacherId, slotId, action } = await req.json(); // action: 'upsert' | 'delete'

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
      .select('gcal_default_color, gcal_default_reminder_minutes, timezone')
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
    } else if (action === 'upsert') {
      // Get student name if available
      let summary = slot.title || 'English Lesson';
      if (slot.student_id) {
        const { data: student } = await supabase.from('students').select('name').eq('id', slot.student_id).maybeSingle();
        if (student?.name) summary = `${student.name} — English Lesson`;
      }

      const event: any = {
        summary,
        start: { dateTime: `${slot.slot_date}T${slot.start_time}`, timeZone: timezone },
        end: { dateTime: `${slot.slot_date}T${slot.end_time}`, timeZone: timezone },
        reminders: {
          useDefault: false,
          overrides: [{ method: 'popup', minutes: settings?.gcal_default_reminder_minutes || 30 }],
        },
      };

      if (settings?.gcal_default_color) {
        event.colorId = settings.gcal_default_color;
      }

      if (slot.gcal_event_id) {
        // Update
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${slot.gcal_event_id}`,
          {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
          }
        );
        console.log('GCal update:', res.status);
      } else {
        // Create
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
          }
        );
        if (res.ok) {
          const created = await res.json();
          await supabase.from('calendar_slots').update({ gcal_event_id: created.id }).eq('id', slotId);
          console.log('GCal created:', created.id);
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
