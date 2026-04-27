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
    const { campaignId } = await req.json();

    if (!campaignId || typeof campaignId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'campaignId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Look up campaign + confirm it's published before exposing roster info
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('id, group_id, publication_status')
      .eq('id', campaignId)
      .maybeSingle();

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (campaign.publication_status !== 'published') {
      return new Response(
        JSON.stringify({ members: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Active rosters for this group
    const { data: rosters, error: rostersError } = await supabaseAdmin
      .from('rosters')
      .select('id')
      .eq('group_id', campaign.group_id);

    if (rostersError) throw rostersError;
    const rosterIds = (rosters || []).map((r: any) => r.id);
    if (rosterIds.length === 0) {
      return new Response(
        JSON.stringify({ members: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Restrict to participant-level roles
    const { data: participantTypes, error: ptError } = await supabaseAdmin
      .from('user_type')
      .select('id')
      .eq('permission_level', 'participant');

    if (ptError) throw ptError;
    const participantTypeIds = (participantTypes || []).map((t: any) => t.id);
    if (participantTypeIds.length === 0) {
      return new Response(
        JSON.stringify({ members: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: orgUsers, error: ouError } = await supabaseAdmin
      .from('organization_user')
      .select('id, user_id')
      .in('roster_id', rosterIds)
      .in('user_type_id', participantTypeIds)
      .eq('active_user', true);

    if (ouError) throw ouError;

    const userIds = (orgUsers || []).map((m: any) => m.user_id).filter(Boolean);
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', userIds);
    if (pErr) throw pErr;

    const profMap: Record<string, { first_name: string | null; last_name: string | null }> = {};
    profiles?.forEach((p: any) => { profMap[p.id] = p; });

    const members = (orgUsers || [])
      .map((m: any) => {
        const p = profMap[m.user_id];
        if (!p) return null;
        return {
          id: m.id,
          firstName: p.first_name || '',
          lastName: p.last_name || '',
        };
      })
      .filter(Boolean) as Array<{ id: string; firstName: string; lastName: string }>;

    members.sort((a, b) =>
      (a.firstName + a.lastName).localeCompare(b.firstName + b.lastName)
    );

    return new Response(
      JSON.stringify({ members }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('get-campaign-roster-members error:', err);
    return new Response(
      JSON.stringify({ error: err?.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});