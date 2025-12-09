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

    // Get Stripe account ID
    const accountQuery = supabaseClient
      .from('stripe_connect_accounts')
      .select('stripe_account_id, onboarding_complete');
    
    if (organizationId) {
      accountQuery.eq('organization_id', organizationId);
    } else {
      accountQuery.eq('group_id', groupId);
    }

    const { data: account, error: accountError } = await accountQuery.single();

    if (accountError || !account) {
      throw new Error('Stripe account not found');
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    console.log('Creating Express Dashboard link for account:', account.stripe_account_id);

    // Create login link for Express Dashboard
    const loginLink = await stripe.accounts.createLoginLink(account.stripe_account_id);

    console.log('Dashboard link created');

    return new Response(
      JSON.stringify({ url: loginLink.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating dashboard link:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
