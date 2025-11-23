import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Heart } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  organization_type: 'school' | 'nonprofit';
  city: string;
  state: string;
  verification_status: string;
  created_at: string;
}

const OrganizationsList = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredOrgs(
        organizations.filter(org =>
          org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          org.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          org.state?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredOrgs(organizations);
    }
  }, [searchQuery, organizations]);

  const fetchOrganizations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching organizations:', error);
    } else {
      setOrganizations(data || []);
      setFilteredOrgs(data || []);
    }
    setLoading(false);
  };

  const getVerificationBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      approved: "default",
      pending: "secondary",
      in_review: "secondary",
      rejected: "destructive"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen flex bg-background">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Organizations</h1>
              <p className="text-muted-foreground">Manage all schools and non-profits</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Search Organizations</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Search by name, city, or state..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : filteredOrgs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          No organizations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrgs.map((org) => (
                        <TableRow key={org.id}>
                          <TableCell>
                            {org.organization_type === 'school' ? (
                              <Building2 className="h-5 w-5 text-primary" />
                            ) : (
                              <Heart className="h-5 w-5 text-primary" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{org.name}</TableCell>
                          <TableCell>{org.city}, {org.state}</TableCell>
                          <TableCell>{getVerificationBadge(org.verification_status)}</TableCell>
                          <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrganizationsList;
