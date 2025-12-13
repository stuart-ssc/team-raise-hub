import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// State abbreviation to slug mappings
const stateToSlug: Record<string, string> = {
  'AL': 'alabama', 'AK': 'alaska', 'AZ': 'arizona', 'AR': 'arkansas',
  'CA': 'california', 'CO': 'colorado', 'CT': 'connecticut', 'DE': 'delaware',
  'DC': 'district-of-columbia', 'FL': 'florida', 'GA': 'georgia', 'HI': 'hawaii',
  'ID': 'idaho', 'IL': 'illinois', 'IN': 'indiana', 'IA': 'iowa',
  'KS': 'kansas', 'KY': 'kentucky', 'LA': 'louisiana', 'ME': 'maine',
  'MD': 'maryland', 'MA': 'massachusetts', 'MI': 'michigan', 'MN': 'minnesota',
  'MS': 'mississippi', 'MO': 'missouri', 'MT': 'montana', 'NE': 'nebraska',
  'NV': 'nevada', 'NH': 'new-hampshire', 'NJ': 'new-jersey', 'NM': 'new-mexico',
  'NY': 'new-york', 'NC': 'north-carolina', 'ND': 'north-dakota', 'OH': 'ohio',
  'OK': 'oklahoma', 'OR': 'oregon', 'PA': 'pennsylvania', 'PR': 'puerto-rico',
  'RI': 'rhode-island', 'SC': 'south-carolina', 'SD': 'south-dakota', 'TN': 'tennessee',
  'TX': 'texas', 'UT': 'utah', 'VT': 'vermont', 'VA': 'virginia', 'VI': 'virgin-islands',
  'WA': 'washington', 'WV': 'west-virginia', 'WI': 'wisconsin', 'WY': 'wyoming'
};

const SUPABASE_URL = "https://tfrebmhionpuowpzedvz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmcmVibWhpb25wdW93cHplZHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMDA0NTksImV4cCI6MjA2ODg3NjQ1OX0.Jw7c0qDfsdvxF3U6IQrjddVxbbRATTLz-RlPw5yYmxY";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateUrlset(urls: Array<{ loc: string; priority?: string }>): string {
  const entries = urls.map(u => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <changefreq>weekly</changefreq>
    <priority>${u.priority || '0.6'}</priority>
  </url>`).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
}

async function fetchAllRecords(table: string, columns: string, filter?: { column: string; value: string }) {
  const records: any[] = [];
  let offset = 0;
  const limit = 1000;
  
  while (true) {
    let query = supabase.from(table).select(columns).not('slug', 'is', null);
    if (filter) {
      query = query.eq(filter.column, filter.value);
    }
    const { data, error } = await query.order('slug').range(offset, offset + limit - 1);
    
    if (error) {
      console.error(`Error fetching ${table}:`, error.message);
      break;
    }
    if (!data || data.length === 0) break;
    
    records.push(...data);
    offset += limit;
    if (data.length < limit) break;
  }
  
  return records;
}

async function generateSitemaps() {
  const publicDir = resolve(__dirname, '../public');
  
  console.log('Fetching districts...');
  const districts = await fetchAllRecords('school_districts', 'state, slug');
  console.log(`Found ${districts.length} districts`);
  
  // Generate districts sitemap
  const districtUrls = districts
    .filter(d => d.state && stateToSlug[d.state])
    .map(d => ({
      loc: `https://sponsorly.io/districts/${stateToSlug[d.state]}/${d.slug}`,
      priority: '0.6'
    }));
  
  writeFileSync(resolve(publicDir, 'sitemap-districts.xml'), generateUrlset(districtUrls));
  console.log(`Created sitemap-districts.xml with ${districtUrls.length} URLs`);
  
  // Get unique states
  console.log('\nFetching schools by state...');
  const { data: statesData } = await supabase
    .from('schools')
    .select('state')
    .not('slug', 'is', null)
    .not('state', 'is', null);
  
  const uniqueStates = [...new Set(statesData?.map(s => s.state) || [])].filter(Boolean).sort() as string[];
  console.log(`Found ${uniqueStates.length} states`);
  
  const schoolSitemapFiles: string[] = [];
  let totalSchools = 0;
  
  // Generate per-state school sitemaps
  for (const state of uniqueStates) {
    const stateSlug = stateToSlug[state];
    if (!stateSlug) {
      console.log(`Skipping unknown state: ${state}`);
      continue;
    }
    
    const schools = await fetchAllRecords('schools', 'slug', { column: 'state', value: state });
    if (schools.length === 0) continue;
    
    totalSchools += schools.length;
    
    const urls = schools.map(s => ({
      loc: `https://sponsorly.io/schools/${stateSlug}/${s.slug}`,
      priority: '0.6'
    }));
    
    const filename = `sitemap-schools-${state.toLowerCase()}.xml`;
    writeFileSync(resolve(publicDir, filename), generateUrlset(urls));
    schoolSitemapFiles.push(filename);
    console.log(`Created ${filename} with ${urls.length} URLs`);
  }
  
  console.log(`\nTotal schools: ${totalSchools}`);
  
  // Generate sitemap index
  const allSitemaps = [
    'sitemap-static.xml',
    'sitemap-states.xml',
    'sitemap-districts.xml',
    ...schoolSitemapFiles
  ];
  
  const indexContent = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allSitemaps.map(f => `  <sitemap>
    <loc>https://sponsorly.io/${f}</loc>
  </sitemap>`).join('\n')}
</sitemapindex>`;
  
  writeFileSync(resolve(publicDir, 'sitemap.xml'), indexContent);
  console.log(`\nCreated sitemap.xml index with ${allSitemaps.length} sitemaps`);
  console.log('\nSitemap generation complete!');
}

generateSitemaps().catch(console.error);
