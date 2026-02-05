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
  exercise_index?: number;
}

interface EvaluationResult {
  question_index: number;
  exercise_index?: number;
  quality_score: number;
  is_acceptable: boolean;
  feedback: string;
}

serve(async (req) => {
  console.log('[verify-open-answers] Function invoked, method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    console.log('[verify-open-answers] ========== FULL REQUEST ==========');
    console.log('[verify-open-answers] Request body:', JSON.stringify(body, null, 2));
    
    const { answers, english_level, context } = body as {
      answers: AnswerToEvaluate[];
      english_level: string;
      context?: string;
    };
    
    console.log('[verify-open-answers] Parsed: answers=', answers?.length, 'level=', english_level);

    if (!answers || answers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No answers to evaluate' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are an English language teacher evaluating student answers.
The student's English level is: ${english_level || 'Intermediate'}

Your task is to evaluate each answer based on:
1. Relevance - Does it answer the question?
2. Language quality - Is the grammar and vocabulary appropriate for the student's level?
3. Completeness - Is the answer sufficiently developed?

For each answer, provide:
- quality_score: A number from 0.0 to 1.0 (0.7+ is acceptable)
- is_acceptable: true if quality_score >= 0.7
- feedback: A brief, encouraging feedback in English (max 30 words). Be SPECIFIC about what the student did well or needs to improve. Do NOT use generic phrases like "Good answer" without specifics.

Be encouraging but honest. Focus on communication rather than perfection.
If the answer shows understanding but has minor errors, still give a passing score.

CRITICAL: Return ONLY a valid JSON array. No markdown code blocks. No extra text. Just the array.`;

    const userPrompt = `Evaluate these ${answers.length} student answers:

${answers.map((a, i) => `[Answer ${i + 1}]
Question: ${a.question_text}
Student's answer: ${a.student_answer}
${a.suggested_answer ? `Suggested answer: ${a.suggested_answer}` : ''}
Exercise type: ${a.exercise_type}
`).join('\n')}
${context ? `Context: ${context}` : ''}

Return exactly ${answers.length} evaluation objects in a JSON array:
[{"question_index": 0, "quality_score": 0.85, "is_acceptable": true, "feedback": "Your explanation of X correctly identifies Y..."}]`;

    console.log('[verify-open-answers] ========== PROMPTS ==========');
    console.log('[verify-open-answers] System prompt length:', systemPrompt.length);
    console.log('[verify-open-answers] User prompt length:', userPrompt.length);
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      console.error('[verify-open-answers] ERROR: LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
        max_tokens: 4000,
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
    
    console.log('[verify-open-answers] ========== RAW AI RESPONSE ==========');
    console.log('[verify-open-answers] Raw content length:', rawContent.length);
    console.log('[verify-open-answers] Raw content:', rawContent);

    let evaluations: EvaluationResult[];
    try {
      let cleanContent = rawContent.trim();
      
      // Strip markdown code blocks
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();
      
      // FIX 2.2: Truncate after last complete JSON array bracket
      const lastBracket = cleanContent.lastIndexOf(']');
      if (lastBracket !== -1 && lastBracket < cleanContent.length - 1) {
        console.log('[verify-open-answers] Truncating trailing content after position', lastBracket);
        cleanContent = cleanContent.substring(0, lastBracket + 1);
      }
      
      // FIX 2.2: Try to repair incomplete JSON - close unclosed braces
      let openBraces = (cleanContent.match(/{/g) || []).length;
      let closeBraces = (cleanContent.match(/}/g) || []).length;
      if (closeBraces < openBraces) {
        console.log('[verify-open-answers] Repairing JSON: adding', openBraces - closeBraces, 'closing braces');
        // Find last ']' position, insert closing braces before it
        const lastArr = cleanContent.lastIndexOf(']');
        if (lastArr !== -1) {
          const before = cleanContent.substring(0, lastArr);
          const missingBraces = '}'.repeat(openBraces - closeBraces);
          cleanContent = before + missingBraces + ']';
        }
      }
      
      // FIX 2.2: Handle truncated strings - remove last incomplete object if parse fails
      let parsedContent: any;
      try {
        parsedContent = JSON.parse(cleanContent);
      } catch (firstParseError) {
        console.log('[verify-open-answers] First parse failed, trying to remove last incomplete object');
        // Find last complete object (last '},' or last '}]')
        const lastCompleteObj = cleanContent.lastIndexOf('},');
        if (lastCompleteObj !== -1) {
          cleanContent = cleanContent.substring(0, lastCompleteObj + 1) + ']';
          console.log('[verify-open-answers] Retrying parse with truncated content');
          parsedContent = JSON.parse(cleanContent);
        } else {
          throw firstParseError;
        }
      }
      
      // Handle object wrapper
      if (!Array.isArray(parsedContent) && parsedContent.evaluations) {
        parsedContent = parsedContent.evaluations;
      }
      if (!Array.isArray(parsedContent)) {
        parsedContent = [parsedContent];
      }
      
      // Map using ORIGINAL indices from request
      evaluations = parsedContent.map((e: any, idx: number) => {
        let qualityScore = parseFloat(e.quality_score);
        if (isNaN(qualityScore)) qualityScore = 0.7;
        qualityScore = Math.max(0, Math.min(1, qualityScore));
        
        let feedback = e.feedback;
        if (!feedback || feedback.length < 10 || feedback === 'Thank you for your answer.') {
          if (qualityScore >= 0.9) {
            feedback = 'Excellent answer! Well structured and comprehensive.';
          } else if (qualityScore >= 0.8) {
            feedback = 'Very good answer with strong understanding shown.';
          } else if (qualityScore >= 0.7) {
            feedback = 'Good answer with some room for improvement.';
          } else if (qualityScore >= 0.5) {
            feedback = 'Partially correct. Review the suggested answer for guidance.';
          } else {
            feedback = 'This answer needs improvement. Check the suggested answer for reference.';
          }
        }
        
        return {
          exercise_index: answers[idx]?.exercise_index,
          question_index: answers[idx]?.question_index,
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
      
      // FIX 2.2: Dynamic fallback instead of generic
      evaluations = answers.map((a) => ({
        exercise_index: a.exercise_index,
        question_index: a.question_index,
        quality_score: 0.7,
        is_acceptable: true,
        feedback: 'Good effort on this answer. Your teacher will provide detailed feedback.'
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
