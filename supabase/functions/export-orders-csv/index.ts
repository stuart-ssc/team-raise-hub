import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExportRequest {
  orderIds: string[];
  columns: string[];
  campaignId: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const { orderIds, columns, campaignId }: ExportRequest = await req.json();

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No order IDs provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      return new Response(
        JSON.stringify({ error: "No columns specified" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch orders
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .in("id", orderIds)
      .eq("campaign_id", campaignId);

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch orders" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch campaign items for item name lookup
    const { data: campaignItems } = await supabase
      .from("campaign_items")
      .select("id, name")
      .eq("campaign_id", campaignId);

    const itemsLookup: Record<string, string> = {};
    campaignItems?.forEach((item: any) => {
      itemsLookup[item.id] = item.name;
    });

    // Column label mapping
    const columnLabels: Record<string, string> = {
      customer_name: "Customer Name",
      customer_email: "Customer Email",
      customer_phone: "Customer Phone",
      items: "Items Purchased",
      items_total: "Amount",
      created_at: "Order Date",
      files_complete: "Files Status",
      status: "Payment Status",
      shipping_address: "Shipping Address",
      business_purchase: "Business Purchase",
      tax_receipt_issued: "Tax Receipt Issued",
    };

    // Generate CSV header
    const header = columns.map((col) => columnLabels[col] || col).join(",");

    // Format value for CSV
    const formatValue = (value: any, column: string): string => {
      if (value === null || value === undefined) return "";

      let formatted = "";

      switch (column) {
        case "items":
          try {
            const parsed = typeof value === "string" ? JSON.parse(value) : value;
            if (Array.isArray(parsed)) {
              formatted = parsed
                .map((item: any) => {
                  const name = item.campaign_item_id && itemsLookup[item.campaign_item_id]
                    ? itemsLookup[item.campaign_item_id]
                    : item.name || item.item_name || "Unknown";
                  const qty = item.quantity || 1;
                  const size = item.size || item.variant_size;
                  return size ? `${name} (${size}) x${qty}` : `${name} x${qty}`;
                })
                .join("; ");
            }
          } catch {
            formatted = String(value);
          }
          break;

        case "items_total":
          formatted = `$${Number(value).toFixed(2)}`;
          break;

        case "created_at":
          formatted = new Date(value).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
          break;

        case "files_complete":
          formatted = value === true ? "Complete" : "Pending";
          break;

        case "business_purchase":
        case "tax_receipt_issued":
          formatted = value === true ? "Yes" : "No";
          break;

        case "shipping_address":
          try {
            const addr = typeof value === "string" ? JSON.parse(value) : value;
            if (addr && typeof addr === "object") {
              const parts = [
                addr.line1,
                addr.line2,
                addr.city,
                addr.state,
                addr.postal_code,
                addr.country,
              ].filter(Boolean);
              formatted = parts.join(", ");
            }
          } catch {
            formatted = String(value);
          }
          break;

        default:
          formatted = String(value);
      }

      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (formatted.includes('"') || formatted.includes(",") || formatted.includes("\n")) {
        formatted = `"${formatted.replace(/"/g, '""')}"`;
      }

      return formatted;
    };

    // Generate CSV rows
    const rows = orders.map((order: any) => {
      return columns.map((col) => formatValue(order[col], col)).join(",");
    });

    const csv = [header, ...rows].join("\n");

    console.log(`Exported ${orders.length} orders for campaign ${campaignId}`);

    return new Response(
      JSON.stringify({ csv, count: orders.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Export error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
