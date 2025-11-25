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
import { SystemAdminPageLayout } from "@/components/SystemAdminPageLayout";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
import { format } from "date-fns";

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
    <SystemAdminPageLayout
      title="Organizations"
      subtitle="View and manage all organizations on the platform"
    >
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">

          <Card>
            <CardHeader>
              <CardTitle>All Organizations</CardTitle>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, city, or state..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading organizations...</div>
              ) : filteredOrgs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No organizations found matching your search." : "No organizations found."}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrgs.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {org.organization_type === 'school' ? 'School' : 'Non-Profit'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{org.name}</TableCell>
                        <TableCell>
                          {org.city && org.state ? `${org.city}, ${org.state}` : '-'}
                        </TableCell>
                        <TableCell>{getVerificationBadge(org.verification_status)}</TableCell>
                        <TableCell>
                          {org.created_at ? format(new Date(org.created_at), 'MMM d, yyyy') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SystemAdminPageLayout>
  );
};

export default OrganizationsList;
