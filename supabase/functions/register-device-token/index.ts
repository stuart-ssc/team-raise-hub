import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegisterTokenPayload {
  deviceToken: string;
  platform: 'ios' | 'android';
  deviceInfo?: {
    model?: string;
    osVersion?: string;
    appVersion?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const payload: RegisterTokenPayload = await req.json();
    const { deviceToken, platform, deviceInfo } = payload;

    if (!deviceToken || !platform) {
      return new Response(
        JSON.stringify({ error: 'deviceToken and platform are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if token already exists for this user
    const { data: existingToken } = await supabaseClient
      .from('push_notification_tokens')
      .select('id')
      .eq('user_id', user.id)
      .eq('device_token', deviceToken)
      .single();

    if (existingToken) {
      // Update existing token
      const { error: updateError } = await supabaseClient
        .from('push_notification_tokens')
        .update({
          platform,
          device_info: deviceInfo,
          active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingToken.id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true, message: 'Token updated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert new token
    const { error: insertError } = await supabaseClient
      .from('push_notification_tokens')
      .insert({
        user_id: user.id,
        device_token: deviceToken,
        platform,
        device_info: deviceInfo,
        active: true
      });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, message: 'Token registered' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error registering device token:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
