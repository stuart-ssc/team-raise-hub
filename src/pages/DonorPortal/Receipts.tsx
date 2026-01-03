import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DonorPortalLayout } from "@/components/DonorPortal/DonorPortalLayout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  FileText, 
  Download, 
  Loader2, 
  Calendar, 
  DollarSign, 
  Building2,
  FileSpreadsheet
} from "lucide-react";
import { format } from "date-fns";

interface Receipt {
  id: string;
  date: string;
  amount: number;
  campaign_name: string;
  organization_name: string;
  program_name: string;
  ein: string;
  donor_name: string;
}

export default function DonorPortalReceipts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAnnual, setDownloadingAnnual] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    const fetchReceipts = async () => {
      if (!user?.email) return;

      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("get-donor-receipts", {
          body: {
            email: user.email,
            year: parseInt(selectedYear),
          },
        });

        if (error) throw error;
        setReceipts(data.receipts || []);
      } catch (error) {
        console.error("Error fetching receipts:", error);
        toast({
          title: "Error",
          description: "Failed to load tax receipts",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, [user, selectedYear, toast]);

  const downloadReceipt = async (receipt: Receipt) => {
    if (!user?.email) return;

    setDownloadingId(receipt.id);
    try {
      const { data, error } = await supabase.functions.invoke("download-tax-receipt", {
        body: {
          orderId: receipt.id,
          email: user.email,
        },
      });

      if (error) throw error;

      const blob = new Blob([data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tax-receipt-${receipt.organization_name.replace(/\s+/g, "-")}-${format(new Date(receipt.date), "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: "Your tax receipt is being downloaded",
      });
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast({
        title: "Download failed",
        description: "Failed to download tax receipt",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const downloadAnnualSummary = async () => {
    if (!user?.email) return;

    setDownloadingAnnual(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-annual-tax-summary", {
        body: { email: user.email, year: parseInt(selectedYear) },
      });

      if (error) throw error;

      const blob = new Blob([data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `annual-tax-summary-${selectedYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Annual summary downloaded",
        description: `Your ${selectedYear} tax summary is ready for filing`,
      });
    } catch (error: any) {
      console.error("Error downloading annual summary:", error);
      toast({
        title: "Download failed",
        description: error.message || "Failed to generate annual summary",
        variant: "destructive",
      });
    } finally {
      setDownloadingAnnual(false);
    }
  };

  const totalDonations = receipts.reduce((sum, r) => sum + r.amount, 0);

  if (loading) {
    return (
      <DonorPortalLayout title="Tax Receipts">
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </DonorPortalLayout>
    );
  }

  return (
    <DonorPortalLayout title="Tax Receipts" subtitle="Download receipts for your charitable contributions">
      <div className="space-y-6">
        {/* Year Selector and Summary */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <Card className="flex-1">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tax Year</p>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-32 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Contributions</p>
                  <p className="text-2xl font-bold">
                    ${totalDonations.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {receipts.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <Button
                  onClick={downloadAnnualSummary}
                  disabled={downloadingAnnual}
                  className="w-full"
                >
                  {downloadingAnnual ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Download {selectedYear} Summary
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Consolidated year-end statement
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Receipts List */}
        <Card>
          <CardHeader>
            <CardTitle>Individual Receipts</CardTitle>
            <CardDescription>
              {receipts.length} receipt{receipts.length === 1 ? "" : "s"} for {selectedYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {receipts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Receipts Found</h3>
                <p className="text-muted-foreground">
                  No tax receipts available for {selectedYear}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {receipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border hover:bg-accent/5 transition-colors gap-4"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start gap-3">
                        <Building2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold">{receipt.organization_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {receipt.campaign_name} • {receipt.program_name}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {format(new Date(receipt.date), "MMM d, yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            ${receipt.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">EIN: {receipt.ein}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => downloadReceipt(receipt)}
                      disabled={downloadingId === receipt.id}
                      variant="outline"
                      className="w-full md:w-auto"
                    >
                      {downloadingId === receipt.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> These receipts are for donations made to 501(c)(3) tax-exempt organizations. 
              Please consult your tax advisor for specific guidance regarding the deductibility of charitable contributions.
            </p>
          </CardContent>
        </Card>
      </div>
    </DonorPortalLayout>
  );
}
