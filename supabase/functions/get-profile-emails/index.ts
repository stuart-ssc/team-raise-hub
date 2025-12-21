import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileIds } = await req.json();

    if (!profileIds || !Array.isArray(profileIds) || profileIds.length === 0) {
      return new Response(
        JSON.stringify({ emails: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Looking up emails for ${profileIds.length} profile IDs`);

    // Create admin client to access auth.users
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get emails from auth.users for the given profile IDs
    // Profile IDs are the same as auth.users IDs
    const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });

    if (error) {
      console.error("Error fetching auth users:", error);
      throw error;
    }

    // Filter to only the requested profile IDs
    const emails = authUsers.users
      .filter(user => profileIds.includes(user.id))
      .map(user => user.email)
      .filter((email): email is string => !!email);

    console.log(`Found ${emails.length} emails for ${profileIds.length} profile IDs`);

    return new Response(
      JSON.stringify({ emails }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in get-profile-emails:", error);
    return new Response(
      JSON.stringify({ error: error.message, emails: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
