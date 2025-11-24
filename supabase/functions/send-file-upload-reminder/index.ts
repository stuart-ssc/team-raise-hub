import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('Processing file upload reminders...');

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Get reminders that need to be sent (deadline approaching)
    const { data: reminders, error: reminderError } = await supabaseClient
      .from('file_upload_reminders')
      .select(`
        *,
        orders (
          id,
          user_id,
          customer_name,
          customer_email,
          campaigns (
            id,
            name
          )
        )
      `)
      .eq('files_completed', false)
      .lte('deadline_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Next 7 days

    if (reminderError) {
      console.error('Error fetching reminders:', reminderError);
      throw reminderError;
    }

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No reminders to send' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    let emailsSent = 0;

    for (const reminder of reminders) {
      const order = (reminder as any).orders;
      if (!order || !order.customer_email) continue;

      const campaign = order.campaigns;
      const deadlineDate = new Date(reminder.deadline_date);
      const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Determine if we should send based on reminder schedule
      let shouldSend = false;
      let reminderType = '';

      if (daysUntilDeadline === 7 && reminder.reminder_count === 0) {
        shouldSend = true;
        reminderType = '7 days before';
      } else if (daysUntilDeadline === 3 && reminder.reminder_count === 1) {
        shouldSend = true;
        reminderType = '3 days before';
      } else if (daysUntilDeadline === 1 && reminder.reminder_count === 2) {
        shouldSend = true;
        reminderType = 'Final reminder';
      } else if (daysUntilDeadline <= 0 && reminder.reminder_count === 3) {
        shouldSend = true;
        reminderType = 'Overdue';
      }

      if (!shouldSend) continue;

      // Check if files have been uploaded
      const { data: uploadedFiles } = await supabaseClient
        .from('sponsorship_files')
        .select('id')
        .eq('order_id', order.id);

      // Get required file fields
      const { data: requiredFields } = await supabaseClient
        .from('campaign_custom_fields')
        .select('field_name, is_required')
        .eq('campaign_id', campaign.id)
        .eq('field_type', 'file')
        .eq('is_required', true);

      const requiredFileCount = requiredFields?.length || 0;
      const uploadedFileCount = uploadedFiles?.length || 0;

      if (uploadedFileCount >= requiredFileCount) {
        // All files uploaded, mark as complete
        await supabaseClient
          .from('file_upload_reminders')
          .update({ files_completed: true })
          .eq('id', reminder.id);
        continue;
      }

      // Build email content
      const urgencyColor = daysUntilDeadline <= 1 ? '#dc2626' : daysUntilDeadline <= 3 ? '#ea580c' : '#2563eb';
      const urgencyText = daysUntilDeadline <= 0 
        ? 'Your file upload deadline has passed!' 
        : `Only ${daysUntilDeadline} day${daysUntilDeadline === 1 ? '' : 's'} left!`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: ${urgencyColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">File Upload Reminder</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Hello ${order.customer_name || 'there'},</p>
            <p style="font-weight: bold; color: ${urgencyColor}; font-size: 18px;">
              ${urgencyText}
            </p>
            <p>You still need to upload required files for your sponsorship of:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <strong>${campaign?.name || 'Campaign'}</strong>
            </div>
            <p>
              <strong>Files uploaded:</strong> ${uploadedFileCount} of ${requiredFileCount}<br>
              <strong>Deadline:</strong> ${deadlineDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <p>
              <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/dashboard/orders/${order.id}/files" 
                 style="background-color: ${urgencyColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 10px;">
                Upload Files Now
              </a>
            </p>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              Need help? Reply to this email and we'll assist you.
            </p>
          </div>
        </div>
      `;

      // Send email
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Sponsorly <notifications@mail.sponsorly.app>',
            to: [order.customer_email],
            subject: `${daysUntilDeadline <= 0 ? 'OVERDUE' : 'Reminder'}: Upload Required Files for ${campaign?.name || 'Your Sponsorship'}`,
            html: emailHtml,
          }),
        });

        console.log(`Sent file reminder to ${order.customer_email} (${reminderType})`);
        emailsSent++;

        // Send in-app notification
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: order.user_id,
            title: daysUntilDeadline <= 0 ? 'File Upload Overdue' : 'File Upload Reminder',
            message: `Please upload required files for your ${campaign?.name || 'sponsorship'}. ${daysUntilDeadline <= 0 ? 'Deadline has passed!' : `${daysUntilDeadline} day${daysUntilDeadline === 1 ? '' : 's'} remaining.`}`,
            type: daysUntilDeadline <= 0 ? 'error' : 'warning',
            order_id: order.id,
            action_url: `/dashboard/orders/${order.id}/files`,
          });

        // Update reminder
        await supabaseClient
          .from('file_upload_reminders')
          .update({
            last_reminder_sent_at: new Date().toISOString(),
            reminder_count: reminder.reminder_count + 1
          })
          .eq('id', reminder.id);

      } catch (emailError) {
        console.error(`Error sending reminder to ${order.customer_email}:`, emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'File upload reminders processed',
        emailsSent
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing file upload reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
