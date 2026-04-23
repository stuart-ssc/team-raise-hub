import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";
import {
  buildSubject,
  renderOutreachHtml,
  type DripStage,
  type OutreachOwner,
} from "../_shared/fundraiser-outreach-template.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 25;
const BATCH_DELAY_MS = 1100;
const MAX_PER_RUN = 200;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY")!;
    const appUrl = Deno.env.get("APP_URL") || "https://sponsorly.io";

    const admin = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendKey);

    // 1. Pull due, scheduled sends
    const { data: dueSends, error: dueErr } = await admin
      .from("fundraiser_outreach_sends")
      .select("id, enrollment_id, stage, scheduled_send_at, unsubscribe_token")
      .eq("status", "scheduled")
      .lte("scheduled_send_at", new Date().toISOString())
      .order("scheduled_send_at", { ascending: true })
      .limit(MAX_PER_RUN);
    if (dueErr) {
      console.error("Failed to query due sends", dueErr);
      return jsonError("Failed to query queue", 500);
    }

    if (!dueSends || dueSends.length === 0) {
      return jsonOk({ processed: 0, sent: 0, skipped: 0, failed: 0 });
    }

    let processed = 0;
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    // Process in batches
    for (let i = 0; i < dueSends.length; i += BATCH_SIZE) {
      const batch = dueSends.slice(i, i + BATCH_SIZE);
      for (const send of batch) {
        processed++;
        const result = await processSend(admin, resend, send as any, appUrl);
        if (result === "sent") sent++;
        else if (result === "skipped") skipped++;
        else failed++;
      }
      if (i + BATCH_SIZE < dueSends.length) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
      }
    }

    return jsonOk({ processed, sent, skipped, failed });
  } catch (err) {
    console.error("dispatch-fundraiser-outreach error:", err);
    return jsonError(err instanceof Error ? err.message : "Internal error", 500);
  }
});

