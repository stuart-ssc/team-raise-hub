import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { campaignId, pitchMessage, pitchImageUrl, pitchVideoUrl, pitchRecordedVideoUrl } = await req.json();

    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: 'campaignId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Saving campaign pitch:', { 
      campaignId, 
      hasMessage: !!pitchMessage, 
      hasImage: !!pitchImageUrl, 
      hasVideo: !!pitchVideoUrl,
      hasRecordedVideo: !!pitchRecordedVideoUrl 
    });

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract JWT token and validate user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('User auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the campaign and verify user has permission to edit it
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select(`
        id,
        group_id,
        groups!inner(
          id,
          organization_id
        )
      `)
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error('Campaign not found:', campaignError);
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user belongs to the organization and has permission
    const { data: userMembership, error: membershipError } = await supabaseAdmin
      .from('organization_user')
      .select(`
        id,
        user_type:user_type_id(
          permission_level
        )
      `)
      .eq('user_id', user.id)
      .eq('organization_id', campaign.groups.organization_id)
      .eq('active_user', true)
      .single();

    if (membershipError || !userMembership) {
      console.error('User not a member of organization:', membershipError);
      return new Response(
        JSON.stringify({ error: 'You do not have permission to edit this campaign' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check permission level
    const permissionLevel = userMembership.user_type?.permission_level;
    if (!permissionLevel || !['organization_admin', 'program_manager'].includes(permissionLevel)) {
      console.error('Insufficient permissions:', permissionLevel);
      return new Response(
        JSON.stringify({ error: 'You do not have permission to edit campaign pitches' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the campaign pitch data
    const { error: updateError } = await supabaseAdmin
      .from('campaigns')
      .update({
        pitch_message: pitchMessage || null,
        pitch_image_url: pitchImageUrl || null,
        pitch_video_url: pitchVideoUrl || null,
        pitch_recorded_video_url: pitchRecordedVideoUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to save pitch' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Campaign pitch saved successfully for campaign:', campaignId);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
