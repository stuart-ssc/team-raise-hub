import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CampaignMilestoneRequest {
  campaignId: string;
  milestoneType: "goal_reached" | "halfway" | "launched";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId, milestoneType }: CampaignMilestoneRequest = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select(`
        id,
        name,
        amount_raised,
        goal_amount,
        groups (
          group_name,
          organization_id,
          organizations (
            name,
            organization_type
          )
        )
      `)
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error("Error fetching campaign:", campaignError);
      return new Response(
        JSON.stringify({ error: "Campaign not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const group = campaign.groups as any;
    const organizationId = group?.organization_id;

    // Fetch campaign managers who have notifications enabled
    const { data: orgUsers, error: usersError } = await supabase
      .from("organization_user")
      .select(`
        user_id,
        profiles (
          email: id,
          first_name,
          notify_campaigns
        ),
        user_type (
          permission_level
        )
      `)
      .eq("organization_id", organizationId)
      .eq("active_user", true)
      .in("user_type.permission_level", ["organization_admin", "program_manager"]);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return new Response(
        JSON.stringify({ error: "Error fetching users" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get actual email addresses from auth.users
    const userIds = orgUsers?.map(u => u.profiles?.email).filter(Boolean) || [];
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    
    const emailRecipients = authUsers?.users
      .filter(user => userIds.includes(user.id))
      .map(user => user.email)
      .filter(Boolean) as string[];

    if (!emailRecipients || emailRecipients.length === 0) {
      console.log("No recipients found for campaign milestone");
      return new Response(
        JSON.stringify({ message: "No recipients" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate email content based on milestone type
    let subject = "";
    let heading = "";
    let message = "";

    const percentageRaised = campaign.goal_amount > 0 
      ? Math.round((campaign.amount_raised / campaign.goal_amount) * 100) 
      : 0;

    switch (milestoneType) {
      case "goal_reached":
        subject = `🎉 ${campaign.name} has reached its fundraising goal!`;
        heading = "Congratulations! Goal Reached! 🎉";
        message = `
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Great news! The campaign <strong>${campaign.name}</strong> has successfully reached its fundraising goal of 
            <strong>$${(campaign.goal_amount / 100).toFixed(2)}</strong>!
          </p>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Thanks to the generous support from your community, you've raised 
            <strong>$${(campaign.amount_raised / 100).toFixed(2)}</strong> to support ${group?.group_name || "your organization"}.
          </p>
        `;
        break;
      case "halfway":
        subject = `${campaign.name} is halfway to its goal!`;
        heading = "Halfway There! 🎯";
        message = `
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            The campaign <strong>${campaign.name}</strong> has reached <strong>${percentageRaised}%</strong> of its fundraising goal!
          </p>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            So far, you've raised <strong>$${(campaign.amount_raised / 100).toFixed(2)}</strong> toward your goal of 
            <strong>$${(campaign.goal_amount / 100).toFixed(2)}</strong>.
          </p>
        `;
        break;
      case "launched":
        subject = `${campaign.name} is now live!`;
        heading = "Campaign Launched! 🚀";
        message = `
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            The campaign <strong>${campaign.name}</strong> has been published and is now live on Sponsorly!
          </p>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Start sharing your campaign with supporters to reach your goal of 
            <strong>$${(campaign.goal_amount / 100).toFixed(2)}</strong>.
          </p>
        `;
        break;
    }

    console.log(`Sending ${milestoneType} milestone emails to ${emailRecipients.length} recipients`);

    // Send emails to all recipients
    const emailPromises = emailRecipients.map(email =>
      resend.emails.send({
        from: "Sponsorly <onboarding@resend.dev>",
        to: [email],
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">${heading}</h1>
            
            ${message}
            
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #333; font-size: 16px; margin-top: 0;">Campaign Progress</h3>
              <div style="background-color: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden; margin: 10px 0;">
                <div style="background: linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%); height: 100%; width: ${Math.min(percentageRaised, 100)}%;"></div>
              </div>
              <p style="color: #666; font-size: 14px; margin: 5px 0;">
                <strong>$${(campaign.amount_raised / 100).toFixed(2)}</strong> raised of 
                <strong>$${(campaign.goal_amount / 100).toFixed(2)}</strong> goal (${percentageRaised}%)
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovableproject.com') || 'http://localhost:5173'}/dashboard/campaigns" 
                 style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
                View Campaign Dashboard
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            
            <p style="color: #888; font-size: 12px;">
              © ${new Date().getFullYear()} Sponsorly. All rights reserved.
            </p>
          </div>
        `,
      })
    );

    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter(r => r.status === "fulfilled").length;

    console.log(`Milestone emails sent: ${successCount}/${emailRecipients.length} successful`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent: successCount,
        totalRecipients: emailRecipients.length 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending campaign milestone email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
