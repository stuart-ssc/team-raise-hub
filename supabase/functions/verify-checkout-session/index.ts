import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Returns true when the given order requires sponsor asset uploads.
 * Logic:
 *   - If any line item in `order.items` references a `campaign_items` row with
 *     `is_sponsorship_item = true`, the order requires assets.
 *   - Otherwise, fall back to the legacy campaign-wide `requires_business_info`
 *     flag combined with the existence of any campaign-wide required asset.
 */
async function orderRequiresAssets(supabaseAdmin: any, order: { campaign_id: string; items?: any }) {
  const itemIds: string[] = Array.isArray(order.items)
    ? order.items
        .map((li: any) => li?.campaign_item_id || li?.id)
        .filter((v: any) => typeof v === 'string')
    : [];

  if (itemIds.length > 0) {
    const { data: sponsorshipItems } = await supabaseAdmin
      .from('campaign_items')
      .select('id')
      .in('id', itemIds)
      .eq('is_sponsorship_item', true);
    if ((sponsorshipItems?.length ?? 0) > 0) return true;
  }

  const { data: campaignInfo } = await supabaseAdmin
    .from('campaigns')
    .select('requires_business_info')
    .eq('id', order.campaign_id)
    .single();

  if (!campaignInfo?.requires_business_info) return false;

  const { count: assetCount } = await supabaseAdmin
    .from('campaign_required_assets')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', order.campaign_id)
    .is('campaign_item_id', null);

  return (assetCount ?? 0) > 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Try to get the authenticated user (if logged in)
  const authHeader = req.headers.get('Authorization');
  let userId: string | null = null;
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const { data: userData } = await supabaseAdmin.auth.getUser(token);
    userId = userData?.user?.id || null;
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing sessionId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Verifying checkout session:', sessionId);

    // Look up the order by processor_session_id
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status, campaign_id, total_amount, platform_fee_amount, customer_email, customer_name, items')
      .eq('processor_session_id', sessionId)
      .single();

    if (orderError || !order) {
      console.error('Order not found for session:', sessionId, orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found', status: 'not_found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If already succeeded, no work needed
    if (order.status === 'succeeded' || order.status === 'completed') {
      console.log('Order already processed:', order.id);
      return new Response(
        JSON.stringify({ status: 'already_processed', orderId: order.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Retrieve the checkout session from Stripe (platform account)
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Stripe session status:', session.payment_status, 'for order:', order.id);

    if (session.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({ status: 'payment_not_completed', paymentStatus: session.payment_status }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Payment is confirmed paid - fulfill the order (same logic as stripe-webhook)
    const customerEmail = session.customer_details?.email || session.customer_email || null;
    const customerName = session.customer_details?.name || null;
    const isSubscription = session.metadata?.is_subscription === 'true';

    // Determine order status based on whether THIS order requires assets.
    // An order requires asset uploads when:
    //   (a) the campaign-wide legacy `requires_business_info` flag is on AND any campaign_required_assets row exists, OR
    //   (b) any line item in the order is flagged as a sponsorship item (per-item or campaign-wide assets exist for it).
    const requiresAssets = await orderRequiresAssets(supabaseAdmin, order);
    const orderStatus = requiresAssets ? 'succeeded' : 'completed';
    console.log('Order status determined:', orderStatus, { requiresAssets });

    console.log('Fulfilling order:', order.id, { customerEmail, customerName });

    // If we don't have a user from auth, try to find one by email
    if (!userId && customerEmail) {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const matchedUser = authUsers?.users?.find(u => u.email?.toLowerCase() === customerEmail.toLowerCase());
      if (matchedUser) {
        userId = matchedUser.id;
        console.log('Matched user by email:', userId);
      }
    }

    // Update order status
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: orderStatus,
        customer_email: customerEmail,
        customer_name: customerName,
        stripe_payment_intent_id: session.payment_intent as string,
        user_id: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw updateError;
    }

    // Get campaign info for donor profile
    const { data: orderWithCampaign } = await supabaseAdmin
      .from('orders')
      .select(`
        campaign_id, total_amount, platform_fee_amount, customer_email, customer_name, items,
        campaigns!inner(group_id, groups!inner(organization_id))
      `)
      .eq('id', order.id)
      .single();

    if (orderWithCampaign && customerEmail) {
      const netAmount = orderWithCampaign.total_amount - (orderWithCampaign.platform_fee_amount || 0);
      const organizationId = (orderWithCampaign.campaigns as any)?.groups?.organization_id;

      if (organizationId) {
        const nameParts = (customerName || '').split(' ');
        const firstName = nameParts[0] || null;
        const lastName = nameParts.slice(1).join(' ') || null;

        const { data: existingDonor } = await supabaseAdmin
          .from('donor_profiles')
          .select('id, donation_count, total_donations, lifetime_value, first_name, last_name')
          .eq('email', customerEmail)
          .eq('organization_id', organizationId)
          .single();

        let donorProfileId: string | null = null;

        if (existingDonor) {
          await supabaseAdmin
            .from('donor_profiles')
            .update({
              donation_count: (existingDonor.donation_count || 0) + 1,
              total_donations: (existingDonor.total_donations || 0) + netAmount,
              lifetime_value: (existingDonor.lifetime_value || 0) + netAmount,
              last_donation_date: new Date().toISOString(),
              first_name: existingDonor.first_name || firstName,
              last_name: existingDonor.last_name || lastName,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingDonor.id);
          donorProfileId = existingDonor.id;
          console.log('Updated existing donor profile:', existingDonor.id);
        } else {
          const { data: newDonor, error: donorError } = await supabaseAdmin
            .from('donor_profiles')
            .insert({
              email: customerEmail,
              first_name: firstName,
              last_name: lastName,
              organization_id: organizationId,
              donation_count: 1,
              total_donations: netAmount,
              lifetime_value: netAmount,
              first_donation_date: new Date().toISOString(),
              last_donation_date: new Date().toISOString(),
            })
            .select('id')
            .single();

          if (donorError) {
            console.error('Error creating donor profile:', donorError);
          } else {
            donorProfileId = newDonor?.id;
            console.log('Created new donor profile:', newDonor?.id);
          }
        }

        // Handle subscriptions
        if (isSubscription && session.subscription && donorProfileId) {
          const subscriptionId = session.subscription as string;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const recurringItem = (orderWithCampaign.items as any[])?.find((item: any) => item.is_recurring);

          const { error: subError } = await supabaseAdmin
            .from('subscriptions')
            .insert({
              order_id: order.id,
              donor_profile_id: donorProfileId,
              campaign_id: orderWithCampaign.campaign_id,
              campaign_item_id: recurringItem?.campaign_item_id,
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: session.customer as string,
              status: subscription.status,
              amount: netAmount,
              interval: recurringItem?.recurring_interval || 'month',
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            });

          if (subError) {
            console.error('Error creating subscription record:', subError);
          }
        }
      }
    }

    // Send donation confirmation email
    try {
      await supabaseAdmin.functions.invoke('send-donation-confirmation', {
        body: { orderId: order.id }
      });
      console.log('Donation confirmation email triggered for order:', order.id);
    } catch (emailErr) {
      console.error('Error sending confirmation email:', emailErr);
    }

    // Notify parents if applicable
    try {
      await supabaseAdmin.functions.invoke('send-parent-donation-notification', {
        body: { orderId: order.id }
      });
    } catch (parentErr) {
      console.error('Error triggering parent notification:', parentErr);
    }

    // Send donation notification to org admins
    try {
      await supabaseAdmin.functions.invoke('send-donation-notification', {
        body: { orderId: order.id }
      });
    } catch (notifErr) {
      console.error('Error sending donation notification:', notifErr);
    }

    console.log('Order fulfilled via verification fallback:', order.id);

    return new Response(
      JSON.stringify({ status: 'verified_and_fulfilled', orderId: order.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
