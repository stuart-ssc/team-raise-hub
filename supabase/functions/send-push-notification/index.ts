import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  userId?: string;
  tokens?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: NotificationPayload = await req.json();
    const { title, body, data, userId, tokens } = payload;

    // Get FCM server key from environment
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
    
    if (!fcmServerKey) {
      throw new Error('FCM_SERVER_KEY not configured');
    }

    // If userId provided, fetch device tokens from database
    let deviceTokens = tokens || [];
    if (userId && !tokens) {
      // TODO: Query your database table for user's device tokens
      // Example: SELECT device_token FROM push_notification_tokens WHERE user_id = userId
      const { data: tokenData, error } = await supabaseClient
        .from('push_notification_tokens')
        .select('device_token, platform')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) {
        console.error('Error fetching device tokens:', error);
      } else {
        deviceTokens = tokenData?.map(t => t.device_token) || [];
      }
    }

    if (deviceTokens.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No device tokens found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Send to FCM (supports both Android and iOS tokens)
    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${fcmServerKey}`
      },
      body: JSON.stringify({
        registration_ids: deviceTokens,
        notification: {
          title,
          body,
          sound: 'default',
          badge: '1'
        },
        data: data || {},
        priority: 'high'
      })
    });

    const fcmResult = await fcmResponse.json();
    console.log('FCM Response:', fcmResult);

    // Log notification to database
    const { error: logError } = await supabaseClient
      .from('push_notification_log')
      .insert({
        user_id: userId,
        title,
        body,
        data,
        tokens_sent: deviceTokens.length,
        success_count: fcmResult.success || 0,
        failure_count: fcmResult.failure || 0,
        fcm_response: fcmResult
      });

    if (logError) {
      console.error('Error logging notification:', logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: fcmResult.success || 0,
        failed: fcmResult.failure || 0,
        results: fcmResult.results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending push notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
