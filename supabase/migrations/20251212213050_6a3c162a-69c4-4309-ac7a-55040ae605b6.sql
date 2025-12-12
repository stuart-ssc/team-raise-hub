-- Step 1: Insert unique districts from schools table into school_districts
INSERT INTO school_districts (id, name, state_id, state, slug, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  s.district_name,
  st.id,
  s.state,
  -- Generate base slug from district name
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(s.district_name), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')),
  NOW(),
  NOW()
FROM (
  SELECT DISTINCT district_name, state 
  FROM schools 
  WHERE district_name IS NOT NULL AND district_name != ''
) s
JOIN states st ON st.abbreviation = s.state
WHERE NOT EXISTS (
  SELECT 1 FROM school_districts sd 
  WHERE sd.name = s.district_name AND sd.state = s.state
);

-- Step 2: Link schools to their districts
UPDATE schools s
SET school_district_id = sd.id
FROM school_districts sd
WHERE s.district_name = sd.name 
  AND s.state = sd.state
  AND s.district_name IS NOT NULL
  AND s.school_district_id IS NULL;