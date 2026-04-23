import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { computeOutreachSchedule } from "../_shared/fundraiser-outreach-schedule.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EnrollRequest {
  campaignId: string;
  donorIds?: string[];
  listId?: string;
}

interface EnrollResponse {
  enrolled: number;
  skippedSuppressed: number;
  skippedNoEmail: number;
  skippedAlreadyDonated: number;
  reactivated: number;
  totalScheduled: number;
  scheduleSummary: { stage: string; count: number }[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonError("Missing authorization header", 401);
    }

    // Caller-scoped client to validate the user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !user) return jsonError("Unauthorized", 401);

    // Service-role client for cross-table writes (bypasses RLS)
    const admin = createClient(supabaseUrl, supabaseServiceKey);

    const body: EnrollRequest = await req.json();
    if (!body.campaignId) return jsonError("campaignId is required", 400);
    if ((!body.donorIds || body.donorIds.length === 0) && !body.listId) {
      return jsonError("Provide donorIds or listId", 400);
    }

    // 1. Fetch campaign and verify it's published with a future end date
    const { data: campaign, error: campErr } = await admin
      .from("campaigns")
      .select("id, name, slug, end_date, image_url, group_id, publication_status, enable_roster_attribution, deleted_at")
      .eq("id", body.campaignId)
      .maybeSingle();
    if (campErr || !campaign) return jsonError("Campaign not found", 404);
    if (campaign.deleted_at) return jsonError("Campaign is deleted", 400);
    if (campaign.publication_status !== "published") {
      return jsonError("Campaign is not published", 400);
    }
    if (!campaign.end_date) return jsonError("Campaign has no end date", 400);
    const endDate = new Date(campaign.end_date);
    const now = new Date();
    if (endDate.getTime() <= now.getTime()) {
      return jsonError("Campaign has already ended", 400);
    }

    // 2. Find the sender's organization_user record (used for permission + roster fallback)
    // Look up the org_user the sender holds for this campaign's organization.
    // We resolve the org via the group → organization relationship.
    let organizationId: string | null = null;
    if (campaign.group_id) {
      const { data: groupRow } = await admin
        .from("groups")
        .select("organization_id")
        .eq("id", campaign.group_id)
        .maybeSingle();
      if (groupRow) organizationId = groupRow.organization_id as string | null;
    }
    if (!organizationId) return jsonError("Could not resolve organization for campaign", 400);

    const { data: senderOrgUser } = await admin
      .from("organization_user")
      .select("id, user_type:user_type_id(permission_level)")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .eq("active_user", true)
      .maybeSingle();
    if (!senderOrgUser) return jsonError("You don't have access to this organization", 403);

    // 3. Resolve recipient donor list
    let donorIds: string[] = [];
    if (body.listId) {
      const { data: members, error: memErr } = await admin
        .from("donor_list_members")
        .select("donor_id")
        .eq("list_id", body.listId);
      if (memErr) return jsonError("Failed to load list members", 500);
      donorIds = (members || []).map((m: any) => m.donor_id);
    } else {
      donorIds = body.donorIds || [];
    }
    if (donorIds.length === 0) {
      return jsonOk({ enrolled: 0, skippedSuppressed: 0, skippedNoEmail: 0, skippedAlreadyDonated: 0, reactivated: 0, totalScheduled: 0, scheduleSummary: [] });
    }

    // 4. Fetch donor profiles (filter to org)
    const { data: donors, error: donorsErr } = await admin
      .from("donor_profiles")
      .select("id, email, first_name, last_name, added_by_organization_user_id")
      .in("id", donorIds)
      .eq("organization_id", organizationId);
    if (donorsErr) return jsonError("Failed to load donors", 500);

    let skippedNoEmail = 0;
    let skippedSuppressed = 0;
    let skippedAlreadyDonated = 0;

    const validDonors = (donors || []).filter((d: any) => {
      if (!d.email) { skippedNoEmail++; return false; }
      return true;
    });

    // 5. Filter suppressed
    const emails = validDonors.map((d: any) => d.email.toLowerCase());
    let suppressedSet = new Set<string>();
    if (emails.length > 0) {
      const { data: suppressed } = await admin
        .from("suppressed_emails")
        .select("email")
        .in("email", emails);
      suppressedSet = new Set((suppressed || []).map((s: any) => String(s.email).toLowerCase()));
    }

    // 6. Filter donors who have already donated to this campaign
    const remainingIds = validDonors
      .filter((d: any) => !suppressedSet.has(String(d.email).toLowerCase()))
      .map((d: any) => d.id);
    let alreadyDonated = new Set<string>();
    if (remainingIds.length > 0) {
      const { data: existingOrders } = await admin
        .from("orders")
        .select("donor_id")
        .eq("campaign_id", body.campaignId)
        .eq("status", "completed")
        .in("donor_id", remainingIds);
      alreadyDonated = new Set((existingOrders || []).map((o: any) => o.donor_id as string));
    }
    skippedSuppressed = validDonors.filter((d: any) => suppressedSet.has(String(d.email).toLowerCase())).length;
    skippedAlreadyDonated = alreadyDonated.size;

    const enrollableDonors = validDonors.filter(
      (d: any) =>
        !suppressedSet.has(String(d.email).toLowerCase()) &&
        !alreadyDonated.has(d.id),
    );

