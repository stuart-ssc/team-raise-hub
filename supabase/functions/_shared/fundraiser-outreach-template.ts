// Shared HTML template generator for fundraiser outreach drip emails.
// Pure helpers — no I/O. All user-supplied strings must be passed pre-escaped
// or piped through `escapeHtml`.

export type DripStage = "intro" | "weekly" | "final_week" | "final_48h" | "last_chance";

export interface OutreachOwner {
  // The "voice" of the outreach. If a student/participant owns the relationship,
  // we lead with them. Otherwise we frame around the team/group.
  studentFirstName?: string | null;
  studentLastName?: string | null;
  pitchMessage?: string | null;
  pitchVideoUrl?: string | null;
  pitchImageUrl?: string | null;
  rosterSlug?: string | null;
}

export interface OutreachOrg {
  name: string;
  logoUrl?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}

export interface OutreachCampaign {
  name: string;
  slug: string | null;
  heroImageUrl?: string | null;
  goalAmount?: number | null;
  amountRaised?: number | null;
  endDate?: string | null; // ISO date
}

export interface OutreachGroup {
  name?: string | null;
}

export interface OutreachRecipient {
  firstName?: string | null;
  email: string;
}

export interface RenderArgs {
  stage: DripStage;
  recipient: OutreachRecipient;
  campaign: OutreachCampaign;
  org: OutreachOrg;
  group: OutreachGroup;
  owner: OutreachOwner | null;
  ctaUrl: string;
  unsubscribeUrl: string;
  appUrl: string;
}

