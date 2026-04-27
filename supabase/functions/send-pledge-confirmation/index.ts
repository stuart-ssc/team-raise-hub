import { Resend } from 'npm:resend@2.0.0';
import { emailCors, fmt, loadPledgeContext, PUBLIC_BASE_URL, shellHtml } from '../_shared/pledge-email-helpers.ts';

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
    const cap = pledge.max_total_amount;
    const eventDate = campaign.pledge_event_date
      ? new Date(campaign.pledge_event_date).toLocaleDateString('en-US', { dateStyle: 'long' })
      : 'the event date';
    const cancelUrl = pledge.cancel_token
      ? `${PUBLIC_BASE_URL}/pledge/cancel?pledgeId=${pledge.id}&token=${pledge.cancel_token}`
      : null;

    const html = shellHtml(`Your pledge to ${displayName} is confirmed`, `
      <p>Hi ${order.customer_name || 'there'},</p>
      <p>Thank you for pledging support to <strong>${displayName}</strong>${participantName ? ` for <strong>${participantName}</strong>` : ''} in the <strong>${campaign.name}</strong> campaign.</p>
      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 6px 0;"><strong>Pledge:</strong> ${fmt(pledge.amount_per_unit)} per ${unit}</p>
        ${cap ? `<p style="margin:0 0 6px 0;"><strong>Maximum total:</strong> ${fmt(cap)}</p>` : `<p style="margin:0 0 6px 0;"><strong>Maximum total:</strong> No cap</p>`}
        <p style="margin:0 0 6px 0;"><strong>Event date:</strong> ${eventDate}</p>
      </div>
      <p style="background:#EFF6FF;border-left:4px solid #3B82F6;padding:12px;border-radius:4px;color:#1E3A8A;">
        <strong>Your card has not been charged yet.</strong> We'll automatically charge it after ${eventDate} once the final ${unit} count is recorded.
      </p>
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin:16px 0;color:#4b5563;font-size:13px;">
        <strong>Authorization:</strong><br/>${pledge.mandate_text_shown}
      </div>
      ${cancelUrl ? `<p><a href="${cancelUrl}" style="color:#dc2626;">Cancel my pledge</a></p>` : ''}
    `);

    await resend.emails.send({
      from: 'Sponsorly <noreply@sponsorly.io>',
      to: [order.customer_email],
      subject: `Your pledge to ${displayName} is confirmed`,
      html,
    });

    return new Response(JSON.stringify({ ok: true }), { headers: { ...emailCors, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('send-pledge-confirmation error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...emailCors, 'Content-Type': 'application/json' } });
  }
});