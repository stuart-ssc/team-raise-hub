import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RosterMember {
  firstName: string;
  lastName: string;
  email: string;
  userTypeId?: string | null;
}

interface BulkInviteRequest {
  organizationId: string;
  groupId: string | null;
  rosterId: number | null;
  defaultUserTypeId: string;
  sendInvites: boolean; // false = save only
  members: RosterMember[];
}

interface RowResult {
  email: string;
  status: "created" | "reactivated" | "exists" | "skipped" | "error";
  invited: boolean;
  error?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Identify caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: u, error: uErr } = await supabaseAdmin.auth.getUser(token);
    if (uErr || !u?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const inviterUserId = u.user.id;

    const body: BulkInviteRequest = await req.json();
    if (!body.organizationId || !body.defaultUserTypeId || !Array.isArray(body.members)) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verify caller can manage this organization
    const { data: callerOrgUser, error: orgUserErr } = await supabaseAdmin
      .from("organization_user")
      .select("id, user_type:user_type_id(permission_level)")
      .eq("user_id", inviterUserId)
      .eq("organization_id", body.organizationId)
      .eq("active_user", true)
      .limit(1)
      .maybeSingle();

    const allowedLevels = ["organization_admin", "program_manager"];
    const callerLevel = (callerOrgUser as any)?.user_type?.permission_level;
    if (orgUserErr || !callerOrgUser || !allowedLevels.includes(callerLevel)) {
      // Allow system admins through
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("system_admin")
        .eq("id", inviterUserId)
        .maybeSingle();
      if (!prof?.system_admin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Pre-fetch all auth users once (Supabase listUsers is paged but for our scale this is fine)
    const { data: usersList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const usersByEmail = new Map<string, string>();
    for (const usr of usersList?.users ?? []) {
      if (usr.email) usersByEmail.set(usr.email.toLowerCase(), usr.id);
    }

    const results: RowResult[] = [];

    for (const m of body.members) {
      const email = (m.email || "").trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        results.push({ email: m.email || "", status: "skipped", invited: false, error: "Invalid email" });
        continue;
      }
      const firstName = (m.firstName || "").trim();
      const lastName = (m.lastName || "").trim();
      const userTypeId = m.userTypeId || body.defaultUserTypeId;

      try {
        // 1) find or create auth user
        let userId = usersByEmail.get(email);
        let didCreate = false;
        if (!userId) {
          const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: false,
            user_metadata: { first_name: firstName, last_name: lastName },
          });
          if (cErr || !created?.user) {
            results.push({ email, status: "error", invited: false, error: cErr?.message || "Failed to create user" });
            continue;
          }
          userId = created.user.id;
          usersByEmail.set(email, userId);
          didCreate = true;
        }

        // 2) upsert organization_user row
        const { data: existing } = await supabaseAdmin
          .from("organization_user")
          .select("id, active_user")
          .eq("user_id", userId)
          .eq("organization_id", body.organizationId)
          .eq("group_id", body.groupId ?? null)
          .maybeSingle();

        let rowStatus: RowResult["status"] = didCreate ? "created" : "exists";
        if (existing) {
          if (!existing.active_user) {
            await supabaseAdmin
              .from("organization_user")
              .update({
                user_type_id: userTypeId,
                roster_id: body.rosterId,
                active_user: true,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existing.id);
            rowStatus = "reactivated";
          }
        } else {
          const { error: insErr } = await supabaseAdmin.from("organization_user").insert({
            user_id: userId,
            user_type_id: userTypeId,
            organization_id: body.organizationId,
            group_id: body.groupId,
            roster_id: body.rosterId,
          });
          if (insErr) {
            results.push({ email, status: "error", invited: false, error: insErr.message });
            continue;
          }
        }

        // 3) optionally send invite
        let invited = false;
        if (body.sendInvites) {
          try {
            const inviteRes = await fetch(
              `${Deno.env.get("SUPABASE_URL")}/functions/v1/invite-user`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  email,
                  firstName,
                  lastName,
                  userTypeId,
                  organizationId: body.organizationId,
                  groupId: body.groupId,
                  rosterId: body.rosterId,
                  linkedOrganizationUserId: null,
                }),
              },
            );
            invited = inviteRes.ok;
            if (!inviteRes.ok) {
              const txt = await inviteRes.text();
              results.push({ email, status: rowStatus, invited: false, error: `Invite failed: ${txt.slice(0, 200)}` });
              continue;
            }
          } catch (inviteErr: any) {
            results.push({ email, status: rowStatus, invited: false, error: `Invite threw: ${inviteErr?.message}` });
            continue;
          }
        }

        results.push({ email, status: rowStatus, invited });
      } catch (rowErr: any) {
        results.push({ email, status: "error", invited: false, error: rowErr?.message ?? "Unknown error" });
      }
    }

    const summary = {
      total: results.length,
      created: results.filter(r => r.status === "created").length,
      reactivated: results.filter(r => r.status === "reactivated").length,
      existed: results.filter(r => r.status === "exists").length,
      skipped: results.filter(r => r.status === "skipped").length,
      errors: results.filter(r => r.status === "error").length,
      invited: results.filter(r => r.invited).length,
    };

    return new Response(JSON.stringify({ summary, results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("bulk-invite-roster error:", err);
    try {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-admin-alert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          functionName: "bulk-invite-roster",
          errorMessage: err?.message ?? "Unknown",
          severity: "high",
          context: { stack: err?.stack },
        }),
      });
    } catch (_) { /* swallow */ }
    return new Response(JSON.stringify({ error: err?.message ?? "Unknown" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});