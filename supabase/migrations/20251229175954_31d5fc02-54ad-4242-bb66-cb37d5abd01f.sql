-- Create campaign_item_variants table for size-based inventory tracking
CREATE TABLE public.campaign_item_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_item_id UUID NOT NULL REFERENCES public.campaign_items(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  quantity_offered INTEGER NOT NULL DEFAULT 0,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_item_id, size)
);

-- Add has_variants flag to campaign_items
ALTER TABLE public.campaign_items ADD COLUMN has_variants BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.campaign_item_variants ENABLE ROW LEVEL SECURITY;

-- RLS policies matching campaign_items patterns
CREATE POLICY "Campaign item variants of active campaigns are publicly readable"
ON public.campaign_item_variants
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM campaign_items ci
  JOIN campaigns c ON c.id = ci.campaign_id
  WHERE ci.id = campaign_item_variants.campaign_item_id AND c.status = true
));

CREATE POLICY "Authorized org users can manage variants"
ON public.campaign_item_variants
FOR ALL
USING (
  (EXISTS (
    SELECT 1
    FROM organization_user ou
    JOIN user_type ut ON ou.user_type_id = ut.id
    JOIN campaign_items ci ON ci.id = campaign_item_variants.campaign_item_id
    JOIN campaigns c ON c.id = ci.campaign_id
    JOIN groups g ON g.id = c.group_id
    WHERE ou.user_id = auth.uid()
    AND ou.organization_id = g.organization_id
    AND ou.active_user = true
    AND ut.permission_level IN ('organization_admin', 'program_manager')
  )) OR is_system_admin(auth.uid())
)
WITH CHECK (
  (EXISTS (
    SELECT 1
    FROM organization_user ou
    JOIN user_type ut ON ou.user_type_id = ut.id
    JOIN campaign_items ci ON ci.id = campaign_item_variants.campaign_item_id
    JOIN campaigns c ON c.id = ci.campaign_id
    JOIN groups g ON g.id = c.group_id
    WHERE ou.user_id = auth.uid()
    AND ou.organization_id = g.organization_id
    AND ou.active_user = true
    AND ut.permission_level IN ('organization_admin', 'program_manager')
  )) OR is_system_admin(auth.uid())
);

CREATE POLICY "School users with qualifying roles can manage variants"
ON public.campaign_item_variants
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM school_user su
    JOIN user_type ut ON su.user_type_id = ut.id
    JOIN campaign_items ci ON ci.id = campaign_item_variants.campaign_item_id
    JOIN campaigns c ON c.id = ci.campaign_id
    JOIN groups g ON g.id = c.group_id
    WHERE su.user_id = auth.uid()
    AND su.school_id = g.school_id
    AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM school_user su
    JOIN user_type ut ON su.user_type_id = ut.id
    JOIN campaign_items ci ON ci.id = campaign_item_variants.campaign_item_id
    JOIN campaigns c ON c.id = ci.campaign_id
    JOIN groups g ON g.id = c.group_id
    WHERE su.user_id = auth.uid()
    AND su.school_id = g.school_id
    AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader')
  )
);

-- Create trigger to update updated_at
CREATE TRIGGER update_campaign_item_variants_updated_at
BEFORE UPDATE ON public.campaign_item_variants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();