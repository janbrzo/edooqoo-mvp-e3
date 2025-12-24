import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentName, englishLevel, mainGoal, goals } = await req.json();

    // Validate required fields
    if (!studentName || !englishLevel || !mainGoal) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context from goals and elements
    const goalsContext = goals?.map((g: any) => {
      const elements = g.elements?.map((e: any) => {
        const ratingText = e.current_rating ? `(rated ${e.current_rating}/5)` : '(not rated yet)';
        return `    - ${e.title} ${ratingText}`;
      }).join('\n') || '    (no elements yet)';
      return `  Goal: ${g.title}\n${elements}`;
    }).join('\n\n') || 'No specific goals set yet.';

    // Identify weak areas (elements rated 1-2)
    const weakElements = goals?.flatMap((g: any) => 
      (g.elements || []).filter((e: any) => e.current_rating && e.current_rating <= 2)
        .map((e: any) => e.title)
    ) || [];

    // Identify areas to practice (elements rated 3)
    const practiceElements = goals?.flatMap((g: any) => 
      (g.elements || []).filter((e: any) => e.current_rating === 3)
        .map((e: any) => e.title)
    ) || [];

    const prompt = `You are an expert ESL curriculum planner. Based on the student profile below, generate 2-4 personalized worksheet suggestions for their upcoming lessons.

STUDENT PROFILE:
- Name: ${studentName}
- English Level: ${englishLevel}
- Main Learning Goal: ${mainGoal}

CURRENT PROGRESS:
${goalsContext}

${weakElements.length > 0 ? `WEAK AREAS (need focus): ${weakElements.join(', ')}` : ''}
${practiceElements.length > 0 ? `AREAS TO PRACTICE: ${practiceElements.join(', ')}` : ''}

Generate 2-4 worksheet suggestions that:
1. Address weak areas first
2. Build progressively on current knowledge
3. Are appropriate for ${englishLevel} level
4. Support the main goal of "${mainGoal}"
5. Include varied and engaging topics

Return a JSON array with this exact format (no markdown, just valid JSON):
[
  {
    "topic": "Specific lesson topic",
    "goal": "What student will learn/practice",
    "exercises": ["exercise-type-1", "exercise-type-2", "exercise-type-3"],
    "rationale": "Why this lesson is recommended now"
  }
]

Valid exercise types: reading, fill-in-blanks, matching, multiple-choice, word-order, gap-text, true-false, categorize, dialogue, synonyms-antonyms, describe-picture, answer-questions, open-questions, paraphrasing, sentence-transformation`;

    // Call AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert ESL curriculum planner. Return only valid JSON arrays.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '[]';
    
    // Parse the JSON response
    let suggestions = [];
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      suggestions = JSON.parse(cleanContent);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      // Return empty suggestions if parsing fails
      suggestions = [];
    }

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-timeline:', error);
    return new Response(
      JSON.stringify({ error: error.message, suggestions: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
