import { Resend } from 'npm:resend@2.0.0';
import { emailCors, fmt, loadPledgeContext, shellHtml } from '../_shared/pledge-email-helpers.ts';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: emailCors });

  try {
    const { pledgeId } = await req.json();
    if (!pledgeId) throw new Error('pledgeId required');
    const { pledge, campaign, displayName, participantName } = await loadPledgeContext(pledgeId);
    const order = Array.isArray(pledge.orders) ? pledge.orders[0] : pledge.orders;
    if (!order?.customer_email) {
      return new Response(JSON.stringify({ skipped: true }), { headers: { ...emailCors, 'Content-Type': 'application/json' } });
    }
    const unit = campaign.pledge_unit_label || 'unit';

    const html = shellHtml(`Thank you — your pledge has been charged`, `
      <p>Hi ${order.customer_name || 'there'},</p>
      <p>Your pledge to <strong>${displayName}</strong>${participantName ? ` for <strong>${participantName}</strong>` : ''} (${campaign.name}) has been charged.</p>
      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 6px 0;">${pledge.units_charged_for || 0} ${unit}${(pledge.units_charged_for || 0) === 1 ? '' : 's'} × ${fmt(pledge.amount_per_unit)} = ${fmt(pledge.calculated_charge_amount || 0)}</p>
        ${pledge.max_total_amount && Number(pledge.calculated_charge_amount) > Number(pledge.max_total_amount) ? `<p style="margin:0 0 6px 0;color:#6b7280;">Capped at maximum: ${fmt(pledge.max_total_amount)}</p>` : ''}
        <p style="margin:8px 0 0 0;font-size:18px;"><strong>Total charged: ${fmt(pledge.final_charge_amount || 0)}</strong></p>
      </div>
      <p>Thank you for your generous support!</p>
    `);

    await resend.emails.send({
      from: 'Sponsorly <noreply@sponsorly.io>',
      to: [order.customer_email],
      subject: `Your pledge has been charged — thank you!`,
      html,
    });

    return new Response(JSON.stringify({ ok: true }), { headers: { ...emailCors, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('send-pledge-charged-receipt error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...emailCors, 'Content-Type': 'application/json' } });
  }
});