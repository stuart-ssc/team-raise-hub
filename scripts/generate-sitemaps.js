/**
 * Script to generate static sitemap XML files from database data.
 * Run this locally to generate the sitemap files.
 * 
 * Usage: node scripts/generate-sitemaps.js
 * 
 * This script:
 * 1. Fetches all districts and schools from the database
 * 2. Generates sitemap-districts.xml
 * 3. Generates sitemap-schools-{state}.xml for each state
 * 4. Updates sitemap.xml index
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://tfrebmhionpuowpzedvz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmcmVibWhpb25wdW93cHplZHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMDA0NTksImV4cCI6MjA2ODg3NjQ1OX0.Jw7c0qDfsdvxF3U6IQrjddVxbbRATTLz-RlPw5yYmxY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const stateNames = {
  'AK': 'alaska', 'AL': 'alabama', 'AR': 'arkansas', 'AZ': 'arizona',
  'CA': 'california', 'CO': 'colorado', 'CT': 'connecticut', 'DC': 'district-of-columbia',
  'DE': 'delaware', 'FL': 'florida', 'GA': 'georgia', 'HI': 'hawaii',
  'IA': 'iowa', 'ID': 'idaho', 'IL': 'illinois', 'IN': 'indiana',
  'KS': 'kansas', 'KY': 'kentucky', 'LA': 'louisiana', 'MA': 'massachusetts',
  'MD': 'maryland', 'ME': 'maine', 'MI': 'michigan', 'MN': 'minnesota',
  'MO': 'missouri', 'MS': 'mississippi', 'MT': 'montana', 'NC': 'north-carolina',
  'ND': 'north-dakota', 'NE': 'nebraska', 'NH': 'new-hampshire', 'NJ': 'new-jersey',
  'NM': 'new-mexico', 'NV': 'nevada', 'NY': 'new-york', 'OH': 'ohio',
  'OK': 'oklahoma', 'OR': 'oregon', 'PA': 'pennsylvania', 'RI': 'rhode-island',
  'SC': 'south-carolina', 'SD': 'south-dakota', 'TN': 'tennessee', 'TX': 'texas',
  'UT': 'utah', 'VA': 'virginia', 'VT': 'vermont', 'WA': 'washington',
  'WI': 'wisconsin', 'WV': 'west-virginia', 'WY': 'wyoming'
};

const BASE_URL = 'https://sponsorly.io';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

function escapeXml(str) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
}

function generateUrlEntry(loc, changefreq = 'weekly', priority = '0.6') {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function generateSitemapXml(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

async function fetchAllDistricts() {
  console.log('Fetching all districts...');
  const { data, error } = await supabase
    .from('school_districts')
    .select('state, slug')
    .not('slug', 'is', null)
    .not('state', 'is', null)
    .order('state')
    .order('slug');
  
  if (error) throw error;
  console.log(`Found ${data.length} districts`);
  return data;
}

async function fetchSchoolsByState(stateAbbr) {
  const { data, error } = await supabase
    .from('schools')
    .select('slug')
    .eq('state', stateAbbr)
    .not('slug', 'is', null)
    .order('slug');
  
  if (error) throw error;
  return data;
}

async function generateDistrictsSitemap(districts) {
  console.log('Generating districts sitemap...');
  const urls = districts.map(d => {
    const stateSlug = stateNames[d.state];
    if (!stateSlug) return null;
    return generateUrlEntry(`${BASE_URL}/districts/${stateSlug}/${d.slug}`, 'weekly', '0.6');
  }).filter(Boolean);
  
  const xml = generateSitemapXml(urls);
  const filePath = path.join(PUBLIC_DIR, 'sitemap-districts.xml');
  fs.writeFileSync(filePath, xml);
  console.log(`Created ${filePath} with ${urls.length} URLs`);
}

async function generateSchoolSitemaps() {
  console.log('Generating school sitemaps by state...');
  
  for (const [abbr, stateSlug] of Object.entries(stateNames)) {
    const schools = await fetchSchoolsByState(abbr);
    
    if (schools.length === 0) {
      console.log(`  ${stateSlug}: No schools found, skipping`);
      continue;
    }
    
    const urls = schools.map(s => 
      generateUrlEntry(`${BASE_URL}/schools/${stateSlug}/${s.slug}`, 'weekly', '0.6')
    );
    
    const xml = generateSitemapXml(urls);
    const filePath = path.join(PUBLIC_DIR, `sitemap-schools-${stateSlug}.xml`);
    fs.writeFileSync(filePath, xml);
    console.log(`  Created ${filePath} with ${urls.length} URLs`);
  }
}

function generateSitemapIndex() {
  console.log('Generating sitemap index...');
  const today = new Date().toISOString().split('T')[0];
  
  const sitemaps = [
    `  <sitemap>
    <loc>${BASE_URL}/sitemap-main.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`,
    `  <sitemap>
    <loc>${BASE_URL}/sitemap-districts.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`
  ];
  
  // Add school sitemaps for each state
  for (const stateSlug of Object.values(stateNames)) {
    const filePath = path.join(PUBLIC_DIR, `sitemap-schools-${stateSlug}.xml`);
    if (fs.existsSync(filePath)) {
      sitemaps.push(`  <sitemap>
    <loc>${BASE_URL}/sitemap-schools-${stateSlug}.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`);
    }
  }
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.join('\n')}
</sitemapindex>`;
  
  const filePath = path.join(PUBLIC_DIR, 'sitemap.xml');
  fs.writeFileSync(filePath, xml);
  console.log(`Created ${filePath}`);
}

async function main() {
  try {
    console.log('Starting sitemap generation...\n');
    
    // Generate districts sitemap
    const districts = await fetchAllDistricts();
    await generateDistrictsSitemap(districts);
    
    // Generate school sitemaps by state
    await generateSchoolSitemaps();
    
    // Generate sitemap index
    generateSitemapIndex();
    
    console.log('\nSitemap generation complete!');
  } catch (error) {
    console.error('Error generating sitemaps:', error);
    process.exit(1);
  }
}

main();
