import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate SVG-based OG image
function generateOGImage(type: string, name: string, location: string): string {
  const escapedName = name
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  
  const escapedLocation = location
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  // Truncate name if too long
  const displayName = escapedName.length > 50 ? escapedName.substring(0, 47) + "..." : escapedName;
  
  // Calculate font size based on name length
  const nameFontSize = displayName.length > 35 ? 42 : displayName.length > 25 ? 48 : 56;

  // Type-specific styling
  let typeLabel = "School";
  let typeIcon = "🏫";
  if (type === "district") {
    typeLabel = "School District";
    typeIcon = "🏛️";
  } else if (type === "state") {
    typeLabel = "State";
    typeIcon = "📍";
  }

  const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#22c55e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#16a34a;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  
  <!-- Decorative circles -->
  <circle cx="1100" cy="100" r="200" fill="rgba(255,255,255,0.05)"/>
  <circle cx="100" cy="530" r="150" fill="rgba(255,255,255,0.05)"/>
  <circle cx="900" cy="500" r="100" fill="rgba(255,255,255,0.03)"/>
  
  <!-- Type badge -->
  <rect x="60" y="80" width="${typeLabel.length * 18 + 80}" height="50" rx="25" fill="rgba(255,255,255,0.15)"/>
  <text x="90" y="115" font-family="system-ui, -apple-system, sans-serif" font-size="24" fill="white">
    ${typeIcon} ${typeLabel} Fundraising
  </text>
  
  <!-- Main name -->
  <text x="60" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="${nameFontSize}" font-weight="bold" fill="white">
    ${displayName}
  </text>
  
  <!-- Location -->
  ${location ? `<text x="60" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="32" fill="rgba(255,255,255,0.8)">
    📍 ${escapedLocation}
  </text>` : ""}
  
  <!-- Value prop -->
  <rect x="60" y="400" width="500" height="60" rx="8" fill="url(#accent)"/>
  <text x="85" y="440" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="600" fill="white">
    ✓ 100% of Donations to Programs
  </text>
  
  <!-- Sponsorly branding -->
  <text x="60" y="570" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="bold" fill="white">
    Sponsorly
  </text>
  <text x="245" y="570" font-family="system-ui, -apple-system, sans-serif" font-size="24" fill="rgba(255,255,255,0.7)">
    Modern Fundraising for Schools
  </text>
</svg>`;

  return svg;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "school";
    const name = url.searchParams.get("name") || "School";
    const location = url.searchParams.get("location") || "";

    console.log(`Generating OG image for ${type}: ${name} (${location})`);

    const svg = generateOGImage(type, name, location);

    // Return SVG directly (browsers and social media crawlers handle SVG well)
    // For maximum compatibility, we return as SVG with proper headers
    return new Response(svg, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400, s-maxage=604800", // Cache for 1 day client, 1 week CDN
      },
    });
  } catch (error) {
    console.error("Error generating OG image:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
