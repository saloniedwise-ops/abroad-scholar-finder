
-- scholarship_sources is backend-only, no public access
CREATE POLICY "No public access to scholarship_sources"
  ON public.scholarship_sources FOR SELECT
  USING (false);
