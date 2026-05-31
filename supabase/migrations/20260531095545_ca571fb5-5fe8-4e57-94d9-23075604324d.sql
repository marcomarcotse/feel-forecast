CREATE TABLE public.mood_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  mood_text TEXT NOT NULL,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('Sunny','Cloudy','Rainy','Snowy')),
  sentiment_score REAL NOT NULL,
  ai_response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.mood_entries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mood_entries TO authenticated;
GRANT ALL ON public.mood_entries TO service_role;

ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read mood entries"
ON public.mood_entries FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert mood entries"
ON public.mood_entries FOR INSERT
WITH CHECK (true);

CREATE INDEX idx_mood_entries_created_at ON public.mood_entries (created_at DESC);