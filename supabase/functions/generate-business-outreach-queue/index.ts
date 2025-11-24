import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
      throw new Error('Unauthorized');
    }

    const { organizationId } = await req.json();
    if (!organizationId) {
      throw new Error('organizationId is required');
    }

    // Verify user belongs to organization and has permission
    const { data: orgUser } = await supabaseClient
      .from('organization_user')
      .select('user_type:user_type(*)')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (!orgUser || !['organization_admin', 'program_manager'].includes(orgUser.user_type.permission_level)) {
      throw new Error('Insufficient permissions');
    }

    // Fetch all businesses for the organization
    const { data: orgBusinesses } = await supabaseClient
      .from('organization_businesses')
      .select('business_id')
      .eq('organization_id', organizationId);

    const businessIds = orgBusinesses?.map(ob => ob.business_id) || [];

    const { data: businesses, error: businessError } = await supabaseClient
      .from('businesses')
      .select(`
        *,
        business_insights(
          partnership_health_score,
          risk_level,
          expansion_potential
        )
      `)
      .in('id', businessIds);

    if (businessError) throw businessError;

    let processed = 0;
    let failed = 0;
    let highPriorityCount = 0;
    const queueItems = [];

    // Process businesses in batches of 10
    for (let i = 0; i < businesses.length; i += 10) {
      const batch = businesses.slice(i, i + 10);

      for (const business of batch) {
        try {
          // Fetch linked donors
          const { data: linkedDonors } = await supabaseClient
            .from('business_donors')
            .select(`
              id,
              donor_id,
              role,
              is_primary_contact,
              donor_profiles!inner(id, first_name, last_name, email)
            `)
            .eq('business_id', business.id)
            .is('blocked_at', null);

          // Fetch donation activity from linked donors
          const donorEmails = linkedDonors?.map(ld => ld.donor_profiles.email) || [];
          const { data: orders } = await supabaseClient
            .from('orders')
            .select('total_amount, created_at, status')
            .in('customer_email', donorEmails)
            .in('status', ['succeeded', 'completed'])
            .order('created_at', { ascending: false })
            .limit(10);

          // Calculate priority score (0-100)
          const vitalityScore = business.engagement_vitality_score || 0;
          const breadthScore = business.engagement_breadth_score || 0;
          const performanceScore = business.engagement_performance_score || 0;
          const linkedDonorCount = linkedDonors?.length || 0;

          const daysSinceActivity = business.last_donor_activity_date
            ? Math.floor((Date.now() - new Date(business.last_donor_activity_date).getTime()) / (1000 * 60 * 60 * 24))
            : 9999;

          // Weighted scoring
          const healthWeight = 0.30;
          const expansionWeight = 0.30;
          const strategicWeight = 0.25;
          const riskWeight = 0.15;

          const healthScore = vitalityScore * 4; // 0-20
          const expansionScore = Math.min(20, linkedDonorCount * 4 + breadthScore * 4);
          const strategicScore = Math.min(25, performanceScore * 5);
          const riskScore = daysSinceActivity > 180 ? 15 : daysSinceActivity > 90 ? 10 : 5;

          const priorityScore = Math.round(
            healthScore * healthWeight +
            expansionScore * expansionWeight +
            strategicScore * strategicWeight +
            riskScore * riskWeight
          );

          // Determine partnership health status
          let healthStatus = 'good';
          if (vitalityScore >= 4 && breadthScore >= 4 && performanceScore >= 4) {
            healthStatus = 'excellent';
          } else if (vitalityScore <= 2 || daysSinceActivity > 180) {
            healthStatus = 'at_risk';
          } else if (daysSinceActivity > 365) {
            healthStatus = 'critical';
          } else if (vitalityScore <= 3 || breadthScore <= 2) {
            healthStatus = 'needs_attention';
          }

          // Determine expansion potential
          let expansionPotential = 'medium';
          if (linkedDonorCount >= 5 && breadthScore >= 4) {
            expansionPotential = 'high';
          } else if (linkedDonorCount <= 1 || breadthScore <= 2) {
            expansionPotential = 'low';
          }

          // Determine outreach target
          const primaryContact = linkedDonors?.find(ld => ld.is_primary_contact);
          let outreachTarget = 'business_entity';
          let specificContactId = null;

          if (!primaryContact) {
            outreachTarget = 'business_entity';
          } else if (vitalityScore >= 4 && linkedDonorCount > 2) {
            // Expand to other stakeholders
            const otherContacts = linkedDonors?.filter(ld => !ld.is_primary_contact);
            if (otherContacts && otherContacts.length > 0) {
              outreachTarget = 'specific_contact';
              specificContactId = otherContacts[0].donor_id;
            }
          } else if (healthStatus === 'at_risk' || healthStatus === 'critical') {
            outreachTarget = 'primary_contact';
            specificContactId = primaryContact.donor_id;
          } else {
            outreachTarget = 'primary_contact';
            specificContactId = primaryContact.donor_id;
          }

          // Calculate optimal outreach date
          let daysToAdd = 7;
          if (daysSinceActivity < 30) {
            daysToAdd = 14;
          } else if (daysSinceActivity > 90) {
            daysToAdd = 0;
          }
          if (healthStatus === 'at_risk' || healthStatus === 'critical') {
            daysToAdd = 0;
          }

          const outreachDate = new Date();
          outreachDate.setDate(outreachDate.getDate() + daysToAdd);

          // Build queue insights
          const queueInsights = {
            engagement_assessment: `Partnership health: ${healthStatus}. ${daysSinceActivity < 30 ? 'Recently active' : daysSinceActivity < 90 ? 'Moderately active' : 'Needs re-engagement'}.`,
            partnership_opportunities: linkedDonorCount > 3
              ? ['Expand to additional stakeholders', 'Cultivate deeper partnerships']
              : ['Identify key decision makers', 'Build primary contact relationship'],
            key_contacts_strategy: {
              primary_contact: primaryContact ? `${primaryContact.donor_profiles.first_name} ${primaryContact.donor_profiles.last_name}` : 'Not assigned',
              total_contacts: linkedDonorCount,
              recommended_target: outreachTarget
            },
            optimal_timing_rationale: daysSinceActivity < 30
              ? 'Recent activity - allow 2 weeks before next touchpoint'
              : daysSinceActivity > 90
              ? 'Dormant partnership - reach out immediately'
              : 'Standard cultivation cadence',
            suggested_messaging_approach: healthStatus === 'excellent'
              ? 'Thank and recognize, explore expansion'
              : healthStatus === 'at_risk'
              ? 'Re-engage with personalized outreach'
              : 'General partnership cultivation',
            next_best_actions: [
              outreachTarget === 'business_entity' ? 'Send general partnership appreciation email' : `Contact ${outreachTarget === 'primary_contact' ? 'primary contact' : 'specific stakeholder'}`,
              'Review recent donation patterns',
              'Identify engagement opportunities'
            ],
            metrics: {
              linked_donor_count: linkedDonorCount,
              total_partnership_value: business.total_partnership_value || 0,
              days_since_last_activity: daysSinceActivity,
              engagement_breadth_score: breadthScore,
              engagement_vitality_score: vitalityScore,
              engagement_performance_score: performanceScore
            }
          };

          // Generate AI insights for high-priority businesses
          if (priorityScore >= 60) {
            try {
              const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
              if (LOVABLE_API_KEY) {
                const recentDonations = orders?.slice(0, 5).map(o => 
                  `$${(o.total_amount / 100).toFixed(2)} on ${new Date(o.created_at).toLocaleDateString()}`
                ).join(', ');

                const aiPrompt = `Business: ${business.business_name}
Partnership Value: $${((business.total_partnership_value || 0) / 100).toFixed(2)}
Linked Contacts: ${linkedDonorCount} (${linkedDonors?.map(ld => `${ld.donor_profiles.first_name} ${ld.donor_profiles.last_name} - ${ld.role || 'Contact'}`).join(', ')})
Primary Contact: ${primaryContact ? `${primaryContact.donor_profiles.first_name} ${primaryContact.donor_profiles.last_name} - ${primaryContact.role || 'Contact'}` : 'Not assigned'}
Last Activity: ${daysSinceActivity} days ago
Engagement Segment: ${business.engagement_segment || 'new'}
Recent Donations: ${recentDonations || 'None'}
Engagement Scores: Vitality=${vitalityScore}, Breadth=${breadthScore}, Performance=${performanceScore}

Questions:
1. What is the current health of this partnership?
2. What expansion opportunities exist with this business?
3. Who should we reach out to and why?
4. What is the optimal timing for outreach?
5. What messaging approach would resonate best?
6. What are the top 3 next best actions?`;

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
                        content: 'You are a partnership development expert specializing in business relationship cultivation. Analyze the business partnership data and provide actionable recommendations for outreach and engagement. Be specific, strategic, and focus on relationship-building opportunities. Provide clear, concise answers to each question.'
                      },
                      { role: 'user', content: aiPrompt }
                    ],
                  }),
                });

                if (aiResponse.ok) {
                  const aiData = await aiResponse.json();
                  const aiContent = aiData.choices[0]?.message?.content;
                  if (aiContent) {
                    queueInsights.ai_generated_insights = aiContent;
                  }
                }
              }
            } catch (aiError) {
              console.error('AI generation error:', aiError);
            }
          }

          // Upsert queue item
          const { error: upsertError } = await supabaseClient
            .from('business_outreach_queue')
            .upsert({
              business_id: business.id,
              organization_id: organizationId,
              priority_score: priorityScore,
              partnership_health_status: healthStatus,
              expansion_potential_level: expansionPotential,
              recommended_outreach_date: outreachDate.toISOString().split('T')[0],
              recommended_outreach_target: outreachTarget,
              specific_contact_id: specificContactId,
              queue_insights: queueInsights,
              generated_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'business_id'
            });

          if (upsertError) throw upsertError;

          processed++;
          if (priorityScore >= 80) highPriorityCount++;

          queueItems.push({
            business_id: business.id,
            business_name: business.business_name,
            priority_score: priorityScore
          });

        } catch (error) {
          console.error(`Error processing business ${business.id}:`, error);
          failed++;
        }
      }

      // Delay between batches to avoid rate limits
      if (i + 10 < businesses.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: businesses.length,
          processed,
          failed,
          high_priority_count: highPriorityCount
        },
        queue_items: queueItems
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in generate-business-outreach-queue:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});