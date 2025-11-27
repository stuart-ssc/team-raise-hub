-- Clean up duplicate roster ID 9
DELETE FROM rosters WHERE id = 9;

-- Add unique constraint to prevent duplicate rosters for same group/year
ALTER TABLE rosters ADD CONSTRAINT rosters_group_id_roster_year_unique 
UNIQUE (group_id, roster_year);