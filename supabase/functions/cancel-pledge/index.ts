import { corsHeaders, getAdminClient } from '../_shared/pledge-helpers.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { pledgeId, token } = await req.json();
    if (!pledgeId || !token) throw new Error('pledgeId and token are required');

    const supabaseAdmin = getAdminClient();

    const { data: pledge, error } = await supabaseAdmin
      .from('pledges')
      .select('id, status, cancel_token, cancel_token_expires_at, order_id')
      .eq('id', pledgeId)
      .maybeSingle();
    if (error || !pledge) throw new Error('Pledge not found');
    if (pledge.cancel_token !== token) throw new Error('Invalid cancel token');
    if (pledge.cancel_token_expires_at && new Date(pledge.cancel_token_expires_at) < new Date()) {
      throw new Error('Cancel link has expired');
    }
    if (!['active', 'requires_action'].includes(pledge.status)) {
      throw new Error(`Pledge cannot be canceled (status: ${pledge.status})`);
    }

    await supabaseAdmin.from('pledges').update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    }).eq('id', pledgeId);

    await supabaseAdmin.from('orders').update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    }).eq('id', pledge.order_id);

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('cancel-pledge error:', error);
    return new Response(
      JSON.stringify({ error: error.message || String(error) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});