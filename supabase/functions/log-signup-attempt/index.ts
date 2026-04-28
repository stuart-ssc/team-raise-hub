import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LogBody {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  userAgent?: string;
  referrer?: string;
  utm?: Record<string, string | undefined>;
  errorMessage?: string;
  completed?: boolean;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body: LogBody = await req.json();
    if (!body.email || typeof body.email !== "string") {
      return new Response(JSON.stringify({ error: "email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const email = body.email.trim().toLowerCase();

    if (body.id) {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.completed) patch.completed_at = new Date().toISOString();
      if (body.errorMessage) patch.error_message = body.errorMessage.slice(0, 500);

      const { error } = await supabaseAdmin
        .from("signup_attempts")
        .update(patch)
        .eq("id", body.id);

      if (error) {
        console.error("update signup_attempt failed:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      return new Response(JSON.stringify({ id: body.id }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const insert = {
      email,
      first_name: body.firstName?.slice(0, 120) ?? null,
      last_name: body.lastName?.slice(0, 120) ?? null,
      user_agent: body.userAgent?.slice(0, 500) ?? null,
      referrer: body.referrer?.slice(0, 500) ?? null,
      utm_source: body.utm?.utm_source ?? null,
      utm_medium: body.utm?.utm_medium ?? null,
      utm_campaign: body.utm?.utm_campaign ?? null,
      utm_term: body.utm?.utm_term ?? null,
      utm_content: body.utm?.utm_content ?? null,
    };

    const { data, error } = await supabaseAdmin
      .from("signup_attempts")
      .insert(insert)
      .select("id")
      .single();

    if (error) {
      console.error("insert signup_attempt failed:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ id: data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("log-signup-attempt error:", err);
    return new Response(JSON.stringify({ error: err?.message ?? "unknown" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
