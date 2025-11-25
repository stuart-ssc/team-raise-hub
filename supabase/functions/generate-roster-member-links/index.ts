import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RosterMemberLink {
  rosterMemberId: string;
  name: string;
  role: string;
  slug: string;
  url: string;
}

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

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { campaignId, rosterId } = await req.json();

    if (!campaignId) {
      throw new Error('Campaign ID is required');
    }

    console.log('Generating roster member links for campaign:', campaignId, 'roster:', rosterId);

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('campaigns')
      .select('slug, group_id, groups(organization_id)')
      .eq('id', campaignId)
      .single();

    if (campaignError) throw campaignError;

    // Verify user has permission to manage this campaign
    const { data: orgUser, error: permError } = await supabaseClient
      .from('organization_user')
      .select('user_type(permission_level)')
      .eq('user_id', user.id)
      .eq('organization_id', (campaign as any).groups.organization_id)
      .single();

    if (permError || !(orgUser as any)?.user_type?.permission_level?.match(/organization_admin|program_manager/)) {
      throw new Error('Insufficient permissions');
    }

    // Get all roster members
    let rosterQuery = supabaseClient
      .from('school_user')
      .select(`
        id,
        user_id,
        user_type_id,
        user_type(name),
        profiles(first_name, last_name)
      `)
      .eq('active_user', true);

    if (rosterId) {
      rosterQuery = rosterQuery.eq('roster_id', rosterId);
    } else {
      // Get all rosters for this group
      const { data: rosters } = await supabaseClient
        .from('rosters')
        .select('id')
        .eq('group_id', campaign.group_id);

      if (rosters && rosters.length > 0) {
        rosterQuery = rosterQuery.in('roster_id', rosters.map(r => r.id));
      }
    }

    const { data: rosterMembers, error: rosterError } = await rosterQuery;

    if (rosterError) throw rosterError;

    if (!rosterMembers || rosterMembers.length === 0) {
      return new Response(
        JSON.stringify({ links: [], message: 'No roster members found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique slugs for each member
    const links: RosterMemberLink[] = [];
    const slugCounts = new Map<string, number>();

    for (const member of rosterMembers) {
      const profile = (member as any).profiles;
      const userType = (member as any).user_type;
      
      if (!profile) continue;

      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
      if (!fullName) continue;

      // Generate base slug
      let baseSlug = fullName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // Handle duplicates
      const count = slugCounts.get(baseSlug) || 0;
      const slug = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;
      slugCounts.set(baseSlug, count + 1);

      // Check if link already exists
      const { data: existingLink } = await supabaseClient
        .from('roster_member_campaign_links')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('roster_member_id', member.id)
        .single();

      if (!existingLink) {
        // Insert new link
        const { error: insertError } = await supabaseClient
          .from('roster_member_campaign_links')
          .insert({
            campaign_id: campaignId,
            roster_member_id: member.id,
            slug: slug,
          });

        if (insertError) {
          console.error('Error inserting link:', insertError);
          continue;
        }
      }

      const url = `${Deno.env.get('PUBLIC_SITE_URL') || 'https://sponsorly.io'}/c/${campaign.slug}/${slug}`;

      links.push({
        rosterMemberId: member.id,
        name: fullName,
        role: userType?.name || 'Member',
        slug: slug,
        url: url,
      });
    }

    console.log(`Generated ${links.length} roster member links`);

    return new Response(
      JSON.stringify({ links, count: links.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating roster member links:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
