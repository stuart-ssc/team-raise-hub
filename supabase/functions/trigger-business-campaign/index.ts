import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TriggerRequest {
  businessId: string;
  campaignId: string;
  queueItemId?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { businessId, campaignId, queueItemId }: TriggerRequest = await req.json();

    console.log(`Manual enrollment request - Business: ${businessId}, Campaign: ${campaignId}`);

    // Verify user has permission
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Verify campaign exists and belongs to user's organization
    const { data: campaign, error: campaignError } = await supabaseClient
      .from("business_nurture_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error("Campaign not found");
    }

    // Verify user belongs to organization
    const { data: orgUser, error: orgError } = await supabaseClient
      .from("organization_user")
      .select("*")
      .eq("user_id", user.id)
      .eq("organization_id", campaign.organization_id)
      .single();

    if (orgError || !orgUser) {
      throw new Error("User does not belong to this organization");
    }

    // Check if business is already enrolled
    const { data: existingEnrollment } = await supabaseClient
      .from("business_nurture_enrollments")
      .select("id, status")
      .eq("business_id", businessId)
      .eq("campaign_id", campaignId)
      .single();

    if (existingEnrollment) {
      if (existingEnrollment.status === "active") {
        throw new Error("Business is already enrolled in this campaign");
      }
      
      // Re-activate if previously paused or cancelled
      const { data: firstSequence } = await supabaseClient
        .from("business_nurture_sequences")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("sequence_order", { ascending: true })
        .limit(1)
        .single();

      if (firstSequence) {
        const nextSendAt = new Date();
        nextSendAt.setDate(nextSendAt.getDate() + firstSequence.send_delay_days);

        const { error: updateError } = await supabaseClient
          .from("business_nurture_enrollments")
          .update({
            status: "active",
            current_sequence_id: firstSequence.id,
            next_send_at: nextSendAt.toISOString(),
            enrolled_at: new Date().toISOString(),
          })
          .eq("id", existingEnrollment.id);

        if (updateError) {
          throw new Error(`Error re-activating enrollment: ${updateError.message}`);
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: "Business re-enrolled in campaign",
            enrollmentId: existingEnrollment.id,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Get first sequence of the campaign
    const { data: firstSequence, error: sequenceError } = await supabaseClient
      .from("business_nurture_sequences")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("sequence_order", { ascending: true })
      .limit(1)
      .single();

    if (sequenceError || !firstSequence) {
      throw new Error("No sequences found for this campaign");
    }

    // Calculate next send time based on delay
    const nextSendAt = new Date();
    nextSendAt.setDate(nextSendAt.getDate() + firstSequence.send_delay_days);

    // Create enrollment
    const { data: enrollment, error: enrollError } = await supabaseClient
      .from("business_nurture_enrollments")
      .insert({
        business_id: businessId,
        campaign_id: campaignId,
        queue_item_id: queueItemId,
        current_sequence_id: firstSequence.id,
        status: "active",
        enrolled_at: new Date().toISOString(),
        next_send_at: nextSendAt.toISOString(),
      })
      .select()
      .single();

    if (enrollError) {
      throw new Error(`Error creating enrollment: ${enrollError.message}`);
    }

    console.log(`Business ${businessId} successfully enrolled in campaign ${campaignId}`);

    // Log activity
    await supabaseClient
      .from("business_activity_log")
      .insert({
        business_id: businessId,
        activity_type: "campaign_enrolled",
        activity_data: {
          campaign_id: campaignId,
          campaign_name: campaign.name,
          enrolled_by: user.id,
          enrolled_at: new Date().toISOString(),
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Business successfully enrolled in campaign",
        enrollmentId: enrollment.id,
        nextSendAt: nextSendAt.toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in trigger-business-campaign function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
