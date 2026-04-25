import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, FileText, Calendar, DollarSign, Building2, ArrowLeft, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { NoIndex } from "@/components/seo/NoIndex";

const searchFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  year: z.string().optional(),
});

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

const DonorReceiptPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAnnual, setDownloadingAnnual] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const form = useForm<z.infer<typeof searchFormSchema>>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      email: "",
      year: currentYear.toString(),
    },
  });

  const onSubmit = async (values: z.infer<typeof searchFormSchema>) => {
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-donor-receipts", {
        body: {
          email: values.email,
          year: values.year ? parseInt(values.year) : undefined,
        },
      });

      if (error) throw error;

      setReceipts(data.receipts || []);
      
      if (data.receipts.length === 0) {
        toast({
          title: "No receipts found",
          description: "We couldn't find any tax receipts for this email address in the selected year.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Receipts loaded",
          description: `Found ${data.receipts.length} tax receipt${data.receipts.length === 1 ? "" : "s"}`,
        });
      }
    } catch (error: any) {
      console.error("Error fetching receipts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tax receipts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const downloadReceipt = async (receipt: Receipt) => {
    setDownloadingId(receipt.id);
    try {
      const { data, error } = await supabase.functions.invoke("download-tax-receipt", {
        body: {
          orderId: receipt.id,
          email: form.getValues("email"),
        },
      });

      if (error) throw error;

      // Create blob and download
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
    } catch (error: any) {
      console.error("Error downloading receipt:", error);
      toast({
        title: "Download failed",
        description: "Failed to download tax receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const downloadAnnualSummary = async () => {
    setDownloadingAnnual(true);
    try {
      const email = form.getValues("email");
      const year = parseInt(form.getValues("year") || currentYear.toString());

      const { data, error } = await supabase.functions.invoke("generate-annual-tax-summary", {
        body: { email, year },
      });

      if (error) throw error;

      // Create blob and download
      const blob = new Blob([data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `annual-tax-summary-${year}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Annual summary downloaded",
        description: `Your ${year} tax summary is ready for filing`,
      });
    } catch (error: any) {
      console.error("Error downloading annual summary:", error);
      toast({
        title: "Download failed",
        description: error.message || "Failed to generate annual summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingAnnual(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <NoIndex />
      <div className="container max-w-5xl mx-auto py-12 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Tax Receipt Portal
          </h1>
          <p className="text-muted-foreground text-lg">
            Access and download your charitable contribution tax receipts
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Find Your Tax Receipts</CardTitle>
            <CardDescription>
              Enter your email address to view all tax receipts for your charitable donations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="donor@example.com"
                            type="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Year</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {years.map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" disabled={searching} className="w-full md:w-auto">
                  {searching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Find Receipts
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {receipts.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Your Tax Receipts</CardTitle>
                  <CardDescription>
                    {receipts.length} receipt{receipts.length === 1 ? "" : "s"} found for {form.getValues("year")}
                  </CardDescription>
                </div>
                <Button
                  onClick={downloadAnnualSummary}
                  disabled={downloadingAnnual}
                  variant="outline"
                  className="w-full md:w-auto"
                >
                  {downloadingAnnual ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Download Annual Summary
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {receipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors gap-4"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start gap-3">
                        <Building2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground">
                            {receipt.organization_name}
                          </h3>
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
                          <span className="font-medium text-foreground">
                            {formatCurrency(receipt.amount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            EIN: {receipt.ein}
                          </span>
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
                          Download PDF
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-4">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Annual Tax Summary</h4>
                      <p className="text-sm text-muted-foreground">
                        Download a consolidated year-end statement showing all your charitable contributions 
                        for {form.getValues("year")}. This comprehensive report includes totals by organization, 
                        individual donation details, and IRS-required documentation—perfect for tax filing.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> These receipts are for donations made to 501(c)(3) tax-exempt organizations. 
                    Please consult your tax advisor for specific guidance regarding the deductibility of charitable contributions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DonorReceiptPortal;
