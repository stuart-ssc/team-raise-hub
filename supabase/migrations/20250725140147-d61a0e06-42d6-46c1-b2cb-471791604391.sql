-- Delete school_user records for scr@een.co
DELETE FROM school_user WHERE user_id = '9ab75af6-a7e2-4462-979c-1d6cdbb1028c';

-- Delete profile record for scr@een.co  
DELETE FROM profiles WHERE id = '9ab75af6-a7e2-4462-979c-1d6cdbb1028c';

-- Delete auth user record for scr@een.co
DELETE FROM auth.users WHERE id = '9ab75af6-a7e2-4462-979c-1d6cdbb1028c';