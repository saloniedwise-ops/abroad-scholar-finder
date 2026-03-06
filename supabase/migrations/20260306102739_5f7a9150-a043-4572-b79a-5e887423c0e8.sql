
CREATE TABLE public.scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_name text NOT NULL,
  university_name text NOT NULL,
  country_name text NOT NULL,
  country_flag text DEFAULT '🌍',
  degree_level text NOT NULL,
  field_category text NOT NULL,
  amount_display text,
  intake text,
  deadline_display text,
  description text,
  status text DEFAULT 'Active',
  learn_more_url text,
  featured boolean DEFAULT false,
  public_visible boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read visible active scholarships"
  ON public.scholarships FOR SELECT
  USING (public_visible = true AND is_active = true);

CREATE TABLE public.universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_name text NOT NULL UNIQUE,
  country_name text,
  website_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read universities"
  ON public.universities FOR SELECT
  USING (true);

CREATE TABLE public.scholarship_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text NOT NULL,
  source_url text,
  last_checked_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.scholarship_sources ENABLE ROW LEVEL SECURITY;
