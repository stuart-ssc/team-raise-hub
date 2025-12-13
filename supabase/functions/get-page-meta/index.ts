import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// State name mappings
const stateNames: Record<string, string> = {
  'al': 'Alabama', 'ak': 'Alaska', 'az': 'Arizona', 'ar': 'Arkansas', 'ca': 'California',
  'co': 'Colorado', 'ct': 'Connecticut', 'de': 'Delaware', 'fl': 'Florida', 'ga': 'Georgia',
  'hi': 'Hawaii', 'id': 'Idaho', 'il': 'Illinois', 'in': 'Indiana', 'ia': 'Iowa',
  'ks': 'Kansas', 'ky': 'Kentucky', 'la': 'Louisiana', 'me': 'Maine', 'md': 'Maryland',
  'ma': 'Massachusetts', 'mi': 'Michigan', 'mn': 'Minnesota', 'ms': 'Mississippi', 'mo': 'Missouri',
  'mt': 'Montana', 'ne': 'Nebraska', 'nv': 'Nevada', 'nh': 'New Hampshire', 'nj': 'New Jersey',
  'nm': 'New Mexico', 'ny': 'New York', 'nc': 'North Carolina', 'nd': 'North Dakota', 'oh': 'Ohio',
  'ok': 'Oklahoma', 'or': 'Oregon', 'pa': 'Pennsylvania', 'ri': 'Rhode Island', 'sc': 'South Carolina',
  'sd': 'South Dakota', 'tn': 'Tennessee', 'tx': 'Texas', 'ut': 'Utah', 'vt': 'Vermont',
  'va': 'Virginia', 'wa': 'Washington', 'wv': 'West Virginia', 'wi': 'Wisconsin', 'wy': 'Wyoming'
};

// Reverse mapping: full name slug to abbreviation
const stateAbbreviations: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
  'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
  'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
  'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new-hampshire': 'NH', 'new-jersey': 'NJ',
  'new-mexico': 'NM', 'new-york': 'NY', 'north-carolina': 'NC', 'north-dakota': 'ND', 'ohio': 'OH',
  'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode-island': 'RI', 'south-carolina': 'SC',
  'south-dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
  'virginia': 'VA', 'washington': 'WA', 'west-virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
};

function getStateInfo(stateSlug: string): { abbr: string; name: string } | null {
  // Check if it's an abbreviation
  const lowerSlug = stateSlug.toLowerCase();
  if (stateNames[lowerSlug]) {
    return { abbr: lowerSlug.toUpperCase(), name: stateNames[lowerSlug] };
  }
  // Check if it's a full name slug
  if (stateAbbreviations[lowerSlug]) {
    const abbr = stateAbbreviations[lowerSlug];
    return { abbr, name: stateNames[abbr.toLowerCase()] };
  }
  return null;
}

const BASE_URL = 'https://sponsorly.io';
// Use static Sponsorly logo for reliable OG images that always work
const STATIC_OG_IMAGE = `${BASE_URL}/lovable-uploads/Sponsorly-Logo.png`;

interface PageMeta {
  title: string;
  description: string;
  image: string;
  url: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get('path') || '/';
    
    console.log(`Processing meta request for path: ${path}`);

    // Default meta
    const defaultMeta: PageMeta = {
      title: 'Sponsorly - 100% Fundraising for Schools & Non-Profits',
      description: 'The only fundraising platform where 100% of donations go directly to your organization. Perfect for schools, teams, clubs, and non-profits.',
      image: STATIC_OG_IMAGE,
      url: BASE_URL
    };

    // Parse path
    const pathParts = path.split('/').filter(Boolean);
    
    // Route: /schools/:state
    if (pathParts[0] === 'schools' && pathParts.length === 2) {
      const stateInfo = getStateInfo(pathParts[1]);
      if (stateInfo) {
        const meta: PageMeta = {
          title: `School Fundraising in ${stateInfo.name} | Sponsorly`,
          description: `Empowering ${stateInfo.name} schools and districts with modern fundraising tools. 100% of donations go directly to your school.`,
          image: STATIC_OG_IMAGE,
          url: `${BASE_URL}/schools/${pathParts[1]}`
        };
        return new Response(JSON.stringify(meta), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Route: /schools/:state/:slug (school page)
    if (pathParts[0] === 'schools' && pathParts.length === 3) {
      const stateInfo = getStateInfo(pathParts[1]);
      const schoolSlug = pathParts[2];
      
      if (stateInfo) {
        // Lookup school from database
        const supabase = createClient(
          SUPABASE_URL,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        const { data: school } = await supabase
          .from('schools')
          .select('school_name, city, state')
          .eq('slug', schoolSlug)
          .eq('state', stateInfo.abbr)
          .single();

        if (school) {
          const location = school.city ? `${school.city}, ${stateInfo.name}` : stateInfo.name;
          const meta: PageMeta = {
            title: `${school.school_name} Fundraising | Sponsorly`,
            description: `Support ${school.school_name} in ${location}. 100% of your donation goes directly to the school. No platform fees for organizations.`,
            image: STATIC_OG_IMAGE,
            url: `${BASE_URL}/schools/${pathParts[1]}/${schoolSlug}`
          };
          return new Response(JSON.stringify(meta), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // Route: /districts/:state/:slug (district page)
    if (pathParts[0] === 'districts' && pathParts.length === 3) {
      const stateInfo = getStateInfo(pathParts[1]);
      const districtSlug = pathParts[2];
      
      if (stateInfo) {
        // Lookup district from database
        const supabase = createClient(
          SUPABASE_URL,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        const { data: district } = await supabase
          .from('school_districts')
          .select('name, state')
          .eq('slug', districtSlug)
          .eq('state', stateInfo.abbr)
          .single();

        if (district) {
          const meta: PageMeta = {
            title: `${district.name} Fundraising | Sponsorly`,
            description: `Empower schools in ${district.name}, ${stateInfo.name} with modern fundraising. 100% of donations go directly to schools.`,
            image: STATIC_OG_IMAGE,
            url: `${BASE_URL}/districts/${pathParts[1]}/${districtSlug}`
          };
          return new Response(JSON.stringify(meta), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // Return default meta for unmatched paths
    return new Response(JSON.stringify(defaultMeta), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing meta request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
