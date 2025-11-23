import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { jsPDF } from "npm:jspdf@2.5.1";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TaxReceiptRequest {
  orderId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const resend = new Resend(resendApiKey);

    const { orderId }: TaxReceiptRequest = await req.json();

    console.log("Generating tax receipt for order:", orderId);

    // Fetch order details with campaign and organization info
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        total_amount,
        created_at,
        customer_name,
        customer_email,
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
      .single();

    if (orderError || !order) {
      console.error("Error fetching order:", orderError);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if this is a nonprofit organization
    const organization = order.campaigns.groups.organizations;
    if (organization.organization_type !== "nonprofit" || !organization.nonprofits?.[0]?.ein) {
      console.log("Not a nonprofit or missing EIN, skipping tax receipt");
      return new Response(
        JSON.stringify({ message: "Tax receipt not applicable" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const nonprofit = organization.nonprofits[0];
    const donationAmount = order.total_amount / 100; // Convert cents to dollars
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

    // Convert PDF to base64
    const pdfBase64 = doc.output("datauristring").split(",")[1];
    const pdfBuffer = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));

    // Send email with PDF attachment
    const emailResult = await resend.emails.send({
      from: "Sponsorly <receipts@sponsorly.io>",
      to: [order.customer_email || ""],
      subject: `Tax Receipt for Your Donation to ${organization.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Thank You for Your Donation!</h1>
          
          <p>Dear ${order.customer_name || "Supporter"},</p>
          
          <p>Thank you for your generous donation of <strong>$${donationAmount.toFixed(2)}</strong> to ${organization.name} on ${donationDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.</p>
          
          <p>Your contribution to the <strong>${order.campaigns.name}</strong> campaign will help support ${order.campaigns.groups.group_name} and make a real difference in our mission.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Tax Receipt Information</h3>
            <p style="margin: 5px 0;"><strong>Receipt Date:</strong> ${donationDate.toLocaleDateString("en-US")}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> $${donationAmount.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>EIN:</strong> ${nonprofit.ein}</p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">
              ${organization.name} is a 501(c)(3) tax-exempt organization. 
              Your donation is tax-deductible to the fullest extent allowed by law.
            </p>
          </div>
          
          <p>Your official tax receipt is attached to this email. Please retain it for your tax records and consult your tax advisor for specific guidance.</p>
          
          <p style="margin-top: 30px;">With gratitude,<br>
          <strong>${organization.name}</strong></p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #666;">
            If you have any questions about this receipt, please contact us at ${organization.email || "our main office"}.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `tax-receipt-${order.id}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    console.log("Tax receipt email sent:", emailResult);

    // Update order to mark tax receipt as issued
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        tax_receipt_issued: true,
        tax_receipt_sent_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order:", updateError);
    }

    return new Response(
      JSON.stringify({ success: true, emailResult }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in generate-tax-receipt function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
