/**
 * generate-welcome-test-audio - Generate TTS audio for Welcome Test listening questions.
 * Uses gpt-4o-audio-preview via OpenAI API, uploads to R2.
 * Requires a valid OPENAI_API_KEY with quota (LOVABLE_API_KEY does not support audio models).
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
    const { transcript, voice } = await req.json();

    if (!transcript) {
      return new Response(JSON.stringify({ error: 'transcript is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Audio models require direct OpenAI API key (LOVABLE_API_KEY gateway doesn't support audio)
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured. Audio generation requires a direct OpenAI API key.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const selectedVoice = voice || 'alloy';
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-audio-preview',
        modalities: ['audio', 'text'],
        audio: { voice: selectedVoice, format: 'mp3' },
        messages: [
          { 
            role: 'system', 
            content: 'You are a voice actor. Read the following dialogue naturally, with appropriate pauses and intonation. Do NOT add any commentary - just read exactly what is given.' 
          },
          { role: 'user', content: transcript }
        ]
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Audio generation error:', errText);
      return new Response(JSON.stringify({ error: 'Audio generation failed', details: errText }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const audioBase64 = data.choices?.[0]?.message?.audio?.data;

    if (!audioBase64) {
      return new Response(JSON.stringify({ error: 'No audio data in response' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Upload to R2
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const timestamp = Date.now();

    const uploadResponse = await fetch(`${supabaseUrl}/functions/v1/upload-to-r2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Image: audioBase64,
        filename: `audio/welcome-test-listening-${timestamp}.mp3`,
        contentType: 'audio/mpeg',
      }),
    });

    let audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json();
      if (uploadData.success && uploadData.url) {
        audioUrl = uploadData.url;
        console.log('R2 upload success:', audioUrl);
      }
    } else {
      console.warn('R2 upload failed, returning base64 fallback');
    }

    return new Response(JSON.stringify({ success: true, audio_url: audioUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
