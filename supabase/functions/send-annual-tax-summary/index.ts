import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { jsPDF } from "npm:jspdf@2.5.1";
import { Resend } from "npm:resend@4.0.0";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { AnnualSummaryEmail } from "./_templates/annual-summary.tsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendAnnualSummaryRequest {
  email: string;
  year: number;
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

    const { email, year }: SendAnnualSummaryRequest = await req.json();

    console.log("Sending annual tax summary to:", email, "for year:", year);

    // Fetch all donations for the year
    const startDate = `${year}-01-01T00:00:00Z`;
    const endDate = `${year}-12-31T23:59:59Z`;

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        total_amount,
        created_at,
        customer_name,
        campaigns!inner(
          name,
          groups!inner(
            group_name,
            organizations!inner(
              name,
              organization_type,
              city,
              state,
              zip,
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
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .order("created_at", { ascending: true });

    if (ordersError || !orders || orders.length === 0) {
      console.log("No donations found for", email);
      return new Response(
        JSON.stringify({ error: "No donations found for this year" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Filter nonprofit donations and calculate totals
    const donations = orders
      .filter(order => order.campaigns?.groups?.organizations?.organization_type === "nonprofit")
      .map(order => ({
        id: order.id,
        date: new Date(order.created_at),
        amount: order.total_amount / 100,
        campaign_name: order.campaigns.name,
        organization_name: order.campaigns.groups.organizations.name,
        program_name: order.campaigns.groups.group_name,
        ein: order.campaigns.groups.organizations.nonprofits?.[0]?.ein || "N/A",
        city: order.campaigns.groups.organizations.city,
        state: order.campaigns.groups.organizations.state,
        zip: order.campaigns.groups.organizations.zip,
      }));

    if (donations.length === 0) {
      return new Response(
        JSON.stringify({ error: "No nonprofit donations found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const donorName = orders[0]?.customer_name || "Valued Donor";
    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);

    // Group by organization
    const donationsByOrg = donations.reduce((acc, donation) => {
      const orgName = donation.organization_name;
      if (!acc[orgName]) {
        acc[orgName] = {
          ein: donation.ein,
          donations: [],
          total: 0,
          city: donation.city,
          state: donation.state,
          zip: donation.zip,
        };
      }
      acc[orgName].donations.push(donation);
      acc[orgName].total += donation.amount;
      return acc;
    }, {} as Record<string, any>);

    const organizations = Object.entries(donationsByOrg).map(([name, data]) => ({
      name,
      amount: data.total,
      count: data.donations.length,
    }));

    // Generate PDF (using existing logic)
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // PDF generation (simplified for brevity - reuse logic from generate-annual-tax-summary)
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(`${year} Annual Charitable Contributions Summary`, pageWidth / 2, yPos, { align: "center" });
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("For Tax Filing Purposes", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Donor Information", 20, yPos);
    yPos += 8;

    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${donorName}`, 20, yPos);
    yPos += 6;
    doc.text(`Email: ${email}`, 20, yPos);
    yPos += 6;
    doc.text(`Tax Year: ${year}`, 20, yPos);
    yPos += 12;

    doc.setFont("helvetica", "bold");
    doc.text("Summary Statistics", 20, yPos);
    yPos += 8;

    doc.setFont("helvetica", "normal");
    doc.text(`Total Donations: ${donations.length}`, 20, yPos);
    yPos += 6;
    doc.text(`Total Organizations: ${organizations.length}`, 20, yPos);
    yPos += 6;
    doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 20, yPos);
    yPos += 15;

    // Add organization details
    doc.setFont("helvetica", "bold");
    doc.text("Donations by Organization", 20, yPos);
    yPos += 10;

    for (const [orgName, orgData] of Object.entries(donationsByOrg)) {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(orgName, 20, yPos);
      yPos += 6;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      if (orgData.city && orgData.state) {
        doc.text(`${orgData.city}, ${orgData.state} ${orgData.zip || ""}`, 20, yPos);
        yPos += 5;
      }
      doc.text(`EIN: ${orgData.ein}`, 20, yPos);
      yPos += 5;
      doc.text(`Total: $${orgData.total.toFixed(2)}`, 20, yPos);
      yPos += 8;

      doc.setFont("helvetica", "bold");
      doc.text("Date", 25, yPos);
      doc.text("Campaign/Program", 60, yPos);
      doc.text("Amount", pageWidth - 40, yPos, { align: "right" });
      yPos += 5;

      doc.setDrawColor(200, 200, 200);
      doc.line(25, yPos, pageWidth - 20, yPos);
      yPos += 5;

      doc.setFont("helvetica", "normal");
      for (const donation of orgData.donations) {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }

        const dateStr = donation.date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const campaignText = `${donation.campaign_name} (${donation.program_name})`;
        const wrappedText = doc.splitTextToSize(campaignText, 90);

        doc.text(dateStr, 25, yPos);
        doc.text(wrappedText[0], 60, yPos);
        doc.text(`$${donation.amount.toFixed(2)}`, pageWidth - 40, yPos, { align: "right" });
        
        yPos += 5 * Math.max(1, wrappedText.length);
      }

      yPos += 10;
    }

    // Add legal page
    doc.addPage();
    yPos = 20;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Important Tax Information", 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const statements = [
      `This document summarizes charitable contributions for tax year ${year}.`,
      "",
      "All organizations listed are 501(c)(3) tax-exempt. Contributions are tax-deductible to the fullest extent allowed by law.",
      "",
      "No goods or services were provided in exchange for these contributions.",
      "",
      "Retain this summary and individual receipts for tax records. Consult your tax advisor for specific guidance.",
    ];

    for (const statement of statements) {
      if (statement === "") {
        yPos += 6;
        continue;
      }
      const splitText = doc.splitTextToSize(statement, pageWidth - 40);
      doc.text(splitText, 20, yPos);
      yPos += splitText.length * 5;
    }

    doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-US")}`, 20, pageHeight - 20);
    doc.text("Sponsorly Annual Tax Summary", pageWidth - 20, pageHeight - 20, { align: "right" });

    const pdfBase64 = doc.output("datauristring").split(",")[1];
    const pdfBuffer = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));

    // Render email template
    const emailHtml = await renderAsync(
      React.createElement(AnnualSummaryEmail, {
        donor_name: donorName,
        year,
        total_amount: totalAmount,
        donation_count: donations.length,
        organization_count: organizations.length,
        organizations: organizations.slice(0, 5), // Top 5 for email
      })
    );

    // Send email with PDF attachment
    const emailResult = await resend.emails.send({
      from: "Sponsorly <receipts@sponsorly.io>",
      to: [email],
      subject: `Your ${year} Annual Charitable Giving Summary`,
      html: emailHtml,
      attachments: [
        {
          filename: `annual-tax-summary-${year}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    console.log("Annual summary email sent:", emailResult);

    return new Response(
      JSON.stringify({ success: true, emailResult }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-annual-tax-summary:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
