-- Create worksheet_drawings table for storing drawing overlay data
CREATE TABLE public.worksheet_drawings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worksheet_id UUID NOT NULL REFERENCES public.worksheets(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL,
  drawing_data JSONB NOT NULL DEFAULT '{"objects": [], "version": "1.0"}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- One drawing per worksheet (teacher can have only one active drawing per worksheet)
  CONSTRAINT unique_worksheet_drawing UNIQUE (worksheet_id)
);

-- Create index for faster lookups
CREATE INDEX idx_worksheet_drawings_worksheet_id ON public.worksheet_drawings(worksheet_id);
CREATE INDEX idx_worksheet_drawings_teacher_id ON public.worksheet_drawings(teacher_id);

-- Enable Row Level Security
ALTER TABLE public.worksheet_drawings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Teachers can manage their own drawings
CREATE POLICY "Teachers can manage their own drawings"
ON public.worksheet_drawings
FOR ALL
USING (auth.uid() = teacher_id)
WITH CHECK (auth.uid() = teacher_id);

-- RLS Policy: Anyone can view drawings (for students in shared worksheets)
CREATE POLICY "Anyone can view worksheet drawings"
ON public.worksheet_drawings
FOR SELECT
USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_worksheet_drawings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_worksheet_drawings_timestamp
BEFORE UPDATE ON public.worksheet_drawings
FOR EACH ROW
EXECUTE FUNCTION public.update_worksheet_drawings_updated_at();

-- Enable Realtime for this table (for live synchronization)
ALTER PUBLICATION supabase_realtime ADD TABLE public.worksheet_drawings;