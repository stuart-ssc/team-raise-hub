-- Populate school_districts.state from associated schools
UPDATE school_districts sd
SET state = (
  SELECT s.state 
  FROM schools s 
  WHERE s.school_district_id = sd.id 
  AND s.state IS NOT NULL 
  LIMIT 1
)
WHERE sd.state IS NULL;