-- Add public read access for active campaigns
CREATE POLICY "Active campaigns are publicly readable"
ON public.campaigns
FOR SELECT
USING (status = true);

-- Add public read access for campaign items of active campaigns
CREATE POLICY "Campaign items of active campaigns are publicly readable"
ON public.campaign_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = campaign_items.campaign_id
    AND c.status = true
  )
);