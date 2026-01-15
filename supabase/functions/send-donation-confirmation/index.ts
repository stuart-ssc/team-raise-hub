import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DonationConfirmationRequest {
  orderId: string;
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  check: "Check",
  cash: "Cash",
  money_order: "Money Order",
  bank_transfer: "Bank Transfer",
  other: "Offline Payment",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId }: DonationConfirmationRequest = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch order details with campaign and group info
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        total_amount,
        customer_name,
        customer_email,
        items,
        created_at,
        manual_entry,
        payment_received,
        offline_payment_type,
        payment_notes,
        campaigns (
          name,
          groups (
            group_name,
            organization_id
          )
        )
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Error fetching order:", orderError);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!order.customer_email) {
      console.log("No customer email for order:", orderId);
      return new Response(
        JSON.stringify({ message: "No customer email" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const campaign = order.campaigns as any;
    // Handle groups as array (no FK constraint returns array)
    const groupData = Array.isArray(campaign?.groups) 
      ? campaign.groups[0] 
      : campaign?.groups;
    const groupName = groupData?.group_name || "";
    const campaignName = campaign?.name || "Campaign";
    
    // Fetch organization name separately (no FK constraint)
    let organizationName = "";
    if (groupData?.organization_id) {
      const { data: orgData } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", groupData.organization_id)
        .single();
      organizationName = orgData?.name || "";
    }
    
    // Display name for emails: "Organization Name Group Name"
    const displayName = organizationName && groupName 
      ? `${organizationName} ${groupName}` 
      : groupName || organizationName || "the organization";

    // Parse items for display
    const items = order.items as any[];
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price / 100).toFixed(2)}</td>
      </tr>
    `).join("");

    // Build manual order payment status section
    const paymentTypeLabel = order.offline_payment_type 
      ? PAYMENT_TYPE_LABELS[order.offline_payment_type] || order.offline_payment_type 
      : "Offline Payment";
    
    const manualOrderSection = order.manual_entry ? `
      <div style="background-color: ${order.payment_received ? '#ECFDF5' : '#FEF3C7'}; 
                  border-left: 4px solid ${order.payment_received ? '#10B981' : '#F59E0B'}; 
                  padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="font-weight: bold; margin: 0 0 8px 0; color: ${order.payment_received ? '#065F46' : '#92400E'};">
          Payment Method: ${paymentTypeLabel}
        </p>
        <p style="font-size: 14px; margin: 0; color: ${order.payment_received ? '#065F46' : '#92400E'};">
          ${order.payment_received 
            ? '✓ Payment has been received. Thank you!' 
            : 'Your order has been recorded. Please submit your payment to complete the donation. You will receive confirmation once payment is received.'}
        </p>
      </div>
    ` : '';

    console.log("Sending donation confirmation to:", order.customer_email, "Manual entry:", order.manual_entry);

    const emailResponse = await resend.emails.send({
      from: "Sponsorly <onboarding@resend.dev>",
      to: [order.customer_email],
      subject: order.manual_entry && !order.payment_received 
        ? `Your order with ${displayName} - Payment Pending`
        : `Thank you for your donation to ${displayName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">
            ${order.manual_entry && !order.payment_received 
              ? 'Your Order Has Been Recorded' 
              : 'Thank You for Your Donation!'}
          </h1>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Hi ${order.customer_name || "Supporter"},
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            ${order.manual_entry && !order.payment_received 
              ? `Your order with <strong>${displayName}</strong> for the <strong>${campaignName}</strong> campaign has been recorded.`
              : `Thank you for supporting <strong>${displayName}</strong> through the <strong>${campaignName}</strong> campaign on Sponsorly!`}
          </p>
          
          ${manualOrderSection}
          
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #333; font-size: 18px; margin-top: 0;">Order Summary</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                  <th style="padding: 8px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                  <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 12px 8px; text-align: right; font-weight: bold;">Total:</td>
                  <td style="padding: 12px 8px; text-align: right; font-weight: bold; font-size: 18px; color: #4F46E5;">
                    $${(order.total_amount / 100).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
            
            <p style="color: #666; font-size: 14px; margin-top: 15px; margin-bottom: 0;">
              Order ID: ${order.id}<br/>
              Date: ${new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Your contribution makes a real difference. 100% of your donation goes directly to support ${displayName}.
          </p>
          
          ${!order.manual_entry ? `
            <div style="background-color: #EEF2FF; border-left: 4px solid #4F46E5; padding: 15px; margin: 20px 0;">
              <p style="color: #4F46E5; font-weight: bold; margin: 0 0 5px 0;">Tax Receipt</p>
              <p style="color: #666; font-size: 14px; margin: 0;">
                If applicable, a tax receipt will be sent separately for your records.
              </p>
            </div>
          ` : ''}
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          
          <p style="color: #888; font-size: 12px;">
            © ${new Date().getFullYear()} Sponsorly. All rights reserved.
          </p>
        </div>
      `,
    });

    console.log("Donation confirmation sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending donation confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
