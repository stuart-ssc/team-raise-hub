-- Add roster_id column to campaigns table for peer-to-peer fundraising
ALTER TABLE campaigns 
ADD COLUMN roster_id INTEGER REFERENCES rosters(id);