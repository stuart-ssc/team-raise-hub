-- Set stuart@schoolsponsorconnect.com as system admin
UPDATE profiles 
SET system_admin = true 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'stuart@schoolsponsorconnect.com'
);