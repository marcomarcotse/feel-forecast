DROP POLICY IF EXISTS "Anyone can read mood entries" ON public.mood_entries;
REVOKE SELECT ON public.mood_entries FROM anon;
REVOKE SELECT ON public.mood_entries FROM authenticated;