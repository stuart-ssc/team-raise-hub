import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml',
  'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
};

const BASE_URL = 'https://sponsorly.io';

// Static pages with their priorities and change frequencies
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generating sitemap...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const urls: Array<{ loc: string; lastmod?: string; changefreq: string; priority: string }> = [];

    // Add static pages
    const today = new Date().toISOString().split('T')[0];
    for (const page of staticPages) {
      urls.push({
        loc: `${BASE_URL}${page.path}`,
        lastmod: today,
        changefreq: page.changefreq,
        priority: page.priority,
      });
    }

    // Fetch published school landing pages
    const { data: schoolConfigs, error: schoolError } = await supabase
      .from('landing_page_configs')
      .select(`
        entity_id,
        updated_at,
        schools!inner(slug, state)
      `)
      .eq('entity_type', 'school')
      .eq('is_published', true);

    if (schoolError) {
      console.error('Error fetching school configs:', schoolError);
    } else if (schoolConfigs) {
      console.log(`Found ${schoolConfigs.length} published school pages`);
      for (const config of schoolConfigs) {
        const school = config.schools as unknown as { slug: string; state: string };
        if (school?.slug && school?.state) {
          urls.push({
            loc: `${BASE_URL}/schools/${school.state.toLowerCase()}/${school.slug}`,
            lastmod: config.updated_at ? new Date(config.updated_at).toISOString().split('T')[0] : today,
            changefreq: 'weekly',
            priority: '0.7',
          });
        }
      }
    }

    // Fetch published district landing pages
    const { data: districtConfigs, error: districtError } = await supabase
      .from('landing_page_configs')
      .select(`
        entity_id,
        updated_at,
        school_districts!inner(slug, state)
      `)
      .eq('entity_type', 'district')
      .eq('is_published', true);

    if (districtError) {
      console.error('Error fetching district configs:', districtError);
    } else if (districtConfigs) {
      console.log(`Found ${districtConfigs.length} published district pages`);
      for (const config of districtConfigs) {
        const district = config.school_districts as unknown as { slug: string; state: string };
        if (district?.slug && district?.state) {
          urls.push({
            loc: `${BASE_URL}/districts/${district.state.toLowerCase()}/${district.slug}`,
            lastmod: config.updated_at ? new Date(config.updated_at).toISOString().split('T')[0] : today,
            changefreq: 'weekly',
            priority: '0.7',
          });
        }
      }
    }

    // Fetch published campaign landing pages
    const { data: campaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select('slug, updated_at')
      .eq('publication_status', 'published')
      .not('slug', 'is', null);

    if (campaignError) {
      console.error('Error fetching campaigns:', campaignError);
    } else if (campaigns) {
      console.log(`Found ${campaigns.length} published campaigns`);
      for (const campaign of campaigns) {
        if (campaign.slug) {
          urls.push({
            loc: `${BASE_URL}/c/${campaign.slug}`,
            lastmod: campaign.updated_at ? new Date(campaign.updated_at).toISOString().split('T')[0] : today,
            changefreq: 'daily',
            priority: '0.8',
          });
        }
      }
    }

    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    console.log(`Generated sitemap with ${urls.length} URLs`);

    return new Response(sitemap, {
      headers: corsHeaders,
      status: 200,
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`,
      { headers: corsHeaders, status: 200 }
    );
  }
});

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
