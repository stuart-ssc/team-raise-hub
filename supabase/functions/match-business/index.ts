import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role key to bypass RLS for business search
    // This allows unauthenticated checkout users to find existing businesses
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { businessData } = await req.json();
    const { business_name, ein, business_email, business_phone } = businessData;

    console.log('Matching business:', businessData);

    // Exact EIN match (highest confidence)
    if (ein) {
      const { data: einMatch } = await supabaseClient
        .from('businesses')
        .select('*')
        .eq('ein', ein)
        .maybeSingle();

      if (einMatch) {
        return new Response(
          JSON.stringify({ 
            matches: [{ ...einMatch, confidence: 100, matchReason: 'Exact EIN match' }] 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fuzzy name matching
    const { data: allBusinesses } = await supabaseClient
      .from('businesses')
      .select('*');

    const matches: any[] = [];

    if (allBusinesses && business_name) {
      for (const business of allBusinesses) {
        let confidence = 0;
        const reasons: string[] = [];

        // Name similarity (case-insensitive, remove special chars)
        const cleanName1 = business_name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanName2 = business.business_name.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        if (cleanName1 === cleanName2) {
          confidence += 60;
          reasons.push('Exact name match');
        } else if (cleanName2.includes(cleanName1) || cleanName1.includes(cleanName2)) {
          confidence += 40;
          reasons.push('Partial name match');
        } else {
          // Levenshtein distance
          const distance = levenshteinDistance(cleanName1, cleanName2);
          const maxLen = Math.max(cleanName1.length, cleanName2.length);
          const similarity = 1 - (distance / maxLen);
          if (similarity > 0.7) {
            confidence += Math.floor(similarity * 40);
            reasons.push('Similar name');
          }
        }

        // Email domain match
        if (business_email && business.business_email) {
          const domain1 = business_email.split('@')[1]?.toLowerCase();
          const domain2 = business.business_email.split('@')[1]?.toLowerCase();
          if (domain1 && domain2 && domain1 === domain2) {
            confidence += 30;
            reasons.push('Same email domain');
          }
        }

        // Phone number match
        if (business_phone && business.business_phone) {
          const cleanPhone1 = business_phone.replace(/\D/g, '');
          const cleanPhone2 = business.business_phone.replace(/\D/g, '');
          if (cleanPhone1 === cleanPhone2) {
            confidence += 10;
            reasons.push('Same phone number');
          }
        }

        if (confidence >= 60) {
          matches.push({
            ...business,
            confidence,
            matchReason: reasons.join(', ')
          });
        }
      }
    }

    // Sort by confidence and return top 3
    matches.sort((a, b) => b.confidence - a.confidence);
    const topMatches = matches.slice(0, 3);

    return new Response(
      JSON.stringify({ matches: topMatches }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error matching business:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Levenshtein distance algorithm
function levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }
  
  return track[str2.length][str1.length];
}
