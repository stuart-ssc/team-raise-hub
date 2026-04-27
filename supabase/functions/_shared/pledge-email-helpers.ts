import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export function fmt(amount: number): string {
  return `$${Number(amount || 0).toFixed(2)}`;
}

export async function loadPledgeContext(pledgeId: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { data: pledge, error } = await supabase
    .from('pledges')
    .select(`
      id, amount_per_unit, max_total_amount, status, mandate_text_shown,
      cancel_token, sca_confirm_token,
      units_charged_for, calculated_charge_amount, final_charge_amount,
      charge_failure_reason, charged_at, attributed_roster_member_id,
      order_id, campaign_id,
      orders!inner(id, customer_email, customer_name, total_amount),
      campaigns!inner(
        id, name, slug, pledge_unit_label, pledge_event_date,
        groups(group_name, organization_id)
      )
    `)
    .eq('id', pledgeId)
    .single();
  if (error || !pledge) throw new Error('Pledge not found');

  const campaign: any = pledge.campaigns;
  const groupData = Array.isArray(campaign?.groups) ? campaign.groups[0] : campaign?.groups;
  let orgName = '';
  if (groupData?.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', groupData.organization_id)
      .single();
    orgName = org?.name || '';
  }
  const displayName = orgName && groupData?.group_name
    ? `${orgName} ${groupData.group_name}`
    : (groupData?.group_name || orgName || 'the organization');

  let participantName: string | null = null;
  if (pledge.attributed_roster_member_id) {
    const { data: ou } = await supabase
      .from('organization_user')
      .select('user_id, profiles:user_id(first_name, last_name)')
      .eq('id', pledge.attributed_roster_member_id)
      .maybeSingle();
    const profile: any = (ou as any)?.profiles;
    if (profile) {
      participantName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() || null;
    }
  }

  return { supabase, pledge: pledge as any, campaign, displayName, participantName };
}

export const emailCors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const PUBLIC_BASE_URL = 'https://sponsorly.io';

export function shellHtml(title: string, body: string): string {
  return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #111; font-size: 24px; margin-bottom: 16px;">${title}</h1>
    ${body}
    <p style="color: #888; font-size: 12px; margin-top: 32px;">Sent by Sponsorly</p>
  </div>`;
}