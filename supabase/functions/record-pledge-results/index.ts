import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, getAdminClient } from '../_shared/pledge-helpers.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Authentication required');

    const supabaseAdmin = getAdminClient();
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) throw new Error('Invalid token');
    const userId = userData.user.id;

    const { campaignId, results } = await req.json();
    // results: Array<{ attributedRosterMemberId: string|null; unitsCompleted: number }>
    if (!campaignId || !Array.isArray(results) || results.length === 0) {
      throw new Error('campaignId and results[] required');
    }

    // Permission check via security definer function
    const { data: canManage, error: permErr } = await supabaseAdmin.rpc('can_manage_campaign_pledges', {
      _campaign_id: campaignId,
      _user_id: userId,
    });
    if (permErr) throw permErr;
    if (!canManage) throw new Error('You do not have permission to record results for this campaign');

    // Upsert each result
    for (const r of results) {
      const units = Number(r.unitsCompleted);
      if (!Number.isFinite(units) || units < 0) continue;

      // Count active pledges for this scope (team or per-participant)
      let pledgeQuery = supabaseAdmin
        .from('pledges')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .eq('status', 'active');
      if (r.attributedRosterMemberId) {
        pledgeQuery = pledgeQuery.eq('attributed_roster_member_id', r.attributedRosterMemberId);
      } else {
        pledgeQuery = pledgeQuery.is('attributed_roster_member_id', null);
      }
      const { count: pledgeCount } = await pledgeQuery;

      // Upsert (campaign_id, attributed_roster_member_id) unique
      // Postgres NULL doesn't equal NULL → use manual select-or-insert
      const baseSel = supabaseAdmin
        .from('pledge_results')
        .select('id')
        .eq('campaign_id', campaignId);
      const existing = r.attributedRosterMemberId
        ? await baseSel.eq('attributed_roster_member_id', r.attributedRosterMemberId).maybeSingle()
        : await baseSel.is('attributed_roster_member_id', null).maybeSingle();

      if (existing.data?.id) {
        await supabaseAdmin.from('pledge_results').update({
          units_completed: units,
          recorded_by: userId,
          recorded_at: new Date().toISOString(),
          charge_status: 'pending',
          total_pledges_count: pledgeCount || 0,
          total_pledges_charged: 0,
          total_pledges_failed: 0,
          total_amount_charged: 0,
          updated_at: new Date().toISOString(),
        }).eq('id', existing.data.id);
      } else {
        await supabaseAdmin.from('pledge_results').insert({
          campaign_id: campaignId,
          attributed_roster_member_id: r.attributedRosterMemberId || null,
          units_completed: units,
          recorded_by: userId,
          charge_status: 'pending',
          total_pledges_count: pledgeCount || 0,
        });
      }
    }

    // Fire-and-forget the charge job
    supabaseAdmin.functions.invoke('charge-pledges', {
      body: { campaignId },
    }).catch((e) => console.error('charge-pledges invoke failed:', e));

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('record-pledge-results error:', error);
    return new Response(
      JSON.stringify({ error: error.message || String(error) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});