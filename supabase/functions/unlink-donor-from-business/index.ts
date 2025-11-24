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

    const { donorId, businessId, organizationId } = await req.json();

    console.log('Unlink donor from business request:', { donorId, businessId, organizationId });

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

    // Get the current link to check if it's primary contact
    const { data: currentLink, error: currentLinkError } = await supabaseClient
      .from('business_donors')
      .select('is_primary_contact')
      .eq('donor_id', donorId)
      .eq('business_id', businessId)
      .eq('organization_id', organizationId)
      .single();

    if (currentLinkError) {
      throw new Error('Link not found');
    }

    const wasPrimary = currentLink.is_primary_contact;

    // Delete the link
    const { error: deleteError } = await supabaseClient
      .from('business_donors')
      .delete()
      .eq('donor_id', donorId)
      .eq('business_id', businessId)
      .eq('organization_id', organizationId);

    if (deleteError) {
      console.error('Error deleting link:', deleteError);
      throw deleteError;
    }

    // If was primary contact, promote another employee to primary
    if (wasPrimary) {
      const { data: otherEmployees } = await supabaseClient
        .from('business_donors')
        .select('donor_id')
        .eq('business_id', businessId)
        .eq('organization_id', organizationId)
        .is('blocked_at', null)
        .limit(1);

      if (otherEmployees && otherEmployees.length > 0) {
        await supabaseClient
          .from('business_donors')
          .update({ is_primary_contact: true })
          .eq('donor_id', otherEmployees[0].donor_id)
          .eq('business_id', businessId)
          .eq('organization_id', organizationId);

        console.log('Promoted new primary contact:', otherEmployees[0].donor_id);
      }
    }

    console.log('Successfully unlinked donor from business');

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in unlink-donor-from-business:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
