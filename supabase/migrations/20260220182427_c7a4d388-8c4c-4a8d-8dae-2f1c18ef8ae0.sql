
-- Create donor_lists table
CREATE TABLE public.donor_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create donor_list_members table
CREATE TABLE public.donor_list_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.donor_lists(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES public.donor_profiles(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  added_by UUID REFERENCES public.profiles(id),
  UNIQUE(list_id, donor_id)
);

-- Add list_id to donor_segment_campaigns
ALTER TABLE public.donor_segment_campaigns
ADD COLUMN list_id UUID REFERENCES public.donor_lists(id) ON DELETE SET NULL;

-- Make segment_id nullable (campaigns can now be for a list instead)
ALTER TABLE public.donor_segment_campaigns
ALTER COLUMN segment_id DROP NOT NULL;

-- Enable RLS
ALTER TABLE public.donor_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_list_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for donor_lists
CREATE POLICY "Users can view lists for their organizations"
ON public.donor_lists FOR SELECT
USING (public.user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Users can create lists for their organizations"
ON public.donor_lists FOR INSERT
WITH CHECK (public.user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Users can update lists for their organizations"
ON public.donor_lists FOR UPDATE
USING (public.user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Users can delete lists for their organizations"
ON public.donor_lists FOR DELETE
USING (public.user_belongs_to_organization(auth.uid(), organization_id));

-- RLS policies for donor_list_members
CREATE POLICY "Users can view list members for their organizations"
ON public.donor_list_members FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.donor_lists dl
  WHERE dl.id = list_id
  AND public.user_belongs_to_organization(auth.uid(), dl.organization_id)
));

CREATE POLICY "Users can add list members for their organizations"
ON public.donor_list_members FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.donor_lists dl
  WHERE dl.id = list_id
  AND public.user_belongs_to_organization(auth.uid(), dl.organization_id)
));

CREATE POLICY "Users can remove list members for their organizations"
ON public.donor_list_members FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.donor_lists dl
  WHERE dl.id = list_id
  AND public.user_belongs_to_organization(auth.uid(), dl.organization_id)
));

-- Indexes
CREATE INDEX idx_donor_lists_organization_id ON public.donor_lists(organization_id);
CREATE INDEX idx_donor_list_members_list_id ON public.donor_list_members(list_id);
CREATE INDEX idx_donor_list_members_donor_id ON public.donor_list_members(donor_id);
CREATE INDEX idx_donor_segment_campaigns_list_id ON public.donor_segment_campaigns(list_id);
