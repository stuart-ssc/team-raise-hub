import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { businessId, organizationId, role, autoLinked } = await req.json();

    console.log('Linking business-donor:', { businessId, donorId: user.id, organizationId, role });

    // Check if this is the first donor for this business at this org
    const { data: existingLinks } = await supabaseClient
      .from('business_donors')
      .select('id')
      .eq('business_id', businessId)
      .eq('organization_id', organizationId);

    const isPrimaryContact = !existingLinks || existingLinks.length === 0;

    // Create business_donor link
    const { data: link, error: linkError } = await supabaseClient
      .from('business_donors')
      .insert({
        business_id: businessId,
        donor_id: user.id,
        organization_id: organizationId,
        role,
        is_primary_contact: isPrimaryContact,
        auto_linked: autoLinked || false,
      })
      .select()
      .single();

    if (linkError) {
      console.error('Error creating business_donor link:', linkError);
      throw linkError;
    }

    // Get business info for notifications
    const { data: business } = await supabaseClient
      .from('businesses')
      .select('business_name')
      .eq('id', businessId)
      .single();

    // Notify all other linked donors
    if (autoLinked) {
      const { data: otherDonors } = await supabaseClient
        .from('business_donors')
        .select('donor_id')
        .eq('business_id', businessId)
        .eq('organization_id', organizationId)
        .neq('donor_id', user.id);

      if (otherDonors && otherDonors.length > 0) {
        const { data: userProfile } = await supabaseClient
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();

        const donorName = userProfile 
          ? `${userProfile.first_name} ${userProfile.last_name}`.trim() 
          : 'Someone';

        for (const otherDonor of otherDonors) {
          await supabaseClient
            .from('notifications')
            .insert({
              user_id: otherDonor.donor_id,
              title: 'New Business Link',
              message: `${donorName} was linked to ${business?.business_name || 'a business'}. If this seems incorrect, you can block this link.`,
              type: 'info',
              business_id: businessId,
              action_url: `/dashboard/business-profile?id=${businessId}`,
            });
        }
      }
    }

    // Create organization_businesses record if doesn't exist
    const { error: orgBusinessError } = await supabaseClient
      .from('organization_businesses')
      .insert({
        organization_id: organizationId,
        business_id: businessId,
      })
      .select()
      .single();

    // Ignore duplicate key error (already exists)
    if (orgBusinessError && !orgBusinessError.message.includes('duplicate')) {
      console.error('Error creating organization_businesses:', orgBusinessError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        businessId,
        isPrimaryContact,
        link 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error linking business-donor:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
