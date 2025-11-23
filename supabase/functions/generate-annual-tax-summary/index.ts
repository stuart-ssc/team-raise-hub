import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { jsPDF } from "npm:jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnnualSummaryRequest {
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
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { email, year }: AnnualSummaryRequest = await req.json();

    if (!email || !year) {
      return new Response(
        JSON.stringify({ error: "Email and year are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Generating annual tax summary for:", email, "year:", year);

    // Fetch all orders with tax receipts for this email in the specified year
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

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch donations" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Filter to only nonprofit donations
    const donations = (orders || [])
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
        JSON.stringify({ error: "No tax-deductible donations found for this year" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const donorName = orders[0]?.customer_name || "Valued Donor";
    const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);

    // Group donations by organization
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

    // Generate PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Header
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(`${year} Annual Charitable Contributions Summary`, pageWidth / 2, yPos, { align: "center" });
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("For Tax Filing Purposes", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // Donor information
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

    // Summary statistics
    doc.setFont("helvetica", "bold");
    doc.text("Summary Statistics", 20, yPos);
    yPos += 8;

    doc.setFont("helvetica", "normal");
    doc.text(`Total Donations: ${donations.length}`, 20, yPos);
    yPos += 6;
    doc.text(`Total Organizations Supported: ${Object.keys(donationsByOrg).length}`, 20, yPos);
    yPos += 6;
    doc.text(`Total Amount Donated: $${totalDonations.toFixed(2)}`, 20, yPos);
    yPos += 15;

    // Donations by organization
    doc.setFont("helvetica", "bold");
    doc.text("Donations by Organization", 20, yPos);
    yPos += 10;

    for (const [orgName, orgData] of Object.entries(donationsByOrg)) {
      // Check if we need a new page
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }

      // Organization header
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
      doc.text(`Total Donated: $${orgData.total.toFixed(2)}`, 20, yPos);
      yPos += 8;

      // Donations table header
      doc.setFont("helvetica", "bold");
      doc.text("Date", 25, yPos);
      doc.text("Campaign/Program", 60, yPos);
      doc.text("Amount", pageWidth - 40, yPos, { align: "right" });
      yPos += 5;

      // Draw line
      doc.setDrawColor(200, 200, 200);
      doc.line(25, yPos, pageWidth - 20, yPos);
      yPos += 5;

      // Donation rows
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

    // Add new page for legal notices
    doc.addPage();
    yPos = 20;

    // IRS compliance statement
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Important Tax Information", 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const statements = [
      "This document summarizes your charitable contributions to 501(c)(3) tax-exempt organizations for the tax year " + year + ".",
      "",
      "All organizations listed in this summary are tax-exempt under Section 501(c)(3) of the Internal Revenue Code, and your contributions are tax-deductible to the fullest extent allowed by law.",
      "",
      "No goods or services were provided in exchange for these contributions unless otherwise noted on individual receipts.",
      "",
      "This summary is provided for your convenience in preparing your tax return. Individual donation receipts are available for download through the donor portal.",
      "",
      "IMPORTANT: Please retain both this summary and your individual donation receipts for your tax records. Consult your tax advisor for specific guidance regarding the deductibility of charitable contributions.",
      "",
      "The IRS requires that you maintain adequate records to substantiate your charitable contributions. For cash contributions of $250 or more, you must have a contemporaneous written acknowledgment from the charitable organization.",
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

    // Footer on last page
    yPos = pageHeight - 20;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 20, yPos);
    doc.text("Sponsorly Annual Tax Summary", pageWidth - 20, yPos, { align: "right" });

    // Return PDF as blob
    const pdfBlob = doc.output("arraybuffer");

    return new Response(pdfBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="annual-tax-summary-${year}-${email.split('@')[0]}.pdf"`,
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in generate-annual-tax-summary function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
