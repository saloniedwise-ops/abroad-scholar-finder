-- Baseline of the LIVE database (Supabase project ndfxfsjbfcocdyzbtitj).
--
-- Written from the real column list, constraints and indexes read from the live project
-- on 2026-11-17. The DDL itself was originally applied outside this repo, so this file is
-- the schema-as-of-now: every statement is IF NOT EXISTS and safe to run on the live DB.
-- The three older migrations in this folder describe a previous, smaller schema
-- (project gsgtdandvjobjewvzojb) that the app no longer uses.
--
-- Not used by the app or the current crawler (kept because they exist and hold data):
-- scholarship_extracted_items (2,061 rows), scholarship_current_items, scholarship_change_events,
-- crawl_runs, daily_change_summary - leftovers of an earlier per-scholarship crawler design.

CREATE TABLE IF NOT EXISTS public.universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_slug text NOT NULL UNIQUE,
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
  scholarship_slug text NOT NULL UNIQUE,
  university_id uuid REFERENCES public.universities(id) ON DELETE SET NULL,
  university_slug text,
  university_name text NOT NULL,
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
  source_slug text NOT NULL UNIQUE,
  university_id uuid REFERENCES public.universities(id) ON DELETE CASCADE,
  university_name text NOT NULL,
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
  source_id uuid REFERENCES public.scholarship_sources(id) ON DELETE CASCADE,
  raw_text text,
  text_hash text,
  captured_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scholarship_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id uuid REFERENCES public.scholarships(id) ON DELETE CASCADE,
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

-- Leftovers of an earlier crawler design (see header) -------------------------------------

CREATE TABLE IF NOT EXISTS public.crawl_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz,
  status text,
  sources_checked integer DEFAULT 0,
  changes_found integer DEFAULT 0,
  error_log text
);

CREATE TABLE IF NOT EXISTS public.scholarship_extracted_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES public.scholarship_sources(id) ON DELETE CASCADE,
  crawl_date timestamptz DEFAULT now(),
  scholarship_key text,
  scholarship_name text,
  amount_display text,
  deadline_display text,
  summary text,
  learn_more_url text,
  raw_item_hash text,
  normalized_name text,
  amount_value_numeric numeric,
  amount_currency text,
  deadline_date date,
  missing_consecutive_crawls integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.scholarship_current_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES public.scholarship_sources(id) ON DELETE CASCADE,
  scholarship_key text NOT NULL,
  scholarship_name text,
  normalized_name text,
  amount_display text,
  amount_value_numeric numeric,
  amount_currency text,
  deadline_display text,
  deadline_date date,
  learn_more_url text,
  raw_item_hash text,
  missing_consecutive_crawls integer DEFAULT 0,
  is_active boolean DEFAULT true,
  first_seen_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  UNIQUE (source_id, scholarship_key)
);

CREATE TABLE IF NOT EXISTS public.scholarship_change_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES public.scholarship_sources(id) ON DELETE CASCADE,
  scholarship_key text NOT NULL,
  scholarship_name text,
  event_type text NOT NULL,
  old_value text,
  new_value text,
  detected_at timestamptz DEFAULT now(),
  crawl_date timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.daily_change_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_date date,
  email_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Views (created in the live DB; definitions as found) -------------------------------------
CREATE OR REPLACE VIEW public.v_source_health AS
  SELECT university_name, source_url, last_status, monitor_enabled, is_active
  FROM public.scholarship_sources ORDER BY university_name;

CREATE OR REPLACE VIEW public.v_recent_scholarship_changes AS
  SELECT sc.detected_at, sc.university_name, sc.change_type, sc.field_changed,
         sc.old_value, sc.new_value, sc.change_summary, ss.source_url
  FROM public.scholarship_changes sc
  LEFT JOIN public.scholarship_sources ss ON sc.source_id = ss.id
  ORDER BY sc.detected_at DESC;