export const escapeHtml = (text: string | null | undefined): string => {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const escMultiline = (text: string | null | undefined): string =>
  escapeHtml(text).replace(/\n/g, "<br>");

function stageHeadline(stage: DripStage, owner: OutreachOwner | null, campaignName: string): string {
  const studentName = owner?.studentFirstName?.trim() || null;
  switch (stage) {
    case "intro":
      return studentName
        ? `${studentName} could use your support`
        : `Help us reach our goal: ${campaignName}`;
    case "weekly":
      return studentName
        ? `A quick update from ${studentName}`
        : `${campaignName} — we're still going strong`;
    case "final_week":
      return studentName
        ? `One week left to support ${studentName}`
        : `One week left for ${campaignName}`;
    case "final_48h":
      return studentName
        ? `Only 48 hours left to back ${studentName}`
        : `Only 48 hours left for ${campaignName}`;
    case "last_chance":
      return studentName
        ? `Last chance — ${studentName}'s fundraiser ends tonight`
        : `Last chance — ${campaignName} ends tonight`;
  }
}

function stageContextLine(stage: DripStage, hasStudent: boolean): string {
  switch (stage) {
    case "intro":
      return hasStudent
        ? "They're working hard to hit their goal and every contribution gets them closer."
        : "Every contribution makes a real difference for the team.";
    case "weekly":
      return hasStudent
        ? "We're checking back in to see if you're able to chip in this week — even a small gift goes a long way."
        : "We're checking in to see if you're able to chip in this week.";
    case "final_week":
      return "The fundraiser wraps up in just one week. Now is the perfect time to make your gift count.";
    case "final_48h":
      return "We're in the final stretch — just 48 hours left to hit our goal.";
    case "last_chance":
      return "This is the final day. After tonight, the fundraiser is closed.";
  }
}

function ctaLabel(stage: DripStage, owner: OutreachOwner | null, groupName: string | null | undefined): string {
  const target = owner?.studentFirstName?.trim() || groupName?.trim() || "this Fundraiser";
  if (stage === "final_48h" || stage === "last_chance") {
    return `Donate now — Support ${target}`;
  }
  return `Support ${target}`;
}

export function buildSubject(args: RenderArgs): string {
  const studentName = args.owner?.studentFirstName?.trim() || null;
  const campaign = args.campaign.name;
  switch (args.stage) {
    case "intro":
      return studentName
        ? `${studentName} needs your help with ${campaign}`
        : `Help support ${campaign}`;
    case "weekly":
      return studentName
        ? `A quick check-in from ${studentName}`
        : `Quick update on ${campaign}`;
    case "final_week":
      return `One week left — ${campaign}`;
    case "final_48h":
      return `48 hours left — ${campaign}`;
    case "last_chance":
      return `Last chance — ${campaign} ends tonight`;
  }
}

export function renderOutreachHtml(args: RenderArgs): string {
  const { stage, recipient, campaign, org, group, owner, ctaUrl, unsubscribeUrl, appUrl } = args;

  const greeting = recipient.firstName
    ? `Hi ${escapeHtml(recipient.firstName)},`
    : "Hi there,";

  const headline = escapeHtml(stageHeadline(stage, owner, campaign.name));
  const hasStudent = !!(owner && owner.studentFirstName);
  const contextLine = escapeHtml(stageContextLine(stage, hasStudent));
  const ctaText = escapeHtml(ctaLabel(stage, owner, group.name));

  const teamOrOrg = group.name?.trim() || org.name;

  // Lead paragraph
  let leadHtml = "";
  if (hasStudent && owner) {
    const studentName = escapeHtml(owner.studentFirstName!);
    const teamLabel = escapeHtml(teamOrOrg);
    leadHtml = `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:hsl(222,47%,11%);">
        <strong>${studentName}</strong> is fundraising with <strong>${teamLabel}</strong> and would love your support.
      </p>`;
    if (owner.pitchMessage) {
      leadHtml += `
        <blockquote style="margin:0 0 16px;padding:16px 20px;border-left:4px solid hsl(217,91%,60%);background:hsl(210,40%,98%);font-size:15px;line-height:1.6;color:hsl(222,47%,20%);font-style:italic;">
          "${escMultiline(owner.pitchMessage)}"
        </blockquote>`;
    }
    const videoUrl = owner.pitchVideoUrl || owner.pitchRecordedVideoUrl;
    if (videoUrl) {
      leadHtml += `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
          <a href="${escapeHtml(videoUrl)}" style="color:hsl(217,91%,60%);text-decoration:underline;font-weight:600;">▶ Watch ${escapeHtml(owner.studentFirstName!)}'s video</a>
        </p>`;
    }
  } else {
    leadHtml = `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:hsl(222,47%,11%);">
        <strong>${escapeHtml(teamOrOrg)}</strong> is raising funds for <strong>${escapeHtml(campaign.name)}</strong> and your support would mean the world.
      </p>`;
  }

  const heroImg = campaign.heroImageUrl
    ? `<img src="${escapeHtml(campaign.heroImageUrl)}" alt="${escapeHtml(campaign.name)}" style="display:block;width:100%;max-width:560px;height:auto;border-radius:8px;margin:0 0 16px;" />`
    : "";

  const orgLogo = org.logoUrl
    ? `<img src="${escapeHtml(org.logoUrl)}" alt="${escapeHtml(org.name)}" style="max-height:48px;max-width:200px;display:block;" />`
    : `<div style="font-size:18px;font-weight:700;color:hsl(222,47%,11%);">${escapeHtml(org.name)}</div>`;

  const orgAddressBits = [org.addressLine1, [org.city, org.state].filter(Boolean).join(", "), org.zip]
    .filter(Boolean)
    .join(" · ");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(args.campaign.name)}</title>
</head>
<body style="margin:0;padding:0;background:hsl(210,40%,96%);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:hsl(222,47%,11%);">
  <div style="display:none;max-height:0;overflow:hidden;">${headline}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:hsl(210,40%,96%);padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <!-- Header -->
        <tr><td style="padding:20px 28px;border-bottom:1px solid hsl(214,32%,91%);">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td align="left" valign="middle">${orgLogo}</td>
              <td align="right" valign="middle" style="font-size:12px;color:hsl(215,16%,47%);">
                Powered by <strong style="color:hsl(217,91%,60%);">Sponsorly</strong>
              </td>
            </tr>
          </table>
        </td></tr>
        <!-- Hero / Title -->
        <tr><td style="padding:24px 28px 8px;">
          ${heroImg}
          <h1 style="margin:0 0 8px;font-size:22px;line-height:1.3;font-weight:700;color:hsl(222,47%,11%);">${headline}</h1>
          <p style="margin:0 0 4px;font-size:14px;color:hsl(215,16%,47%);">${escapeHtml(campaign.name)}</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:16px 28px 8px;">
          <p style="margin:0 0 16px;font-size:16px;color:hsl(222,47%,11%);">${greeting}</p>
          ${leadHtml}
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:hsl(222,47%,30%);">${contextLine}</p>
        </td></tr>
        <!-- CTA -->
        <tr><td align="center" style="padding:8px 28px 32px;">
          <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:hsl(217,91%,60%);color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 28px;border-radius:8px;">${ctaText}</a>
          <p style="margin:12px 0 0;font-size:12px;color:hsl(215,16%,47%);">or visit <a href="${escapeHtml(ctaUrl)}" style="color:hsl(217,91%,60%);">${escapeHtml(ctaUrl)}</a></p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 28px;border-top:1px solid hsl(214,32%,91%);background:hsl(210,40%,98%);">
          <p style="margin:0 0 6px;font-size:12px;color:hsl(215,16%,47%);text-align:center;">
            Powered by <a href="${escapeHtml(appUrl)}" style="color:hsl(217,91%,60%);text-decoration:none;font-weight:600;">Sponsorly</a>
          </p>
          ${orgAddressBits ? `<p style="margin:0 0 6px;font-size:11px;color:hsl(215,16%,47%);text-align:center;">${escapeHtml(org.name)} · ${escapeHtml(orgAddressBits)}</p>` : `<p style="margin:0 0 6px;font-size:11px;color:hsl(215,16%,47%);text-align:center;">${escapeHtml(org.name)}</p>`}
          <p style="margin:0;font-size:11px;color:hsl(215,16%,47%);text-align:center;">
            <a href="${escapeHtml(unsubscribeUrl)}" style="color:hsl(215,16%,47%);text-decoration:underline;">Unsubscribe from this campaign</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Allow either pitch_video_url or pitch_recorded_video_url
declare module "./fundraiser-outreach-template.ts" {
  interface OutreachOwner {
    pitchRecordedVideoUrl?: string | null;
  }
}