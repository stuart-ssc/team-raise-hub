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
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    const { donorId, businessId, organizationId } = await req.json();
    if (!donorId || !businessId || !organizationId) {
      throw new Error('donorId, businessId, and organizationId are required');
    }

    console.log('Disengage request:', { donorId, businessId, organizationId, userId: user.id });

    // Permission check: org admin/manager OR participant owner of the business OR system admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('system_admin')
      .eq('id', user.id)
      .single();

    const isSystemAdmin = profile?.system_admin === true;

    let allowed = isSystemAdmin;

    if (!allowed) {
      const { data: orgUser } = await supabaseClient
        .from('organization_user')
        .select('id, user_type:user_type_id(permission_level)')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .eq('active_user', true)
        .maybeSingle();

      const permissionLevel = (orgUser?.user_type as any)?.permission_level;
      if (permissionLevel === 'organization_admin' || permissionLevel === 'program_manager') {
        allowed = true;
      } else if (orgUser?.id) {
        // Participant owner check
        const { data: biz } = await supabaseClient
          .from('businesses')
          .select('added_by_organization_user_id')
          .eq('id', businessId)
          .single();
        if (biz?.added_by_organization_user_id === orgUser.id) {
          allowed = true;
        }
      }
    }

    if (!allowed) throw new Error('Insufficient permissions');

    const { error: updateError } = await supabaseClient
      .from('business_donors')
      .update({ blocked_at: new Date().toISOString(), blocked_by: user.id })
      .eq('donor_id', donorId)
      .eq('business_id', businessId)
      .eq('organization_id', organizationId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in disengage-business-contact:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});