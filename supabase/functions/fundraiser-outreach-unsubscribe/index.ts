import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return json({ error: "Missing token" }, 400);
    }
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Find the send by unsubscribe_token, then unsubscribe its enrollment
    const { data: send } = await admin
      .from("fundraiser_outreach_sends")
      .select("id, enrollment_id")
      .eq("unsubscribe_token", token)
      .maybeSingle();

    if (!send) {
      return json({ error: "Invalid or expired token" }, 404);
    }

    // Mark enrollment unsubscribed
    await admin
      .from("fundraiser_outreach_enrollments")
      .update({ status: "unsubscribed", completion_reason: "unsubscribed" })
      .eq("id", send.enrollment_id);

    // Cancel any scheduled sends for this enrollment
    await admin
      .from("fundraiser_outreach_sends")
      .delete()
      .eq("enrollment_id", send.enrollment_id)
      .eq("status", "scheduled");

    return json({
      success: true,
      message: "You have been unsubscribed from this fundraiser. You will not receive further emails about it.",
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Internal error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
