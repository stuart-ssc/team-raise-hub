-- Function to generate URL-safe slug from text
CREATE OR REPLACE FUNCTION public.generate_slug(input_text text)
RETURNS text AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          trim(input_text),
          '[^a-zA-Z0-9\s-]', '', 'g'  -- Remove special characters
        ),
        '\s+', '-', 'g'  -- Replace spaces with hyphens
      ),
      '-+', '-', 'g'  -- Replace multiple hyphens with single
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate unique slug for a school within its state
CREATE OR REPLACE FUNCTION public.generate_unique_school_slug(school_name text, school_city text, school_state text, school_id uuid)
RETURNS text AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 1;
BEGIN
  -- Generate base slug from school name
  base_slug := public.generate_slug(school_name);
  
  -- If city exists, append it for uniqueness
  IF school_city IS NOT NULL AND school_city != '' THEN
    base_slug := base_slug || '-' || public.generate_slug(school_city);
  END IF;
  
  -- Truncate to reasonable length
  base_slug := substring(base_slug from 1 for 80);
  
  final_slug := base_slug;
  
  -- Check for duplicates within the same state and increment if needed
  WHILE EXISTS (
    SELECT 1 FROM public.schools 
    WHERE slug = final_slug 
    AND state = school_state 
    AND id != school_id
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION public.auto_generate_school_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if slug is null or empty
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_unique_school_slug(
      NEW.school_name, 
      NEW.city, 
      NEW.state, 
      COALESCE(NEW.id, gen_random_uuid())
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new schools
DROP TRIGGER IF EXISTS trigger_auto_generate_school_slug ON public.schools;
CREATE TRIGGER trigger_auto_generate_school_slug
  BEFORE INSERT OR UPDATE ON public.schools
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_school_slug();

-- Generate slugs for all existing schools without slugs (batch process)
-- Process in batches by state to handle duplicates correctly
DO $$
DECLARE
  school_record RECORD;
BEGIN
  FOR school_record IN 
    SELECT id, school_name, city, state 
    FROM public.schools 
    WHERE slug IS NULL OR slug = ''
    ORDER BY state, school_name
  LOOP
    UPDATE public.schools 
    SET slug = public.generate_unique_school_slug(
      school_record.school_name, 
      school_record.city, 
      school_record.state, 
      school_record.id
    )
    WHERE id = school_record.id;
  END LOOP;
END $$;

-- Same for districts
CREATE OR REPLACE FUNCTION public.generate_unique_district_slug(district_name text, district_state text, district_id uuid)
RETURNS text AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 1;
BEGIN
  base_slug := public.generate_slug(district_name);
  base_slug := substring(base_slug from 1 for 80);
  final_slug := base_slug;
  
  WHILE EXISTS (
    SELECT 1 FROM public.school_districts 
    WHERE slug = final_slug 
    AND state = district_state 
    AND id != district_id
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for districts
CREATE OR REPLACE FUNCTION public.auto_generate_district_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_unique_district_slug(
      NEW.name, 
      NEW.state, 
      COALESCE(NEW.id, gen_random_uuid())
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new districts
DROP TRIGGER IF EXISTS trigger_auto_generate_district_slug ON public.school_districts;
CREATE TRIGGER trigger_auto_generate_district_slug
  BEFORE INSERT OR UPDATE ON public.school_districts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_district_slug();

-- Generate slugs for existing districts
DO $$
DECLARE
  district_record RECORD;
BEGIN
  FOR district_record IN 
    SELECT id, name, state 
    FROM public.school_districts 
    WHERE slug IS NULL OR slug = ''
    ORDER BY state, name
  LOOP
    UPDATE public.school_districts 
    SET slug = public.generate_unique_district_slug(
      district_record.name, 
      district_record.state, 
      district_record.id
    )
    WHERE id = district_record.id;
  END LOOP;
END $$;