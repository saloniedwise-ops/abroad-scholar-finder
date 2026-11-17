-- Richer scholarship details + a review queue for proposed source URLs.
-- Additive only: no existing column or row is changed.

ALTER TABLE public.scholarships
  ADD COLUMN IF NOT EXISTS deadline_type text,            -- fixed | rolling | automatic | varies | closed | not_published
  ADD COLUMN IF NOT EXISTS deadline_inferred boolean DEFAULT false,  -- year was inferred, not stated
  ADD COLUMN IF NOT EXISTS opens_date date,
  ADD COLUMN IF NOT EXISTS eligibility text,
  ADD COLUMN IF NOT EXISTS requirements text,
  ADD COLUMN IF NOT EXISTS how_to_apply text,
  ADD COLUMN IF NOT EXISTS application_url text,
  ADD COLUMN IF NOT EXISTS award_type text,               -- tuition waiver | stipend | grant | ...
  ADD COLUMN IF NOT EXISTS number_of_awards text,
  ADD COLUMN IF NOT EXISTS nationality text,              -- e.g. "International students", "Indian nationals"
  ADD COLUMN IF NOT EXISTS amount_value numeric,
  ADD COLUMN IF NOT EXISTS amount_currency text,
  ADD COLUMN IF NOT EXISTS extraction_confidence numeric, -- 0..1, how many fields were found
  ADD COLUMN IF NOT EXISTS extracted_at timestamptz,
  ADD COLUMN IF NOT EXISTS source_url text;

-- Proposed real source pages for universities whose "source" is a search link or a dead URL.
-- Approve a row in the Supabase Table Editor by setting status = 'approved'.
CREATE TABLE IF NOT EXISTS public.source_url_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.scholarship_sources(id) ON DELETE CASCADE,
  candidate_url text NOT NULL,
  page_title text,
  score numeric,
  reason text,
  status text NOT NULL DEFAULT 'pending',   -- pending | approved | rejected | applied
  created_at timestamptz DEFAULT now(),
  UNIQUE (source_id, candidate_url)
);

-- Private: only the service-role key (crawler) and the dashboard can touch it.
ALTER TABLE public.source_url_suggestions ENABLE ROW LEVEL SECURITY;
