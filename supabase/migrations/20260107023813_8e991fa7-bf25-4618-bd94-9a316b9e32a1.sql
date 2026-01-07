-- Clean up orphaned test donor profile created from deleted test orders

-- Step 1: Remove the business_donors link first (foreign key constraint)
DELETE FROM business_donors 
WHERE donor_id = 'df4f116d-0106-4c5b-8975-68cb2a2eed6d';

-- Step 2: Delete the orphaned donor profile
DELETE FROM donor_profiles 
WHERE id = 'df4f116d-0106-4c5b-8975-68cb2a2eed6d'
  AND email = 'test@example.com';