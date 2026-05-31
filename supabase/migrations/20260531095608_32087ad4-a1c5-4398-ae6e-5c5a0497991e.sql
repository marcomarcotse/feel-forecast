DROP POLICY "Anyone can insert mood entries" ON public.mood_entries;
REVOKE INSERT ON public.mood_entries FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.mood_entries FROM authenticated;