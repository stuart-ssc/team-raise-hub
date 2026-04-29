const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 1200x630 Sponsorly brand card — proper OG dimensions for Facebook/LinkedIn/Twitter.
const STATIC_OG_IMAGE = "https://sponsorly.io/lovable-uploads/og-default-1200x630.jpg";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Redirect to static Sponsorly logo
    // This ensures Facebook/Twitter can always download the OG image
    console.log("Redirecting to static Sponsorly logo for OG image");
    
    return Response.redirect(STATIC_OG_IMAGE, 302);
  } catch (error) {
    console.error("Error in generate-og-image:", error);
    // Fallback redirect on any error
    return Response.redirect(STATIC_OG_IMAGE, 302);
  }
});