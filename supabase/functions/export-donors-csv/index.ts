import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExportRequest {
  donorIds: string[];
  columns: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { donorIds, columns }: ExportRequest = await req.json();

    if (!donorIds || !Array.isArray(donorIds) || donorIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid donor IDs" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid columns" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Exporting ${columns.length} columns for ${donorIds.length} donors`);

    // Fetch donor data with only requested columns
    const { data: donors, error: fetchError } = await supabase
      .from("donor_profiles")
      .select(columns.join(","))
      .in("id", donorIds)
      .order("email");

    if (fetchError || !donors) {
      throw new Error("Failed to fetch donor data");
    }

    // Generate CSV header
    const csvHeader = columns.map(col => {
      // Convert snake_case to Title Case
      return col
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }).join(',');

    // Generate CSV rows
    const csvRows = donors.map(donor => {
      return columns.map(col => {
        let value = donor[col];
        
        // Format values
        if (value === null || value === undefined) {
          return '';
        }
        
        if (Array.isArray(value)) {
          value = value.join('; ');
        }
        
        if (col === 'total_donations' || col === 'lifetime_value') {
          value = (Number(value) / 100).toFixed(2);
        }
        
        // Escape commas and quotes in CSV
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
      }).join(',');
    });

    const csv = [csvHeader, ...csvRows].join('\n');

    console.log(`Successfully generated CSV with ${donors.length} rows`);

    return new Response(
      JSON.stringify({
        csv,
        count: donors.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in export-donors-csv function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
