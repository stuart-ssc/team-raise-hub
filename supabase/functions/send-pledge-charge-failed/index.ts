import { Resend } from 'npm:resend@2.0.0';
import { emailCors, fmt, loadPledgeContext, shellHtml } from '../_shared/pledge-email-helpers.ts';

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

    const html = shellHtml(`We couldn't process your pledge`, `
      <p>Hi ${order.customer_name || 'there'},</p>
      <p>We tried to charge your card for your pledge to <strong>${displayName}</strong> (${campaign.name}) for <strong>${fmt(pledge.final_charge_amount || 0)}</strong>, but the charge could not be completed.</p>
      ${pledge.charge_failure_reason ? `<p style="color:#6b7280;font-size:14px;">Reason: ${pledge.charge_failure_reason}</p>` : ''}
      <p>Please contact <strong>${displayName}</strong> directly to arrange payment. They can re-attempt the charge or accept your pledge through another method.</p>
    `);

    await resend.emails.send({
      from: 'Sponsorly <noreply@sponsorly.io>',
      to: [order.customer_email],
      subject: `We couldn't process your pledge to ${displayName}`,
      html,
    });

    return new Response(JSON.stringify({ ok: true }), { headers: { ...emailCors, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('send-pledge-charge-failed error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...emailCors, 'Content-Type': 'application/json' } });
  }
});