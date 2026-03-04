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
    const { teacherId, dateFrom, dateTo } = await req.json();

    if (!teacherId || !dateFrom || !dateTo) {
      return new Response(JSON.stringify({ error: 'teacherId, dateFrom and dateTo are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: slots } = await supabase
      .from('calendar_slots')
      .select('slot_date, start_time, end_time, status, notes, is_paid, title, student_id, confirmed_at, cancelled_at, cancelled_by, meeting_link')
      .eq('teacher_id', teacherId)
      .gte('slot_date', dateFrom)
      .lte('slot_date', dateTo)
      .order('slot_date')
      .order('start_time');

    // Get student names
    const studentIds = [...new Set((slots || []).filter((s: any) => s.student_id).map((s: any) => s.student_id))];
    const studentMap: Record<string, { name: string; email: string }> = {};
    
    if (studentIds.length > 0) {
      const { data: students } = await supabase
        .from('students')
        .select('id, name, student_email')
        .in('id', studentIds);
      (students || []).forEach((s: any) => {
        studentMap[s.id] = { name: s.name, email: s.student_email || '' };
      });
    }

    // Escape CSV field
    const esc = (val: string) => {
      if (!val) return '';
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const headers = ['Date', 'Start', 'End', 'Student', 'Email', 'Status', 'Notes', 'Paid', 'Confirmed', 'Cancelled By', 'Meeting Link'];
    const rows = (slots || []).map((s: any) => {
      const st = s.student_id ? studentMap[s.student_id] : null;
      return [
        s.slot_date,
        s.start_time?.slice(0, 5),
        s.end_time?.slice(0, 5),
        esc(st?.name || ''),
        esc(st?.email || ''),
        s.status,
        esc(s.notes || ''),
        s.is_paid ? 'Yes' : 'No',
        s.confirmed_at ? 'Yes' : 'No',
        s.cancelled_by || '',
        esc(s.meeting_link || ''),
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="calendar-export-${dateFrom}-${dateTo}.csv"`,
      },
    });
  } catch (err) {
    console.error('Error in calendar-export-csv:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
