import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { test_id, student_id, teacher_id, answers, detected_traits } = await req.json();

    if (!test_id || !student_id || !teacher_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all questions with answers
    const { data: questions } = await supabase
      .from('student_test_questions')
      .select('*')
      .eq('test_id', test_id)
      .order('question_index', { ascending: true });

    if (!questions || questions.length === 0) {
      return new Response(JSON.stringify({ error: 'No questions found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate scores by element_type
    const scoresByType: Record<string, { correct: number; total: number }> = {};
    for (const q of questions) {
      if (q.element_type && q.is_correct !== null) {
        if (!scoresByType[q.element_type]) scoresByType[q.element_type] = { correct: 0, total: 0 };
        scoresByType[q.element_type].total++;
        if (q.is_correct) scoresByType[q.element_type].correct++;
      }
    }

    const calcPercent = (type: string) => {
      const s = scoresByType[type];
      return s ? Math.round((s.correct / s.total) * 100) : null;
    };

    const grammarScore = calcPercent('grammar');
    const vocabularyScore = calcPercent('vocabulary');
    const readingScore = calcPercent('reading');
    const writingScore = calcPercent('writing');

    // Determine strongest/weakest
    const scores = [
      { skill: 'grammar', score: grammarScore },
      { skill: 'vocabulary', score: vocabularyScore },
      { skill: 'reading', score: readingScore },
      { skill: 'writing', score: writingScore },
    ].filter(s => s.score !== null);

    const strongest = scores.length > 0 ? scores.reduce((a, b) => (a.score! > b.score! ? a : b)).skill : null;
    const weakest = scores.length > 0 ? scores.reduce((a, b) => (a.score! < b.score! ? a : b)).skill : null;

    // Estimate level from grammar + vocabulary scores
    const avgScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s.score!, 0) / scores.length : 0;
    let estimatedLevel = 'A2';
    if (avgScore >= 90) estimatedLevel = 'C1';
    else if (avgScore >= 75) estimatedLevel = 'B2';
    else if (avgScore >= 55) estimatedLevel = 'B1';
    else if (avgScore >= 35) estimatedLevel = 'A2';
    else estimatedLevel = 'A1';

    // Extract traits from detected_traits
    const traits = detected_traits || {};
    const selfAssessedLevel = traits.self_assessed_level || null;

    // Level confidence
    const levelMap: Record<string, number> = { 'A1': 1, 'A1-A2': 1.5, 'A2': 2, 'A2-B1': 2.5, 'B1': 3, 'B1-B2': 3.5, 'B2': 4, 'B2-C1': 4.5, 'C1': 5, 'C1-C2': 5.5 };
    const estNum = levelMap[estimatedLevel] || 3;
    const selfNum = levelMap[selfAssessedLevel] || estNum;
    const levelConfidence = Math.abs(estNum - selfNum) <= 0.5 ? 'accurate' : selfNum > estNum ? 'overestimates' : 'underestimates';

    // Extract preferred activities from answers (Q6)
    const preferredActivities = Array.isArray(answers?.wt_q6) ? answers.wt_q6 : [];
    const interestTopics = Array.isArray(answers?.wt_q43) ? answers.wt_q43 : [];

    // Extract confidence matrix (Q44)
    const matrix = answers?.wt_q44 || {};
    const confMap: Record<string, string> = {
      'Speaking with strangers': 'confidence_speaking',
      'Writing formal emails': 'confidence_writing',
      'Understanding movies without subtitles': 'confidence_listening',
      'Reading news articles': 'confidence_reading',
      'Giving presentations': 'confidence_presenting',
      'Small talk at parties': 'confidence_small_talk',
    };

    // Upsert learning profile
    const profileData = {
      student_id,
      teacher_id,
      welcome_test_id: test_id,
      estimated_level: estimatedLevel,
      self_assessed_level: selfAssessedLevel,
      level_confidence: levelConfidence,
      motivation_type: traits.motivation_type || null,
      anxiety_level: traits.anxiety_level || null,
      ambiguity_tolerance: traits.ambiguity_tolerance || null,
      error_attitude: traits.error_attitude || null,
      preferred_activities: preferredActivities,
      preferred_input_channel: traits.preferred_input_channel || null,
      feedback_preference: traits.feedback_preference || null,
      interest_topics: interestTopics,
      weekly_study_time: traits.weekly_study_time || null,
      grammar_score: grammarScore,
      vocabulary_score: vocabularyScore,
      reading_score: readingScore,
      writing_score: writingScore,
      communication_score: null,
      strongest_skill: strongest,
      weakest_skill: weakest,
      confidence_speaking: matrix['Speaking with strangers'] || null,
      confidence_writing: matrix['Writing formal emails'] || null,
      confidence_listening: matrix['Understanding movies without subtitles'] || null,
      confidence_reading: matrix['Reading news articles'] || null,
      confidence_presenting: matrix['Giving presentations'] || null,
      confidence_small_talk: matrix['Small talk at parties'] || null,
      raw_answers: answers || {},
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from('student_learning_profiles')
      .upsert(profileData, { onConflict: 'student_id,teacher_id' });

    if (upsertError) {
      console.error('Error upserting learning profile:', upsertError);
      throw upsertError;
    }

    // Log welcome_test_completed event
    await supabase.rpc('add_student_event', {
      p_student_id: student_id,
      p_teacher_id: teacher_id,
      p_event_type: 'welcome_test_completed',
      p_event_source: 'test',
      p_source_id: test_id,
      p_event_payload: {
        test_type: 'welcome',
        total_questions: questions.length,
        completed_questions: questions.filter((q: any) => q.student_answer !== null).length,
        grammar_score: grammarScore,
        vocabulary_score: vocabularyScore,
        estimated_level: estimatedLevel,
        self_assessed_level: selfAssessedLevel,
        level_gap: levelConfidence,
        profile_summary: {
          motivation_type: traits.motivation_type,
          anxiety_level: traits.anxiety_level,
          preferred_activities: preferredActivities.slice(0, 3),
          interest_topics: interestTopics.slice(0, 3),
          feedback_preference: traits.feedback_preference,
          strongest_skill: strongest,
          weakest_skill: weakest,
        },
      },
    });

    return new Response(JSON.stringify({ success: true, estimated_level: estimatedLevel }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing welcome test:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
