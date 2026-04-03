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
    const { token, email, action, gcalSettings } = await req.json();
    if (!token || !email) {
      return new Response(JSON.stringify({ error: 'Token and email are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Resolve token → teacher_id
    const { data: settingsData, error: settingsError } = await supabase
      .from('calendar_settings')
      .select('teacher_id, default_meeting_link')
      .eq('public_calendar_token', token)
      .eq('public_calendar_enabled', true)
      .single();

    if (settingsError || !settingsData) {
      return new Response(JSON.stringify({ error: 'Invalid or disabled calendar token' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const teacherId = settingsData.teacher_id;
    const normalEmail = normalizedEmail;

    // Handle GCal-related actions
    if (action === 'get_gcal_status') {
      const { data: gcalToken } = await supabase.from('student_gcal_tokens')
        .select('settings')
        .eq('student_email', normalEmail)
        .eq('teacher_id', teacherId)
        .maybeSingle();
      return new Response(JSON.stringify({
        gcal_connected: !!gcalToken,
        gcal_settings: gcalToken?.settings || null,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'disconnect_gcal') {
      await supabase.from('student_gcal_tokens')
        .delete()
        .eq('student_email', normalEmail)
        .eq('teacher_id', teacherId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update_gcal_settings' && gcalSettings) {
      await supabase.from('student_gcal_tokens')
        .update({ settings: gcalSettings, updated_at: new Date().toISOString() })
        .eq('student_email', normalEmail)
        .eq('teacher_id', teacherId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    // 2. Find student
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id, name, english_level, student_email')
      .eq('teacher_id', teacherId)
      .ilike('student_email', normalizedEmail)
      .is('deleted_at', null)
      .single();

    if (studentError || !studentData) {
      return new Response(JSON.stringify({ error: 'Student not found for this teacher' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const studentId = studentData.id;

    // 3. Get teacher name
    const { data: teacherProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', teacherId)
      .single();

    const teacherName = [teacherProfile?.first_name, teacherProfile?.last_name].filter(Boolean).join(' ') || 'Teacher';

    // 4. Flashcard sets
    const { data: flashcardSets } = await supabase
      .from('flashcard_sets')
      .select('id, title, description, share_token, is_bidirectional, back_type, created_at, updated_at')
      .eq('student_id', studentId)
      .eq('teacher_id', teacherId)
      .is('deleted_at', null)
      .not('share_token', 'is', null)
      .order('updated_at', { ascending: false });

    // Count cards per set
    const setIds = (flashcardSets || []).map(s => s.id);
    let cardsCountMap: Record<string, number> = {};
    let masteredCountMap: Record<string, number> = {};

    if (setIds.length > 0) {
      const { data: cards } = await supabase
        .from('flashcard_cards')
        .select('id, set_id')
        .in('set_id', setIds)
        .is('deleted_at', null);

      (cards || []).forEach(c => {
        cardsCountMap[c.set_id] = (cardsCountMap[c.set_id] || 0) + 1;
      });

      const { data: progress } = await supabase
        .from('flashcard_progress')
        .select('set_id, card_id, repetition')
        .eq('learner_identifier', normalizedEmail)
        .in('set_id', setIds)
        .gte('repetition', 4);

      (progress || []).forEach(p => {
        masteredCountMap[p.set_id] = (masteredCountMap[p.set_id] || 0) + 1;
      });
    }

    const enrichedFlashcardSets = (flashcardSets || []).map(s => ({
      ...s,
      cards_count: cardsCountMap[s.id] || 0,
      mastered_count: masteredCountMap[s.id] || 0,
    }));

    // 5. Homework assignments
    const { data: homeworks } = await supabase
      .from('homework_assignments')
      .select('id, title, share_token, deadline, created_at, completed_at, reviewed_at, source_worksheet_id, selected_exercises')
      .eq('student_id', studentId)
      .eq('teacher_id', teacherId)
      .not('share_token', 'is', null)
      .order('created_at', { ascending: false });

    // Get homework progress
    const homeworkIds = (homeworks || []).map(h => h.id);
    let homeworkProgressMap: Record<string, { total: number; completed: number }> = {};

    if (homeworkIds.length > 0) {
      const { data: answers } = await supabase
        .from('homework_student_answers')
        .select('homework_id, is_submitted')
        .ilike('student_email', normalizedEmail)
        .in('homework_id', homeworkIds);

      (answers || []).forEach(a => {
        if (!homeworkProgressMap[a.homework_id]) {
          homeworkProgressMap[a.homework_id] = { total: 0, completed: 0 };
        }
        homeworkProgressMap[a.homework_id].total++;
        if (a.is_submitted) homeworkProgressMap[a.homework_id].completed++;
      });
    }

    // Get source worksheet titles
    const worksheetIds = [...new Set((homeworks || []).filter(h => h.source_worksheet_id).map(h => h.source_worksheet_id!))];
    let worksheetTitleMap: Record<string, string> = {};
    if (worksheetIds.length > 0) {
      const { data: worksheets } = await supabase
        .from('worksheets')
        .select('id, lesson_topic')
        .in('id', worksheetIds);
      (worksheets || []).forEach(w => { worksheetTitleMap[w.id] = w.lesson_topic || 'Untitled'; });
    }

    const enrichedHomeworks = (homeworks || []).map(h => {
      const exercises = Array.isArray(h.selected_exercises) ? h.selected_exercises : [];
      const progress = homeworkProgressMap[h.id];
      return {
        id: h.id,
        title: h.title,
        share_token: h.share_token,
        deadline: h.deadline,
        created_at: h.created_at,
        completed_at: h.completed_at,
        reviewed_at: h.reviewed_at,
        source_worksheet_title: h.source_worksheet_id ? worksheetTitleMap[h.source_worksheet_id] : null,
        exercises_count: exercises.length,
        completed_exercises_count: progress?.completed || 0,
      };
    });

    // 6. Shared worksheets
    const { data: sharedWorksheets } = await supabase
      .from('worksheets')
      .select('id, lesson_topic, share_token, created_at, english_level, content')
      .eq('student_id', studentId)
      .eq('teacher_id', teacherId)
      .not('share_token', 'is', null)
      .order('created_at', { ascending: false });

    // Check linked slots for worksheets
    const wsIds = (sharedWorksheets || []).map(w => w.id);
    let linkedSlotMap: Record<string, string> = {};
    if (wsIds.length > 0) {
      const { data: linkedSlots } = await supabase
        .from('calendar_slots')
        .select('worksheet_id, slot_date')
        .in('worksheet_id', wsIds);
      (linkedSlots || []).forEach(s => {
        if (s.worksheet_id) linkedSlotMap[s.worksheet_id] = s.slot_date;
      });
    }

    const enrichedWorksheets = (sharedWorksheets || []).map(w => {
      const content = w.content as any;
      const exercises = content?.exercises || [];
      return {
        id: w.id,
        title: w.lesson_topic || 'Untitled',
        share_token: w.share_token,
        created_at: w.created_at,
        english_level: w.english_level,
        exercises_count: exercises.length,
        linked_slot_date: linkedSlotMap[w.id] || null,
      };
    });

    // 7. Upcoming lessons
    const today = new Date().toISOString().split('T')[0];
    const { data: upcomingLessons } = await supabase
      .from('calendar_slots')
      .select('id, slot_date, start_time, end_time, status, title, notes, meeting_link, confirmed_at, worksheet_id')
      .eq('student_id', studentId)
      .eq('teacher_id', teacherId)
      .gte('slot_date', today)
      .in('status', ['booked', 'available'])
      .order('slot_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(10);

    // Get worksheet share tokens for lessons
    const lessonWsIds = [...new Set((upcomingLessons || []).filter(l => l.worksheet_id).map(l => l.worksheet_id!))];
    let lessonWsTokenMap: Record<string, string> = {};
    if (lessonWsIds.length > 0) {
      const { data: lessonWs } = await supabase
        .from('worksheets')
        .select('id, share_token')
        .in('id', lessonWsIds);
      (lessonWs || []).forEach(w => { if (w.share_token) lessonWsTokenMap[w.id] = w.share_token; });
    }

    const enrichedLessons = (upcomingLessons || []).map(l => ({
      ...l,
      worksheet_share_token: l.worksheet_id ? lessonWsTokenMap[l.worksheet_id] || null : null,
    }));

    // 8. Past lessons count
    const { count: completedLessonsCount } = await supabase
      .from('calendar_slots')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('teacher_id', teacherId)
      .eq('status', 'completed');

    const { count: totalLessonsCount } = await supabase
      .from('calendar_slots')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('teacher_id', teacherId)
      .in('status', ['booked', 'completed', 'no_show']);

    // 9. Compute stats
    const totalFlashcards = Object.values(cardsCountMap).reduce((a, b) => a + b, 0);
    const masteredFlashcards = Object.values(masteredCountMap).reduce((a, b) => a + b, 0);
    const activeHomeworks = enrichedHomeworks.filter(h => !h.completed_at).length;

    const stats = {
      totalLessons: totalLessonsCount || 0,
      completedLessons: completedLessonsCount || 0,
      upcomingLessons: enrichedLessons.length,
      activeHomeworks,
      flashcardSetsCount: enrichedFlashcardSets.length,
      totalFlashcards,
      masteredFlashcards,
    };

    // 10. Per-student meeting link
    const { data: studentSettingsData } = await supabase
      .from('calendar_student_settings')
      .select('default_meeting_link')
      .eq('student_id', studentId)
      .eq('teacher_id', teacherId)
      .maybeSingle();
    const studentMeetingLink = studentSettingsData?.default_meeting_link || null;

    return new Response(JSON.stringify({
      teacherName,
      teacherEmail: teacherProfile?.email || null,
      studentName: studentData.name,
      studentId,
      studentEmail: studentData.student_email,
      englishLevel: studentData.english_level,
      flashcardSets: enrichedFlashcardSets,
      homeworks: enrichedHomeworks,
      sharedWorksheets: enrichedWorksheets,
      upcomingLessons: enrichedLessons,
      stats,
      defaultMeetingLink: studentMeetingLink || settingsData.default_meeting_link || null,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error in get-student-hub-data:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
