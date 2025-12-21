
-- First delete the orphaned business_donors records
DELETE FROM business_donors 
WHERE business_id = '84a582af-5d0a-4366-aab0-fb8e5d62279c';

-- Now insert valid records linking to actual donors
INSERT INTO business_donors (business_id, donor_id, organization_id, role, is_primary_contact)
VALUES 
  ('84a582af-5d0a-4366-aab0-fb8e5d62279c', 'df4f116d-0106-4c5b-8975-68cb2a2eed6d', '11111111-1111-1111-1111-111111111111', 'Owner', true),
  ('84a582af-5d0a-4366-aab0-fb8e5d62279c', 'b4b1e11a-7887-4db8-bc1e-1905afc006ea', '11111111-1111-1111-1111-111111111111', 'Employee', false),
  ('84a582af-5d0a-4366-aab0-fb8e5d62279c', '69456a18-d0ab-44bb-ac82-6dae3bbca59c', '11111111-1111-1111-1111-111111111111', 'Employee', false);

-- Update the businesses table to reflect correct linked_donors_count
UPDATE businesses 
SET linked_donors_count = 3,
    total_partnership_value = 4800
WHERE id = '84a582af-5d0a-4366-aab0-fb8e5d62279c';
