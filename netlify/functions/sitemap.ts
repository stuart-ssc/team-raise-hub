import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'https://sponsorly.io';

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

function generateSitemapIndex(): string {
  const today = new Date().toISOString().split('T')[0];
  const sitemapBaseUrl = `${BASE_URL}/sitemaps`;
  
  const sitemaps: string[] = [];
  
  sitemaps.push(`  <sitemap>
    <loc>${escapeXml(sitemapBaseUrl)}/static</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`);
  
  for (const state of ALL_STATES) {
    sitemaps.push(`  <sitemap>
    <loc>${escapeXml(sitemapBaseUrl)}/schools/${state}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`);
  }
  
  for (const state of ALL_STATES) {
    sitemaps.push(`  <sitemap>
    <loc>${escapeXml(sitemapBaseUrl)}/districts/${state}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`);
  }
  
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
  
  for (const page of staticPages) {
    urls.push(`  <url>
    <loc>${escapeXml(BASE_URL + page.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
  }
  
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

async function generateSchoolsSitemap(supabase: ReturnType<typeof createClient>, stateSlug: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  const stateAbbrev = Object.entries(STATE_ABBREV_TO_SLUG).find(([_, slug]) => slug === stateSlug)?.[0];
  
  if (!stateAbbrev) {
    return generateEmptySitemap();
  }
  
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
    
    if (error || !schools || schools.length === 0) {
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
    
    if (schools.length < pageSize) {
      hasMore = false;
    }
    page++;
  }
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

async function generateDistrictsSitemap(supabase: ReturnType<typeof createClient>, stateSlug: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  const stateAbbrev = Object.entries(STATE_ABBREV_TO_SLUG).find(([_, slug]) => slug === stateSlug)?.[0];
  
  if (!stateAbbrev) {
    return generateEmptySitemap();
  }
  
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
    
    if (error || !districts || districts.length === 0) {
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
    
    if (districts.length < pageSize) {
      hasMore = false;
    }
    page++;
  }
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

async function generateCampaignsSitemap(supabase: ReturnType<typeof createClient>, stateSlug: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  const stateAbbrev = Object.entries(STATE_ABBREV_TO_SLUG).find(([_, slug]) => slug === stateSlug)?.[0];
  
  if (!stateAbbrev) {
    return generateEmptySitemap();
  }
  
  const urls: string[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data: campaigns, error } = await supabase
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
      .eq('groups.organizations.state', stateAbbrev)
      .not('slug', 'is', null)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error || !campaigns || campaigns.length === 0) {
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
    
    if (campaigns.length < pageSize) {
      hasMore = false;
    }
    page++;
  }
  
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

// Netlify Function handler
export const handler = async (event: { queryStringParameters: Record<string, string | undefined>, path: string }) => {
  const headers = {
    'Content-Type': 'application/xml',
    'Cache-Control': 'public, max-age=86400',
  };

  try {
    // Parse type and state from query params or path
    let type = event.queryStringParameters?.type || 'index';
    let state = event.queryStringParameters?.state;
    
    // Also parse from path for /sitemaps/schools/kentucky style URLs
    const pathMatch = event.path.match(/\/sitemaps\/(schools|districts|campaigns)\/([^/]+)/);
    if (pathMatch) {
      type = pathMatch[1];
      state = pathMatch[2];
    } else if (event.path.includes('/sitemaps/static')) {
      type = 'static';
    }
    
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || 'https://tfrebmhionpuowpzedvz.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
    
    if (!supabaseKey) {
      console.error('Missing Supabase key');
      return {
        statusCode: 500,
        headers,
        body: generateEmptySitemap(),
      };
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
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
          return { statusCode: 400, headers, body: 'Missing state parameter' };
        }
        sitemap = await generateSchoolsSitemap(supabase, state);
        break;
      case 'districts':
        if (!state) {
          return { statusCode: 400, headers, body: 'Missing state parameter' };
        }
        sitemap = await generateDistrictsSitemap(supabase, state);
        break;
      case 'campaigns':
        if (!state) {
          return { statusCode: 400, headers, body: 'Missing state parameter' };
        }
        sitemap = await generateCampaignsSitemap(supabase, state);
        break;
      default:
        sitemap = generateSitemapIndex();
    }
    
    return {
      statusCode: 200,
      headers,
      body: sitemap,
    };
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return {
      statusCode: 200,
      headers,
      body: generateEmptySitemap(),
    };
  }
};
