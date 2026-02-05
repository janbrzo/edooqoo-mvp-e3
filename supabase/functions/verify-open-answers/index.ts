import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnswerToEvaluate {
  question_index: number;
  question_text: string;
  student_answer: string;
  suggested_answer?: string;
  exercise_type: string;
}

interface EvaluationResult {
  question_index: number;
  quality_score: number; // 0.0 - 1.0
  is_acceptable: boolean;
  feedback: string;
}

serve(async (req) => {
  console.log('[verify-open-answers] Function invoked, method:', req.method);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('[verify-open-answers] Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // PROBLEM 4.2 FIX: Detailed logging for debugging
    console.log('[verify-open-answers] ========== FULL REQUEST ==========');
    console.log('[verify-open-answers] Request body:', JSON.stringify(body, null, 2));
    
    const { answers, english_level, context } = body as {
      answers: AnswerToEvaluate[];
      english_level: string;
      context?: string;
    };
    
    console.log('[verify-open-answers] Parsed data:');
    console.log('[verify-open-answers] - Answers count:', answers?.length || 0);
    console.log('[verify-open-answers] - English level:', english_level);
    console.log('[verify-open-answers] - Context:', context || '(none)');

    if (!answers || answers.length === 0) {
      console.log('[verify-open-answers] ERROR: No answers provided');
      return new Response(
        JSON.stringify({ error: 'No answers to evaluate' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[verify-open-answers] Evaluating', answers.length, 'open answers, level:', english_level);

    // Build prompt for AI evaluation
    const systemPrompt = `You are an English language teacher evaluating student answers.
The student's English level is: ${english_level || 'Intermediate'}

Your task is to evaluate each answer based on:
1. Relevance - Does it answer the question?
2. Language quality - Is the grammar and vocabulary appropriate for the student's level?
3. Completeness - Is the answer sufficiently developed?

For each answer, provide:
- quality_score: A number from 0.0 to 1.0 (0.7+ is acceptable)
- is_acceptable: true if quality_score >= 0.7
- feedback: A brief, encouraging feedback in English (max 50 words)

Be encouraging but honest. Focus on communication rather than perfection.
If the answer shows understanding but has minor errors, still give a passing score.

IMPORTANT: Return ONLY valid JSON array, no markdown, no explanation.`;

    const userPrompt = `Evaluate these student answers:

${answers.map((a, i) => `
[Answer ${i + 1}]
Question: ${a.question_text}
Student's answer: ${a.student_answer}
${a.suggested_answer ? `Suggested answer: ${a.suggested_answer}` : ''}
Exercise type: ${a.exercise_type}
`).join('\n')}

${context ? `Context: ${context}` : ''}

Return a JSON array with objects for each answer:
[{"question_index": 0, "quality_score": 0.85, "is_acceptable": true, "feedback": "..."}]`;

    // PROBLEM 4.2 FIX: Log the full prompts being sent to AI
    console.log('[verify-open-answers] ========== SYSTEM PROMPT ==========');
    console.log(systemPrompt);
    console.log('[verify-open-answers] ========== USER PROMPT ==========');
    console.log(userPrompt);
    
    // Call Lovable AI API (google/gemini-2.5-flash)
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    console.log('[verify-open-answers] LOVABLE_API_KEY configured:', !!lovableApiKey);
    
    if (!lovableApiKey) {
      console.error('[verify-open-answers] ERROR: LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[verify-open-answers] Calling Lovable AI API...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[verify-open-answers] AI API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'AI evaluation failed', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || '[]';
    
    // PROBLEM 4.2 FIX: Log full AI response for debugging
    console.log('[verify-open-answers] ========== RAW AI RESPONSE ==========');
    console.log('[verify-open-answers] Full aiData:', JSON.stringify(aiData, null, 2));
    console.log('[verify-open-answers] Raw content:', rawContent);

    // Parse AI response - handle potential markdown wrapping
    let evaluations: EvaluationResult[];
    try {
      // Remove markdown code blocks if present
      let cleanContent = rawContent.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();
      
      // PROBLEM 2.2 FIX: Handle case where AI returns object instead of array
      let parsedContent = JSON.parse(cleanContent);
      
      // If AI returned an object with evaluations array inside
      if (!Array.isArray(parsedContent) && parsedContent.evaluations) {
        parsedContent = parsedContent.evaluations;
      }
      
      // If still not an array, wrap single evaluation
      if (!Array.isArray(parsedContent)) {
        parsedContent = [parsedContent];
      }
      
      // PROBLEM 2.1 & 2.2 FIX: Use ORIGINAL indices from request, not AI response
      // AI may reorder or renumber, so we use positional mapping to preserve original indices
      evaluations = parsedContent.map((e: any, idx: number) => {
        // Ensure quality_score is a valid number
        let qualityScore = parseFloat(e.quality_score);
        if (isNaN(qualityScore)) {
          qualityScore = 0.7; // Default if missing
        }
        qualityScore = Math.max(0, Math.min(1, qualityScore));
        
        // PROBLEM 2.2 FIX: Ensure feedback exists and is meaningful
        let feedback = e.feedback;
        if (!feedback || feedback.length < 10 || feedback === 'Thank you for your answer.') {
          // Generate dynamic feedback based on score
          if (qualityScore >= 0.9) {
            feedback = 'Excellent answer! Well structured and comprehensive.';
          } else if (qualityScore >= 0.8) {
            feedback = 'Very good answer! Minor improvements possible.';
          } else if (qualityScore >= 0.7) {
            feedback = 'Good answer with some room for improvement.';
          } else if (qualityScore >= 0.5) {
            feedback = 'Partially correct. Review the suggested answer for guidance.';
          } else {
            feedback = 'This answer needs improvement. Check the suggested answer for reference.';
          }
        }
        
        return {
          exercise_index: answers[idx]?.exercise_index,  // From original request
          question_index: answers[idx]?.question_index,  // From original request - NOT e.question_index!
          quality_score: qualityScore,
          is_acceptable: e.is_acceptable ?? (qualityScore >= 0.7),
          feedback: feedback
        };
      });
      
      console.log('[verify-open-answers] Successfully parsed', evaluations.length, 'evaluations');
      console.log('[verify-open-answers] Evaluations:', JSON.stringify(evaluations, null, 2));
    } catch (parseError) {
      console.error('[verify-open-answers] Failed to parse AI response:', parseError);
      console.error('[verify-open-answers] Raw content was:', rawContent);
      
      // PROBLEM 2.2 FIX: Return more informative feedback on parse failure
      evaluations = answers.map((a, idx) => ({
        exercise_index: a.exercise_index,
        question_index: a.question_index,
        quality_score: 0.7,
        is_acceptable: true,
        feedback: 'Your answer has been recorded. AI evaluation was unavailable, your teacher will review it.'
      }));
    }

    const result = {
      evaluated_at: new Date().toISOString(),
      model: 'google/gemini-2.5-flash',
      evaluations
    };

    console.log('[verify-open-answers] Evaluation complete:', evaluations.length, 'answers processed');

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[verify-open-answers] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
