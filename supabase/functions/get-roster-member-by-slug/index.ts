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
    const { campaignSlug, memberSlug } = await req.json();

    if (!campaignSlug || !memberSlug) {
      return new Response(
        JSON.stringify({ error: 'campaignSlug and memberSlug are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Looking up roster member:', { campaignSlug, memberSlug });

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get campaign with roster_id
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('id, roster_id')
      .eq('slug', campaignSlug)
      .eq('status', true)
      .single();

    if (campaignError || !campaign) {
      console.error('Campaign not found:', campaignError);
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!campaign.roster_id) {
      console.log('Campaign has no roster_id');
      return new Response(
        JSON.stringify({ rosterMember: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the member slug into name parts (e.g., "taylor-player" -> ["Taylor", "Player"])
    const nameParts = memberSlug.split('-').map(
      (part: string) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    );

    if (nameParts.length < 2) {
      console.log('Invalid member slug format');
      return new Response(
        JSON.stringify({ rosterMember: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    console.log('Searching for:', { firstName, lastName, rosterId: campaign.roster_id });

    // Get all roster members for this roster
    const { data: rosterMembers, error: rosterError } = await supabaseAdmin
      .from('organization_user')
      .select('id, user_id, roster_id')
      .eq('roster_id', campaign.roster_id)
      .eq('active_user', true);

    if (rosterError || !rosterMembers?.length) {
      console.log('No roster members found:', rosterError);
      return new Response(
        JSON.stringify({ rosterMember: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get profiles for these users
    const userIds = rosterMembers.map(m => m.user_id);
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', userIds);

    if (profilesError || !profiles?.length) {
      console.log('No profiles found:', profilesError);
      return new Response(
        JSON.stringify({ rosterMember: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find matching profile (case-insensitive)
    const matchingProfile = profiles.find(profile =>
      profile.first_name?.toLowerCase() === firstName.toLowerCase() &&
      profile.last_name?.toLowerCase() === lastName.toLowerCase()
    );

    if (!matchingProfile) {
      console.log('No matching profile found for:', firstName, lastName);
      return new Response(
        JSON.stringify({ rosterMember: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the roster member record
    const matchingMember = rosterMembers.find(m => m.user_id === matchingProfile.id);

    if (!matchingMember) {
      console.log('No matching roster member found');
      return new Response(
        JSON.stringify({ rosterMember: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get pitch data from roster_member_campaign_links
    const { data: linkData, error: linkError } = await supabaseAdmin
      .from('roster_member_campaign_links')
      .select('pitch_message, pitch_image_url, pitch_video_url, pitch_recorded_video_url')
      .eq('campaign_id', campaign.id)
      .eq('roster_member_id', matchingMember.id)
      .single();

    if (linkError && linkError.code !== 'PGRST116') {
      console.error('Error fetching link data:', linkError);
    }

    console.log('Found roster member:', {
      id: matchingMember.id,
      firstName: matchingProfile.first_name,
      lastName: matchingProfile.last_name,
      hasPitch: !!linkData?.pitch_message,
      hasRecordedVideo: !!linkData?.pitch_recorded_video_url,
    });

    return new Response(
      JSON.stringify({
        rosterMember: {
          id: matchingMember.id,
          firstName: matchingProfile.first_name,
          lastName: matchingProfile.last_name,
          pitchMessage: linkData?.pitch_message || null,
          pitchImageUrl: linkData?.pitch_image_url || null,
          pitchVideoUrl: linkData?.pitch_video_url || null,
          pitchRecordedVideoUrl: linkData?.pitch_recorded_video_url || null,
        },
      }),
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