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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Extract the JWT token from Bearer header
    const token = authHeader.replace('Bearer ', '');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: `Bearer ${token}` }
        }
      }
    );

    // Verify user is authenticated using the token directly
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    console.log('User auth result:', { userId: user?.id, authError: authError?.message });
    
    if (authError || !user) {
      console.error('Auth error details:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { organizationId, groupId, businessType = 'company' } = await req.json();

    if (!organizationId && !groupId) {
      throw new Error('Either organizationId or groupId is required');
    }

    // Get organization or group details for prefilling
    let entityName = '';
    let entityEmail = '';
    let entityWebsite = '';

    if (organizationId) {
      const { data: org, error: orgError } = await supabaseClient
        .from('organizations')
        .select('name, email, website_url')
        .eq('id', organizationId)
        .single();

      if (orgError) throw new Error('Organization not found');
      entityName = org.name;
      entityEmail = org.email || '';
      entityWebsite = org.website_url || '';
    } else if (groupId) {
      const { data: group, error: groupError } = await supabaseClient
        .from('groups')
        .select('group_name, organizations(name, email, website_url)')
        .eq('id', groupId)
        .single();

      if (groupError) throw new Error('Group not found');
      entityName = group.group_name;
      const org = group.organizations as any;
      entityEmail = org?.email || '';
      entityWebsite = org?.website_url || '';
    }

    // Check for existing Stripe account
    const existingQuery = supabaseClient
      .from('stripe_connect_accounts')
      .select('id, stripe_account_id');
    
    if (organizationId) {
      existingQuery.eq('organization_id', organizationId);
    } else {
      existingQuery.eq('group_id', groupId);
    }

    const { data: existing } = await existingQuery.maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ 
          accountId: existing.stripe_account_id,
          message: 'Stripe account already exists'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    console.log('Creating Stripe Express connected account for:', entityName);

    // Create Stripe Express connected account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: entityEmail || undefined,
      business_type: businessType as Stripe.AccountCreateParams.BusinessType,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
        us_bank_account_ach_payments: { requested: true },
      },
      business_profile: {
        name: entityName,
        url: entityWebsite || undefined,
      },
      metadata: {
        organization_id: organizationId || '',
        group_id: groupId || '',
      },
    });

    console.log('Stripe account created:', account.id);

    // Store in database using service role for insert
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: insertError } = await supabaseAdmin
      .from('stripe_connect_accounts')
      .insert({
        organization_id: organizationId || null,
        group_id: groupId || null,
        stripe_account_id: account.id,
        business_type: businessType,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
      });

    if (insertError) {
      console.error('Error storing Stripe account:', insertError);
      throw new Error('Failed to store Stripe account');
    }

    return new Response(
      JSON.stringify({
        accountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
