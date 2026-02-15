/**
 * generate-welcome-test-audio - One-time edge function to generate TTS audio
 * for Welcome Test listening comprehension questions.
 * Calls generate-audio internally for each transcript.
 */

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
    const { transcript, voice } = await req.json();

    if (!transcript) {
      return new Response(JSON.stringify({ error: 'transcript is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('LOVABLE_API_KEY');
    
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'No API key configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call OpenAI TTS
    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: transcript,
        voice: voice || 'alloy',
        response_format: 'mp3',
      }),
    });

    if (!ttsResponse.ok) {
      const errText = await ttsResponse.text();
      console.error('TTS error:', errText);
      return new Response(JSON.stringify({ error: 'TTS generation failed', details: errText }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get audio as blob
    const audioBlob = await ttsResponse.blob();

    // Upload to R2 via upload-to-r2 function
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const formData = new FormData();
    const fileName = `welcome-test-listening-${Date.now()}.mp3`;
    formData.append('file', audioBlob, fileName);

    const uploadResponse = await fetch(`${supabaseUrl}/functions/v1/upload-to-r2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errText = await uploadResponse.text();
      console.error('Upload error:', errText);
      return new Response(JSON.stringify({ error: 'Upload failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const uploadData = await uploadResponse.json();
    const audioUrl = uploadData?.url || uploadData?.publicUrl;

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
