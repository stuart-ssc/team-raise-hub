import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('Processing business update digest...');

    // Get unsent notifications from the last 24 hours
    const { data: notifications, error: notifError } = await supabaseClient
      .from('business_update_notifications')
      .select(`
        *,
        businesses (
          id,
          business_name
        )
      `)
      .eq('notification_sent', false)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (notifError) {
      console.error('Error fetching notifications:', notifError);
      throw notifError;
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending notifications' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Group notifications by business
    const businessUpdates = new Map<string, any[]>();
    for (const notif of notifications) {
      const businessId = notif.business_id;
      if (!businessUpdates.has(businessId)) {
        businessUpdates.set(businessId, []);
      }
      businessUpdates.get(businessId)!.push(notif);
    }

    // For each business, send digest to all linked donors
    for (const [businessId, updates] of businessUpdates.entries()) {
      const { data: linkedDonors } = await supabaseClient
        .from('business_donors')
        .select(`
          donor_id,
          profiles:donor_id (
            id,
            first_name,
            last_name,
            email:id (email)
          )
        `)
        .eq('business_id', businessId)
        .is('blocked_at', null);

      if (!linkedDonors || linkedDonors.length === 0) continue;

      const businessName = (updates[0] as any).businesses?.business_name || 'Your business';

      // Get unique donor IDs excluding the ones who made updates
      const updaterIds = new Set(updates.map(u => u.updated_by));
      const recipientDonors = linkedDonors.filter(d => !updaterIds.has(d.donor_id));

      for (const donor of recipientDonors) {
        const profile = (donor as any).profiles;
        if (!profile) continue;

        // Get donor email from auth.users
        const { data: authUser } = await supabaseClient.auth.admin.getUserById(donor.donor_id);
        const donorEmail = authUser?.user?.email;

        if (!donorEmail) continue;

        // Build email content
        const changesHtml = updates.map(update => {
          const changes = Array.isArray(update.changes) ? update.changes : [];
          return changes.map((change: any) => 
            `<li><strong>${change.field}</strong> was updated</li>`
          ).join('');
        }).join('');

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Business Information Updated</h2>
            <p>Hello ${profile.first_name || 'there'},</p>
            <p>Information for <strong>${businessName}</strong> has been updated by another team member:</p>
            <ul style="line-height: 1.8;">
              ${changesHtml}
            </ul>
            <p>
              <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/dashboard/business-profile?id=${businessId}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Review Changes
              </a>
            </p>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              If any changes seem incorrect, you can block the person who made them from managing this business profile.
            </p>
          </div>
        `;

        // Send email via Resend
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: 'Sponsorly <notifications@mail.sponsorly.app>',
              to: [donorEmail],
              subject: `${businessName} - Business Information Updated`,
              html: emailHtml,
            }),
          });

          console.log(`Sent digest to ${donorEmail}`);

          // Send in-app notification
          await supabaseClient
            .from('notifications')
            .insert({
              user_id: donor.donor_id,
              title: 'Business Information Updated',
              message: `Information for ${businessName} has been updated by another team member.`,
              type: 'info',
              business_id: businessId,
              action_url: `/dashboard/business-profile?id=${businessId}`,
            });

        } catch (emailError) {
          console.error(`Error sending email to ${donorEmail}:`, emailError);
        }
      }
    }

    // Mark all notifications as sent
    const notificationIds = notifications.map(n => n.id);
    await supabaseClient
      .from('business_update_notifications')
      .update({ notification_sent: true })
      .in('id', notificationIds);

    return new Response(
      JSON.stringify({ 
        message: 'Business update digests sent successfully',
        processed: notifications.length
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending business update digests:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
