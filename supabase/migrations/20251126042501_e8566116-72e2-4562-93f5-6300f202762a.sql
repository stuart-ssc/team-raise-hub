-- Create Sample School organization
INSERT INTO public.organizations (
  id,
  name,
  organization_type,
  email,
  phone,
  website_url,
  city,
  state,
  zip,
  requires_verification,
  verification_status
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Sample School',
  'school',
  'info@sampleschool.demo',
  '555-0100',
  'https://sampleschool.demo',
  'Springfield',
  'IL',
  '62701',
  true,
  'approved'
);

-- Create Helpful House organization
INSERT INTO public.organizations (
  id,
  name,
  organization_type,
  email,
  phone,
  website_url,
  city,
  state,
  zip,
  requires_verification,
  verification_status
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Helpful House',
  'nonprofit',
  'info@helpfulhouse.demo',
  '555-0200',
  'https://helpfulhouse.demo',
  'Portland',
  'OR',
  '97201',
  true,
  'approved'
);

-- Create schools record for Sample School (for backwards compatibility)
INSERT INTO public.schools (
  id,
  organization_id,
  school_name,
  school_type,
  city,
  state,
  zip
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'Sample School',
  'public',
  'Springfield',
  'IL',
  '62701'
);

-- Create nonprofits record for Helpful House
INSERT INTO public.nonprofits (
  organization_id,
  ein,
  mission_statement
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '12-3456789',
  'Empowering youth through mentorship and community programs'
);

-- Get group type IDs and create groups
DO $$
DECLARE
  sports_team_id uuid;
  club_id uuid;
  program_id uuid;
BEGIN
  -- Get existing group type IDs
  SELECT id INTO sports_team_id FROM public.group_type WHERE name = 'Sports Team' LIMIT 1;
  SELECT id INTO club_id FROM public.group_type WHERE name = 'Club' LIMIT 1;
  SELECT id INTO program_id FROM public.group_type WHERE name = 'Program' LIMIT 1;
  
  -- Create groups for Sample School
  INSERT INTO public.groups (
    id,
    group_name,
    group_type_id,
    organization_id,
    school_id,
    status
  ) VALUES (
    '33333333-3333-3333-3333-333333333333',
    'Varsity Basketball',
    sports_team_id,
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    true
  );
  
  INSERT INTO public.groups (
    id,
    group_name,
    group_type_id,
    organization_id,
    school_id,
    status
  ) VALUES (
    '44444444-4444-4444-4444-444444444444',
    'Drama Club',
    club_id,
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    true
  );
  
  -- Create group for Helpful House
  INSERT INTO public.groups (
    id,
    group_name,
    group_type_id,
    organization_id,
    status
  ) VALUES (
    '55555555-5555-5555-5555-555555555555',
    'Youth Mentorship Program',
    program_id,
    '22222222-2222-2222-2222-222222222222',
    true
  );
END $$;