import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BulkTagRequest {
  businessIds: string[];
  tags: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { businessIds, tags }: BulkTagRequest = await req.json();

    if (!businessIds || !Array.isArray(businessIds) || businessIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid business IDs" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid tags" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Adding ${tags.length} tags to ${businessIds.length} businesses`);

    let updated = 0;

    // Process each business
    for (const businessId of businessIds) {
      // Get current business
      const { data: business, error: fetchError } = await supabase
        .from("businesses")
        .select("tags")
        .eq("id", businessId)
        .single();

      if (fetchError || !business) {
        console.error(`Error fetching business ${businessId}:`, fetchError);
        continue;
      }

      // Merge existing tags with new tags (avoid duplicates)
      const existingTags = business.tags || [];
      const uniqueTags = Array.from(new Set([...existingTags, ...tags]));

      // Update business with new tags
      const { error: updateError } = await supabase
        .from("businesses")
        .update({
          tags: uniqueTags,
          updated_at: new Date().toISOString(),
        })
        .eq("id", businessId);

      if (updateError) {
        console.error(`Error updating business ${businessId}:`, updateError);
        continue;
      }

      updated++;
    }

    console.log(`Successfully updated ${updated} businesses with tags`);

    return new Response(
      JSON.stringify({
        success: true,
        updated,
        total: businessIds.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in bulk-tag-businesses function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
