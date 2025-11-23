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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { organizationId, groupId } = await req.json();

    if (!organizationId) {
      return new Response(JSON.stringify({ error: 'Organization ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user belongs to organization
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build donor query
    let donorQuery = supabase
      .from('donor_profiles')
      .select(`
        *,
        donor_activity_log(activity_type, created_at)
      `)
      .eq('organization_id', organizationId)
      .order('lifetime_value', { ascending: false });

    // Apply group filter if specified
    if (groupId && groupId !== 'all') {
      const { data: groupOrders } = await supabase
        .from('orders')
        .select('customer_email')
        .in('status', ['succeeded', 'completed'])
        .eq('campaigns.group_id', groupId);
      
      if (groupOrders && groupOrders.length > 0) {
        const emails = groupOrders.map(o => o.customer_email).filter(Boolean);
        donorQuery = donorQuery.in('email', emails);
      }
    }

    const { data: donors, error: donorsError } = await donorQuery;

    if (donorsError) {
      console.error('Error fetching donors:', donorsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch donors' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${donors?.length || 0} donors for organization ${organizationId}`);

    const results = {
      total: donors?.length || 0,
      processed: 0,
      failed: 0,
      insights: [] as any[]
    };

    // Process donors in batches of 10 to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < (donors?.length || 0); i += batchSize) {
      const batch = donors!.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (donor) => {
        try {
          // Fetch donation history
          const { data: orders } = await supabase
            .from('orders')
            .select('total_amount, created_at, campaigns(name, group_id)')
            .eq('customer_email', donor.email)
            .in('status', ['succeeded', 'completed'])
            .order('created_at', { ascending: false })
            .limit(20);

          // Calculate donor metrics
          const donationAmounts = orders?.map(o => o.total_amount / 100) || [];
          const avgDonation = donationAmounts.length > 0 
            ? donationAmounts.reduce((a, b) => a + b, 0) / donationAmounts.length 
            : 0;

          const daysSinceLastDonation = donor.last_donation_date 
            ? Math.floor((Date.now() - new Date(donor.last_donation_date).getTime()) / (1000 * 60 * 60 * 24))
            : null;

          // Calculate retention risk
          let retentionRisk = 'low';
          let riskScore = 0;
          
          if (!daysSinceLastDonation) {
            retentionRisk = 'low';
            riskScore = 1;
          } else if (daysSinceLastDonation > 365) {
            retentionRisk = 'high';
            riskScore = 3;
          } else if (daysSinceLastDonation > 180) {
            retentionRisk = 'medium';
            riskScore = 2;
          } else {
            retentionRisk = 'low';
            riskScore = 1;
          }

          // Calculate potential value score
          const lifetimeValue = donor.lifetime_value / 100;
          const potentialValue = Math.max(avgDonation * 1.2, lifetimeValue * 0.1);
          const valueScore = lifetimeValue > 1000 ? 3 : lifetimeValue > 500 ? 2 : 1;

          // Calculate engagement score
          const engagementScore = donor.engagement_score || 0;
          const engagementMultiplier = engagementScore > 70 ? 1.5 : engagementScore > 40 ? 1.2 : 1.0;

          // Calculate priority score (0-100)
          const priorityScore = Math.min(100, Math.round(
            (riskScore * 25) + // Risk: 25-75 points
            (valueScore * 15) + // Value: 15-45 points
            (engagementScore * 0.3) * engagementMultiplier // Engagement: 0-30 points
          ));

          // Determine optimal contact date
          const daysUntilContact = daysSinceLastDonation 
            ? Math.max(1, Math.min(30, Math.floor(daysSinceLastDonation / 10)))
            : 7;
          
          const optimalContactDate = new Date();
          optimalContactDate.setDate(optimalContactDate.getDate() + daysUntilContact);

          // Generate AI insights for high-priority donors
          let aiInsights = null;
          if (priorityScore > 60) {
            try {
              const donorContext = {
                profile: {
                  name: `${donor.first_name || ''} ${donor.last_name || ''}`.trim() || 'Anonymous',
                  lifetimeValue,
                  donationCount: donor.donation_count,
                  daysSinceLastDonation,
                  engagementScore: donor.engagement_score,
                  rfmSegment: donor.rfm_segment,
                },
                patterns: {
                  averageDonation: avgDonation,
                  recentCampaigns: orders?.slice(0, 5).map(o => o.campaigns?.name).filter(Boolean) || [],
                }
              };

              const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${lovableApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'google/gemini-2.5-flash',
                  messages: [
                    {
                      role: 'system',
                      content: 'You are a donor relationship expert. Provide a brief, actionable engagement strategy in 2-3 sentences.'
                    },
                    {
                      role: 'user',
                      content: `Donor: ${donorContext.profile.name}, Lifetime Value: $${lifetimeValue.toFixed(2)}, Last donation: ${daysSinceLastDonation} days ago, Segment: ${donorContext.profile.rfmSegment}. What's the best engagement approach?`
                    }
                  ],
                }),
              });

              if (aiResponse.ok) {
                const aiData = await aiResponse.json();
                aiInsights = aiData.choices?.[0]?.message?.content;
              }
            } catch (aiError) {
              console.error('AI generation error:', aiError);
            }
          }

          // Store insights
          const { error: insertError } = await supabase
            .from('donor_insights')
            .upsert({
              donor_id: donor.id,
              organization_id: organizationId,
              priority_score: priorityScore,
              retention_risk_level: retentionRisk,
              suggested_ask_amount: Math.round(potentialValue * 100),
              optimal_contact_date: optimalContactDate.toISOString().split('T')[0],
              insights: {
                engagement_strategy: aiInsights,
                metrics: {
                  lifetime_value: lifetimeValue,
                  avg_donation: avgDonation,
                  donation_count: donor.donation_count,
                  days_since_last: daysSinceLastDonation,
                  engagement_score: engagementScore
                }
              },
              generated_at: new Date().toISOString()
            }, {
              onConflict: 'donor_id'
            });

          if (insertError) {
            console.error('Error inserting insight:', insertError);
            results.failed++;
          } else {
            results.processed++;
            results.insights.push({
              donor_id: donor.id,
              name: `${donor.first_name || ''} ${donor.last_name || ''}`.trim(),
              priority_score: priorityScore,
              retention_risk: retentionRisk
            });
          }
        } catch (error) {
          console.error(`Error processing donor ${donor.id}:`, error);
          results.failed++;
        }
      }));

      // Small delay between batches to avoid rate limits
      if (i + batchSize < (donors?.length || 0)) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Batch processing complete: ${results.processed} processed, ${results.failed} failed`);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-batch-insights:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});