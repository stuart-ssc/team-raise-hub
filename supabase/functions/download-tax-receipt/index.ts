import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { jsPDF } from "npm:jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DownloadReceiptRequest {
  orderId: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { orderId, email }: DownloadReceiptRequest = await req.json();

    console.log("Downloading tax receipt for order:", orderId);

    // Fetch order details with verification
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        total_amount,
        created_at,
        customer_name,
        customer_email,
        tax_receipt_issued,
        campaigns!inner(
          name,
          groups!inner(
            group_name,
            organizations!inner(
              id,
              name,
              organization_type,
              email,
              phone,
              city,
              state,
              zip,
              nonprofits(
                ein,
                mission_statement
              )
            )
          )
        )
      `)
      .eq("id", orderId)
      .eq("customer_email", email.toLowerCase())
      .single();

    if (orderError || !order) {
      console.error("Error fetching order:", orderError);
      return new Response(
        JSON.stringify({ error: "Receipt not found or access denied" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify this is a nonprofit with a tax receipt
    const organization = order.campaigns.groups.organizations;
    if (organization.organization_type !== "nonprofit" || !order.tax_receipt_issued) {
      return new Response(
        JSON.stringify({ error: "Tax receipt not available" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const nonprofit = organization.nonprofits[0];
    const donationAmount = order.total_amount / 100;
    const donationDate = new Date(order.created_at);

    // Generate PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(organization.name, pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    if (organization.city && organization.state) {
      doc.text(`${organization.city}, ${organization.state} ${organization.zip || ""}`, pageWidth / 2, 28, { align: "center" });
    }
    if (organization.phone) {
      doc.text(`Phone: ${organization.phone}`, pageWidth / 2, 35, { align: "center" });
    }
    if (organization.email) {
      doc.text(`Email: ${organization.email}`, pageWidth / 2, 42, { align: "center" });
    }

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("TAX RECEIPT FOR CHARITABLE CONTRIBUTION", pageWidth / 2, 55, { align: "center" });

    // Receipt details
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    let yPos = 70;

    doc.text(`Receipt Date: ${donationDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 20, yPos);
    yPos += 10;
    
    doc.text(`Donor: ${order.customer_name || "Anonymous"}`, 20, yPos);
    yPos += 10;

    doc.text(`Donation Amount: $${donationAmount.toFixed(2)}`, 20, yPos);
    yPos += 10;

    doc.text(`Campaign: ${order.campaigns.name}`, 20, yPos);
    yPos += 10;

    doc.text(`Program: ${order.campaigns.groups.group_name}`, 20, yPos);
    yPos += 20;

    // IRS-required statements
    doc.setFont("helvetica", "bold");
    doc.text("501(c)(3) Tax-Exempt Organization", 20, yPos);
    yPos += 8;
    
    doc.setFont("helvetica", "normal");
    doc.text(`EIN: ${nonprofit.ein}`, 20, yPos);
    yPos += 15;

    // Tax deductibility statement
    const deductibilityText = `${organization.name} is a tax-exempt organization under Section 501(c)(3) of the Internal Revenue Code. ` +
      `Your contribution is tax-deductible to the fullest extent allowed by law.`;
    const splitDeductibility = doc.splitTextToSize(deductibilityText, pageWidth - 40);
    doc.text(splitDeductibility, 20, yPos);
    yPos += splitDeductibility.length * 6 + 10;

    // Goods and services statement
    const goodsServicesText = "No goods or services were provided in exchange for this contribution.";
    doc.text(goodsServicesText, 20, yPos);
    yPos += 15;

    // Record keeping notice
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    const noticeText = "Please retain this receipt for your tax records. Consult your tax advisor for specific guidance " +
      "regarding the deductibility of charitable contributions.";
    const splitNotice = doc.splitTextToSize(noticeText, pageWidth - 40);
    doc.text(splitNotice, 20, yPos);

    // Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Receipt ID: ${order.id}`, 20, 280);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-US")}`, pageWidth - 20, 280, { align: "right" });

    // Return PDF as blob
    const pdfBlob = doc.output("arraybuffer");

    return new Response(pdfBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="tax-receipt-${order.id}.pdf"`,
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in download-tax-receipt function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
