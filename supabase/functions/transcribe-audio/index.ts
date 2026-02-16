/**
 * transcribe-audio - Edge function to transcribe audio URLs using OpenAI Whisper
 * Fetches audio binary from URL, sends to Whisper API for transcription
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

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Fetch the audio file as binary
    console.log('[transcribe-audio] Fetching audio from:', audio_url);
    const audioResponse = await fetch(audio_url);
    if (!audioResponse.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch audio: ${audioResponse.status}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const audioBlob = await audioResponse.blob();
    const contentType = audioResponse.headers.get('content-type') || 'audio/webm';
    
    // Determine file extension
    let ext = 'webm';
    if (contentType.includes('mp4') || contentType.includes('m4a')) ext = 'mp4';
    else if (contentType.includes('ogg')) ext = 'ogg';
    else if (contentType.includes('wav')) ext = 'wav';
    else if (contentType.includes('mpeg') || contentType.includes('mp3')) ext = 'mp3';

    // Step 2: Send to OpenAI Whisper API
    const formData = new FormData();
    formData.append('file', audioBlob, `recording.${ext}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    console.log('[transcribe-audio] Sending to Whisper API, size:', audioBlob.size);
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errText = await whisperResponse.text();
      console.error('[transcribe-audio] Whisper error:', errText);
      return new Response(JSON.stringify({ error: 'Transcription failed', details: errText }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const whisperData = await whisperResponse.json();
    const transcription = whisperData.text || 'Unable to transcribe audio.';

    console.log('[transcribe-audio] Transcription successful, length:', transcription.length);

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
