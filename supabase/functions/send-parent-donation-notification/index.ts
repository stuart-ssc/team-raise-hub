import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParentNotificationRequest {
  orderId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId }: ParentNotificationRequest = await req.json();
    console.log("Processing parent notification for order:", orderId);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch order with roster member attribution
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        total_amount,
        customer_name,
        attributed_roster_member_id,
        created_at,
        campaigns (
          id,
          name,
          group_id
        )
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderError);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If no roster member attribution, skip parent notification
    if (!order.attributed_roster_member_id) {
      console.log("Order has no roster member attribution, skipping parent notification");
      return new Response(
        JSON.stringify({ message: "No roster member attributed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the roster member's organization_user record
    const { data: rosterMemberLink, error: linkError } = await supabase
      .from("roster_member_campaign_links")
      .select("organization_user_id")
      .eq("id", order.attributed_roster_member_id)
      .single();

    if (linkError || !rosterMemberLink) {
      console.log("Roster member link not found:", linkError);
      return new Response(
        JSON.stringify({ message: "Roster member link not found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the child's organization_user record
    const { data: childOrgUser, error: childError } = await supabase
      .from("organization_user")
      .select("id, user_id")
      .eq("id", rosterMemberLink.organization_user_id)
      .single();

    if (childError || !childOrgUser) {
      console.log("Child organization_user not found:", childError);
      return new Response(
        JSON.stringify({ message: "Child user not found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the child's name
    const { data: childProfile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", childOrgUser.user_id)
      .single();

    const childName = childProfile 
      ? `${childProfile.first_name || ''} ${childProfile.last_name || ''}`.trim() || 'your student'
      : 'your student';

    // Find parents linked to this child (organization_user records with linked_organization_user_id pointing to child)
    const { data: parentOrgUsers, error: parentError } = await supabase
      .from("organization_user")
      .select("user_id")
      .eq("linked_organization_user_id", childOrgUser.id)
      .eq("active_user", true);

    if (parentError) {
      console.error("Error fetching parent org users:", parentError);
      throw parentError;
    }

    if (!parentOrgUsers || parentOrgUsers.length === 0) {
      console.log("No parents linked to this roster member");
      return new Response(
        JSON.stringify({ message: "No parents to notify" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parentUserIds = parentOrgUsers.map(p => p.user_id);
    console.log(`Found ${parentUserIds.length} parent(s) to notify`);

    // Get parent profiles with emails
    const { data: parentProfiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .in("id", parentUserIds);

    if (profileError || !parentProfiles) {
      console.error("Error fetching parent profiles:", profileError);
      throw profileError;
    }

    // Filter to parents who have emails
    const parentsWithEmail = parentProfiles.filter(p => p.email);
    console.log(`${parentsWithEmail.length} parent(s) have email addresses`);

    if (parentsWithEmail.length === 0) {
      return new Response(
        JSON.stringify({ message: "No parent emails found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const campaign = order.campaigns as any;
    const campaignName = campaign?.name || "the campaign";
    const donationAmount = (order.total_amount / 100).toFixed(2);
    const donorName = order.customer_name || "Someone";
    const appUrl = Deno.env.get("APP_URL") || "https://sponsorly.com";

    // Send email to each parent
    const emailPromises = parentsWithEmail.map(async (parent) => {
      const parentName = parent.first_name || "there";
      
      console.log(`Sending donation notification to parent: ${parent.email}`);
      
      return resend.emails.send({
        from: "Sponsorly <noreply@sponsorly.io>",
        to: [parent.email],
        subject: `🎉 ${childName} just received a donation!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Great News! 🎉</h1>
            
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
              Hi ${parentName},
            </p>
            
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
              <strong>${childName}</strong> just received a donation for the <strong>${campaignName}</strong> campaign!
            </p>
            
            <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="color: #166534; font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">
                Donation Received
              </p>
              <p style="color: #15803d; font-size: 36px; font-weight: bold; margin: 0;">
                $${donationAmount}
              </p>
              <p style="color: #166534; font-size: 14px; margin: 8px 0 0 0;">
                from ${donorName}
              </p>
            </div>
            
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
              Every donation brings ${childName} closer to their fundraising goal. Keep up the great work supporting their efforts!
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${appUrl}/dashboard/my-fundraising" 
                 style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                View Fundraising Progress
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            
            <p style="color: #888; font-size: 12px; text-align: center;">
              You're receiving this email because you're connected to ${childName}'s account on Sponsorly.
              <br/>
              © ${new Date().getFullYear()} Sponsorly. All rights reserved.
            </p>
          </div>
        `,
      });
    });

    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failedCount = results.filter(r => r.status === 'rejected').length;
    
    console.log(`Parent notifications sent: ${successCount} success, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notified: successCount,
        failed: failedCount
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending parent donation notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
