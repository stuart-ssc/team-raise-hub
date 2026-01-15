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
      .select('id, donation_count, total_donations, user_id')
      .eq('email', customerEmail)
      .eq('organization_id', organizationId)
      .maybeSingle();

    let donorId = existingDonor?.id;

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
      const { data: newDonor } = await supabaseClient
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
        })
        .select('id')
        .single();
      
      donorId = newDonor?.id;
    }

    // Log activity
    if (donorId) {
      await supabaseClient
        .from('donor_activity_log')
        .insert({
          donor_id: donorId,
          activity_type: 'manual_order',
          activity_data: {
            order_id: order.id,
            amount: itemsTotal,
            payment_type: offlinePaymentType,
            entered_by: enteredBy,
          },
        });
    }

    // Send donation confirmation email
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      const confirmationResponse = await fetch(
        `${supabaseUrl}/functions/v1/send-donation-confirmation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ orderId: order.id }),
        }
      );
      
      if (confirmationResponse.ok) {
        console.log('Donation confirmation email sent for order:', order.id);
      } else {
        const errorText = await confirmationResponse.text();
        console.error('Failed to send donation confirmation:', errorText);
      }
    } catch (emailError) {
      console.error('Error sending donation confirmation email:', emailError);
      // Don't fail the order creation if email fails
    }

    // Check if user needs an account invitation
    const hasExistingAccount = existingDonor?.user_id != null;
    
    if (!hasExistingAccount) {
      try {
        // Check if there's already an auth user with this email
        const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
        const existingAuthUser = existingUsers?.users?.find(u => u.email === customerEmail);
        
        if (!existingAuthUser) {
          console.log('Creating account invitation for new donor:', customerEmail);
          
          const nameParts = customerName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          // Create auth user
          const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
            email: customerEmail,
            email_confirm: false,
            user_metadata: { first_name: firstName, last_name: lastName },
          });
          
          if (authError) {
            console.error('Error creating auth user:', authError);
          } else if (authData.user) {
            console.log('Created auth user:', authData.user.id);
            
            // Link the donor profile to this user
            if (donorId) {
              await supabaseClient
                .from('donor_profiles')
                .update({ user_id: authData.user.id })
                .eq('id', donorId);
            }
            
            // Get organization name for the invitation email
            const { data: orgData } = await supabaseClient
              .from('organizations')
              .select('name')
              .eq('id', organizationId)
              .single();
            
            const organizationName = orgData?.name || 'the organization';
            
            // Generate password setup link
            const siteUrl = Deno.env.get('SITE_URL') || 'https://team-raise-hub.lovable.app';
            const { data: linkData, error: linkError } = await supabaseClient.auth.admin.generateLink({
              type: 'recovery',
              email: customerEmail,
              options: { redirectTo: `${siteUrl}/login` },
            });
            
            if (linkError) {
              console.error('Error generating invite link:', linkError);
            } else if (linkData?.properties?.action_link) {
              console.log('Generated invitation link for:', customerEmail);
              
              // Send invitation email
              const supabaseUrl = Deno.env.get('SUPABASE_URL');
              const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
              
              const inviteResponse = await fetch(
                `${supabaseUrl}/functions/v1/send-invitation-email`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${serviceRoleKey}`,
                  },
                  body: JSON.stringify({
                    email: customerEmail,
                    firstName,
                    lastName,
                    organizationName,
                    roleName: 'Supporter',
                    inviteLink: linkData.properties.action_link,
                  }),
                }
              );
              
              if (inviteResponse.ok) {
                console.log('Invitation email sent for:', customerEmail);
              } else {
                const errorText = await inviteResponse.text();
                console.error('Failed to send invitation email:', errorText);
              }
            }
          }
        } else {
          console.log('User already has an auth account:', customerEmail);
          
          // Link the donor profile to this existing user if not already linked
          if (donorId && !existingDonor?.user_id) {
            await supabaseClient
              .from('donor_profiles')
              .update({ user_id: existingAuthUser.id })
              .eq('id', donorId);
          }
        }
      } catch (inviteError) {
        console.error('Error in account invitation process:', inviteError);
        // Don't fail the order creation if invitation fails
      }
    }

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
