import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, FileCheck, Mail, FlaskConical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SystemAdminPageLayout } from "@/components/SystemAdminPageLayout";
import { supabase } from "@/integrations/supabase/client";

const SystemAdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrgs: 0,
    pendingVerifications: 0,
    activeCampaigns: 0,
    totalUsers: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [orgsResult, verificationsResult, campaignsResult, usersResult] = await Promise.all([
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('verification_status', 'in_review'),
        supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('publication_status', 'published'),
        supabase.from('profiles').select('id', { count: 'exact', head: true })
      ]);

      setStats({
        totalOrgs: orgsResult.count || 0,
        pendingVerifications: verificationsResult.count || 0,
        activeCampaigns: campaignsResult.count || 0,
        totalUsers: usersResult.count || 0
      });
    };

    fetchStats();
  }, []);

  return (
    <SystemAdminPageLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Administration</h1>
            <p className="text-muted-foreground mt-2">
              Manage platform-wide settings and monitor system health
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Organizations
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrgs}</div>
                <p className="text-xs text-muted-foreground">
                  Active organizations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Verifications
                </CardTitle>
                <FileCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingVerifications}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Campaigns
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
                <p className="text-xs text-muted-foreground">
                  Currently running
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Platform users
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/system-admin/organizations')}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    <CardTitle>Manage Organizations</CardTitle>
                  </div>
                  <CardDescription>
                    View and manage all organizations on the platform
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/system-admin/verification')}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5" />
                    <CardTitle>Verification Queue</CardTitle>
                  </div>
                  <CardDescription>
                    Review and approve organization verification requests
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/system-admin/emails')}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    <CardTitle>Email Management</CardTitle>
                  </div>
                  <CardDescription>
                    Monitor email delivery and manage email settings
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/system-admin/ab-tests')}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-5 w-5" />
                    <CardTitle>A/B Testing</CardTitle>
                  </div>
                  <CardDescription>
                    Manage and analyze email A/B tests
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </SystemAdminPageLayout>
  );
};

export default SystemAdminDashboard;
