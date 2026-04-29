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
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
// 1200x630 brand card — proper Open Graph dimensions for Facebook/LinkedIn/Twitter.
const STATIC_OG_IMAGE = `${BASE_URL}/lovable-uploads/og-default-1200x630.jpg`;
const FB_APP_ID = '2577576499294352';

interface PageMeta {
  title: string;
  description: string;
  image: string;
  url: string;
  fb_app_id: string;
  image_alt?: string;
  site_name?: string;
}

// Curated meta for static marketing routes. Keys are the exact url.pathname
// (no trailing slash, except `/`).
const STATIC_ROUTES: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Sponsorly — 100% Fundraising for Schools & Non-Profits',
    description: 'The only fundraising platform where 100% of donations go directly to your organization. Built for schools, sports teams, booster clubs, marching bands, PTOs, and nonprofits.',
  },
  '/fundraisers': {
    title: 'Browse Fundraisers — Schools, Teams & Nonprofits | Sponsorly',
    description: 'Discover active fundraisers from schools, sports teams, booster clubs, marching bands, and nonprofits. 100% of donations go directly to the organization.',
  },
  '/fundraisers/sponsorships': {
    title: 'Sponsorship Fundraisers | Sponsorly',
    description: 'Browse local sponsorship fundraisers. Connect businesses with schools, teams, and nonprofits in their community.',
  },
  '/fundraisers/donations': {
    title: 'Donation Fundraisers | Sponsorly',
    description: 'Support schools, teams, and nonprofits with direct donations. 100% of every gift goes to the organization.',
  },
  '/fundraisers/events': {
    title: 'Event Fundraisers | Sponsorly',
    description: 'Galas, auctions, jog-a-thons, tournaments and more — find and support local fundraising events.',
  },
  '/fundraisers/merchandise': {
    title: 'Merchandise Fundraisers | Sponsorly',
    description: 'Buy team gear, spirit wear, and branded merchandise to support schools, teams, clubs, and nonprofits.',
  },
  '/fundraisers/roster': {
    title: 'Team Roster Fundraisers | Sponsorly',
    description: 'Support a player on a roster. Peer-to-peer fundraising built for sports teams, marching bands, and clubs.',
  },
  '/fundraisers/pledge': {
    title: 'Pledge Fundraisers | Sponsorly',
    description: 'Pledge per lap, per mile, per points scored. Performance-based fundraisers for teams and clubs.',
  },
  '/pricing': {
    title: 'Pricing — Free Forever, No Platform Fees | Sponsorly',
    description: 'Sponsorly is free for organizations. 100% of donations go to your school, team, or nonprofit. Donors cover a small optional fee at checkout.',
  },
  '/platform': {
    title: 'The Sponsorly Platform | Sponsorly',
    description: 'Everything you need to run a modern fundraiser: campaigns, donor CRM, payments, communications, and rosters — in one place.',
  },
  '/features': {
    title: 'Features | Sponsorly',
    description: 'Roster fundraisers, sponsor packages, donor CRM, email marketing, peer-to-peer pledges, mobile-friendly checkout, and more.',
  },
  '/who-its-for': {
    title: "Who Sponsorly Is For — Teams, Schools, Nonprofits & Businesses",
    description: 'Sponsorly powers fundraising for sports teams, booster clubs, marching bands, PTOs, academic and arts clubs, and nonprofits — and the businesses that sponsor them.',
  },
  '/schools': {
    title: 'School Fundraising Made Simple | Sponsorly',
    description: 'Modern fundraising for schools, teams, booster clubs, PTOs, and student organizations. 100% of donations go to your school.',
  },
  '/schools/sports-teams': {
    title: 'Sports Team Fundraising | Sponsorly',
    description: 'Roster fundraisers, sponsor packages, team stores, and pledge-per-event events. Fund the season your team deserves.',
  },
  '/schools/booster-clubs': {
    title: 'Booster Club Fundraising | Sponsorly',
    description: 'Tiered sponsor packages, capital campaigns, gala and auction nights — without the binder.',
  },
  '/schools/pto-pta': {
    title: 'PTO & PTA Fundraising | Sponsorly',
    description: 'Direct-give fundraisers, jog-a-thons, spring auctions, and classroom grants. Volunteer-friendly, board-ready.',
  },
  '/schools/marching-bands': {
    title: 'Marching Band Fundraising | Sponsorly',
    description: 'Per-student fair-share, BOA travel funding, program-book ads, and alumni drives — built for a marching budget.',
  },
  '/schools/academic-clubs': {
    title: 'Academic Club Fundraising — Robotics, Debate & More | Sponsorly',
    description: 'Robotics, debate, Science Olympiad, Model UN, FBLA, esports. Travel funds, registration fees, and equipment grants.',
  },
  '/schools/arts-clubs': {
    title: 'Arts Club Fundraising — Theater, Choir & More | Sponsorly',
    description: 'Theater, choir, orchestra, dance, film, and visual arts. Production budgets, season subscriptions, donor lounges, and program-book ads.',
  },
  '/nonprofits': {
    title: 'Nonprofit Fundraising | Sponsorly',
    description: 'Annual appeals, peer-to-peer events, capital campaigns, recurring giving, and major-gift CRM — big-shop tools at small-shop fees.',
  },
  '/for-businesses': {
    title: 'Sponsorly for Businesses | Sponsorly',
    description: 'Reach families and supporters in your community by sponsoring local schools, teams, and nonprofits through Sponsorly.',
  },
  '/contact': {
    title: 'Contact Sponsorly',
    description: 'Get in touch with the Sponsorly team. We respond fast and would love to help your organization start fundraising.',
  },
  '/faq': {
    title: 'Frequently Asked Questions | Sponsorly',
    description: 'Answers about Sponsorly fundraising, payments, fees, tax receipts, organization verification, and more.',
  },
  '/privacy': {
    title: 'Privacy Policy | Sponsorly',
    description: 'How Sponsorly collects, uses, and protects personal information for donors, organizations, and volunteers.',
  },
  '/terms': {
    title: 'Terms of Service | Sponsorly',
    description: 'The terms and conditions for using Sponsorly, including donor and organization responsibilities.',
  },
  '/login': {
    title: 'Log In | Sponsorly',
    description: 'Log in to your Sponsorly account to manage fundraisers, donations, and your organization.',
  },
  '/signup': {
    title: 'Create Your Free Sponsorly Account',
    description: 'Start fundraising with 100% of donations going to your school, team, or nonprofit. Free forever, no credit card required.',
  },
};

