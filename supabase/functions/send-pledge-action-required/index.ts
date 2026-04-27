import { Resend } from 'npm:resend@2.0.0';
import { emailCors, fmt, loadPledgeContext, PUBLIC_BASE_URL, shellHtml } from '../_shared/pledge-email-helpers.ts';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: emailCors });
  try {
    const { pledgeId } = await req.json();
    if (!pledgeId) throw new Error('pledgeId required');
    const { pledge, campaign, displayName } = await loadPledgeContext(pledgeId);
    const order = Array.isArray(pledge.orders) ? pledge.orders[0] : pledge.orders;
    if (!order?.customer_email) {
      return new Response(JSON.stringify({ skipped: true }), { headers: { ...emailCors, 'Content-Type': 'application/json' } });
    }

    const confirmUrl = pledge.sca_confirm_token
      ? `${PUBLIC_BASE_URL}/pledge/confirm?pledgeId=${pledge.id}&token=${pledge.sca_confirm_token}`
      : `${PUBLIC_BASE_URL}/c/${campaign.slug}`;

    const html = shellHtml(`Action needed to complete your pledge`, `
      <p>Hi ${order.customer_name || 'there'},</p>
      <p>Your bank requires extra verification to complete your <strong>${fmt(pledge.final_charge_amount || 0)}</strong> pledge to <strong>${displayName}</strong> (${campaign.name}).</p>
      <p style="margin:24px 0;">
        <a href="${confirmUrl}" style="background:#3B82F6;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Confirm payment</a>
      </p>
      <p style="color:#6b7280;font-size:13px;">This link expires in 14 days. If you don't confirm, your pledge will not be charged.</p>
    `);

    await resend.emails.send({
      from: 'Sponsorly <noreply@sponsorly.io>',
      to: [order.customer_email],
      subject: `Action needed: confirm your pledge to ${displayName}`,
      html,
    });

    return new Response(JSON.stringify({ ok: true }), { headers: { ...emailCors, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('send-pledge-action-required error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...emailCors, 'Content-Type': 'application/json' } });
  }
});