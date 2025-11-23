import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { organizationId, status, notes } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { data: org } = await supabaseClient
      .from('organizations')
      .select('name, email')
      .eq('id', organizationId)
      .single();
    
    if (!org) {
      throw new Error('Organization not found');
    }
    
    await supabaseClient
      .from('organizations')
      .update({
        verification_status: status,
        verification_approved_at: status === 'approved' ? new Date().toISOString() : null
      })
      .eq('id', organizationId);
    
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'Sponsorly <verify@sponsorly.io>',
        to: org.email,
        subject: status === 'approved' 
          ? 'Your Sponsorly Organization Has Been Verified!' 
          : 'Update on Your Sponsorly Verification',
        html: status === 'approved'
          ? `<h1>Congratulations!</h1><p>Your organization "${org.name}" has been verified. You can now publish campaigns and accept donations.</p>`
          : `<h1>Verification Update</h1><p>Your verification for "${org.name}" needs attention. ${notes || 'Please contact support for more details.'}</p>`
      })
    });
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
