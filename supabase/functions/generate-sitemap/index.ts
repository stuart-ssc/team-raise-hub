import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml',
  'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
};

const BASE_URL = 'https://sponsorly.io';

// All 50 US states + DC
const ALL_STATES = [
  'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut',
  'delaware', 'district-of-columbia', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois',
  'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts',
  'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada',
  'new-hampshire', 'new-jersey', 'new-mexico', 'new-york', 'north-carolina', 'north-dakota',
  'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode-island', 'south-carolina', 'south-dakota',
  'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west-virginia',
  'wisconsin', 'wyoming',
];

// State abbreviation to slug mapping
const STATE_ABBREV_TO_SLUG: Record<string, string> = {
  'AL': 'alabama', 'AK': 'alaska', 'AZ': 'arizona', 'AR': 'arkansas', 'CA': 'california',
  'CO': 'colorado', 'CT': 'connecticut', 'DE': 'delaware', 'DC': 'district-of-columbia',
  'FL': 'florida', 'GA': 'georgia', 'HI': 'hawaii', 'ID': 'idaho', 'IL': 'illinois',
  'IN': 'indiana', 'IA': 'iowa', 'KS': 'kansas', 'KY': 'kentucky', 'LA': 'louisiana',
  'ME': 'maine', 'MD': 'maryland', 'MA': 'massachusetts', 'MI': 'michigan', 'MN': 'minnesota',
  'MS': 'mississippi', 'MO': 'missouri', 'MT': 'montana', 'NE': 'nebraska', 'NV': 'nevada',
  'NH': 'new-hampshire', 'NJ': 'new-jersey', 'NM': 'new-mexico', 'NY': 'new-york',
  'NC': 'north-carolina', 'ND': 'north-dakota', 'OH': 'ohio', 'OK': 'oklahoma', 'OR': 'oregon',
  'PA': 'pennsylvania', 'RI': 'rhode-island', 'SC': 'south-carolina', 'SD': 'south-dakota',
  'TN': 'tennessee', 'TX': 'texas', 'UT': 'utah', 'VT': 'vermont', 'VA': 'virginia',
  'WA': 'washington', 'WV': 'west-virginia', 'WI': 'wisconsin', 'WY': 'wyoming',
};

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getStateSlug(stateAbbrev: string): string {
  return STATE_ABBREV_TO_SLUG[stateAbbrev.toUpperCase()] || stateAbbrev.toLowerCase();
}

