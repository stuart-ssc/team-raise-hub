import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExportRequest {
  orderIds: string[];
  columns: string[];
  campaignId?: string;
  campaignIds?: string[];
  format?: "csv" | "xlsx";
  startDate?: string;
  endDate?: string;
  statusFilter?: string;
  includeSummary?: boolean;
  filename?: string;
  organizationId?: string;
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

    const { 
      orderIds, 
      columns, 
      campaignId, 
      campaignIds,
      format = "csv", 
      startDate, 
      endDate,
      statusFilter,
      includeSummary = false,
      filename = "orders-export",
      organizationId
    }: ExportRequest = await req.json();

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

    // Determine which campaign IDs to use
    const targetCampaignIds = campaignIds && campaignIds.length > 0 
      ? campaignIds 
      : campaignId 
        ? [campaignId] 
        : [];

    // Build orders query with optional date and status filtering
    let ordersQuery = supabase
      .from("orders")
      .select("*")
      .in("id", orderIds);

    // Filter by campaign(s)
    if (targetCampaignIds.length === 1) {
      ordersQuery = ordersQuery.eq("campaign_id", targetCampaignIds[0]);
    } else if (targetCampaignIds.length > 1) {
      ordersQuery = ordersQuery.in("campaign_id", targetCampaignIds);
    }

    // Apply date range filter if provided
    if (startDate) {
      ordersQuery = ordersQuery.gte("created_at", startDate);
    }
    if (endDate) {
      // Set end date to end of day (23:59:59.999)
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      ordersQuery = ordersQuery.lte("created_at", endDateTime.toISOString());
    }

    // Apply status filter if provided
    if (statusFilter && statusFilter !== "all") {
      ordersQuery = ordersQuery.eq("status", statusFilter);
    }

    const { data: orders, error: ordersError } = await ordersQuery;

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch orders" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Filters: date=${startDate || 'none'} to ${endDate || 'none'}, status=${statusFilter || 'all'}, found ${orders?.length || 0} orders`);

    // Fetch campaign items for item name lookup (for all target campaigns)
    const { data: campaignItems } = await supabase
      .from("campaign_items")
      .select("id, name, campaign_id")
      .in("campaign_id", targetCampaignIds.length > 0 ? targetCampaignIds : [campaignId || ""]);

    const itemsLookup: Record<string, string> = {};
    campaignItems?.forEach((item: any) => {
      itemsLookup[item.id] = item.name;
    });

    // Fetch campaign names for multi-campaign export
    let campaignNamesLookup: Record<string, string> = {};
    if (columns.includes("campaign_name") && targetCampaignIds.length > 0) {
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("id, name")
        .in("id", targetCampaignIds);
      
      if (campaigns) {
        campaignNamesLookup = Object.fromEntries(
          campaigns.map((c: any) => [c.id, c.name])
        );
      }
    }

    // Handle custom fields
    const customFieldColumns = columns.filter((c: string) => c.startsWith("custom_"));
    const customFieldIds = customFieldColumns.map((c: string) => c.replace("custom_", ""));
    
    let customFieldDefs: Record<string, { field_name: string; field_type: string }> = {};
    let customFieldValues: Record<string, Record<string, string>> = {}; // orderId -> fieldId -> value

    if (customFieldIds.length > 0) {
      // Fetch field definitions
      const { data: fields } = await supabase
        .from("campaign_custom_fields")
        .select("id, field_name, field_type")
        .in("id", customFieldIds);
      
      if (fields) {
        customFieldDefs = Object.fromEntries(
          fields.map((f: any) => [f.id, { field_name: f.field_name, field_type: f.field_type }])
        );
      }

      // Fetch values for all orders
      const { data: values } = await supabase
        .from("order_custom_field_values")
        .select("order_id, field_id, field_value")
        .in("order_id", orderIds)
        .in("field_id", customFieldIds);

      if (values) {
        for (const v of values as any[]) {
          if (!customFieldValues[v.order_id]) {
            customFieldValues[v.order_id] = {};
          }
          customFieldValues[v.order_id][v.field_id] = v.field_value || "";
        }
      }
    }

    // Column label mapping
    const columnLabels: Record<string, string> = {
      campaign_name: "Campaign Name",
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

    // Add custom field labels
    for (const fieldId of customFieldIds) {
      const def = customFieldDefs[fieldId];
      if (def) {
        columnLabels[`custom_${fieldId}`] = def.field_name;
      }
    }

    // Format value for export (returns raw value for Excel, formatted string for CSV)
    const formatValue = (order: any, column: string, forExcel = false): any => {
      let formatted: any = "";

      // Handle campaign_name column
      if (column === "campaign_name") {
        return campaignNamesLookup[order.campaign_id] || "";
      }

      // Handle custom fields
      if (column.startsWith("custom_")) {
        const fieldId = column.replace("custom_", "");
        const orderValues = customFieldValues[order.id] || {};
        const rawValue = orderValues[fieldId] || "";
        const fieldDef = customFieldDefs[fieldId];
        
        if (fieldDef) {
          switch (fieldDef.field_type) {
            case "checkbox":
              formatted = rawValue === "true" ? "Yes" : rawValue === "false" ? "No" : rawValue;
              break;
            case "date":
              if (rawValue) {
                try {
                  const date = new Date(rawValue);
                  formatted = forExcel ? date : date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });
                } catch {
                  formatted = rawValue;
                }
              }
              break;
            default:
              formatted = rawValue;
          }
        } else {
          formatted = rawValue;
        }
      } else {
        // Handle standard fields
        const value = order[column];
        if (value === null || value === undefined) {
          formatted = "";
        } else {
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
              if (forExcel) {
                formatted = Number(value); // Return raw number for Excel
              } else {
                formatted = `$${Number(value).toFixed(2)}`;
              }
              break;

            case "created_at":
              const date = new Date(value);
              formatted = forExcel ? date : date.toLocaleDateString("en-US", {
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
        }
      }

      return formatted;
    };

    // CSV escape function
    const escapeForCsv = (value: any): string => {
      const str = String(value);
      if (str.includes('"') || str.includes(",") || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Calculate summary values
    const calculateSummary = () => {
      const summary: Record<string, any> = {};
      
      for (const col of columns) {
        switch (col) {
          case "customer_name":
          case "campaign_name":
            summary[col] = "TOTAL";
            break;
          case "items_total":
            const total = orders.reduce((sum, order) => sum + (Number(order.items_total) || 0), 0);
            summary[col] = total;
            break;
          case "customer_email":
            summary[col] = `${orders.length} orders`;
            break;
          case "files_complete":
            const completeCount = orders.filter(o => o.files_complete === true).length;
            summary[col] = `${completeCount}/${orders.length} complete`;
            break;
          default:
            summary[col] = "";
        }
      }
      
      return summary;
    };

    console.log(`Exporting ${orders.length} orders for campaign(s) ${targetCampaignIds.join(', ')} as ${format}, includeSummary=${includeSummary}`);

    if (format === "xlsx") {
      // Generate Excel
      const headers = columns.map((col) => columnLabels[col] || col);
      const rows = orders.map((order: any) => {
        return columns.map((col) => formatValue(order, col, true));
      });

      // Add summary row if requested
      if (includeSummary && orders.length > 0) {
        const summaryData = calculateSummary();
        const summaryRow = columns.map((col) => {
          const val = summaryData[col];
          if (col === "items_total") return val; // Keep as number for Excel
          return val;
        });
        rows.push(summaryRow);
      }

      // Create worksheet
      const wsData = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths
      const colWidths = columns.map((col) => {
        if (col === "items" || col === "shipping_address") return { wch: 40 };
        if (col === "customer_email") return { wch: 25 };
        if (col === "campaign_name") return { wch: 25 };
        if (col === "items_total") return { wch: 12 };
        return { wch: 18 };
      });
      ws["!cols"] = colWidths;

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Orders");

      // Write to buffer and encode as base64
      const xlsxBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      const base64 = btoa(String.fromCharCode(...new Uint8Array(xlsxBuffer)));

      // Log export to history if organizationId provided
      if (organizationId) {
        await logExportHistory(supabase, {
          organizationId,
          userId: user.id,
          campaignId: targetCampaignIds.length === 1 ? targetCampaignIds[0] : null,
          campaignIds: targetCampaignIds.length > 1 ? targetCampaignIds : null,
          format: "xlsx",
          columns,
          filters: { statusFilter, startDate, endDate, includeSummary },
          orderCount: orders.length,
          filename,
        });
      }

      return new Response(
        JSON.stringify({ xlsx: base64, count: orders.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Generate CSV
      const header = columns.map((col) => columnLabels[col] || col).join(",");
      const rows = orders.map((order: any) => {
        return columns.map((col) => escapeForCsv(formatValue(order, col, false))).join(",");
      });

      // Add summary row if requested
      if (includeSummary && orders.length > 0) {
        const summaryData = calculateSummary();
        const summaryRow = columns.map((col) => {
          const val = summaryData[col];
          if (col === "items_total") return `$${Number(val).toFixed(2)}`;
          return escapeForCsv(val);
        }).join(",");
        rows.push(summaryRow);
      }

      const csv = [header, ...rows].join("\n");

      // Log export to history if organizationId provided
      if (organizationId) {
        await logExportHistory(supabase, {
          organizationId,
          userId: user.id,
          campaignId: targetCampaignIds.length === 1 ? targetCampaignIds[0] : null,
          campaignIds: targetCampaignIds.length > 1 ? targetCampaignIds : null,
          format: "csv",
          columns,
          filters: { statusFilter, startDate, endDate, includeSummary },
          orderCount: orders.length,
          filename,
        });
      }

      return new Response(
        JSON.stringify({ csv, count: orders.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Export error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to log export to history table
async function logExportHistory(
  supabase: any,
  data: {
    organizationId: string;
    userId: string;
    campaignId: string | null;
    campaignIds: string[] | null;
    format: string;
    columns: string[];
    filters: any;
    orderCount: number;
    filename: string;
  }
) {
  try {
    await supabase.from("order_export_history").insert({
      organization_id: data.organizationId,
      user_id: data.userId,
      campaign_id: data.campaignId,
      campaign_ids: data.campaignIds,
      export_format: data.format,
      columns: data.columns,
      filters: data.filters,
      order_count: data.orderCount,
      filename: data.filename,
    });
    console.log("Export history logged successfully");
  } catch (error) {
    console.error("Failed to log export history:", error);
    // Don't throw - logging failure shouldn't stop the export
  }
}
