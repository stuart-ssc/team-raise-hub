import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { donorId, businessId, organizationId, role, isPrimaryContact } = await req.json();

    console.log('Link donor to business request:', { donorId, businessId, organizationId, role, isPrimaryContact });

    // Verify user has permission (organization_admin or program_manager)
    const { data: orgUser, error: orgUserError } = await supabaseClient
      .from('organization_user')
      .select('user_type:user_type_id(permission_level)')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (orgUserError || !orgUser) {
      throw new Error('User not found in organization');
    }

    const permissionLevel = (orgUser.user_type as any)?.permission_level;
    if (permissionLevel !== 'organization_admin' && permissionLevel !== 'program_manager') {
      throw new Error('Insufficient permissions');
    }

    // Check if link already exists
    const { data: existingLink, error: existingLinkError } = await supabaseClient
      .from('business_donors')
      .select('id')
      .eq('donor_id', donorId)
      .eq('business_id', businessId)
      .eq('organization_id', organizationId)
      .is('blocked_at', null)
      .maybeSingle();

    if (existingLink) {
      throw new Error('This donor is already linked to this business');
    }

    // If setting as primary contact, remove primary status from others
    if (isPrimaryContact) {
      await supabaseClient
        .from('business_donors')
        .update({ is_primary_contact: false })
        .eq('business_id', businessId)
        .eq('organization_id', organizationId);
    }

    // Create the link
    const { data: newLink, error: linkError } = await supabaseClient
      .from('business_donors')
      .insert({
        donor_id: donorId,
        business_id: businessId,
        organization_id: organizationId,
        role: role || null,
        is_primary_contact: isPrimaryContact,
        auto_linked: false,
        linked_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (linkError) {
      console.error('Error creating link:', linkError);
      throw linkError;
    }

    // Ensure organization_businesses record exists
    const { error: orgBusinessError } = await supabaseClient
      .from('organization_businesses')
      .upsert({
        business_id: businessId,
        organization_id: organizationId,
      }, { onConflict: 'business_id,organization_id' });

    if (orgBusinessError) {
      console.error('Error creating organization_businesses:', orgBusinessError);
    }

    console.log('Successfully linked donor to business:', newLink);

    return new Response(
      JSON.stringify({ success: true, link: newLink }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in link-donor-to-business:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
