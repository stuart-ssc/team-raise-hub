import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DemoUser {
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  userTypeName: string;
  groupId?: string;
}

const DEMO_USERS: DemoUser[] = [
  // Sample School Users
  {
    email: 'principal@sampleschool.demo',
    firstName: 'Pat',
    lastName: 'Principal',
    organizationId: '11111111-1111-1111-1111-111111111111',
    userTypeName: 'Principal',
  },
  {
    email: 'ad@sampleschool.demo',
    firstName: 'Alex',
    lastName: 'Director',
    organizationId: '11111111-1111-1111-1111-111111111111',
    userTypeName: 'Athletic Director',
  },
  {
    email: 'coach@sampleschool.demo',
    firstName: 'Chris',
    lastName: 'Coach',
    organizationId: '11111111-1111-1111-1111-111111111111',
    userTypeName: 'Coach',
    groupId: '33333333-3333-3333-3333-333333333333', // Varsity Basketball
  },
  {
    email: 'player@sampleschool.demo',
    firstName: 'Taylor',
    lastName: 'Player',
    organizationId: '11111111-1111-1111-1111-111111111111',
    userTypeName: 'Team Player',
    groupId: '33333333-3333-3333-3333-333333333333', // Varsity Basketball
  },
  {
    email: 'parent@sampleschool.demo',
    firstName: 'Morgan',
    lastName: 'Parent',
    organizationId: '11111111-1111-1111-1111-111111111111',
    userTypeName: 'Family Member',
    groupId: '33333333-3333-3333-3333-333333333333', // Varsity Basketball
  },
  {
    email: 'sponsor@sampleschool.demo',
    firstName: 'Sam',
    lastName: 'Sponsor',
    organizationId: '11111111-1111-1111-1111-111111111111',
    userTypeName: 'Sponsor',
  },
  // Helpful House Users
  {
    email: 'ed@helpfulhouse.demo',
    firstName: 'Dana',
    lastName: 'Director',
    organizationId: '22222222-2222-2222-2222-222222222222',
    userTypeName: 'Executive Director',
  },
  {
    email: 'pd@helpfulhouse.demo',
    firstName: 'Jordan',
    lastName: 'Program',
    organizationId: '22222222-2222-2222-2222-222222222222',
    userTypeName: 'Program Director',
    groupId: '55555555-5555-5555-5555-555555555555', // Youth Mentorship Program
  },
  {
    email: 'volunteer@helpfulhouse.demo',
    firstName: 'Riley',
    lastName: 'Volunteer',
    organizationId: '22222222-2222-2222-2222-222222222222',
    userTypeName: 'Volunteer',
    groupId: '55555555-5555-5555-5555-555555555555', // Youth Mentorship Program
  },
  {
    email: 'board@helpfulhouse.demo',
    firstName: 'Casey',
    lastName: 'Board',
    organizationId: '22222222-2222-2222-2222-222222222222',
    userTypeName: 'Board Member',
  },
  {
    email: 'donor@helpfulhouse.demo',
    firstName: 'Jamie',
    lastName: 'Donor',
    organizationId: '22222222-2222-2222-2222-222222222222',
    userTypeName: 'Donor',
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const results = {
      created: [] as string[],
      skipped: [] as string[],
      errors: [] as { email: string; error: string }[],
    };

    const DEMO_PASSWORD = 'Demo2024!';

    for (const demoUser of DEMO_USERS) {
      try {
        // Check if user already exists
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', demoUser.email)
          .single();

        if (existingProfile) {
          console.log(`User ${demoUser.email} already exists, skipping`);
          results.skipped.push(demoUser.email);
          continue;
        }

        // Get user type ID
        const { data: userType, error: userTypeError } = await supabaseAdmin
          .from('user_type')
          .select('id')
          .eq('name', demoUser.userTypeName)
          .single();

        if (userTypeError || !userType) {
          throw new Error(`User type ${demoUser.userTypeName} not found`);
        }

        // Create auth user with known password
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: demoUser.email,
          password: DEMO_PASSWORD,
          email_confirm: true,
          user_metadata: {
            first_name: demoUser.firstName,
            last_name: demoUser.lastName,
          },
        });

        if (authError || !authUser.user) {
          throw new Error(`Failed to create auth user: ${authError?.message}`);
        }

        console.log(`Created auth user: ${demoUser.email} (${authUser.user.id})`);

        // Create profile (should be handled by trigger, but ensure it exists)
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: authUser.user.id,
            first_name: demoUser.firstName,
            last_name: demoUser.lastName,
            email: demoUser.email,
          });

        if (profileError) {
          console.error(`Profile creation error for ${demoUser.email}:`, profileError);
        }

        // Create organization_user record
        const { error: orgUserError } = await supabaseAdmin
          .from('organization_user')
          .insert({
            user_id: authUser.user.id,
            organization_id: demoUser.organizationId,
            user_type_id: userType.id,
            group_id: demoUser.groupId || null,
            active_user: true,
          });

        if (orgUserError) {
          throw new Error(`Failed to create organization_user: ${orgUserError.message}`);
        }

        console.log(`Successfully created demo user: ${demoUser.email}`);
        results.created.push(demoUser.email);
      } catch (error) {
        console.error(`Error creating user ${demoUser.email}:`, error);
        results.errors.push({
          email: demoUser.email,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Demo users seeding complete`,
        results,
        credentials: {
          password: DEMO_PASSWORD,
          note: 'All demo users use this password',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in seed-demo-users function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
