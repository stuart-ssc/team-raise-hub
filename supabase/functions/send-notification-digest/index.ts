import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationDigestRequest {
  frequency?: "daily" | "weekly";
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get frequency from request body or default to daily
    const body = await req.json().catch(() => ({})) as NotificationDigestRequest;
    const frequency = body.frequency || "daily";
    
    console.log(`Processing ${frequency} digest notifications...`);

    // Calculate time threshold
    const now = new Date();
    const timeThreshold = new Date();
    if (frequency === "daily") {
      timeThreshold.setDate(timeThreshold.getDate() - 1);
    } else {
      timeThreshold.setDate(timeThreshold.getDate() - 7);
    }

    // Get users who want this frequency digest and haven't received one recently
    const { data: usersToNotify, error: usersError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email_digest_frequency, last_digest_sent_at")
      .eq("email_digest_frequency", frequency)
      .or(`last_digest_sent_at.is.null,last_digest_sent_at.lt.${timeThreshold.toISOString()}`);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }

    console.log(`Found ${usersToNotify?.length || 0} users to notify`);

    let successCount = 0;
    let errorCount = 0;

    // Process each user
    for (const profile of usersToNotify || []) {
      try {
        // Get user's email from auth.users
        const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(profile.id);
        
        if (authError || !user?.email) {
          console.error(`Error getting email for user ${profile.id}:`, authError);
          errorCount++;
          continue;
        }

        // Get unread notifications for this user
        const { data: notifications, error: notifError } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", profile.id)
          .eq("read", false)
          .order("created_at", { ascending: false })
          .limit(50);

        if (notifError) {
          console.error(`Error fetching notifications for user ${profile.id}:`, notifError);
          errorCount++;
          continue;
        }

        // Skip if no unread notifications
        if (!notifications || notifications.length === 0) {
          console.log(`No unread notifications for user ${profile.id}, skipping`);
          continue;
        }

        // Group notifications by type
        const notificationsByType = notifications.reduce((acc, notif) => {
          if (!acc[notif.type]) acc[notif.type] = [];
          acc[notif.type].push(notif);
          return acc;
        }, {} as Record<string, any[]>);

        // Generate email HTML
        const emailHtml = generateDigestEmail(
          profile.first_name || "User",
          notifications.length,
          notificationsByType,
          frequency
        );

        // Send email
        const emailResponse = await resend.emails.send({
          from: "Notifications <notifications@resend.dev>",
          to: [user.email],
          subject: `Your ${frequency} notification digest - ${notifications.length} unread notification${notifications.length !== 1 ? 's' : ''}`,
          html: emailHtml,
        });

        if (emailResponse.error) {
          throw emailResponse.error;
        }

        console.log(`Email sent successfully to ${user.email}`);

        // Update last_digest_sent_at
        await supabase
          .from("profiles")
          .update({ last_digest_sent_at: now.toISOString() })
          .eq("id", profile.id);

        successCount++;
      } catch (error) {
        console.error(`Error processing user ${profile.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Digest complete: ${successCount} sent, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        frequency,
        sent: successCount,
        errors: errorCount,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification-digest function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

function generateDigestEmail(
  firstName: string,
  totalCount: number,
  notificationsByType: Record<string, any[]>,
  frequency: string
): string {
  const typeEmojis: Record<string, string> = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
  };

  let notificationsHtml = "";
  
  Object.entries(notificationsByType).forEach(([type, notifs]) => {
    const emoji = typeEmojis[type] || "📬";
    notificationsHtml += `
      <div style="margin-bottom: 24px;">
        <h3 style="color: #333; font-size: 16px; margin-bottom: 12px;">
          ${emoji} ${type.charAt(0).toUpperCase() + type.slice(1)} (${notifs.length})
        </h3>
        ${notifs.slice(0, 5).map(notif => `
          <div style="background: #f8f9fa; padding: 12px; margin-bottom: 8px; border-radius: 6px; border-left: 3px solid ${getTypeColor(type)};">
            <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${notif.title}</div>
            <div style="color: #666; font-size: 14px;">${notif.message}</div>
            <div style="color: #999; font-size: 12px; margin-top: 4px;">
              ${new Date(notif.created_at).toLocaleDateString()}
            </div>
          </div>
        `).join("")}
        ${notifs.length > 5 ? `<div style="color: #666; font-size: 14px; margin-top: 8px;">... and ${notifs.length - 5} more</div>` : ""}
      </div>
    `;
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0 0 10px 0;">Your ${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Digest</h1>
            <p style="color: #666; margin: 0; font-size: 16px;">
              Hi ${firstName}, you have ${totalCount} unread notification${totalCount !== 1 ? 's' : ''}
            </p>
          </div>
          
          ${notificationsHtml}
          
          <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e0e0e0;">
            <a href="${supabaseUrl.replace('https://', 'https://').split('.supabase.co')[0]}.lovable.app/dashboard/notifications" 
               style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View All Notifications
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 24px; color: #999; font-size: 12px;">
            <p>You're receiving this because you opted in for ${frequency} notification digests.</p>
            <p>You can change your preferences in your profile settings.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function getTypeColor(type: string): string {
  switch (type) {
    case "success":
      return "#10b981";
    case "warning":
      return "#f59e0b";
    case "error":
      return "#ef4444";
    default:
      return "#3b82f6";
  }
}
