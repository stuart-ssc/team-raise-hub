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

    console.log('Update donor business role request:', { donorId, businessId, organizationId, role, isPrimaryContact });

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

    // If changing to primary contact, remove primary status from others first
    if (isPrimaryContact) {
      await supabaseClient
        .from('business_donors')
        .update({ is_primary_contact: false })
        .eq('business_id', businessId)
        .eq('organization_id', organizationId)
        .neq('donor_id', donorId);
    }

    // Update the link
    const { data: updatedLink, error: updateError } = await supabaseClient
      .from('business_donors')
      .update({
        role: role || null,
        is_primary_contact: isPrimaryContact,
      })
      .eq('donor_id', donorId)
      .eq('business_id', businessId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating link:', updateError);
      throw updateError;
    }

    console.log('Successfully updated donor business role:', updatedLink);

    return new Response(
      JSON.stringify({ success: true, link: updatedLink }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in update-donor-business-role:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
