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
import { supabase } from "@/integrations/supabase/client";
import { Search, TrendingUp, DollarSign, Users, Building2 } from "lucide-react";
import { getSegmentInfo } from "@/lib/businessEngagement";

interface Business {
  id: string;
  business_name: string;
  city: string | null;
  state: string | null;
  industry: string | null;
  engagement_segment: string;
  engagement_score: number;
  total_partnership_value: number;
  linked_donors_count: number;
  verification_status: string;
  organization_name?: string;
  organization_type?: string;
}

const BusinessesList = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [verificationFilter, setVerificationFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Stats for top cards
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    totalPartnershipValue: 0,
    avgEngagementScore: 0,
    segmentBreakdown: {} as Record<string, number>
  });

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    let results = businesses;
    
    // Apply search filter
    if (searchQuery) {
      results = results.filter(biz =>
        biz.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.organization_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply state filter
    if (stateFilter !== "all") {
      results = results.filter(biz => biz.state === stateFilter);
    }
    
    // Apply industry filter
    if (industryFilter !== "all") {
      results = results.filter(biz => biz.industry === industryFilter);
    }
    
    // Apply segment filter
    if (segmentFilter !== "all") {
      results = results.filter(biz => biz.engagement_segment === segmentFilter);
    }
    
    // Apply verification filter
    if (verificationFilter !== "all") {
      results = results.filter(biz => biz.verification_status === verificationFilter);
    }
    
    setFilteredBusinesses(results);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, businesses, stateFilter, industryFilter, segmentFilter, verificationFilter]);

  const fetchBusinesses = async () => {
    setLoading(true);
    
    // Fetch businesses with organization information
    const { data: businessData, error } = await supabase
      .from('businesses')
      .select(`
        *,
        organization_businesses!inner(
          organization_id,
          organizations(name, organization_type)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching businesses:', error);
      setLoading(false);
      return;
    }

    // Transform data to flatten organization info
    const transformedData = (businessData || []).map((biz: any) => ({
      ...biz,
      organization_name: biz.organization_businesses?.[0]?.organizations?.name,
      organization_type: biz.organization_businesses?.[0]?.organizations?.organization_type,
    }));

    setBusinesses(transformedData);
    setFilteredBusinesses(transformedData);
    
    // Calculate stats
    const totalValue = transformedData.reduce((sum, biz) => sum + (biz.total_partnership_value || 0), 0);
    const avgScore = transformedData.length > 0 
      ? transformedData.reduce((sum, biz) => sum + (biz.engagement_score || 0), 0) / transformedData.length 
      : 0;
    
    const segmentCounts: Record<string, number> = {};
    transformedData.forEach(biz => {
      const segment = biz.engagement_segment || 'new';
      segmentCounts[segment] = (segmentCounts[segment] || 0) + 1;
    });

    setStats({
      totalBusinesses: transformedData.length,
      totalPartnershipValue: totalValue,
      avgEngagementScore: Math.round(avgScore),
      segmentBreakdown: segmentCounts
    });

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

  // Get unique values for filter dropdowns
  const uniqueStates = Array.from(new Set(businesses.map(biz => biz.state).filter(Boolean))).sort();
  const uniqueIndustries = Array.from(new Set(businesses.map(biz => biz.industry).filter(Boolean))).sort();

  // Pagination calculations
  const totalPages = Math.ceil(filteredBusinesses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBusinesses = filteredBusinesses.slice(startIndex, endIndex);

  // Smart pagination helper
  const getVisiblePages = () => {
    const delta = 1;
    const range: (number | 'ellipsis')[] = [];
    
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
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
      title="Business Partnerships"
      subtitle="Manage the advertising network and business partnerships across all organizations"
    >
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBusinesses}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Partnership Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(stats.totalPartnershipValue / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgEngagementScore}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Segment</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">
                  {Object.entries(stats.segmentBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] ? 
                    getSegmentInfo(Object.entries(stats.segmentBreakdown).sort((a, b) => b[1] - a[1])[0][0]).label : 
                    'N/A'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Business List Card */}
          <Card>
            <CardHeader>
              <CardTitle>All Businesses</CardTitle>
              <div className="space-y-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by business name, city, or organization..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

                  <Select value={industryFilter} onValueChange={setIndustryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Industries</SelectItem>
                      {uniqueIndustries.map((industry) => (
                        <SelectItem key={industry} value={industry!}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Segment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Segments</SelectItem>
                      <SelectItem value="champion_partners">Champion Partners</SelectItem>
                      <SelectItem value="engaged_partners">Engaged Partners</SelectItem>
                      <SelectItem value="high_value_focused">High Value Focused</SelectItem>
                      <SelectItem value="emerging_partners">Emerging Partners</SelectItem>
                      <SelectItem value="needs_cultivation">Needs Cultivation</SelectItem>
                      <SelectItem value="at_risk">At Risk</SelectItem>
                      <SelectItem value="dormant">Dormant</SelectItem>
                      <SelectItem value="new">New</SelectItem>
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
                <div className="text-center py-8 text-muted-foreground">Loading businesses...</div>
              ) : filteredBusinesses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No businesses found matching your search." : "No businesses found."}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Industry</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Engagement</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Donors</TableHead>
                        <TableHead>Verification</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedBusinesses.map((biz) => {
                        const segmentInfo = getSegmentInfo(biz.engagement_segment);
                        const SegmentIcon = segmentInfo.icon;
                        
                        return (
                          <TableRow key={biz.id}>
                            <TableCell className="font-medium">{biz.business_name}</TableCell>
                            <TableCell>
                              {biz.city && biz.state ? `${biz.city}, ${biz.state}` : biz.state || '-'}
                            </TableCell>
                            <TableCell>{biz.industry || '-'}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm">{biz.organization_name || '-'}</span>
                                {biz.organization_type && (
                                  <Badge variant="outline" className="w-fit mt-1 text-xs">
                                    {biz.organization_type === 'school' ? 'School' : 'Non-Profit'}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`p-1 rounded ${segmentInfo.bgColor}`}>
                                  <SegmentIcon className={`h-3 w-3 ${segmentInfo.color}`} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium">{biz.engagement_score}</span>
                                  <span className="text-xs text-muted-foreground">{segmentInfo.label}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              ${(biz.total_partnership_value / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </TableCell>
                            <TableCell>{biz.linked_donors_count}</TableCell>
                            <TableCell>{getVerificationBadge(biz.verification_status)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  
                  {filteredBusinesses.length > 0 && (
                    <div className="flex items-center justify-between pt-4">
                      <p className="text-sm text-muted-foreground">
                        Showing {startIndex + 1}-{Math.min(endIndex, filteredBusinesses.length)} of {filteredBusinesses.length} businesses
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
    </SystemAdminPageLayout>
  );
};

export default BusinessesList;
