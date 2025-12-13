-- Create landing_page_views table for tracking marketing page visits
CREATE TABLE public.landing_page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type text NOT NULL, -- 'school', 'district', 'state', 'home'
  page_path text NOT NULL,
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  district_id uuid REFERENCES public.school_districts(id) ON DELETE SET NULL,
  state text,
  session_id text, -- anonymous session tracking
  referrer text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_landing_page_views_page_type ON public.landing_page_views(page_type);
CREATE INDEX idx_landing_page_views_state ON public.landing_page_views(state);
CREATE INDEX idx_landing_page_views_school_id ON public.landing_page_views(school_id);
CREATE INDEX idx_landing_page_views_district_id ON public.landing_page_views(district_id);
CREATE INDEX idx_landing_page_views_created_at ON public.landing_page_views(created_at);
CREATE INDEX idx_landing_page_views_session_id ON public.landing_page_views(session_id);

-- Enable RLS
ALTER TABLE public.landing_page_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (tracking is public)
CREATE POLICY "Anyone can log landing page views"
ON public.landing_page_views
FOR INSERT
WITH CHECK (true);

-- Only system admins can view analytics
CREATE POLICY "System admins can view landing page analytics"
ON public.landing_page_views
FOR SELECT
USING (is_system_admin(auth.uid()));