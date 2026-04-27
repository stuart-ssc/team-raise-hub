import { corsHeaders, getStripe, getAdminClient, finalizePledgeSetup } from '../_shared/pledge-helpers.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { sessionId } = await req.json();
    if (!sessionId) throw new Error('sessionId is required');

    const stripe = getStripe();
    const supabaseAdmin = getAdminClient();

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const result = await finalizePledgeSetup({ session, supabaseAdmin, stripe });

    return new Response(
      JSON.stringify({ ok: true, ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('verify-pledge-setup error:', error);
    return new Response(
      JSON.stringify({ error: error.message || String(error) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});