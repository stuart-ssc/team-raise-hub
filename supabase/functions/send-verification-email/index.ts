import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationRequest {
  organizationId: string;
  status: 'approved' | 'rejected';
  notes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { organizationId, status, notes }: VerificationRequest = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Fetch organization details
    const { data: org, error: orgError } = await supabaseClient
      .from('organizations')
      .select('name, email, organization_type')
      .eq('id', organizationId)
      .single();
    
    if (orgError || !org) {
      throw new Error('Organization not found');
    }
    
    // Update organization verification status
    const { error: updateError } = await supabaseClient
      .from('organizations')
      .update({
        verification_status: status,
        verification_approved_at: status === 'approved' ? new Date().toISOString() : null
      })
      .eq('id', organizationId);

    if (updateError) {
      throw new Error(`Failed to update organization: ${updateError.message}`);
    }

    // Update nonprofit table with verification notes if applicable
    if (org.organization_type === 'nonprofit' && notes) {
      await supabaseClient
        .from('nonprofits')
        .update({ verification_notes: notes })
        .eq('organization_id', organizationId);
    }
    
    // Send verification email using Resend
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    const emailSubject = status === 'approved' 
      ? `✓ ${org.name} - Verification Approved!`
      : `Update Required - ${org.name} Verification`;

    const emailHtml = status === 'approved'
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">Congratulations! 🎉</h1>
          <p>Your organization <strong>${org.name}</strong> has been successfully verified on Sponsorly.</p>
          <p>You can now:</p>
          <ul>
            <li>Publish fundraising campaigns</li>
            <li>Accept donations from supporters</li>
            <li>Access all platform features</li>
          </ul>
          <p style="margin-top: 20px;">
            <a href="https://sponsorly.io/dashboard/fundraisers" 
               style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Get Started
            </a>
          </p>
          <p style="color: #6b7280; margin-top: 30px; font-size: 14px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">Verification Update Required</h1>
          <p>Thank you for submitting your verification for <strong>${org.name}</strong>.</p>
          <p>Unfortunately, we need additional information before we can complete your verification.</p>
          ${notes ? `
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0;">
              <strong>Reviewer Notes:</strong>
              <p style="margin: 8px 0 0 0;">${notes}</p>
            </div>
          ` : ''}
          <p>Please review the notes above and resubmit your verification documents.</p>
          <p style="margin-top: 20px;">
            <a href="https://sponsorly.io/dashboard" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Update Verification
            </a>
          </p>
          <p style="color: #6b7280; margin-top: 30px; font-size: 14px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      `;

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Sponsorly <verify@sponsorly.io>',
      to: [org.email],
      subject: emailSubject,
      html: emailHtml,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      // Don't fail the whole operation if email fails
    } else {
      console.log('Verification email sent successfully:', emailData);
    }
    
    return new Response(
      JSON.stringify({ success: true, emailSent: !emailError }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('Error in send-verification-email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
