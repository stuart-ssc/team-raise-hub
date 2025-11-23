import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BulkTagRequest {
  donorIds: string[];
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

    const { donorIds, tags }: BulkTagRequest = await req.json();

    if (!donorIds || !Array.isArray(donorIds) || donorIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid donor IDs" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid tags" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Adding ${tags.length} tags to ${donorIds.length} donors`);

    let updated = 0;

    // Process each donor
    for (const donorId of donorIds) {
      // Get current donor
      const { data: donor, error: fetchError } = await supabase
        .from("donor_profiles")
        .select("tags")
        .eq("id", donorId)
        .single();

      if (fetchError || !donor) {
        console.error(`Error fetching donor ${donorId}:`, fetchError);
        continue;
      }

      // Merge existing tags with new tags (avoid duplicates)
      const existingTags = donor.tags || [];
      const uniqueTags = Array.from(new Set([...existingTags, ...tags]));

      // Update donor with new tags
      const { error: updateError } = await supabase
        .from("donor_profiles")
        .update({
          tags: uniqueTags,
          updated_at: new Date().toISOString(),
        })
        .eq("id", donorId);

      if (updateError) {
        console.error(`Error updating donor ${donorId}:`, updateError);
        continue;
      }

      updated++;
    }

    console.log(`Successfully updated ${updated} donors with tags`);

    return new Response(
      JSON.stringify({
        success: true,
        updated,
        total: donorIds.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in bulk-tag-donors function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
