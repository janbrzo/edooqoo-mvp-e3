import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { text, target_language, mode = 'translation' } = await req.json();

    if (!text || !target_language) {
      return new Response(
        JSON.stringify({ error: 'Missing text or target_language' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[translate-flashcard] Mode: ${mode}, Processing "${text}" for ${target_language}`);

    // Determine system prompt based on mode
    let systemPrompt = '';
    if (mode === 'definition') {
      systemPrompt = `You are an English language teacher. Provide a clear, concise definition of the English word or phrase. Write the definition in simple English that an ESL student can understand. Provide ONLY the definition, nothing else. Keep it under 20 words.`;
    } else {
      systemPrompt = `You are a professional translator. Translate the given English text to ${target_language}. Provide ONLY the translation, nothing else. Keep it natural and conversational.`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 100,
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[translate-flashcard] OpenAI error:', data);
      throw new Error(data.error?.message || 'OpenAI request failed');
    }

    const translation = data.choices[0]?.message?.content?.trim() || '';

    console.log(`[translate-flashcard] Result: "${translation}"`);

    return new Response(
      JSON.stringify({ translation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[translate-flashcard] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
