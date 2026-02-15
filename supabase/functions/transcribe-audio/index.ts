/**
 * transcribe-audio - Edge function to transcribe audio URLs using Lovable AI
 * Used by teachers to get text from speaking recordings in Welcome Test
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio_url } = await req.json();

    if (!audio_url || !audio_url.startsWith('http')) {
      return new Response(JSON.stringify({ error: 'Valid audio_url is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use Gemini multimodal to transcribe audio
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'You are a transcription assistant. Listen to the audio and transcribe exactly what the speaker says. Return ONLY the transcription text, nothing else. If you cannot access the audio, return "Unable to transcribe audio."'
          },
          {
            role: 'user',
            content: `Please transcribe the audio at this URL: ${audio_url}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI transcription error:', errText);
      return new Response(JSON.stringify({ error: 'Transcription failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const transcription = data.choices?.[0]?.message?.content || 'Unable to transcribe audio.';

    return new Response(JSON.stringify({ success: true, transcription }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
