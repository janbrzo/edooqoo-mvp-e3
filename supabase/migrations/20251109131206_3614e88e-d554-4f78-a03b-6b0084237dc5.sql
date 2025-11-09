-- Create geolocation cache table for optimization
CREATE TABLE IF NOT EXISTS public.geolocation_cache (
  ip TEXT PRIMARY KEY,
  country TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_geolocation_cache_updated_at 
ON public.geolocation_cache(updated_at);

-- Enable RLS (though this table is only accessed from edge functions)
ALTER TABLE public.geolocation_cache ENABLE ROW LEVEL SECURITY;

-- Policy for service role (edge functions) to read/write
CREATE POLICY "Service role can manage geolocation cache"
ON public.geolocation_cache
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Function to clean old cache entries (older than 7 days)
CREATE OR REPLACE FUNCTION public.clean_old_geolocation_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.geolocation_cache
  WHERE updated_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;