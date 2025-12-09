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

    const { organizationId, groupId, returnUrl, refreshUrl } = await req.json();

    if (!organizationId && !groupId) {
      throw new Error('Either organizationId or groupId is required');
    }

    // Get Stripe account ID
    const accountQuery = supabaseClient
      .from('stripe_connect_accounts')
      .select('stripe_account_id');
    
    if (organizationId) {
      accountQuery.eq('organization_id', organizationId);
    } else {
      accountQuery.eq('group_id', groupId);
    }

    const { data: account, error: accountError } = await accountQuery.single();

    if (accountError || !account) {
      throw new Error('Stripe account not found. Please create an account first.');
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    console.log('Creating onboarding link for account:', account.stripe_account_id);

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.stripe_account_id,
      refresh_url: refreshUrl || `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/dashboard/settings`,
      return_url: returnUrl || `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/dashboard/settings?stripe_onboarding=complete`,
      type: 'account_onboarding',
    });

    console.log('Onboarding link created:', accountLink.url);

    return new Response(
      JSON.stringify({ url: accountLink.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating onboarding link:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
