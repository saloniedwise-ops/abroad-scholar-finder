-- Baseline of the LIVE database (Supabase project ndfxfsjbfcocdyzbtitj).
--
-- Reconstructed from the PostgREST API (column names and value types) because the
-- original DDL was applied outside this repo. Column types/defaults are best-effort:
-- before relying on this, compare with the real thing:
--     supabase db dump --linked --schema public > live.sql
-- Every statement is IF NOT EXISTS, so it is safe to run on the live database.
-- The three older migrations in this folder describe a previous, smaller schema
-- (project gsgtdandvjobjewvzojb) that is no longer used by the app.

CREATE TABLE IF NOT EXISTS public.universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_slug text,
  university_name text NOT NULL,
  country_name text,
  country_code text,
  website_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_slug text UNIQUE,
  university_id uuid REFERENCES public.universities(id),
  university_slug text,
  university_name text,
  country_name text,
  country_code text,
  scholarship_name text NOT NULL,
  degree_level text,
  field_category text,
  eligible_program text,
  amount_display text,
  deadline_display text,
  deadline_date date,
  intake text,
  status text,                      -- 'Active' | 'Closed' (NULL is treated as Active)
  featured boolean DEFAULT false,
  public_visible boolean DEFAULT true,
  summary text,
  learn_more_url text,
  legacy_source_value text,         -- links a scholarship to scholarship_sources.source_slug (or source_url)
  source_type text,
  is_active boolean DEFAULT true,
  last_verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scholarship_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_slug text UNIQUE,
  university_id uuid REFERENCES public.universities(id),
  university_name text,
  country_name text,
  source_url text,
  source_type text,
  crawl_method text DEFAULT 'requests',
  css_selector text,
  monitor_enabled boolean DEFAULT true,
  is_active boolean DEFAULT true,
  last_checked_at timestamptz,
  last_status text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scholarship_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.scholarship_sources(id) ON DELETE CASCADE,
  raw_text text,
  text_hash text,
  captured_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_snapshots_source_captured ON public.scholarship_snapshots (source_id, captured_at DESC);

CREATE TABLE IF NOT EXISTS public.scholarship_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id uuid REFERENCES public.scholarships(id) ON DELETE SET NULL,
  source_id uuid REFERENCES public.scholarship_sources(id) ON DELETE SET NULL,
  university_name text,
  scholarship_name text,
  field_changed text,
  change_type text,                 -- modified | deadline_changed | amount_changed | added | removed
  old_value text,
  new_value text,
  change_summary text,
  detected_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_changes_detected ON public.scholarship_changes (detected_at DESC);
