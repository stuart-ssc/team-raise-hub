-- Create function to generate unique slug from campaign name
CREATE OR REPLACE FUNCTION public.generate_campaign_slug(campaign_name text, campaign_id uuid DEFAULT NULL)
RETURNS text AS $$
DECLARE
  base_slug text;
  existing_count integer;
  final_slug text;
BEGIN
  -- Convert campaign name to slug format (lowercase, replace spaces with dashes)
  base_slug := lower(trim(regexp_replace(campaign_name, '\s+', '-', 'g')));
  
  -- Count existing campaigns with slugs that start with this base slug
  -- Exclude the current campaign if updating
  SELECT COUNT(*) INTO existing_count
  FROM public.campaigns 
  WHERE slug ~ ('^' || base_slug || '(-\d+)?$')
    AND (campaign_id IS NULL OR id != campaign_id);
  
  -- If no existing slugs, use base slug
  IF existing_count = 0 THEN
    final_slug := base_slug;
  ELSE
    -- Add number suffix (existing count + 1)
    final_slug := base_slug || '-' || (existing_count + 1);
  END IF;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to automatically set slug on insert/update
CREATE OR REPLACE FUNCTION public.set_campaign_slug()
RETURNS trigger AS $$
BEGIN
  -- Only set slug if it's null or if the name has changed
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.name != NEW.name) THEN
    NEW.slug := public.generate_campaign_slug(NEW.name, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set slug before insert/update
CREATE TRIGGER set_campaign_slug_trigger
  BEFORE INSERT OR UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.set_campaign_slug();

-- Update existing campaigns to have slugs
UPDATE public.campaigns 
SET slug = public.generate_campaign_slug(name, id)
WHERE slug IS NULL;