async function processSend(
  admin: any,
  resend: any,
  send: { id: string; enrollment_id: string; stage: DripStage; unsubscribe_token: string },
  appUrl: string,
): Promise<"sent" | "skipped" | "failed"> {
  // 1. Load the enrollment + campaign + donor + org
  const { data: enrollment, error: enrErr } = await admin
    .from("fundraiser_outreach_enrollments")
    .select(`
      id, status, organization_id, campaign_id, donor_id,
      student_organization_user_id, roster_member_id, roster_member_slug,
      campaigns:campaign_id (
        id, name, slug, end_date, image_url, group_id,
        publication_status, deleted_at, enable_roster_attribution
      ),
      donor_profiles:donor_id ( id, email, first_name, last_name ),
      organizations:organization_id (
        id, name, logo_url, address_line1, city, state, zip
      )
    `)
    .eq("id", send.enrollment_id)
    .maybeSingle();
  if (enrErr || !enrollment) {
    await markSend(admin, send.id, "skipped", "enrollment_missing");
    return "skipped";
  }

  // Auto-stop: enrollment no longer active
  if (enrollment.status !== "active") {
    await markSend(admin, send.id, "skipped", `enrollment_${enrollment.status}`);
    return "skipped";
  }

  const campaign = (enrollment as any).campaigns;
  const donor = (enrollment as any).donor_profiles;
  const org = (enrollment as any).organizations;

  if (!campaign || !donor || !org) {
    await markSend(admin, send.id, "skipped", "data_missing");
    return "skipped";
  }

  // Auto-stop: campaign ended or unpublished
  if (campaign.deleted_at || campaign.publication_status !== "published") {
    await markSend(admin, send.id, "skipped", "campaign_ended");
    await completeEnrollment(admin, enrollment.id, "campaign_ended");
    return "skipped";
  }
  if (campaign.end_date && new Date(campaign.end_date).getTime() <= Date.now()) {
    await markSend(admin, send.id, "skipped", "campaign_ended");
    await completeEnrollment(admin, enrollment.id, "campaign_ended");
    return "skipped";
  }

  // Auto-stop: donor donated
  const { data: donatedRows } = await admin
    .from("orders")
    .select("id")
    .eq("campaign_id", campaign.id)
    .eq("donor_id", donor.id)
    .eq("status", "completed")
    .limit(1);
  if (donatedRows && donatedRows.length > 0) {
    await markSend(admin, send.id, "skipped", "donated");
    await completeEnrollment(admin, enrollment.id, "donated");
    // Cancel future scheduled sends
    await admin
      .from("fundraiser_outreach_sends")
      .delete()
      .eq("enrollment_id", enrollment.id)
      .eq("status", "scheduled");
    return "skipped";
  }

  // Auto-stop: suppressed
  if (donor.email) {
    const { data: sup } = await admin
      .from("suppressed_emails")
      .select("email")
      .eq("email", String(donor.email).toLowerCase())
      .maybeSingle();
    if (sup) {
      await markSend(admin, send.id, "skipped", "suppressed");
      await completeEnrollment(admin, enrollment.id, "suppressed");
      return "skipped";
    }
  } else {
    await markSend(admin, send.id, "skipped", "no_email");
    return "skipped";
  }

  // Resolve owner pitch (if any)
  let owner: OutreachOwner | null = null;
  if (enrollment.roster_member_id) {
    const { data: ouRow } = await admin
      .from("organization_user")
      .select("id, user_id, profiles:user_id (first_name, last_name)")
      .eq("id", enrollment.roster_member_id)
      .maybeSingle();
    const { data: link } = await admin
      .from("roster_member_campaign_links")
      .select("slug, pitch_message, pitch_video_url, pitch_recorded_video_url, pitch_image_url")
      .eq("campaign_id", campaign.id)
      .eq("roster_member_id", enrollment.roster_member_id)
      .maybeSingle();
    const profile = (ouRow as any)?.profiles;
    if (profile?.first_name) {
      owner = {
        studentFirstName: profile.first_name,
        studentLastName: profile.last_name,
        pitchMessage: link?.pitch_message ?? null,
        pitchVideoUrl: link?.pitch_video_url ?? null,
        pitchRecordedVideoUrl: link?.pitch_recorded_video_url ?? null,
        pitchImageUrl: link?.pitch_image_url ?? null,
        rosterSlug: link?.slug ?? enrollment.roster_member_slug ?? null,
      };
    }
  }

  // Resolve group/team name
  let groupName: string | null = null;
  if (campaign.group_id) {
    const { data: groupRow } = await admin
      .from("groups")
      .select("group_name")
      .eq("id", campaign.group_id)
      .maybeSingle();
    if (groupRow) groupName = (groupRow as any).group_name;
  }

  // Build CTA URL
  const baseUrl = appUrl.replace(/\/$/, "");
  const slug = campaign.slug || campaign.id;
  const ctaUrl = owner?.rosterSlug
    ? `${baseUrl}/c/${slug}/${owner.rosterSlug}`
    : `${baseUrl}/c/${slug}`;

  // Build unsubscribe URL — points at this same edge function with action=unsub
  const unsubscribeUrl = `${baseUrl}/fundraiser-unsubscribe?token=${send.unsubscribe_token}`;

  // Render
  const renderArgs = {
    stage: send.stage,
    recipient: { firstName: donor.first_name, email: donor.email },
    campaign: {
      name: campaign.name,
      slug: campaign.slug,
      heroImageUrl: campaign.image_url,
      endDate: campaign.end_date,
    },
    org: {
      name: org.name,
      logoUrl: org.logo_url,
      addressLine1: org.address_line1,
      city: org.city,
      state: org.state,
      zip: org.zip,
    },
    group: { name: groupName },
    owner,
    ctaUrl,
    unsubscribeUrl,
    appUrl: baseUrl,
  };

  const subject = buildSubject(renderArgs as any);
  const html = renderOutreachHtml(renderArgs as any);

  // Send via Resend
  try {
    const fromAddress = `${org.name.replace(/[<>"]/g, "")} via Sponsorly <fundraisers@sponsorly.io>`;
    const result = await resend.emails.send({
      from: fromAddress,
      to: [donor.email],
      subject,
      html,
    });
    if ((result as any)?.error) {
      console.error("Resend error", (result as any).error);
      await markSend(admin, send.id, "failed", String((result as any).error?.message || "resend_error"));
      return "failed";
    }
    const emailId = (result as any)?.data?.id || null;
    await admin
      .from("fundraiser_outreach_sends")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        resend_email_id: emailId,
      })
      .eq("id", send.id);
    return "sent";
  } catch (e) {
    console.error("Send threw", e);
    await markSend(admin, send.id, "failed", e instanceof Error ? e.message : "throw");
    return "failed";
  }
}

async function markSend(admin: any, id: string, status: "skipped" | "failed", reason: string) {
  await admin
    .from("fundraiser_outreach_sends")
    .update({ status, skip_reason: reason, sent_at: new Date().toISOString() })
    .eq("id", id);
}

async function completeEnrollment(
  admin: any,
  enrollmentId: string,
  reason: "donated" | "campaign_ended" | "unsubscribed" | "suppressed",
) {
  await admin
    .from("fundraiser_outreach_enrollments")
    .update({ status: "completed", completion_reason: reason })
    .eq("id", enrollmentId);
}

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