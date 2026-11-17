-- Lock down the live database (project ndfxfsjbfcocdyzbtitj).
--
-- Before this migration RLS was OFF on every table, so anyone holding the public (anon)
-- key could read, edit and delete all data. After it:
--   * the website's public key can only READ listed scholarships, universities and change history;
--   * everything else (sources, raw snapshots, crawler bookkeeping) is private;
--   * the crawler must write with the service-role key (GitHub secret SUPABASE_SERVICE_KEY),
--     which bypasses RLS.

DO $$
DECLARE t text; p record;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'universities','scholarships','scholarship_sources','scholarship_changes',
    'scholarship_snapshots','crawl_runs','scholarship_extracted_items',
    'scholarship_current_items','scholarship_change_events','daily_change_summary']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, t);
    END LOOP;
  END LOOP;
END $$;

CREATE POLICY "Public reads listed scholarships" ON public.scholarships
  FOR SELECT USING (public_visible = true AND is_active = true);
CREATE POLICY "Public reads universities" ON public.universities
  FOR SELECT USING (true);
CREATE POLICY "Public reads change history" ON public.scholarship_changes
  FOR SELECT USING (true);

-- Views ran with the owner's rights and so bypassed RLS; make them respect the caller's.
ALTER VIEW public.v_source_health SET (security_invoker = true);
ALTER VIEW public.v_recent_scholarship_changes SET (security_invoker = true);
REVOKE ALL ON public.v_source_health, public.v_recent_scholarship_changes FROM anon, authenticated;

-- NOTE: src/pages/admin/SourceMonitor.tsx reads scholarship_sources with the public key and
-- will show "Admin access required" until admin login + an admin policy are added.
