import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Auth required for manual order creation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization required');
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const {
      campaignId,
      organizationId,
      customerEmail,
      customerName,
      customerPhone,
      businessData,
      attributedRosterMemberId,
      items,
      offlinePaymentType,
      checkNumber,
      paymentNotes,
      paymentReceived,
      enteredBy,
    } = await req.json();

    console.log('Creating manual order:', { campaignId, customerEmail, itemCount: items?.length });

    // Validate required fields
    if (!campaignId || !customerEmail || !customerName || !items?.length) {
      throw new Error('Missing required fields');
    }

    // Calculate totals
    const itemsTotal = items.reduce((sum: number, item: any) => 
      sum + (item.price_at_purchase * item.quantity), 0);

    // Create business if provided
    let businessId = null;
    if (businessData && businessData.business_name) {
      const { data: business, error: businessError } = await supabaseClient
        .from('businesses')
        .insert({
          business_name: businessData.business_name,
          business_email: businessData.business_email || null,
          business_phone: businessData.business_phone || null,
          address_line1: businessData.address_line1 || null,
          city: businessData.city || null,
          state: businessData.state || null,
          zip: businessData.zip || null,
        })
        .select('id')
        .single();

      if (businessError) {
        console.error('Error creating business:', businessError);
      } else {
        businessId = business.id;

        // Link business to organization
        await supabaseClient
          .from('organization_businesses')
          .insert({
            organization_id: organizationId,
            business_id: businessId,
          });

        console.log('Created business:', businessId);
      }
    }

    // Create order with manual entry flags
    const orderData = {
      campaign_id: campaignId,
      customer_email: customerEmail,
      customer_name: customerName,
      customer_phone: customerPhone || null,
      items: items,
      items_total: itemsTotal,
      total_amount: itemsTotal,
      status: 'succeeded', // Manual orders are immediately "succeeded"
      currency: 'usd',
      payment_processor: 'manual',
      business_id: businessId,
      business_purchase: !!businessId,
      attributed_roster_member_id: attributedRosterMemberId || null,
      files_complete: false,
      // Manual order specific fields
      payment_method: 'manual',
      manual_entry: true,
      entered_by: enteredBy,
      payment_received: paymentReceived || false,
      payment_received_at: paymentReceived ? new Date().toISOString() : null,
      payment_received_by: paymentReceived ? enteredBy : null,
      offline_payment_type: offlinePaymentType,
      payment_notes: checkNumber 
        ? `${offlinePaymentType === 'check' ? `Check #${checkNumber}` : ''}${paymentNotes ? ` - ${paymentNotes}` : ''}`
        : paymentNotes || null,
    };

    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert(orderData)
      .select('id')
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw orderError;
    }

    console.log('Created manual order:', order.id);

    // Update campaign amount_raised
    const { data: campaign } = await supabaseClient
      .from('campaigns')
      .select('amount_raised')
      .eq('id', campaignId)
      .single();

    if (campaign) {
      await supabaseClient
        .from('campaigns')
        .update({
          amount_raised: (campaign.amount_raised || 0) + itemsTotal,
        })
        .eq('id', campaignId);
    }

    // Create/update donor profile
    const { data: existingDonor } = await supabaseClient
      .from('donor_profiles')
      .select('id, donation_count, total_donations')
      .eq('email', customerEmail)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (existingDonor) {
      // Update existing donor
      await supabaseClient
        .from('donor_profiles')
        .update({
          donation_count: (existingDonor.donation_count || 0) + 1,
          total_donations: (existingDonor.total_donations || 0) + itemsTotal,
          last_donation_date: new Date().toISOString(),
        })
        .eq('id', existingDonor.id);
    } else {
      // Create new donor profile
      const nameParts = customerName.split(' ');
      await supabaseClient
        .from('donor_profiles')
        .insert({
          email: customerEmail,
          organization_id: organizationId,
          first_name: nameParts[0] || null,
          last_name: nameParts.slice(1).join(' ') || null,
          phone: customerPhone || null,
          donation_count: 1,
          total_donations: itemsTotal,
          first_donation_date: new Date().toISOString(),
          last_donation_date: new Date().toISOString(),
        });
    }

    // Log activity
    await supabaseClient
      .from('donor_activity_log')
      .insert({
        donor_id: existingDonor?.id,
        activity_type: 'manual_order',
        activity_data: {
          order_id: order.id,
          amount: itemsTotal,
          payment_type: offlinePaymentType,
          entered_by: enteredBy,
        },
      });

    return new Response(
      JSON.stringify({ 
        success: true,
        orderId: order.id,
        businessId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating manual order:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
