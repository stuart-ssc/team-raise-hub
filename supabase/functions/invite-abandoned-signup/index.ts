import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify caller is a system admin
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("system_admin")
      .eq("id", userData.user.id)
      .single();
    if (!profile?.system_admin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { attemptId } = await req.json();
    if (!attemptId) {
      return new Response(JSON.stringify({ error: "attemptId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: attempt, error: aErr } = await supabaseAdmin
      .from("signup_attempts")
      .select("id, email, first_name, last_name")
      .eq("id", attemptId)
      .single();

    if (aErr || !attempt) {
      return new Response(JSON.stringify({ error: "Attempt not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const email = attempt.email.trim().toLowerCase();
    const redirectTo = "https://sponsorly.io/set-password";

    // Check if user already exists
    const { data: list } = await supabaseAdmin.auth.admin.listUsers();
    const existing = list?.users?.find((u) => u.email?.toLowerCase() === email);

    let result: any;
    if (existing) {
      // Send a password recovery / magic link instead
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo },
      });
      if (error) throw error;
      result = { mode: "recovery", actionLink: data?.properties?.action_link };
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: {
          first_name: attempt.first_name ?? undefined,
          last_name: attempt.last_name ?? undefined,
        },
      });
      if (error) throw error;
      result = { mode: "invite", userId: data?.user?.id };
    }

    await supabaseAdmin
      .from("signup_attempts")
      .update({
        invite_sent_at: new Date().toISOString(),
        invite_sent_by: userData.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", attempt.id);

    return new Response(JSON.stringify({ success: true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("invite-abandoned-signup error:", err);
    return new Response(JSON.stringify({ error: err?.message ?? "unknown" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
