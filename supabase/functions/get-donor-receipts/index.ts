import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DonorReceiptsRequest {
  email: string;
  year?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { email, year }: DonorReceiptsRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Fetching receipts for donor:", email, "year:", year);

    // Fetch orders with tax receipts for this email
    let query = supabase
      .from("orders")
      .select(`
        id,
        total_amount,
        created_at,
        customer_name,
        customer_email,
        tax_receipt_issued,
        tax_receipt_sent_at,
        campaigns!inner(
          name,
          groups!inner(
            group_name,
            organizations!inner(
              name,
              organization_type,
              nonprofits(
                ein
              )
            )
          )
        )
      `)
      .eq("customer_email", email.toLowerCase())
      .eq("tax_receipt_issued", true)
      .in("status", ["succeeded", "completed"])
      .order("created_at", { ascending: false });

    // Filter by year if provided
    if (year) {
      const startDate = `${year}-01-01T00:00:00Z`;
      const endDate = `${year}-12-31T23:59:59Z`;
      query = query.gte("created_at", startDate).lte("created_at", endDate);
    }

    const { data: orders, error: ordersError } = await query;

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch receipts" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Filter to only nonprofit donations
    const receipts = (orders || [])
      .filter(order => order.campaigns?.groups?.organizations?.organization_type === "nonprofit")
      .map(order => ({
        id: order.id,
        date: order.created_at,
        amount: order.total_amount / 100,
        campaign_name: order.campaigns.name,
        organization_name: order.campaigns.groups.organizations.name,
        program_name: order.campaigns.groups.group_name,
        ein: order.campaigns.groups.organizations.nonprofits?.[0]?.ein || "N/A",
        donor_name: order.customer_name,
      }));

    console.log(`Found ${receipts.length} tax receipts for ${email}`);

    return new Response(
      JSON.stringify({ receipts }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in get-donor-receipts function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