function abs(image: string | null | undefined): string {
  if (!image) return STATIC_OG_IMAGE;
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  return `${BASE_URL}${image.startsWith('/') ? '' : '/'}${image}`;
}

function withDefaults(meta: Partial<PageMeta>): PageMeta {
  return {
    title: meta.title || 'Sponsorly',
    description: meta.description || 'Sponsorly — 100% Fundraising for Schools & Non-Profits.',
    image: abs(meta.image),
    url: meta.url || BASE_URL,
    fb_app_id: FB_APP_ID,
    image_alt: meta.image_alt || meta.title || 'Sponsorly',
    site_name: 'Sponsorly',
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let path = url.searchParams.get('path') || '/';
    // Normalize: strip query string, trailing slash (except root).
    path = path.split('?')[0];
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    
    console.log(`Processing meta request for path: ${path}`);

    const respond = (meta: Partial<PageMeta>) =>
      new Response(JSON.stringify(withDefaults(meta)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
      });

    // Static marketing routes — fast path, no DB call.
    if (STATIC_ROUTES[path]) {
      const r = STATIC_ROUTES[path];
      return respond({
        title: r.title,
        description: r.description,
        image: STATIC_OG_IMAGE,
        url: `${BASE_URL}${path}`,
      });
    }

    // Parse path
    const pathParts = path.split('/').filter(Boolean);

    // Lazy supabase client — only construct when needed.
    const getClient = () =>
      createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Route: /c/:slug or /c/:slug/:rosterMemberSlug — campaign landing page.
    if (pathParts[0] === 'c' && pathParts.length >= 2) {
      const slug = pathParts[1];
      const rosterMemberSlug = pathParts[2];
      const supabase = getClient();

      const { data: campaign } = await supabase
        .from('campaigns')
        .select(`
          id, name, description, image_url,
          groups:group_id (
            group_name,
            schools:school_id ( school_name, city, state ),
            organizations:organization_id ( name )
          )
        `)
        .eq('slug', slug)
        .maybeSingle();

      if (campaign) {
        const group: any = Array.isArray((campaign as any).groups)
          ? (campaign as any).groups[0]
          : (campaign as any).groups;
        const school: any = group?.schools && (Array.isArray(group.schools) ? group.schools[0] : group.schools);
        const org: any = group?.organizations && (Array.isArray(group.organizations) ? group.organizations[0] : group.organizations);
        const orgLabel = school?.school_name || org?.name || '';
        const groupLabel = group?.group_name || '';
        const subject = [orgLabel, groupLabel].filter(Boolean).join(' ') || 'this fundraiser';

        let title = `Support ${subject} — ${campaign.name} | Sponsorly`;
        if (rosterMemberSlug) {
          // Roster member personalization — keep title under ~80 chars total.
          const memberName = rosterMemberSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          title = `Support ${memberName} — ${campaign.name} | Sponsorly`;
        }
        const description =
          (campaign.description || `Support ${subject} on Sponsorly. 100% of your donation goes directly to the organization.`).slice(0, 200);

        return respond({
          title: title.slice(0, 110),
          description,
          image: campaign.image_url || STATIC_OG_IMAGE,
          url: `${BASE_URL}/c/${slug}${rosterMemberSlug ? '/' + rosterMemberSlug : ''}`,
          image_alt: campaign.name,
        });
      }
    }

    // Route: /o/:orgSlug — public org hub.
    if (pathParts[0] === 'o' && pathParts.length === 2) {
      const orgSlug = pathParts[1];
      const supabase = getClient();
      const { data: org } = await supabase
        .from('organizations')
        .select('name, city, state, logo_url')
        .eq('slug', orgSlug)
        .maybeSingle();
      if (org) {
        const loc = [org.city, org.state].filter(Boolean).join(', ');
        return respond({
          title: `${org.name} on Sponsorly`,
          description: `Support ${org.name}${loc ? ' in ' + loc : ''}. Browse active fundraisers — 100% of donations go directly to the organization.`,
          image: (org as any).logo_url || STATIC_OG_IMAGE,
          url: `${BASE_URL}/o/${orgSlug}`,
          image_alt: org.name,
        });
      }
    }

    // Route: /g/:orgSlug/:groupSlug — public group hub.
    if (pathParts[0] === 'g' && pathParts.length === 3) {
      const orgSlug = pathParts[1];
      const groupSlug = pathParts[2];
      const supabase = getClient();
      const { data: group } = await supabase
        .from('groups')
        .select(`group_name, slug,
          organizations:organization_id ( name, slug, city, state, logo_url )`)
        .eq('slug', groupSlug)
        .maybeSingle();
      if (group) {
        const org: any = Array.isArray((group as any).organizations)
          ? (group as any).organizations[0]
          : (group as any).organizations;
        const orgName = org?.name || 'Sponsorly';
        return respond({
          title: `${orgName} ${group.group_name} | Sponsorly`,
          description: `Support ${orgName} ${group.group_name}. Browse active fundraisers — 100% of donations go directly to the organization.`,
          image: org?.logo_url || STATIC_OG_IMAGE,
          url: `${BASE_URL}/g/${orgSlug}/${groupSlug}`,
          image_alt: `${orgName} ${group.group_name}`,
        });
      }
    }
    
    // Route: /schools/:state
    if (pathParts[0] === 'schools' && pathParts.length === 2) {
      const stateInfo = getStateInfo(pathParts[1]);
      if (stateInfo) {
        return respond({
          title: `School Fundraising in ${stateInfo.name} | Sponsorly`,
          description: `Empowering ${stateInfo.name} schools and districts with modern fundraising tools. 100% of donations go directly to your school.`,
          image: STATIC_OG_IMAGE,
          url: `${BASE_URL}/schools/${pathParts[1]}`,
        });
      }
    }

    // Route: /schools/:state/:slug (school page)
    if (pathParts[0] === 'schools' && pathParts.length === 3) {
      const stateInfo = getStateInfo(pathParts[1]);
      const schoolSlug = pathParts[2];
      
      if (stateInfo) {
        const supabase = getClient();

        const { data: school } = await supabase
          .from('schools')
          .select('school_name, city, state')
          .eq('slug', schoolSlug)
          .eq('state', stateInfo.abbr)
          .maybeSingle();

        if (school) {
          const location = school.city ? `${school.city}, ${stateInfo.name}` : stateInfo.name;
          return respond({
            title: `${school.school_name} Fundraisers in ${location} | Sponsorly`,
            description: `Support ${school.school_name} in ${location}. 100% of your donation goes directly to the school. No platform fees for organizations.`,
            image: STATIC_OG_IMAGE,
            url: `${BASE_URL}/schools/${pathParts[1]}/${schoolSlug}`,
            image_alt: `${school.school_name} on Sponsorly`,
          });
        }
      }
    }

    // Route: /districts/:state/:slug (district page)
    if (pathParts[0] === 'districts' && pathParts.length === 3) {
      const stateInfo = getStateInfo(pathParts[1]);
      const districtSlug = pathParts[2];
      
      if (stateInfo) {
        const supabase = getClient();

        const { data: district } = await supabase
          .from('school_districts')
          .select('name, state')
          .eq('slug', districtSlug)
          .eq('state', stateInfo.abbr)
          .maybeSingle();

        if (district) {
          return respond({
            title: `${district.name} Fundraising | Sponsorly`,
            description: `Empower schools in ${district.name}, ${stateInfo.name} with modern fundraising. 100% of donations go directly to schools.`,
            image: STATIC_OG_IMAGE,
            url: `${BASE_URL}/districts/${pathParts[1]}/${districtSlug}`,
            image_alt: district.name,
          });
        }
      }
    }

    // Return default meta for unmatched paths
    return respond({
      title: 'Sponsorly — 100% Fundraising for Schools & Non-Profits',
      description: 'The only fundraising platform where 100% of donations go directly to your organization. Perfect for schools, teams, clubs, and non-profits.',
      image: STATIC_OG_IMAGE,
      url: `${BASE_URL}${path}`,
    });

  } catch (error) {
    console.error('Error processing meta request:', error);
    // Never 5xx — crawlers should still get usable defaults.
    return new Response(JSON.stringify(withDefaults({
      title: 'Sponsorly — 100% Fundraising for Schools & Non-Profits',
      description: 'The only fundraising platform where 100% of donations go directly to your organization.',
      image: STATIC_OG_IMAGE,
      url: BASE_URL,
    })), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
