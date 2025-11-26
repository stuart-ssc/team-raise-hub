import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { SystemAdminPageLayout } from "@/components/SystemAdminPageLayout";
import { AddOrganizationDialog } from "@/components/AddOrganizationDialog";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, Settings } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [orgTypeFilter, setOrgTypeFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [verificationFilter, setVerificationFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    let results = organizations;
    
    // Apply search filter
    if (searchQuery) {
      results = results.filter(org =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.state?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply org type filter
    if (orgTypeFilter !== "all") {
      results = results.filter(org => org.organization_type === orgTypeFilter);
    }
    
    // Apply state filter
    if (stateFilter !== "all") {
      results = results.filter(org => org.state === stateFilter);
    }
    
    // Apply verification filter
    if (verificationFilter !== "all") {
      results = results.filter(org => org.verification_status === verificationFilter);
    }
    
    setFilteredOrgs(results);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, organizations, orgTypeFilter, stateFilter, verificationFilter]);

  const fetchOrganizations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })
      .range(0, 9999);

    if (error) {
      console.error('Error fetching organizations:', error);
    } else {
      setOrganizations(data || []);
      setFilteredOrgs(data || []);
    }
    setLoading(false);
  };


  const formatVerificationStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getVerificationBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      approved: "default",
      pending: "secondary",
      in_review: "secondary",
      rejected: "destructive"
    };
    return <Badge variant={variants[status] || "outline"}>{formatVerificationStatus(status)}</Badge>;
  };

  // Get unique states for filter dropdown
  const uniqueStates = Array.from(new Set(organizations.map(org => org.state).filter(Boolean))).sort();

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrgs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrgs = filteredOrgs.slice(startIndex, endIndex);

  // Smart pagination helper: shows limited page numbers with ellipsis
  const getVisiblePages = () => {
    const delta = 1; // Number of pages to show on each side of current
    const range: (number | 'ellipsis')[] = [];
    
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || // First page
        i === totalPages || // Last page
        (i >= currentPage - delta && i <= currentPage + delta) // Pages around current
      ) {
        range.push(i);
      } else if (range[range.length - 1] !== 'ellipsis') {
        range.push('ellipsis');
      }
    }
    
    return range;
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
              <div className="space-y-4 mt-4">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search by name, city, or state..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Organization
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Select value={orgTypeFilter} onValueChange={setOrgTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Org Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="school">School</SelectItem>
                      <SelectItem value="nonprofit">Non-Profit</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={stateFilter} onValueChange={setStateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      {uniqueStates.map((state) => (
                        <SelectItem key={state} value={state!}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Verification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Verification</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedOrgs.map((org) => (
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
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/system-admin/organizations/${org.id}`)}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Manage
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {filteredOrgs.length > 0 && (
                    <div className="flex items-center justify-between pt-4">
                      <p className="text-sm text-muted-foreground">
                        Showing {startIndex + 1}-{Math.min(endIndex, filteredOrgs.length)} of {filteredOrgs.length} organizations
                      </p>
                      
                      {totalPages > 1 && (
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>
                            
                            {getVisiblePages().map((page, index) => (
                              <PaginationItem key={index}>
                                {page === 'ellipsis' ? (
                                  <PaginationEllipsis />
                                ) : (
                                  <PaginationLink
                                    onClick={() => setCurrentPage(page)}
                                    isActive={currentPage === page}
                                    className="cursor-pointer"
                                  >
                                    {page}
                                  </PaginationLink>
                                )}
                              </PaginationItem>
                            ))}
                            
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Organization Dialog */}
      <AddOrganizationDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={fetchOrganizations}
      />
    </SystemAdminPageLayout>
  );
};

export default OrganizationsList;
