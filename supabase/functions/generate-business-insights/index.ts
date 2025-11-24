import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { businessId, organizationId } = await req.json();

    if (!businessId || !organizationId) {
      throw new Error('Missing required parameters');
    }

    // Verify user has permission
    const { data: orgUser } = await supabaseClient
      .from('organization_user')
      .select('user_type:user_type(permission_level)')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (!orgUser || !['organization_admin', 'program_manager'].includes(orgUser.user_type.permission_level)) {
      throw new Error('Unauthorized');
    }

    // Fetch business details
    const { data: business } = await supabaseClient
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (!business) {
      throw new Error('Business not found');
    }

    // Fetch linked donors with their donation history
    const { data: linkedDonors } = await supabaseClient
      .from('business_donors')
      .select(`
        donor:donor_profiles(
          id,
          email,
          first_name,
          last_name,
          total_donations,
          donation_count,
          last_donation_date,
          rfm_segment
        ),
        role,
        is_primary_contact,
        linked_at
      `)
      .eq('business_id', businessId)
      .is('blocked_at', null);

    // Fetch recent activity
    const { data: recentActivity } = await supabaseClient
      .from('business_activity_log')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Fetch donation history from linked donors
    const donorEmails = linkedDonors?.map(ld => ld.donor?.email).filter(Boolean) || [];
    const { data: donations } = await supabaseClient
      .from('orders')
      .select('total_amount, created_at, status')
      .in('customer_email', donorEmails)
      .eq('business_id', businessId)
      .in('status', ['succeeded', 'completed'])
      .order('created_at', { ascending: false })
      .limit(50);

    // Build AI prompt
    const prompt = `Analyze this business partnership and provide actionable insights:

Business: ${business.business_name}
Industry: ${business.industry || 'Unknown'}
Engagement Segment: ${business.engagement_segment || 'new'}
Engagement Score: ${business.engagement_score || 0}/100
Vitality Score: ${business.engagement_vitality_score || 0}/5 (recency)
Breadth Score: ${business.engagement_breadth_score || 0}/5 (employee participation)
Performance Score: ${business.engagement_performance_score || 0}/5 (donation value)

Linked Employees: ${linkedDonors?.length || 0}
Total Partnership Value: $${((business.total_partnership_value || 0) / 100).toFixed(2)}
Last Donor Activity: ${business.last_donor_activity_date || 'Never'}

Employee Details:
${linkedDonors?.map(ld => `- ${ld.donor?.first_name} ${ld.donor?.last_name} (${ld.role || 'Employee'})${ld.is_primary_contact ? ' [PRIMARY CONTACT]' : ''}: ${ld.donor?.donation_count || 0} donations, $${((ld.donor?.total_donations || 0) / 100).toFixed(2)} total, RFM: ${ld.donor?.rfm_segment || 'new'}`).join('\n') || 'None'}

Recent Donations: ${donations?.length || 0} in database
Total Donated: $${(donations?.reduce((sum, d) => sum + (d.total_amount || 0), 0) / 100).toFixed(2)}

Recent Activity:
${recentActivity?.slice(0, 10).map(a => `- ${a.activity_type}: ${JSON.stringify(a.activity_data)}`).join('\n') || 'No recent activity'}

Provide a comprehensive partnership analysis with:

1. PARTNERSHIP_HEALTH: Brief assessment (2-3 sentences) of overall partnership strength and trajectory
2. HEALTH_SCORE: Single number 0-100 representing partnership health
3. OUTREACH_TIMING: Best date for next outreach (YYYY-MM-DD format) with 1-sentence reasoning
4. EXPANSION_OPPORTUNITIES: 3-5 specific, actionable strategies to grow this partnership
5. RISK_INDICATORS: Any concerning patterns or risks (or "None" if healthy)
6. RISK_LEVEL: One of: "low", "medium", "high", or "none"
7. EXPANSION_POTENTIAL: One of: "low", "medium", "high"
8. PRIORITY_SCORE: Single number 0-100 for how much attention this business deserves
9. NEXT_BEST_ACTIONS: 3-5 specific, prioritized next steps
10. MESSAGING_STRATEGY: 2-3 key points for communication approach

Format your response as JSON with these exact keys (use arrays for lists).`;

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a partnership insights analyst. Provide detailed, actionable recommendations based on business engagement data. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway returned ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    // Parse AI response (handle both direct JSON and markdown code blocks)
    let insights;
    try {
      // Try parsing as direct JSON first
      insights = JSON.parse(aiContent);
    } catch {
      // Try extracting JSON from markdown code block
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[1]);
      } else {
        // Last resort: try to find JSON object in the text
        const objectMatch = aiContent.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          insights = JSON.parse(objectMatch[0]);
        } else {
          throw new Error('Could not parse AI response as JSON');
        }
      }
    }

    // Extract structured data
    const partnershipHealthScore = insights.HEALTH_SCORE || 50;
    const riskLevel = insights.RISK_LEVEL || 'none';
    const expansionPotential = insights.EXPANSION_POTENTIAL || 'medium';
    const priorityScore = insights.PRIORITY_SCORE || 50;
    const optimalOutreachDate = insights.OUTREACH_TIMING?.split(' ')[0] || null;

    // Upsert insights into database
    const { error: upsertError } = await supabaseClient
      .from('business_insights')
      .upsert({
        business_id: businessId,
        organization_id: organizationId,
        insights: insights,
        partnership_health_score: partnershipHealthScore,
        risk_level: riskLevel,
        expansion_potential: expansionPotential,
        optimal_outreach_date: optimalOutreachDate,
        priority_score: priorityScore,
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'business_id'
      });

    if (upsertError) {
      console.error('Database upsert error:', upsertError);
      throw upsertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        insights: {
          partnership_health: insights.PARTNERSHIP_HEALTH,
          partnership_health_score: partnershipHealthScore,
          outreach_timing: insights.OUTREACH_TIMING,
          optimal_outreach_date: optimalOutreachDate,
          expansion_opportunities: insights.EXPANSION_OPPORTUNITIES,
          risk_indicators: insights.RISK_INDICATORS,
          risk_level: riskLevel,
          expansion_potential: expansionPotential,
          priority_score: priorityScore,
          next_best_actions: insights.NEXT_BEST_ACTIONS,
          messaging_strategy: insights.MESSAGING_STRATEGY,
          generated_at: new Date().toISOString(),
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-business-insights:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