    // 7. Compute schedule once (same for everyone — based on campaign end date)
    const schedule = computeOutreachSchedule(endDate, now);
    if (schedule.length === 0) {
      return jsonError("Cannot schedule: campaign ends too soon", 400);
    }

    // 8. For each donor: resolve student/roster owner, upsert enrollment, insert sends
    let enrolled = 0;
    let reactivated = 0;
    let totalScheduled = 0;

    for (const donor of enrollableDonors) {
      // Resolve roster member from prior orders for this campaign
      let rosterMemberId: string | null = null;
      let rosterSlug: string | null = null;
      let studentOrgUserId: string | null = null;

      if (campaign.enable_roster_attribution) {
        // Step 1: most recent order with roster_member_id for this donor on this campaign
        const { data: lastOrder } = await admin
          .from("orders")
          .select("roster_member_id, created_at")
          .eq("donor_id", donor.id)
          .eq("campaign_id", body.campaignId)
          .not("roster_member_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (lastOrder?.roster_member_id) {
          rosterMemberId = lastOrder.roster_member_id as string;
        }

        // Step 2: donor was added by a participant
        if (!rosterMemberId && donor.added_by_organization_user_id) {
          const { data: ouRow } = await admin
            .from("organization_user")
            .select("id, user_type:user_type_id(permission_level)")
            .eq("id", donor.added_by_organization_user_id)
            .maybeSingle();
          if (ouRow && (ouRow as any).user_type?.permission_level === "participant") {
            rosterMemberId = ouRow.id as string;
          }
        }

        // Step 3: sender themselves is a participant
        if (!rosterMemberId && (senderOrgUser as any).user_type?.permission_level === "participant") {
          rosterMemberId = senderOrgUser.id as string;
        }

        // Look up the slug for the resolved roster member on this campaign
        if (rosterMemberId) {
          const { data: link } = await admin
            .from("roster_member_campaign_links")
            .select("slug")
            .eq("campaign_id", body.campaignId)
            .eq("roster_member_id", rosterMemberId)
            .maybeSingle();
          if (link) rosterSlug = (link as any).slug as string;
          studentOrgUserId = rosterMemberId;
        }
      }

      // Upsert enrollment
      const { data: existing } = await admin
        .from("fundraiser_outreach_enrollments")
        .select("id, status")
        .eq("campaign_id", body.campaignId)
        .eq("donor_id", donor.id)
        .maybeSingle();

      let enrollmentId: string;
      if (existing) {
        // Reactivate
        const { error: updErr } = await admin
          .from("fundraiser_outreach_enrollments")
          .update({
            status: "active",
            completion_reason: null,
            enrolled_by_user_id: user.id,
            enrolled_by_organization_user_id: senderOrgUser.id,
            student_organization_user_id: studentOrgUserId,
            roster_member_id: rosterMemberId,
            roster_member_slug: rosterSlug,
          })
          .eq("id", existing.id);
        if (updErr) {
          console.error("Failed to reactivate enrollment", updErr);
          continue;
        }
        // Cancel any leftover scheduled sends so we don't double-schedule
        await admin
          .from("fundraiser_outreach_sends")
          .delete()
          .eq("enrollment_id", existing.id)
          .eq("status", "scheduled");
        enrollmentId = existing.id;
        reactivated++;
      } else {
        const { data: inserted, error: insErr } = await admin
          .from("fundraiser_outreach_enrollments")
          .insert({
            organization_id: organizationId,
            campaign_id: body.campaignId,
            donor_id: donor.id,
            enrolled_by_user_id: user.id,
            enrolled_by_organization_user_id: senderOrgUser.id,
            student_organization_user_id: studentOrgUserId,
            roster_member_id: rosterMemberId,
            roster_member_slug: rosterSlug,
            status: "active",
          })
          .select("id")
          .single();
        if (insErr || !inserted) {
          console.error("Failed to insert enrollment", insErr);
          continue;
        }
        enrollmentId = inserted.id;
        enrolled++;
      }

      // Insert scheduled sends
      const sendRows = schedule.map((s) => ({
        enrollment_id: enrollmentId,
        stage: s.stage,
        scheduled_send_at: s.sendAt,
        status: "scheduled" as const,
      }));
      const { error: sendsErr } = await admin
        .from("fundraiser_outreach_sends")
        .insert(sendRows);
      if (sendsErr) {
        console.error("Failed to insert sends", sendsErr);
        continue;
      }
      totalScheduled += sendRows.length;
    }

    // 9. Trigger immediate dispatcher run so the intro email fires now
    try {
      await admin.functions.invoke("dispatch-fundraiser-outreach", { body: {} });
    } catch (e) {
      console.error("Failed to trigger dispatcher", e);
    }

    const summary: Record<string, number> = {};
    for (const s of schedule) summary[s.stage] = (summary[s.stage] || 0) + 1;
    const scheduleSummary = Object.entries(summary).map(([stage, count]) => ({ stage, count }));

    const resp: EnrollResponse = {
      enrolled,
      reactivated,
      skippedSuppressed,
      skippedNoEmail,
      skippedAlreadyDonated,
      totalScheduled,
      scheduleSummary,
    };
    return jsonOk(resp);
  } catch (err) {
    console.error("enroll-fundraiser-outreach error:", err);
    return jsonError(err instanceof Error ? err.message : "Internal error", 500);
  }
});

function jsonOk(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}