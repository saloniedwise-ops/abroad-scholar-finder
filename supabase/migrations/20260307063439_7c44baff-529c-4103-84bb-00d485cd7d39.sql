
-- Add slug and last_verified_at to scholarships
ALTER TABLE public.scholarships ADD COLUMN IF NOT EXISTS scholarship_slug text;
ALTER TABLE public.scholarships ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;
ALTER TABLE public.scholarships ADD COLUMN IF NOT EXISTS summary text;

-- Generate slugs from existing scholarship names
UPDATE public.scholarships SET scholarship_slug = lower(regexp_replace(regexp_replace(scholarship_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) WHERE scholarship_slug IS NULL;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_scholarships_slug ON public.scholarships(scholarship_slug);

-- Add last_status to scholarship_sources
ALTER TABLE public.scholarship_sources ADD COLUMN IF NOT EXISTS last_status text DEFAULT 'unknown';
ALTER TABLE public.scholarship_sources ADD COLUMN IF NOT EXISTS university_name text;

-- Create scholarship_changes table
CREATE TABLE IF NOT EXISTS public.scholarship_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id uuid REFERENCES public.scholarships(id) ON DELETE CASCADE,
  university_name text NOT NULL,
  scholarship_name text NOT NULL,
  field_changed text NOT NULL,
  old_value text,
  new_value text,
  detected_at timestamptz DEFAULT now()
);

ALTER TABLE public.scholarship_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read scholarship changes"
  ON public.scholarship_changes FOR SELECT
  USING (true);

-- Enable realtime for scholarships
ALTER PUBLICATION supabase_realtime ADD TABLE public.scholarships;
