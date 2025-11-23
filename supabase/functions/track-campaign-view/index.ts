import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrackViewRequest {
  campaignId: string;
  donorEmail?: string;
  referrer?: string;
  userAgent?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { campaignId, donorEmail, referrer, userAgent }: TrackViewRequest = await req.json();

    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: "Campaign ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify campaign exists
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("id, name")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({ error: "Campaign not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Track the view (only if we have an email, otherwise it's anonymous)
    if (donorEmail) {
      const { error: insertError } = await supabase
        .from("campaign_views")
        .insert({
          campaign_id: campaignId,
          donor_email: donorEmail,
          referrer: referrer || null,
          user_agent: userAgent || req.headers.get("user-agent") || null,
        });

      if (insertError) {
        console.error("Error tracking campaign view:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to track view" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Campaign view tracked successfully"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in track-campaign-view function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
