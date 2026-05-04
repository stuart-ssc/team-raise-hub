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

    // Auth is optional - allows unauthenticated checkout
    const authHeader = req.headers.get('Authorization');
    let user = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data } = await supabaseClient.auth.getUser(token);
      user = data?.user;
    }

    const {
      orderId,
      businessId,
      newBusinessData,
      organizationId,
      customFieldValues,
      campaignId,
      logoUrl,
    } = await req.json();

    console.log('Processing checkout business:', { orderId, businessId, organizationId });

    let finalBusinessId = businessId;

    // Create new business if provided
    if (newBusinessData && !businessId) {
      const { data: business, error: businessError } = await supabaseClient
        .from('businesses')
        .insert({
          business_name: newBusinessData.business_name,
          ein: newBusinessData.ein || null,
          business_email: newBusinessData.business_email,
          business_phone: newBusinessData.business_phone || null,
          website_url: newBusinessData.website_url || null,
          industry: newBusinessData.industry || null,
          address_line1: newBusinessData.address_line1 || null,
          address_line2: newBusinessData.address_line2 || null,
          city: newBusinessData.city || null,
          state: newBusinessData.state || null,
          zip: newBusinessData.zip || null,
        })
        .select()
        .single();

      if (businessError) throw businessError;

      finalBusinessId = business.id;

      // Create organization_businesses record
      await supabaseClient
        .from('organization_businesses')
        .insert({
          organization_id: organizationId,
          business_id: finalBusinessId,
        });

      console.log('Created new business:', finalBusinessId);
    }

    // Update business logo if provided (only if not already set)
    if (logoUrl && finalBusinessId) {
      const { data: existing } = await supabaseClient
        .from('businesses')
        .select('logo_url')
        .eq('id', finalBusinessId)
        .single();
      if (!existing?.logo_url) {
        await supabaseClient
          .from('businesses')
          .update({ logo_url: logoUrl })
          .eq('id', finalBusinessId);
        console.log('Updated business logo:', finalBusinessId);
      }
    }

    // ALWAYS update order with business info (regardless of auth status)
    if (finalBusinessId && orderId) {
      await supabaseClient
        .from('orders')
        .update({
          business_id: finalBusinessId,
          business_purchase: true,
        })
        .eq('id', orderId);

      console.log('Linked business to order:', orderId);
    }

    // Link donor to business (only if authenticated)
    if (finalBusinessId && user && authHeader) {
      await supabaseClient.functions.invoke('link-business-donor', {
        body: {
          businessId: finalBusinessId,
          organizationId,
          role: newBusinessData?.role || 'Contact',
          autoLinked: !businessId, // true if newly created
        },
        headers: { Authorization: authHeader }
      });
      console.log('Linked donor to business');
    }

    // Save custom field values
    if (customFieldValues && Object.keys(customFieldValues).length > 0) {
      const fieldRecords = Object.entries(customFieldValues).map(([fieldId, value]) => ({
        order_id: orderId,
        field_id: fieldId,
        field_value: typeof value === 'object' ? JSON.stringify(value) : String(value),
      }));

      const { error: fieldError } = await supabaseClient
        .from('order_custom_field_values')
        .insert(fieldRecords);

      if (fieldError) {
        console.error('Error saving custom field values:', fieldError);
      } else {
        console.log('Saved custom field values for order:', orderId);
      }
    }

    // If a deadline is configured and the buyer just provided business info
    // (which only happens when the cart contains a sponsorship item or the
    // legacy campaign-wide flag is on), schedule the asset upload reminder.
    const { data: campaign } = await supabaseClient
      .from('campaigns')
      .select('file_upload_deadline_days')
      .eq('id', campaignId)
      .single();

    if (campaign?.file_upload_deadline_days) {
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + campaign.file_upload_deadline_days);

      // Create file upload reminder
      await supabaseClient
        .from('file_upload_reminders')
        .insert({
          order_id: orderId,
          deadline_date: deadlineDate.toISOString().split('T')[0],
        });

      console.log('Created file upload reminder with deadline:', deadlineDate);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        businessId: finalBusinessId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing checkout business:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
