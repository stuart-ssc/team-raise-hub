import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DonationNotificationPayload {
  orderId: string;
  campaignId: string;
  amount: number;
  donorName: string;
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

    const payload: DonationNotificationPayload = await req.json();
    const { orderId, campaignId, amount, donorName } = payload;

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('campaigns')
      .select('name, group_id, groups(organization_id)')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error('Campaign not found');
    }

    // Get organization admins to notify
    const { data: orgUsers, error: orgUsersError } = await supabaseClient
      .from('organization_user')
      .select('user_id, user_type:user_type_id(permission_level)')
      .eq('organization_id', campaign.groups.organization_id)
      .eq('active_user', true);

    if (orgUsersError) throw orgUsersError;

    // Filter for admins and program managers
    const adminUserIds = orgUsers
      ?.filter(ou => {
        const permLevel = ou.user_type?.permission_level;
        return permLevel === 'organization_admin' || permLevel === 'program_manager';
      })
      .map(ou => ou.user_id) || [];

    if (adminUserIds.length === 0) {
      console.log('No admins to notify');
      return new Response(
        JSON.stringify({ success: true, message: 'No admins to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send push notifications to all admins
    const notificationPromises = adminUserIds.map(userId =>
      supabaseClient.functions.invoke('send-push-notification', {
        body: {
          userId,
          title: '🎉 New Donation!',
          body: `${donorName} donated $${amount.toFixed(2)} to ${campaign.name}`,
          data: {
            type: 'donation',
            orderId,
            campaignId,
            route: `/dashboard/campaigns`
          }
        }
      })
    );

    await Promise.all(notificationPromises);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notified: adminUserIds.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending donation notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
