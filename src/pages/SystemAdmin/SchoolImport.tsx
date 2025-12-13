import { useState, useEffect } from "react";
import { SystemAdminPageLayout } from "@/components/SystemAdminPageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportSchoolsDialog } from "@/components/ImportSchoolsDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, GraduationCap, Building2, MapPin } from "lucide-react";

interface SchoolStats {
  totalSchools: number;
  stateCount: number;
  recentImports: number;
}

const SchoolImport = () => {
  const { toast } = useToast();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [stats, setStats] = useState<SchoolStats>({
    totalSchools: 0,
    stateCount: 0,
    recentImports: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      // Get total schools count
      const { count: totalSchools } = await supabase
        .from("schools")
        .select("*", { count: "exact", head: true });

      // Get distinct states count
      const { data: states } = await supabase
        .from("schools")
        .select("state")
        .not("state", "is", null);

      const uniqueStates = new Set(states?.map(s => s.state) || []);

      // Get schools created in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: recentImports } = await supabase
        .from("schools")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo.toISOString());

      setStats({
        totalSchools: totalSchools || 0,
        stateCount: uniqueStates.size,
        recentImports: recentImports || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
      toast({
        title: "Error",
        description: "Failed to load school statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleImportComplete = () => {
    loadStats();
  };

  return (
    <SystemAdminPageLayout title="School Import" subtitle="Import public school data from CSV files">
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.totalSchools.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all states
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">States Covered</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.stateCount}
              </div>
              <p className="text-xs text-muted-foreground">
                States with school data
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Imports</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.recentImports.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Last 7 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle>Import Schools from CSV</CardTitle>
            <CardDescription>
              Upload CSV files containing public school data. Each import will automatically create both organization and school records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold">CSV Format Requirements</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Required column: <code className="bg-muted px-1 py-0.5 rounded">school_name</code></li>
                    <li>Optional columns: school_district, county, street_address, city, state, zipcode, zipcode_4_digit, phone_number</li>
                    <li>Duplicate detection by: school_name + city + state</li>
                    <li>Creates organization record with type: 'school', subtype: 'public'</li>
                  </ul>
                </div>
              </div>

              <Button 
                onClick={() => setImportDialogOpen(true)}
                className="w-full"
                size="lg"
              >
                <Upload className="mr-2 h-5 w-5" />
                Import Schools
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      <ImportSchoolsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={handleImportComplete}
      />
    </SystemAdminPageLayout>
  );
};

export default SchoolImport;
