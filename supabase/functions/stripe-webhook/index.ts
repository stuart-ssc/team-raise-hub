import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    let event: Stripe.Event;
    
    if (webhookSecret && signature) {
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // For development without signature verification
      event = JSON.parse(body);
      console.warn('Webhook signature verification skipped - no secret configured');
    }

    console.log('Received Stripe webhook event:', event.type);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Processing checkout.session.completed:', session.id);

        const orderId = session.metadata?.order_id;
        if (!orderId) {
          console.error('No order_id in session metadata');
          break;
        }

        // Extract customer details from Stripe session
        const customerEmail = session.customer_details?.email || session.customer_email || null;
        const customerName = session.customer_details?.name || null;
        const isSubscription = session.metadata?.is_subscription === 'true';

        console.log('Customer details from Stripe:', { customerEmail, customerName, isSubscription });

        // Update order status and customer info
        const { error: orderError } = await supabaseAdmin
          .from('orders')
          .update({
            status: 'succeeded',
            customer_email: customerEmail,
            customer_name: customerName,
            stripe_payment_intent_id: session.payment_intent as string,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        if (orderError) {
          console.error('Error updating order:', orderError);
          throw orderError;
        }

        // Get order with campaign info for donor profile creation
        const { data: order } = await supabaseAdmin
          .from('orders')
          .select(`
            campaign_id, 
            total_amount, 
            platform_fee_amount,
            customer_email,
            customer_name,
            items,
            campaigns!inner(
              group_id,
              groups!inner(organization_id)
            )
          `)
          .eq('id', orderId)
          .single();

        if (order) {
          // Calculate net amount (total minus platform fee) for donor profile
          const netAmount = order.total_amount - (order.platform_fee_amount || 0);
          
          // Note: Campaign amount_raised is updated automatically by the sync_campaign_amount_raised trigger
          // when the order status is set to 'succeeded' above

          // Create or update donor profile
          if (customerEmail) {
            const organizationId = (order.campaigns as any)?.groups?.organization_id;
            
            if (organizationId) {
              const nameParts = (customerName || '').split(' ');
              const firstName = nameParts[0] || null;
              const lastName = nameParts.slice(1).join(' ') || null;

              const { data: existingDonor } = await supabaseAdmin
                .from('donor_profiles')
                .select('id, donation_count, total_donations, lifetime_value')
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

              // Create subscription record if this was a subscription checkout
              if (isSubscription && session.subscription && donorProfileId) {
                const subscriptionId = session.subscription as string;
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                
                // Find the first recurring item from order
                const recurringItem = (order.items as any[])?.find(item => item.is_recurring);
                
                const { error: subError } = await supabaseAdmin
                  .from('subscriptions')
                  .insert({
                    order_id: orderId,
                    donor_profile_id: donorProfileId,
                    campaign_id: order.campaign_id,
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
                } else {
                  console.log('Created subscription record for:', subscriptionId);
                }
              }
            }
          }
          
          // Notify parents of roster member if applicable
          try {
            await supabaseAdmin.functions.invoke('send-parent-donation-notification', {
              body: { orderId }
            });
            console.log('Parent notification triggered for order:', orderId);
          } catch (parentNotifError) {
            console.error('Error triggering parent notification:', parentNotifError);
            // Don't fail the webhook for notification errors
          }
        }

        console.log('Order updated successfully:', orderId);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Processing customer.subscription.updated:', subscription.id);

        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Error updating subscription:', error);
        } else {
          console.log('Subscription updated:', subscription.id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Processing customer.subscription.deleted:', subscription.id);

        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Error canceling subscription:', error);
        } else {
          console.log('Subscription canceled:', subscription.id);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Processing invoice.payment_succeeded:', invoice.id);

        // Only process subscription renewal invoices (not the first one)
        if (invoice.billing_reason === 'subscription_cycle' && invoice.subscription) {
          const { data: sub } = await supabaseAdmin
            .from('subscriptions')
            .select('*, campaigns(group_id, groups(organization_id))')
            .eq('stripe_subscription_id', invoice.subscription)
            .single();

          if (sub) {
            // Get donor info for order creation
            let donorEmail: string | null = null;
            let donorName: string | null = null;
            
            if (sub.donor_profile_id) {
              const { data: donor } = await supabaseAdmin
                .from('donor_profiles')
                .select('email, first_name, last_name, donation_count, total_donations, lifetime_value')
                .eq('id', sub.donor_profile_id)
                .single();

              if (donor) {
                donorEmail = donor.email;
                donorName = [donor.first_name, donor.last_name].filter(Boolean).join(' ') || null;
                
                // Update donor profile stats
                await supabaseAdmin
                  .from('donor_profiles')
                  .update({
                    donation_count: (donor.donation_count || 0) + 1,
                    total_donations: (donor.total_donations || 0) + sub.amount,
                    lifetime_value: (donor.lifetime_value || 0) + sub.amount,
                    last_donation_date: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', sub.donor_profile_id);
              }
            }

            // Create a new order record for this renewal payment
            // This triggers sync_campaign_amount_raised automatically
            const { data: renewalOrder, error: orderError } = await supabaseAdmin
              .from('orders')
              .insert({
                campaign_id: sub.campaign_id,
                status: 'succeeded',
                total_amount: sub.amount,
                items_total: sub.amount,
                platform_fee_amount: 0,
                customer_email: donorEmail,
                customer_name: donorName,
                stripe_payment_intent_id: invoice.payment_intent as string,
                is_subscription_renewal: true,
                subscription_id: sub.id,
                items: [{
                  campaign_item_id: sub.campaign_item_id,
                  quantity: 1,
                  price_at_purchase: sub.amount,
                  is_recurring: true,
                }],
              })
              .select('id')
              .single();

            if (orderError) {
              console.error('Error creating renewal order:', orderError);
            } else {
              console.log('Created renewal order:', renewalOrder?.id);
            }

            console.log('Processed subscription renewal for:', invoice.subscription);
          }
        }
        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        console.log('Processing account.updated:', account.id);

        const { error: updateError } = await supabaseAdmin
          .from('stripe_connect_accounts')
          .update({
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            details_submitted: account.details_submitted,
            onboarding_complete: account.charges_enabled && account.payouts_enabled,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_account_id', account.id);

        if (updateError) {
          console.error('Error updating connect account:', updateError);
        }

        if (account.charges_enabled) {
          const { data: connectAccount } = await supabaseAdmin
            .from('stripe_connect_accounts')
            .select('organization_id, group_id')
            .eq('stripe_account_id', account.id)
            .single();

          if (connectAccount) {
            const config = {
              processor: 'stripe',
              account_id: account.id,
              account_enabled: account.charges_enabled,
            };

            if (connectAccount.organization_id) {
              await supabaseAdmin
                .from('organizations')
                .update({ payment_processor_config: config })
                .eq('id', connectAccount.organization_id);
            }
            
            if (connectAccount.group_id) {
              await supabaseAdmin
                .from('groups')
                .update({ payment_processor_config: config })
                .eq('id', connectAccount.group_id);
            }
          }
        }

        console.log('Account updated successfully:', account.id);
        break;
      }

      case 'payout.paid':
      case 'payout.failed': {
        const payout = event.data.object as Stripe.Payout;
        console.log('Processing payout event:', event.type, payout.id);

        const stripeAccountId = event.account;
        if (!stripeAccountId) {
          console.error('No account ID in payout event');
          break;
        }

        const { data: connectAccount } = await supabaseAdmin
          .from('stripe_connect_accounts')
          .select('id')
          .eq('stripe_account_id', stripeAccountId)
          .single();

        if (!connectAccount) {
          console.error('Connect account not found:', stripeAccountId);
          break;
        }

        const { error: payoutError } = await supabaseAdmin
          .from('stripe_payouts')
          .upsert({
            stripe_connect_account_id: connectAccount.id,
            stripe_payout_id: payout.id,
            amount: payout.amount,
            currency: payout.currency,
            status: payout.status,
            arrival_date: payout.arrival_date 
              ? new Date(payout.arrival_date * 1000).toISOString() 
              : null,
          }, {
            onConflict: 'stripe_payout_id',
          });

        if (payoutError) {
          console.error('Error recording payout:', payoutError);
        }

        console.log('Payout recorded:', payout.id);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Processing payment_intent.succeeded:', paymentIntent.id);
        
        const orderId = paymentIntent.metadata?.order_id;
        if (orderId) {
          await supabaseAdmin
            .from('orders')
            .update({
              stripe_payment_intent_id: paymentIntent.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);
        }
        break;
      }

      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer;
        console.log('Processing transfer.created:', transfer.id);
        
        const orderId = transfer.metadata?.order_id;
        if (orderId) {
          await supabaseAdmin
            .from('orders')
            .update({
              stripe_transfer_id: transfer.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});