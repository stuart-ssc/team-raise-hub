import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DOMAIN = "https://sponsorly.io";

const STATES = [
  "alabama", "alaska", "arizona", "arkansas", "california", "colorado", "connecticut",
  "delaware", "florida", "georgia", "hawaii", "idaho", "illinois", "indiana", "iowa",
  "kansas", "kentucky", "louisiana", "maine", "maryland", "massachusetts", "michigan",
  "minnesota", "mississippi", "missouri", "montana", "nebraska", "nevada", "new-hampshire",
  "new-jersey", "new-mexico", "new-york", "north-carolina", "north-dakota", "ohio",
  "oklahoma", "oregon", "pennsylvania", "rhode-island", "south-carolina", "south-dakota",
  "tennessee", "texas", "utah", "vermont", "virginia", "washington", "west-virginia",
  "wisconsin", "wyoming"
];

const STATE_ABBR_MAP: Record<string, string> = {
  "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR", "california": "CA",
  "colorado": "CO", "connecticut": "CT", "delaware": "DE", "florida": "FL", "georgia": "GA",
  "hawaii": "HI", "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA",
  "kansas": "KS", "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
  "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS",
  "missouri": "MO", "montana": "MT", "nebraska": "NE", "nevada": "NV", "new-hampshire": "NH",
  "new-jersey": "NJ", "new-mexico": "NM", "new-york": "NY", "north-carolina": "NC",
  "north-dakota": "ND", "ohio": "OH", "oklahoma": "OK", "oregon": "OR", "pennsylvania": "PA",
  "rhode-island": "RI", "south-carolina": "SC", "south-dakota": "SD", "tennessee": "TN",
  "texas": "TX", "utah": "UT", "vermont": "VT", "virginia": "VA", "washington": "WA",
  "west-virginia": "WV", "wisconsin": "WI", "wyoming": "WY"
};

function xmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    },
  });
}

// Supabase edge function base URL for sitemap references
const SITEMAP_BASE = "https://tfrebmhionpuowpzedvz.supabase.co/functions/v1/generate-sitemap";

function generateSitemapIndex(): string {
  const today = new Date().toISOString().split("T")[0];
  
  let sitemaps = `
    <sitemap><loc>${SITEMAP_BASE}?file=static</loc><lastmod>${today}</lastmod></sitemap>
    <sitemap><loc>${SITEMAP_BASE}?file=states</loc><lastmod>${today}</lastmod></sitemap>
    <sitemap><loc>${SITEMAP_BASE}?file=districts</loc><lastmod>${today}</lastmod></sitemap>
    <sitemap><loc>${SITEMAP_BASE}?file=campaigns</loc><lastmod>${today}</lastmod></sitemap>
  `;
  
  // Add state-specific school sitemaps
  for (const state of STATES) {
    sitemaps += `<sitemap><loc>${SITEMAP_BASE}?file=schools-${state}</loc><lastmod>${today}</lastmod></sitemap>\n`;
  }
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>`;
}

function generateStaticSitemap(): string {
  const today = new Date().toISOString().split("T")[0];
  const staticPages = [
    { url: "/", priority: "1.0", changefreq: "daily" },
    { url: "/schools", priority: "0.9", changefreq: "weekly" },
    { url: "/nonprofits", priority: "0.9", changefreq: "weekly" },
    { url: "/pricing", priority: "0.8", changefreq: "monthly" },
    { url: "/features", priority: "0.8", changefreq: "monthly" },
    { url: "/platform", priority: "0.8", changefreq: "monthly" },
    { url: "/contact", priority: "0.7", changefreq: "monthly" },
    { url: "/login", priority: "0.5", changefreq: "monthly" },
    { url: "/signup", priority: "0.6", changefreq: "monthly" },
    { url: "/terms", priority: "0.3", changefreq: "yearly" },
    { url: "/privacy", priority: "0.3", changefreq: "yearly" },
    { url: "/dpa", priority: "0.3", changefreq: "yearly" },
  ];
  
  const urls = staticPages.map(page => `
  <url>
    <loc>${DOMAIN}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join("");
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function generateStatesSitemap(): string {
  const today = new Date().toISOString().split("T")[0];
  
  const urls = STATES.map(state => `
  <url>
    <loc>${DOMAIN}/schools/${state}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join("");
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

async function generateDistrictsSitemap(supabase: any): Promise<string> {
  const today = new Date().toISOString().split("T")[0];
  
  const { data: districts, error } = await supabase
    .from("school_districts")
    .select("slug, state")
    .not("slug", "is", null)
    .not("state", "is", null);
  
  if (error) {
    console.error("Error fetching districts:", error);
    return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
  }
  
  const urls = (districts || []).map((d: any) => {
    const stateSlug = Object.entries(STATE_ABBR_MAP).find(([_, abbr]) => abbr === d.state)?.[0] || d.state.toLowerCase();
    return `
  <url>
    <loc>${DOMAIN}/districts/${stateSlug}/${d.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join("");
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

async function generateSchoolsSitemap(supabase: any, stateSlug: string): Promise<string> {
  const today = new Date().toISOString().split("T")[0];
  const stateAbbr = STATE_ABBR_MAP[stateSlug];
  
  if (!stateAbbr) {
    return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
  }
  
  const { data: schools, error } = await supabase
    .from("schools")
    .select("slug")
    .eq("state", stateAbbr)
    .not("slug", "is", null);
  
  if (error) {
    console.error("Error fetching schools:", error);
    return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
  }
  
  const urls = (schools || []).map((s: any) => `
  <url>
    <loc>${DOMAIN}/schools/${stateSlug}/${s.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join("");
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

async function generateCampaignsSitemap(supabase: any): Promise<string> {
  const today = new Date().toISOString().split("T")[0];
  
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("slug")
    .eq("status", true)
    .eq("publication_status", "published")
    .not("slug", "is", null);
  
  if (error) {
    console.error("Error fetching campaigns:", error);
    return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
  }
  
  const urls = (campaigns || []).map((c: any) => `
  <url>
    <loc>${DOMAIN}/c/${c.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`).join("");
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const file = url.searchParams.get("file") || "index";
    
    console.log(`Generating sitemap: ${file}`);
    
    // Static sitemaps (no DB needed)
    if (file === "index" || file === "sitemap") {
      return xmlResponse(generateSitemapIndex());
    }
    
    if (file === "static") {
      return xmlResponse(generateStaticSitemap());
    }
    
    if (file === "states") {
      return xmlResponse(generateStatesSitemap());
    }
    
    // Dynamic sitemaps (need DB)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    if (file === "districts") {
      return xmlResponse(await generateDistrictsSitemap(supabase));
    }
    
    if (file === "campaigns") {
      return xmlResponse(await generateCampaignsSitemap(supabase));
    }
    
    // State-specific school sitemaps: schools-kentucky, schools-california, etc.
    if (file.startsWith("schools-")) {
      const stateSlug = file.replace("schools-", "");
      return xmlResponse(await generateSchoolsSitemap(supabase, stateSlug));
    }
    
    // Default to index
    return xmlResponse(generateSitemapIndex());
    
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response("Error generating sitemap", { 
      status: 500,
      headers: corsHeaders 
    });
  }
});
