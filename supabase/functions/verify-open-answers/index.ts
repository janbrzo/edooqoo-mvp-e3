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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { answers, english_level, context } = await req.json() as {
      answers: AnswerToEvaluate[];
      english_level: string;
      context?: string;
    };

    if (!answers || answers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No answers to evaluate' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[verify-open-answers] Evaluating', answers.length, 'open answers');

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

    // Call Lovable AI API (google/gemini-2.5-flash)
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('[verify-open-answers] LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await fetch('https://api.lovable.dev/v1/chat/completions', {
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
    
    console.log('[verify-open-answers] Raw AI response:', rawContent);

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
      
      evaluations = JSON.parse(cleanContent.trim());
      
      // Ensure quality_score is clamped and is_acceptable is set
      evaluations = evaluations.map((e, idx) => ({
        question_index: e.question_index ?? answers[idx]?.question_index ?? idx,
        quality_score: Math.max(0, Math.min(1, e.quality_score || 0)),
        is_acceptable: e.is_acceptable ?? (e.quality_score >= 0.7),
        feedback: e.feedback || 'Thank you for your answer.'
      }));
    } catch (parseError) {
      console.error('[verify-open-answers] Failed to parse AI response:', parseError);
      // Return neutral evaluation on parse failure
      evaluations = answers.map((a, idx) => ({
        question_index: a.question_index,
        quality_score: 0.7,
        is_acceptable: true,
        feedback: 'Answer recorded. Your teacher will review it.'
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
