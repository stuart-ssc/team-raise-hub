-- Add non-profit specific group types
INSERT INTO group_type (name, description) VALUES 
  ('Program', 'A non-profit program or service'),
  ('Initiative', 'A non-profit initiative or project'),
  ('Chapter', 'A local chapter of the organization'),
  ('Campaign', 'A specific fundraising campaign');

-- Update the Youth Mentorship Program to have a proper group_type_id
UPDATE groups 
SET group_type_id = (SELECT id FROM group_type WHERE name = 'Program')
WHERE id = '55555555-5555-5555-5555-555555555555' AND group_type_id IS NULL;