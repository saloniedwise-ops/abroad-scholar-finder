-- PROPOSED, NOT APPLIED. Run manually in the Supabase SQL editor of project
-- ndfxfsjbfcocdyzbtitj ONLY AFTER the GitHub secret SUPABASE_SERVICE_KEY is set
-- (otherwise the crawler, which today writes with the public key, will lose write access).
--
-- Goal: the public (anon) key may only READ listed scholarships and change history.
-- The crawler uses the service-role key, which bypasses RLS.

DO $$
DECLARE t text; p record;
BEGIN
  FOREACH t IN ARRAY ARRAY['scholarship_sources','scholarship_snapshots','scholarship_changes','scholarships','universities']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, t);
    END LOOP;
  END LOOP;
END $$;

-- Raw crawler data: backend only (no policy = no access for anon/authenticated).
-- Public read of what the website shows:
CREATE POLICY "Public reads listed scholarships" ON public.scholarships
  FOR SELECT USING (public_visible = true AND is_active = true);
CREATE POLICY "Public reads universities" ON public.universities
  FOR SELECT USING (true);
CREATE POLICY "Public reads change history" ON public.scholarship_changes
  FOR SELECT USING (true);

-- NOTE: src/pages/admin/SourceMonitor.tsx reads scholarship_sources with the public key.
-- After this change that page shows "Admin access required" until admin login/RLS is added.
