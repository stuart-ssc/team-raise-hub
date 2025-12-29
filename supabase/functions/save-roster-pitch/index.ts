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

    console.log('Saving roster pitch:', { 
      campaignId, 
      hasMessage: !!pitchMessage, 
      hasImage: !!pitchImageUrl, 
      hasVideo: !!pitchVideoUrl,
      hasRecordedVideo: !!pitchRecordedVideoUrl 
    });

    // Use service role client for all operations
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

    // Get user's roster membership
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('organization_user')
      .select('id, roster_id')
      .eq('user_id', user.id)
      .eq('active_user', true)
      .not('roster_id', 'is', null)
      .limit(1)
      .single();

    if (membershipError || !membership) {
      console.error('Membership not found:', membershipError);
      return new Response(
        JSON.stringify({ error: 'No active roster membership found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the campaign link exists for this roster member
    const { data: existingLink, error: linkError } = await supabaseAdmin
      .from('roster_member_campaign_links')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('roster_member_id', membership.id)
      .single();

    if (linkError || !existingLink) {
      console.error('Campaign link not found:', linkError);
      return new Response(
        JSON.stringify({ error: 'No campaign link found for this roster member' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the pitch data
    const { error: updateError } = await supabaseAdmin
      .from('roster_member_campaign_links')
      .update({
        pitch_message: pitchMessage || null,
        pitch_image_url: pitchImageUrl || null,
        pitch_video_url: pitchVideoUrl || null,
        pitch_recorded_video_url: pitchRecordedVideoUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingLink.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to save pitch' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Pitch saved successfully for link:', existingLink.id);

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