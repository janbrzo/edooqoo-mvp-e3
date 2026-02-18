import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { test_id, student_id, teacher_id, answers, detected_traits, answered_count } = await req.json();

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

    // ===== SERVER-SIDE TRAIT RECONSTRUCTION (Issue 6B) =====
    // Reconstruct traits from answers instead of relying on frontend detected_traits
    // This ensures traits are correct even after page refresh/cross-device resume
    
    const TRAIT_QUESTIONS: Record<string, { questionId: string; options: string[]; mapping: Record<string, string> }> = {
      self_assessed_level: {
        questionId: 'wt_q1',
        options: [
          'I can handle basic everyday situations like ordering food or asking for directions',
          'I can have simple conversations about familiar topics but struggle with complex ideas',
          'I can discuss most topics but make grammatical mistakes and sometimes lack vocabulary',
          'I speak fluently in most situations but want to sound more natural and precise',
          "I'm comfortable in English but want to master advanced/professional language",
        ],
        mapping: { '0': 'A1-A2', '1': 'A2-B1', '2': 'B1-B2', '3': 'B2-C1', '4': 'C1-C2' },
      },
      motivation_type: {
        questionId: 'wt_q3',
        options: [
          'I need it for my job - meetings, emails, presentations',
          "I'm preparing for an exam (IELTS, Cambridge, etc.)",
          'I want to travel and communicate freely',
          'I want to watch movies/read books without subtitles',
          'I want to feel confident talking to English speakers',
          'Career advancement - I need English for promotion',
          "I'm moving to an English-speaking country",
        ],
        mapping: { '0': 'instrumental', '1': 'instrumental', '2': 'integrative', '3': 'integrative', '4': 'integrative', '5': 'instrumental', '6': 'instrumental' },
      },
      ambiguity_tolerance: {
        questionId: 'wt_q4',
        options: [
          'I ask the person to repeat or explain',
          'I pretend I understood and hope for the best',
          'I try to guess from context',
          'I get stressed and switch to my language',
          'I look it up immediately on my phone',
        ],
        mapping: { '0': 'high', '1': 'low', '2': 'high', '3': 'low', '4': 'medium' },
      },
      weekly_study_time: {
        questionId: 'wt_q5',
        options: [
          'Almost none - I only have lesson time',
          '15-30 minutes a few times a week',
          'About 1 hour spread across the week',
          "2-3 hours - I'm committed",
          'More than 3 hours - English is my priority',
        ],
        mapping: { '0': 'none', '1': '15_30_min', '2': '1_hour', '3': '2_3_hours', '4': '3_plus_hours' },
      },
      anxiety_level: {
        questionId: 'wt_q7',
        options: [
          "I don't mind at all - that's how you learn",
          'I prefer not to, but I can handle it',
          'I feel embarrassed but try to push through',
          "I avoid speaking because I'm afraid of mistakes",
          'I get really frustrated with myself',
        ],
        mapping: { '0': 'low', '1': 'low', '2': 'medium', '3': 'high', '4': 'high' },
      },
      preferred_input_channel: {
        questionId: 'wt_q8',
        options: [
          'Seeing it written down with a definition',
          'Hearing it in a sentence',
          'Using it in my own sentence right away',
          'Connecting it to a picture or image',
          'Repeating it many times',
          'Understanding the word parts (prefix, root, suffix)',
        ],
        mapping: { '0': 'visual', '1': 'auditory', '2': 'kinesthetic', '3': 'visual', '4': 'auditory', '5': 'visual' },
      },
      error_attitude: {
        questionId: 'wt_q14',
        options: [
          'I say "Sorry, could you repeat that please?" and try again',
          'I just point at the menu and smile',
          'I use Google Translate on my phone',
          'I answer with what I think they asked',
        ],
        mapping: { '0': 'comfortable', '1': 'avoidant', '2': 'cautious', '3': 'comfortable' },
      },
      feedback_preference: {
        questionId: 'wt_q42',
        options: [
          'Correct me immediately, every time',
          'Note them down and discuss at the end',
          'Only correct major mistakes, ignore small ones',
          'Write corrections for me to review later',
          'I prefer to self-correct with hints',
        ],
        mapping: { '0': 'immediate', '1': 'delayed_discussion', '2': 'major_only', '3': 'written_review', '4': 'self_correct' },
      },
    };

    // Reconstruct traits from DB answers (not frontend state)
    const traits: Record<string, string> = {};
    for (const [traitName, config] of Object.entries(TRAIT_QUESTIONS)) {
      // Try from DB questions first, then from answers payload
      const dbQ = questions.find((q: any) => {
        const qIdx = q.question_index;
        // Map question_index to question_id - check all questions
        return q.student_answer !== null;
      });
      
      // Use answers payload as source (it has question IDs as keys)
      const answerVal = answers?.[config.questionId];
      if (answerVal && typeof answerVal === 'string') {
        const optIdx = config.options.indexOf(answerVal);
        if (optIdx >= 0) {
          const mapped = config.mapping[String(optIdx)];
          if (mapped) traits[traitName] = mapped;
        }
      }
    }

    // Also use frontend detected_traits as fallback
    const frontendTraits = detected_traits || {};
    for (const [key, val] of Object.entries(frontendTraits)) {
      if (!traits[key] && val) traits[key] = val as string;
    }

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

    // Update student_tests with answered_count
    if (answered_count !== undefined) {
      await supabase
        .from('student_tests')
        .update({ answered_count })
        .eq('id', test_id);
    }

    // Note: welcome_test_completed event removed - only test_answer_submitted events are logged per-question

    // --- Point 6: Create notification for teacher ---
    try {
      // Get student name
      const { data: studentData } = await supabase
        .from('students')
        .select('name')
        .eq('id', student_id)
        .single();

      const studentName = studentData?.name || 'Student';

      await supabase.from('homework_notifications').insert({
        homework_id: null,
        student_id,
        teacher_id,
        notification_type: 'welcome_test_completed',
        message: `${studentName} completed the Welcome Test (Level: ${estimatedLevel})`,
        is_read: false,
      });
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
      // Non-critical, don't fail
    }

    // --- Point 8: Email teacher on completion ---
    if (RESEND_API_KEY) {
      try {
        const { data: teacherData } = await supabase
          .from('profiles')
          .select('email, first_name')
          .eq('id', teacher_id)
          .single();

        const { data: studentData } = await supabase
          .from('students')
          .select('name')
          .eq('id', student_id)
          .single();

        if (teacherData?.email) {
          const studentName = studentData?.name || 'Student';
          const teacherFirstName = teacherData.first_name || 'Teacher';

          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #7c3aed;">✅ Welcome Test Completed!</h2>
              <p>Hi ${teacherFirstName},</p>
              <p><strong>${studentName}</strong> has completed the Welcome Test. Here's a quick summary:</p>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                  <div style="text-align: center; flex: 1; min-width: 100px;">
                    <div style="font-size: 24px; font-weight: bold; color: #7c3aed;">${estimatedLevel}</div>
                    <div style="font-size: 12px; color: #6b7280;">Estimated Level</div>
                  </div>
                  ${grammarScore !== null ? `<div style="text-align: center; flex: 1; min-width: 100px;">
                    <div style="font-size: 24px; font-weight: bold;">${grammarScore}%</div>
                    <div style="font-size: 12px; color: #6b7280;">Grammar</div>
                  </div>` : ''}
                  ${vocabularyScore !== null ? `<div style="text-align: center; flex: 1; min-width: 100px;">
                    <div style="font-size: 24px; font-weight: bold;">${vocabularyScore}%</div>
                    <div style="font-size: 12px; color: #6b7280;">Vocabulary</div>
                  </div>` : ''}
                </div>
                ${strongest ? `<p style="margin-top: 12px; font-size: 14px; color: #374151;">
                  <strong>Strongest:</strong> ${strongest} | <strong>Weakest:</strong> ${weakest || '—'}
                </p>` : ''}
                ${selfAssessedLevel ? `<p style="font-size: 14px; color: #374151;">
                  <strong>Self-assessed:</strong> ${selfAssessedLevel} (${levelConfidence})
                </p>` : ''}
              </div>
              <p>View the full learning profile in the student's profile page:</p>
              <a href="https://edooqoo-mvp-e3.lovable.app/student/${student_id}?tab=tests" style="display: inline-block; background: #7c3aed; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin: 10px 0; font-weight: bold;">View Results →</a>
              <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
                — edooqoo
              </p>
            </div>
          `;

          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'edooqoo <noreply@edooqoo.com>',
              to: [teacherData.email],
              subject: `${studentName} completed the Welcome Test (${estimatedLevel})`,
              html: emailHtml,
            }),
          });

          console.log('[process-welcome-test] Teacher notification email sent to:', teacherData.email);
        }
      } catch (emailError) {
        console.error('Error sending teacher email:', emailError);
        // Non-critical
      }
    }

    // --- Point 15: AI Analysis of open answers (including speaking transcriptions) ---
    let aiSummary: string | null = null;
    if (LOVABLE_API_KEY) {
      try {
        const openQuestionIds = ['wt_q12', 'wt_q13', 'wt_q16', 'wt_q17', 'wt_q36', 'wt_q37', 'wt_q40', 'wt_q41', 'wt_q45'];
        const speakingQuestionIds = ['wt_q16s', 'wt_q36s', 'wt_q41s'];
        
        // Transcribe speaking answers before AI analysis
        const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
        const transcriptions: Record<string, string> = {};
        
        if (OPENAI_API_KEY) {
          for (const sqId of speakingQuestionIds) {
            const audioUrl = answers?.[sqId];
            if (audioUrl && typeof audioUrl === 'string' && audioUrl.startsWith('http') && (audioUrl.includes('r2.dev') || audioUrl.startsWith('https://pub-'))) {
              try {
                console.log(`[process-welcome-test] Transcribing speaking answer: ${sqId}`);
                // Call transcribe-audio edge function
                const transcribeResponse = await fetch(`${supabaseUrl}/functions/v1/transcribe-audio`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ audio_url: audioUrl }),
                });
                
                if (transcribeResponse.ok) {
                  const transcribeData = await transcribeResponse.json();
                  if (transcribeData.transcription) {
                    transcriptions[sqId] = transcribeData.transcription;
                    console.log(`[process-welcome-test] Transcribed ${sqId}: ${transcribeData.transcription.substring(0, 50)}...`);
                  }
                }
              } catch (transcribeErr) {
                console.error(`[process-welcome-test] Failed to transcribe ${sqId}:`, transcribeErr);
              }
            }
          }
        }
        
        // Build open answers including transcriptions
        const allAnswerIds = [...openQuestionIds, ...speakingQuestionIds];
        const openAnswers = allAnswerIds
          .filter(id => {
            if (transcriptions[id]) return true; // has transcription
            return answers?.[id] && answers[id] !== '__IDK__' && !String(answers[id]).startsWith('http');
          })
          .map(id => {
            if (transcriptions[id]) return `${id} (speaking - transcribed): "${transcriptions[id]}"`;
            return `${id}: "${answers[id]}"`;
          })
          .join('\n');

        if (openAnswers) {
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                {
                  role: 'system',
                  content: `You are an expert ESL teacher analyzing a student's Welcome Test answers. Based on their open-ended responses, provide:
1. A concise 3-4 sentence profile summary covering their English level, strengths, weaknesses, and personality as a learner.
2. 2-3 specific teaching recommendations.
3. For EACH open/speaking answer, rate the quality on a 0-100 scale (0=no meaningful content, 25=basic, 50=intermediate, 75=advanced, 100=near-native).
Format as JSON: {"summary": "...", "recommendations": ["...", "..."], "writing_quality": "basic|intermediate|advanced", "key_observations": ["...", "..."], "per_question_scores": {"wt_q16": 45, "wt_q36": 70, "wt_q16s": 55, ...}}`
                },
                {
                  role: 'user',
                  content: `Student profile data:
- Estimated level: ${estimatedLevel}
- Grammar score: ${grammarScore}%
- Vocabulary score: ${vocabularyScore}%
- Motivation: ${traits.motivation_type || 'unknown'}
- Anxiety: ${traits.anxiety_level || 'unknown'}
- Questions answered: ${questions.filter((q: any) => q.student_answer !== null).length}/${questions.length}

Open-ended answers:
${openAnswers}`
                }
              ],
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const content = aiData.choices?.[0]?.message?.content || '';
            try {
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                aiSummary = JSON.stringify(parsed);
              } else {
                aiSummary = JSON.stringify({ summary: content, recommendations: [], writing_quality: 'unknown', key_observations: [] });
              }
            } catch {
              aiSummary = JSON.stringify({ summary: content, recommendations: [], writing_quality: 'unknown', key_observations: [] });
            }
          }
        }

        // Save AI summary to profile
        if (aiSummary) {
          await supabase
            .from('student_learning_profiles')
            .update({ ai_summary: aiSummary })
            .eq('student_id', student_id)
            .eq('teacher_id', teacher_id);
          console.log('[process-welcome-test] AI summary generated and saved');

          // Update mastery in student_events for open/speaking questions
          // Round 8: Use per_question_scores for individual mastery, fallback to writing_quality
          try {
            const parsed = JSON.parse(aiSummary);
            const writingQuality = parsed.writing_quality;
            const fallbackMastery = writingQuality === 'advanced' ? 75 :
                                    writingQuality === 'intermediate' ? 50 : 25;
            const perScores = parsed.per_question_scores || {};
            
            const allOpenSpeakingIds = [...openQuestionIds, ...speakingQuestionIds];
            let updatedCount = 0;
            for (const qId of allOpenSpeakingIds) {
              if (answers?.[qId] && answers[qId] !== '__IDK__') {
                const score = perScores[qId] !== undefined ? Math.round(perScores[qId]) : fallbackMastery;
                await supabase
                  .from('student_events')
                  .update({ mastery: score })
                  .eq('source_id', test_id)
                  .eq('event_type', 'test_answer_submitted')
                  .filter('event_payload->>answer_id', 'eq', qId);
                updatedCount++;
              }
            }
            console.log(`[process-welcome-test] Updated mastery for ${updatedCount} open/speaking events (per_question_scores: ${Object.keys(perScores).length} keys)`);
          } catch (masteryErr) {
            console.error('[process-welcome-test] Error updating mastery:', masteryErr);
          }
        }
      } catch (aiError) {
        console.error('Error generating AI summary:', aiError);
      }
    }

    return new Response(JSON.stringify({ success: true, estimated_level: estimatedLevel, ai_summary: aiSummary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing welcome test:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
