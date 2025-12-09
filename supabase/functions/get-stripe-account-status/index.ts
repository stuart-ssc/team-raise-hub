import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { organizationId, groupId } = await req.json();

    if (!organizationId && !groupId) {
      throw new Error('Either organizationId or groupId is required');
    }

    // Get Stripe account from database
    const accountQuery = supabaseClient
      .from('stripe_connect_accounts')
      .select('*');
    
    if (organizationId) {
      accountQuery.eq('organization_id', organizationId);
    } else {
      accountQuery.eq('group_id', groupId);
    }

    const { data: dbAccount, error: dbError } = await accountQuery.maybeSingle();

    if (!dbAccount) {
      return new Response(
        JSON.stringify({ 
          exists: false,
          message: 'No Stripe account connected'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe to get live status
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    console.log('Fetching Stripe account status:', dbAccount.stripe_account_id);

    // Get current account status from Stripe
    const stripeAccount = await stripe.accounts.retrieve(dbAccount.stripe_account_id);

    // Update database with latest status
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: updateError } = await supabaseAdmin
      .from('stripe_connect_accounts')
      .update({
        charges_enabled: stripeAccount.charges_enabled,
        payouts_enabled: stripeAccount.payouts_enabled,
        details_submitted: stripeAccount.details_submitted,
        onboarding_complete: stripeAccount.charges_enabled && stripeAccount.payouts_enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dbAccount.id);

    if (updateError) {
      console.error('Error updating account status:', updateError);
    }

    // Determine account status
    let status = 'pending';
    if (stripeAccount.charges_enabled && stripeAccount.payouts_enabled) {
      status = 'active';
    } else if (stripeAccount.details_submitted) {
      status = 'pending_verification';
    } else {
      status = 'incomplete';
    }

    // Get requirements if any
    const requirements = stripeAccount.requirements?.currently_due || [];
    const pendingVerification = stripeAccount.requirements?.pending_verification || [];

    return new Response(
      JSON.stringify({
        exists: true,
        accountId: stripeAccount.id,
        status,
        chargesEnabled: stripeAccount.charges_enabled,
        payoutsEnabled: stripeAccount.payouts_enabled,
        detailsSubmitted: stripeAccount.details_submitted,
        requirements,
        pendingVerification,
        businessType: stripeAccount.business_type,
        payoutSchedule: dbAccount.payout_schedule,
        minimumPayoutAmount: dbAccount.minimum_payout_amount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error getting Stripe account status:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
