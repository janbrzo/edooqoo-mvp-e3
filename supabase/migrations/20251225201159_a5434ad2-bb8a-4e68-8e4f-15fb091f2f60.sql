-- Add new columns for additional worksheet suggestion fields
ALTER TABLE public.future_worksheet_suggestions 
ADD COLUMN IF NOT EXISTS suggested_additional_info TEXT,
ADD COLUMN IF NOT EXISTS suggested_grammar_focus TEXT;