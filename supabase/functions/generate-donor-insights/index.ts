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
    const { donorId } = await req.json();

    if (!donorId) {
      return new Response(JSON.stringify({ error: 'Donor ID is required' }), {
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

    // Fetch donor profile
    const { data: donor, error: donorError } = await supabase
      .from('donor_profiles')
      .select('*')
      .eq('id', donorId)
      .single();

    if (donorError) {
      console.error('Error fetching donor:', donorError);
      return new Response(JSON.stringify({ error: 'Failed to fetch donor data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch donation history
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('total_amount, created_at, campaigns(name, group_id)')
      .eq('customer_email', donor.email)
      .in('status', ['succeeded', 'completed'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
    }

    // Fetch recent activity
    const { data: activities, error: activitiesError } = await supabase
      .from('donor_activity_log')
      .select('activity_type, activity_data, created_at')
      .eq('donor_id', donorId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
    }

    // Analyze donation patterns
    const donationAmounts = orders?.map(o => o.total_amount / 100) || [];
    const avgDonation = donationAmounts.length > 0 
      ? donationAmounts.reduce((a, b) => a + b, 0) / donationAmounts.length 
      : 0;
    
    // Analyze day of week and time patterns
    const donationDates = orders?.map(o => new Date(o.created_at)) || [];
    const dayOfWeekCounts: { [key: number]: number } = {};
    const hourCounts: { [key: number]: number } = {};
    
    donationDates.forEach(date => {
      const day = date.getDay(); // 0-6 (Sunday-Saturday)
      const hour = date.getHours(); // 0-23
      dayOfWeekCounts[day] = (dayOfWeekCounts[day] || 0) + 1;
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const mostCommonDay = Object.keys(dayOfWeekCounts).length > 0
      ? parseInt(Object.entries(dayOfWeekCounts).sort((a, b) => b[1] - a[1])[0][0])
      : null;
    
    const mostCommonHour = Object.keys(hourCounts).length > 0
      ? parseInt(Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0])
      : null;

    // Calculate days since last donation
    const daysSinceLastDonation = donor.last_donation_date 
      ? Math.floor((Date.now() - new Date(donor.last_donation_date).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Email engagement data
    const emailEngagement = activities?.filter(a => 
      a.activity_type === 'email_opened' || a.activity_type === 'email_clicked'
    ) || [];

    // Build context for AI
    const donorContext = {
      profile: {
        name: `${donor.first_name || ''} ${donor.last_name || ''}`.trim() || 'Anonymous',
        email: donor.email,
        lifetimeValue: donor.lifetime_value / 100,
        donationCount: donor.donation_count,
        firstDonation: donor.first_donation_date,
        lastDonation: donor.last_donation_date,
        daysSinceLastDonation,
        engagementScore: donor.engagement_score,
        rfmSegment: donor.rfm_segment,
        preferredCommunication: donor.preferred_communication,
        tags: donor.tags,
      },
      patterns: {
        averageDonation: avgDonation,
        donationAmounts: donationAmounts.slice(0, 10),
        mostCommonDayOfWeek: mostCommonDay,
        mostCommonHour: mostCommonHour,
        recentCampaigns: orders?.slice(0, 5).map(o => o.campaigns?.name).filter(Boolean) || [],
        emailEngagementRate: emailEngagement.length > 0 
          ? (emailEngagement.filter(a => a.activity_type === 'email_opened').length / emailEngagement.length) * 100
          : 0,
      },
      recentActivity: activities?.slice(0, 10).map(a => ({
        type: a.activity_type,
        date: a.created_at,
      })) || [],
    };

    // Generate insights using Lovable AI with structured output
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
            content: `You are an expert donor relationship analyst for nonprofits and fundraising organizations. 
Analyze donor giving patterns and engagement history to provide actionable, data-driven recommendations.
Your insights should be specific, personalized, and help maximize donor retention and lifetime value.`
          },
          {
            role: 'user',
            content: `Analyze this donor's profile and provide personalized engagement recommendations:

${JSON.stringify(donorContext, null, 2)}

Provide specific, actionable recommendations based on their giving patterns, engagement history, and behavior.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_donor_insights",
              description: "Generate personalized donor engagement recommendations",
              parameters: {
                type: "object",
                properties: {
                  bestTimeToReachOut: {
                    type: "object",
                    properties: {
                      dayOfWeek: { 
                        type: "string",
                        description: "Best day of the week to reach out (e.g., 'Tuesday', 'Thursday')"
                      },
                      timeOfDay: { 
                        type: "string",
                        description: "Best time of day (e.g., 'morning', 'afternoon', 'evening')"
                      },
                      reason: { 
                        type: "string",
                        description: "Data-driven explanation of why this timing is optimal"
                      }
                    },
                    required: ["dayOfWeek", "timeOfDay", "reason"]
                  },
                  optimalAskAmount: {
                    type: "object",
                    properties: {
                      amount: { 
                        type: "number",
                        description: "Recommended donation ask amount in dollars"
                      },
                      range: {
                        type: "object",
                        properties: {
                          min: { type: "number" },
                          max: { type: "number" }
                        },
                        required: ["min", "max"]
                      },
                      reasoning: { 
                        type: "string",
                        description: "Explanation based on their giving history and capacity"
                      }
                    },
                    required: ["amount", "range", "reasoning"]
                  },
                  messagingStrategy: {
                    type: "object",
                    properties: {
                      tone: { 
                        type: "string",
                        description: "Recommended communication tone (e.g., 'warm and personal', 'professional', 'grateful')"
                      },
                      focusAreas: {
                        type: "array",
                        items: { type: "string" },
                        description: "Key topics or themes to emphasize (2-4 items)"
                      },
                      sampleSubjectLines: {
                        type: "array",
                        items: { type: "string" },
                        description: "3 personalized email subject line suggestions"
                      },
                      keyMessages: {
                        type: "array",
                        items: { type: "string" },
                        description: "2-3 key talking points to include"
                      }
                    },
                    required: ["tone", "focusAreas", "sampleSubjectLines", "keyMessages"]
                  },
                  retentionRisk: {
                    type: "object",
                    properties: {
                      level: { 
                        type: "string",
                        enum: ["low", "medium", "high"],
                        description: "Current risk of donor churning"
                      },
                      indicators: {
                        type: "array",
                        items: { type: "string" },
                        description: "Specific behavioral indicators of churn risk"
                      },
                      interventions: {
                        type: "array",
                        items: { type: "string" },
                        description: "Recommended actions to reduce churn risk"
                      }
                    },
                    required: ["level", "indicators", "interventions"]
                  },
                  nextBestActions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        action: { type: "string" },
                        priority: { 
                          type: "string",
                          enum: ["high", "medium", "low"]
                        },
                        timeline: { type: "string" },
                        expectedImpact: { type: "string" }
                      },
                      required: ["action", "priority", "timeline", "expectedImpact"]
                    },
                    description: "3-5 prioritized next steps for engaging this donor"
                  }
                },
                required: ["bestTimeToReachOut", "optimalAskAmount", "messagingStrategy", "retentionRisk", "nextBestActions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_donor_insights" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI service credits exhausted. Please add credits to continue.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Failed to generate insights' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    
    // Extract the structured output from tool call
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.arguments) {
      console.error('No tool call in response:', JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: 'Invalid AI response format' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const insights = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ 
      insights,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-donor-insights:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
