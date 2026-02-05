import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Process pending AI evaluations for worksheet answers
 * Called when teacher opens worksheet or clicks "Mark Done"
 */
serve(async (req) => {
  console.log('[process-pending-ai-evaluations] Function invoked');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Optional: filter by worksheet_id if provided
    let worksheetIdFilter: string | null = null;
    try {
      const body = await req.json();
      worksheetIdFilter = body?.worksheet_id || null;
    } catch {
      // No body provided - process all pending
    }

    // Get pending evaluations (limit to avoid timeout)
    let query = supabase
      .from('pending_worksheet_ai_evaluations')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);
    
    if (worksheetIdFilter) {
      query = query.eq('worksheet_id', worksheetIdFilter);
    }

    const { data: pendingEvals, error: fetchError } = await query;

    if (fetchError) throw fetchError;
    if (!pendingEvals || pendingEvals.length === 0) {
      console.log('[process-pending] No pending evaluations found');
      return new Response(
        JSON.stringify({ processed: 0, message: 'No pending evaluations' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[process-pending] Found ${pendingEvals.length} pending evaluations`);

    let processed = 0;
    let failed = 0;
    let skipped = 0;
    
    for (const pending of pendingEvals) {
      try {
        // PLAN FIX: Check if AI eval is actually needed using conditional logic
        // Only run if last_saved_at > last_ai_eval_at
        const { data: needsEval } = await supabase.rpc('needs_ai_evaluation', {
          p_worksheet_id: pending.worksheet_id,
          p_student_email: pending.student_email,
          p_exercise_index: pending.exercise_index
        });
        
        if (!needsEval) {
          console.log(`[process-pending] Skipping ${pending.id} - already evaluated (no new changes)`);
          // Mark as completed since no new evaluation needed
          await supabase
            .from('pending_worksheet_ai_evaluations')
            .update({ 
              status: 'completed',
              processed_at: new Date().toISOString()
            })
            .eq('id', pending.id);
          skipped++;
          continue;
        }
        
        // Mark as processing
        await supabase
          .from('pending_worksheet_ai_evaluations')
          .update({ status: 'processing' })
          .eq('id', pending.id);

        // Build answers for AI verification
        const answers = pending.answers || {};
        const context = pending.context || {};
        const questionItems = context.questions || [];
        
        // Build answersToVerify with proper structure
        const answersToVerify = Object.entries(answers).map(([qIdxStr, answer]) => {
          const qIdx = parseInt(qIdxStr);
          const questionItem = questionItems[qIdx] || {};
          
          // Get question text from various possible fields
          const questionText = questionItem?.question || 
                              questionItem?.text || 
                              questionItem?.prompt || 
                              questionItem?.expression ||
                              `Question ${qIdx + 1}`;
          
          // Get suggested answer if available
          const suggestedAnswer = questionItem?.answer || 
                                  questionItem?.suggested_answer || 
                                  questionItem?.paraphrase ||
                                  '';
          
          return {
            exercise_index: pending.exercise_index,
            question_index: qIdx,
            question_text: questionText,
            student_answer: String(answer),
            suggested_answer: suggestedAnswer,
            exercise_type: pending.exercise_type
          };
        }).filter(a => a.student_answer && a.student_answer.trim() !== '');

        if (answersToVerify.length === 0) {
          console.log(`[process-pending] No valid answers to verify for ${pending.id}`);
          await supabase
            .from('pending_worksheet_ai_evaluations')
            .update({ 
              status: 'completed',
              processed_at: new Date().toISOString()
            })
            .eq('id', pending.id);
          skipped++;
          continue;
        }

        console.log(`[process-pending] Verifying ${answersToVerify.length} answers for pending ${pending.id}`);

        // Call verify-open-answers
        const verifyResponse = await fetch(`${supabaseUrl}/functions/v1/verify-open-answers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            answers: answersToVerify,
            english_level: pending.english_level || 'Intermediate',
            context: context.title || `Exercise ${pending.exercise_index + 1}`
          })
        });

        if (!verifyResponse.ok) {
          const errorText = await verifyResponse.text();
          throw new Error(`AI verification failed: ${errorText}`);
        }

        const aiResult = await verifyResponse.json();
        console.log(`[process-pending] AI returned ${aiResult.evaluations?.length || 0} evaluations`);
        
        // Build item_evaluations from AI result
        const itemEvaluations = (aiResult.evaluations || []).map((e: any) => {
          const qIdx = e.question_index;
          const questionItem = questionItems[qIdx] || {};
          const nanoSkill = questionItem?.nano_skill;
          
          return {
            question_index: qIdx,
            name: nanoSkill?.name || `question_${qIdx}`,
            reason: nanoSkill?.reason || '',
            mastery: Math.round((e.quality_score || 0.7) * 100),
            hasValue: true,
            feedback: e.feedback || ''
          };
        });

        const overallMastery = itemEvaluations.length > 0
          ? Math.round(itemEvaluations.reduce((sum: number, e: any) => sum + e.mastery, 0) / itemEvaluations.length)
          : null;

        console.log(`[process-pending] Calculated mastery: ${overallMastery}% for ${itemEvaluations.length} items`);

        // Update worksheet_student_answers with AI results AND mark last_ai_eval_at
        const { error: updateError } = await supabase
          .from('worksheet_student_answers')
          .update({
            item_evaluations: itemEvaluations,
            mastery: overallMastery,
            last_ai_eval_at: new Date().toISOString() // PLAN FIX: Mark evaluation done
          })
          .eq('worksheet_id', pending.worksheet_id)
          .eq('student_email', pending.student_email)
          .eq('exercise_index', pending.exercise_index);

        if (updateError) {
          console.error(`[process-pending] Failed to update worksheet_student_answers:`, updateError);
          throw updateError;
        }

        // Mark as completed
        await supabase
          .from('pending_worksheet_ai_evaluations')
          .update({ 
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('id', pending.id);

        processed++;
        console.log(`[process-pending] Completed evaluation ${pending.id}, mastery=${overallMastery}%`);

      } catch (evalError: any) {
        console.error(`[process-pending] Error processing ${pending.id}:`, evalError);
        failed++;
        
        await supabase
          .from('pending_worksheet_ai_evaluations')
          .update({ 
            status: 'failed',
            error_message: evalError.message || 'Unknown error',
            processed_at: new Date().toISOString()
          })
          .eq('id', pending.id);
      }
    }

    console.log(`[process-pending] Finished: ${processed} processed, ${skipped} skipped, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        processed, 
        skipped,
        failed,
        total: pendingEvals.length,
        message: `Processed ${processed} evaluations, ${skipped} skipped (already evaluated), ${failed} failed`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[process-pending] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
