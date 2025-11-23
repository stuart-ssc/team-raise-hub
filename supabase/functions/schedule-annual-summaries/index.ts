import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log("Starting annual tax summary batch processing...");

    // Get the previous year
    const currentDate = new Date();
    const year = currentDate.getFullYear() - 1;
    const startDate = `${year}-01-01T00:00:00Z`;
    const endDate = `${year}-12-31T23:59:59Z`;

    console.log(`Processing donations for year: ${year}`);

    // Get all unique donor emails who received tax receipts last year
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        customer_email,
        customer_name,
        campaigns!inner(
          groups!inner(
            organizations!inner(
              organization_type
            )
          )
        )
      `)
      .eq("tax_receipt_issued", true)
      .in("status", ["succeeded", "completed"])
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .not("customer_email", "is", null);

    if (ordersError) {
      throw ordersError;
    }

    // Filter for nonprofit donations and get unique emails
    const nonprofitOrders = orders.filter(
      order => order.campaigns?.groups?.organizations?.organization_type === "nonprofit"
    );

    const uniqueDonors = new Map<string, string>();
    nonprofitOrders.forEach(order => {
      if (order.customer_email && !uniqueDonors.has(order.customer_email)) {
        uniqueDonors.set(order.customer_email, order.customer_name || "Valued Donor");
      }
    });

    console.log(`Found ${uniqueDonors.size} unique donors to process`);

    if (uniqueDonors.size === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No donors to process",
          processed: 0 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Process donors in batches
    const batchSize = 50;
    const donorArray = Array.from(uniqueDonors.keys());
    let processed = 0;
    let failed = 0;

    for (let i = 0; i < donorArray.length; i += batchSize) {
      const batch = donorArray.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(donorArray.length / batchSize)}`);

      // Process batch in parallel
      const batchPromises = batch.map(async (email) => {
        try {
          // Call send-annual-tax-summary function
          const response = await fetch(`${supabaseUrl}/functions/v1/send-annual-tax-summary`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceRoleKey}`,
            },
            body: JSON.stringify({ email, year }),
          });

          if (!response.ok) {
            const error = await response.text();
            console.error(`Failed to send to ${email}:`, error);
            return { success: false, email };
          }

          console.log(`Successfully sent to ${email}`);
          return { success: true, email };
        } catch (error) {
          console.error(`Error sending to ${email}:`, error);
          return { success: false, email };
        }
      });

      const results = await Promise.allSettled(batchPromises);
      
      results.forEach(result => {
        if (result.status === "fulfilled" && result.value.success) {
          processed++;
        } else {
          failed++;
        }
      });

      // Add delay between batches to avoid rate limiting
      if (i + batchSize < donorArray.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`Batch processing complete. Processed: ${processed}, Failed: ${failed}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        year,
        total_donors: uniqueDonors.size,
        processed,
        failed,
        message: `Annual tax summaries sent to ${processed} donors for year ${year}`
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in schedule-annual-summaries:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
