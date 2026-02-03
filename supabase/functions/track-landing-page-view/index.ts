import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrackViewRequest {
  pageType: string;
  pagePath: string;
  schoolId?: string;
  districtId?: string;
  state?: string;
  sessionId?: string;
  referrer?: string;
  userAgent?: string;
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 100;
const rateLimitStore: Map<string, { count: number; resetAt: number }> = new Map();

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count };
}

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function sanitizeString(str: string | undefined, maxLength: number = 500): string | null {
  if (!str) return null;
  return str.substring(0, maxLength).replace(/[<>]/g, '');
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";

    // Check rate limit
    const { allowed, remaining } = checkRateLimit(clientIP);
    if (!allowed) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": "0",
            "Retry-After": "3600",
          },
        }
      );
    }

    // Parse and validate request body
    const body: TrackViewRequest = await req.json();
    
    // Validate required fields
    if (!body.pageType || !body.pagePath) {
      return new Response(
        JSON.stringify({ error: "pageType and pagePath are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate pageType
    const validPageTypes = ['home', 'school', 'district', 'state', 'marketing'];
    if (!validPageTypes.includes(body.pageType)) {
      return new Response(
        JSON.stringify({ error: "Invalid pageType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate UUIDs if provided
    if (body.schoolId && !isValidUUID(body.schoolId)) {
      return new Response(
        JSON.stringify({ error: "Invalid schoolId format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.districtId && !isValidUUID(body.districtId)) {
      return new Response(
        JSON.stringify({ error: "Invalid districtId format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert the page view record
    const { error: insertError } = await supabase
      .from("landing_page_views")
      .insert({
        page_type: body.pageType,
        page_path: sanitizeString(body.pagePath, 500),
        school_id: body.schoolId || null,
        district_id: body.districtId || null,
        state: sanitizeString(body.state, 10),
        session_id: sanitizeString(body.sessionId, 100),
        referrer: sanitizeString(body.referrer, 1000),
        user_agent: sanitizeString(body.userAgent, 500),
      });

    if (insertError) {
      console.error("Error inserting page view:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to track view" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Tracked ${body.pageType} view: ${body.pagePath}`);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": remaining.toString(),
        },
      }
    );
  } catch (error) {
    console.error("Error in track-landing-page-view:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
