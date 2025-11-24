import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";

// Import email templates
import { PartnershipAppreciationEmail } from "./_templates/partnership-appreciation.tsx";
import { PartnershipCheckInEmail } from "./_templates/partnership-check-in.tsx";
import { ReEngagementEmail } from "./_templates/re-engagement.tsx";
import { UrgentReactivationEmail } from "./_templates/urgent-reactivation.tsx";
import { ExpansionOpportunityEmail } from "./_templates/expansion-opportunity.tsx";
import { StakeholderCultivationEmail } from "./_templates/stakeholder-cultivation.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  businessId: string;
  templateKey: string;
  subjectLine: string;
  campaignId?: string;
  enrollmentId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { businessId, templateKey, subjectLine, campaignId, enrollmentId }: EmailRequest = await req.json();

    console.log(`Sending business outreach email - Business: ${businessId}, Template: ${templateKey}`);

    // Fetch business data
    const { data: business, error: businessError } = await supabaseClient
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .single();

    if (businessError || !business) {
      throw new Error(`Business not found: ${businessError?.message}`);
    }

    // Fetch linked donors (contacts)
    const { data: linkedDonors, error: donorsError } = await supabaseClient
      .from("business_donors")
      .select(`
        *,
        donor:donor_profiles(*)
      `)
      .eq("business_id", businessId)
      .is("blocked_at", null)
      .order("is_primary_contact", { ascending: false });

    if (donorsError) {
      console.error("Error fetching donors:", donorsError);
    }

    // Get primary contact or first contact
    const primaryContact = linkedDonors?.find(ld => ld.is_primary_contact)?.donor || linkedDonors?.[0]?.donor;
    
    if (!primaryContact || !primaryContact.email) {
      throw new Error("No valid contact email found for business");
    }

    // Fetch organization data
    const { data: orgBusiness } = await supabaseClient
      .from("organization_businesses")
      .select("organization:organizations(*)")
      .eq("business_id", businessId)
      .single();

    const organization = orgBusiness?.organization;

    // Calculate metrics
    const donorCount = linkedDonors?.length || 0;
    const partnershipValue = `$${((business.total_partnership_value || 0) / 100).toLocaleString()}`;
    
    // Calculate days since activity
    let daysSinceActivity = 0;
    if (business.last_donor_activity_date) {
      const lastActivity = new Date(business.last_donor_activity_date);
      const now = new Date();
      daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    }

    const lastActivityDate = business.last_donor_activity_date 
      ? new Date(business.last_donor_activity_date).toLocaleDateString()
      : "N/A";

    // Prepare template data
    const templateData = {
      businessName: business.business_name,
      contactFirstName: primaryContact.first_name || "there",
      contactLastName: primaryContact.last_name || "",
      contactRole: linkedDonors?.find(ld => ld.donor.id === primaryContact.id)?.role,
      partnershipValue,
      donorCount,
      lastActivityDate,
      daysSinceActivity,
      healthStatus: business.engagement_segment || "unknown",
      organizationName: organization?.name || "our organization",
      primaryContactName: organization?.name ? undefined : "The Team",
    };

    // Select and render the appropriate template
    let emailHtml: string;
    
    switch (templateKey) {
      case "partnership-appreciation":
        emailHtml = await renderAsync(
          React.createElement(PartnershipAppreciationEmail, templateData)
        );
        break;
      case "partnership-check-in":
        emailHtml = await renderAsync(
          React.createElement(PartnershipCheckInEmail, templateData)
        );
        break;
      case "re-engagement":
        emailHtml = await renderAsync(
          React.createElement(ReEngagementEmail, templateData)
        );
        break;
      case "urgent-reactivation":
        emailHtml = await renderAsync(
          React.createElement(UrgentReactivationEmail, templateData)
        );
        break;
      case "expansion-opportunity":
        emailHtml = await renderAsync(
          React.createElement(ExpansionOpportunityEmail, templateData)
        );
        break;
      case "stakeholder-cultivation":
        emailHtml = await renderAsync(
          React.createElement(StakeholderCultivationEmail, templateData)
        );
        break;
      default:
        throw new Error(`Unknown template key: ${templateKey}`);
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: `${organization?.name || "Sponsorly"} <partnerships@resend.dev>`,
      to: [primaryContact.email],
      subject: subjectLine,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log to email_delivery_log
    const { error: logError } = await supabaseClient
      .from("email_delivery_log")
      .insert({
        email_type: "business_outreach_automated",
        recipient_email: primaryContact.email,
        recipient_name: `${primaryContact.first_name || ""} ${primaryContact.last_name || ""}`.trim(),
        status: "sent",
        sent_at: new Date().toISOString(),
        resend_email_id: emailResponse.data?.id,
        metadata: {
          business_id: businessId,
          template_key: templateKey,
          campaign_id: campaignId,
          enrollment_id: enrollmentId,
          subject: subjectLine,
        },
      });

    if (logError) {
      console.error("Error logging email delivery:", logError);
    }

    // Log to business_activity_log
    const { error: activityError } = await supabaseClient
      .from("business_activity_log")
      .insert({
        business_id: businessId,
        activity_type: "automated_email_sent",
        activity_data: {
          template_key: templateKey,
          subject_line: subjectLine,
          recipient: primaryContact.email,
          campaign_id: campaignId,
          enrollment_id: enrollmentId,
          sent_at: new Date().toISOString(),
        },
      });

    if (activityError) {
      console.error("Error logging business activity:", activityError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id,
        recipient: primaryContact.email 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-business-outreach-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