// Generate sitemap index pointing to all sub-sitemaps
function generateSitemapIndex(): string {
  const today = new Date().toISOString().split('T')[0];
  const sitemapBaseUrl = 'https://sponsorly.io/sitemaps';
  
  const sitemaps: string[] = [];
  
  // Static sitemap
  sitemaps.push(`  <sitemap>
    <loc>${escapeXml(sitemapBaseUrl)}/static</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`);
  
  // Schools sitemaps by state
  for (const state of ALL_STATES) {
    sitemaps.push(`  <sitemap>
    <loc>${escapeXml(sitemapBaseUrl)}/schools/${state}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`);
  }
  
  // Districts sitemaps by state
  for (const state of ALL_STATES) {
    sitemaps.push(`  <sitemap>
    <loc>${escapeXml(sitemapBaseUrl)}/districts/${state}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`);
  }
  
  // Campaigns sitemaps by state
  for (const state of ALL_STATES) {
    sitemaps.push(`  <sitemap>
    <loc>${escapeXml(sitemapBaseUrl)}/campaigns/${state}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`);
  }
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.join('\n')}
</sitemapindex>`;
}

// Generate static pages sitemap
function generateStaticSitemap(): string {
  const today = new Date().toISOString().split('T')[0];
  
  const staticPages = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/schools', priority: '0.9', changefreq: 'weekly' },
    { path: '/nonprofits', priority: '0.9', changefreq: 'weekly' },
    { path: '/pricing', priority: '0.8', changefreq: 'monthly' },
    { path: '/features', priority: '0.8', changefreq: 'monthly' },
    { path: '/platform', priority: '0.7', changefreq: 'monthly' },
    { path: '/contact', priority: '0.6', changefreq: 'monthly' },
    { path: '/terms', priority: '0.3', changefreq: 'yearly' },
    { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
  ];
  
  const urls: string[] = [];
  
  // Static pages
  for (const page of staticPages) {
    urls.push(`  <url>
    <loc>${escapeXml(BASE_URL + page.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
  }
  
  // State landing pages
  for (const stateSlug of ALL_STATES) {
    urls.push(`  <url>
    <loc>${escapeXml(BASE_URL + '/schools/' + stateSlug)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
  }
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

// Generate schools sitemap for a specific state
async function generateSchoolsSitemap(supabase: any, stateSlug: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  const stateAbbrev = Object.entries(STATE_ABBREV_TO_SLUG).find(([_, slug]) => slug === stateSlug)?.[0];
  
  if (!stateAbbrev) {
    console.log(`Invalid state slug: ${stateSlug}`);
    return generateEmptySitemap();
  }
  
  console.log(`Fetching schools for state: ${stateAbbrev}`);
  
  // Fetch all schools for this state (paginated to handle large datasets)
  const urls: string[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data: schools, error } = await supabase
      .from('schools')
      .select('slug, state, updated_at')
      .eq('state', stateAbbrev)
      .not('slug', 'is', null)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error) {
      console.error(`Error fetching schools for ${stateAbbrev}:`, error);
      break;
    }
    
    if (!schools || schools.length === 0) {
      hasMore = false;
      break;
    }
    
    for (const school of schools) {
      if (school.slug) {
        const lastmod = school.updated_at 
          ? new Date(school.updated_at).toISOString().split('T')[0] 
          : today;
        urls.push(`  <url>
    <loc>${escapeXml(BASE_URL + '/schools/' + stateSlug + '/' + school.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
      }
    }
    
    console.log(`Fetched ${schools.length} schools for ${stateAbbrev} (page ${page + 1})`);
    
    if (schools.length < pageSize) {
      hasMore = false;
    }
    page++;
  }
  
  console.log(`Total schools for ${stateAbbrev}: ${urls.length}`);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

// Generate districts sitemap for a specific state
async function generateDistrictsSitemap(supabase: any, stateSlug: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  const stateAbbrev = Object.entries(STATE_ABBREV_TO_SLUG).find(([_, slug]) => slug === stateSlug)?.[0];
  
  if (!stateAbbrev) {
    console.log(`Invalid state slug: ${stateSlug}`);
    return generateEmptySitemap();
  }
  
  console.log(`Fetching districts for state: ${stateAbbrev}`);
  
  const urls: string[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data: districts, error } = await supabase
      .from('school_districts')
      .select('slug, state, updated_at')
      .eq('state', stateAbbrev)
      .not('slug', 'is', null)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error) {
      console.error(`Error fetching districts for ${stateAbbrev}:`, error);
      break;
    }
    
    if (!districts || districts.length === 0) {
      hasMore = false;
      break;
    }
    
    for (const district of districts) {
      if (district.slug) {
        const lastmod = district.updated_at 
          ? new Date(district.updated_at).toISOString().split('T')[0] 
          : today;
        urls.push(`  <url>
    <loc>${escapeXml(BASE_URL + '/districts/' + stateSlug + '/' + district.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
      }
    }
    
    console.log(`Fetched ${districts.length} districts for ${stateAbbrev} (page ${page + 1})`);
    
    if (districts.length < pageSize) {
      hasMore = false;
    }
    page++;
  }
  
  console.log(`Total districts for ${stateAbbrev}: ${urls.length}`);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

// Generate campaigns sitemap for a specific state
async function generateCampaignsSitemap(supabase: any, stateSlug?: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  
  // Get state abbreviation from slug if provided
  let stateAbbrev: string | undefined;
  if (stateSlug) {
    stateAbbrev = Object.entries(STATE_ABBREV_TO_SLUG).find(([_, slug]) => slug === stateSlug)?.[0];
    if (!stateAbbrev) {
      console.log(`Invalid state slug for campaigns: ${stateSlug}`);
      return generateEmptySitemap();
    }
  }
  
  console.log(`Fetching published campaigns${stateAbbrev ? ` for state: ${stateAbbrev}` : ''}`);
  
  const urls: string[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    // Build query - campaigns → groups → organizations → state
    let query = supabase
      .from('campaigns')
      .select(`
        slug,
        updated_at,
        groups!inner(
          organization_id,
          organizations!inner(state)
        )
      `)
      .eq('publication_status', 'published')
      .not('slug', 'is', null);
    
    // Filter by state if provided
    if (stateAbbrev) {
      query = query.eq('groups.organizations.state', stateAbbrev);
    }
    
    const { data: campaigns, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error) {
      console.error(`Error fetching campaigns${stateAbbrev ? ` for ${stateAbbrev}` : ''}:`, error);
      break;
    }
    
    if (!campaigns || campaigns.length === 0) {
      hasMore = false;
      break;
    }
    
    for (const campaign of campaigns) {
      if (campaign.slug) {
        const lastmod = campaign.updated_at 
          ? new Date(campaign.updated_at).toISOString().split('T')[0] 
          : today;
        urls.push(`  <url>
    <loc>${escapeXml(BASE_URL + '/c/' + campaign.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);
      }
    }
    
    console.log(`Fetched ${campaigns.length} campaigns${stateAbbrev ? ` for ${stateAbbrev}` : ''} (page ${page + 1})`);
    
    if (campaigns.length < pageSize) {
      hasMore = false;
    }
    page++;
  }
  
  console.log(`Total campaigns${stateAbbrev ? ` for ${stateAbbrev}` : ''}: ${urls.length}`);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

function generateEmptySitemap(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'index';
    const state = url.searchParams.get('state');
    
    console.log(`Generating sitemap: type=${type}, state=${state}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let sitemap: string;

    switch (type) {
      case 'index':
        sitemap = generateSitemapIndex();
        break;
      case 'static':
        sitemap = generateStaticSitemap();
        break;
      case 'schools':
        if (!state) {
          return new Response('Missing state parameter', { status: 400 });
        }
        sitemap = await generateSchoolsSitemap(supabase, state);
        break;
      case 'districts':
        if (!state) {
          return new Response('Missing state parameter', { status: 400 });
        }
        sitemap = await generateDistrictsSitemap(supabase, state);
        break;
      case 'campaigns':
        if (!state) {
          return new Response('Missing state parameter', { status: 400 });
        }
        sitemap = await generateCampaignsSitemap(supabase, state);
        break;
      default:
        sitemap = generateSitemapIndex();
    }

    return new Response(sitemap, {
      headers: corsHeaders,
      status: 200,
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(generateEmptySitemap(), { 
      headers: corsHeaders, 
      status: 200 
    });
  }
});
