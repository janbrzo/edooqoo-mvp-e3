-- Add audio-related columns to worksheets table
ALTER TABLE public.worksheets
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS audio_transcript TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS audio_voice TEXT;

COMMENT ON COLUMN public.worksheets.audio_url IS 'R2 URL for audio file (if audio-enhanced worksheet)';
COMMENT ON COLUMN public.worksheets.audio_transcript IS 'Full transcript of audio content';
COMMENT ON COLUMN public.worksheets.audio_duration IS 'Duration of audio in seconds';
COMMENT ON COLUMN public.worksheets.audio_voice IS 'Voice used for TTS (alloy, echo, fable, etc.)';