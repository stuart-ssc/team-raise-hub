import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Building2, DollarSign, Users, Handshake, Search, Download, Plus, Pencil, Upload, Archive, Trash2, BarChart3, Activity, Target, MoreHorizontal, Mail, Tag, RotateCcw, CheckSquare, Square } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { getSegmentInfo } from "@/lib/businessEngagement";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getTagColor, getTagBgColor } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CsvExportBusinessDialog } from "@/components/CsvExportBusinessDialog";
import { AddBusinessDialog } from "@/components/AddBusinessDialog";
import { EditBusinessDialog } from "@/components/EditBusinessDialog";
import { ImportBusinessesDialog } from "@/components/ImportBusinessesDialog";
import BulkActionToolbarBusiness from "@/components/BulkActionToolbarBusiness";
import BulkTagDialogBusiness from "@/components/BulkTagDialogBusiness";
import BulkEmailDialogBusiness from "@/components/BulkEmailDialogBusiness";
import { ManualEnrollmentDialog } from "@/components/ManualEnrollmentDialog";

interface BusinessProfile {
  id: string;
  business_name: string;
  business_email: string | null;
  business_phone: string | null;
  ein: string | null;
  industry: string | null;
  website_url: string | null;
  verification_status: string;
  logo_url: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  archived_at: string | null;
  linked_donors_count: number;
  total_donations: number;
  last_donation_date: string | null;
  tags: string[] | null;
  engagement_segment: string | null;
  engagement_score: number | null;
}

const Businesses = () => {
  const navigate = useNavigate();
  const { organizationUser, loading: orgLoading } = useOrganizationUser();
  const isMobile = useIsMobile();
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [verificationFilter, setVerificationFilter] = useState<string>("all");
  const [archiveFilter, setArchiveFilter] = useState<string>("active");
  const [sortBy, setSortBy] = useState<string>("name");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessProfile | null>(null);
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>([]);
  const [showBulkArchiveDialog, setShowBulkArchiveDialog] = useState(false);
  const [showBulkRestoreDialog, setShowBulkRestoreDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showBulkTagDialog, setShowBulkTagDialog] = useState(false);
  const [showBulkEmailDialog, setShowBulkEmailDialog] = useState(false);
  const [showEnrollmentDialog, setShowEnrollmentDialog] = useState(false);
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [highPriorityCount, setHighPriorityCount] = useState<number>(0);
  
  // Single business action states
  const [menuBusinessId, setMenuBusinessId] = useState<string | null>(null);
  const [showSingleEmailDialog, setShowSingleEmailDialog] = useState(false);
  const [showSingleTagDialog, setShowSingleTagDialog] = useState(false);
  const [showSingleEnrollDialog, setShowSingleEnrollDialog] = useState(false);
  const [showSingleArchiveDialog, setShowSingleArchiveDialog] = useState(false);
  const [showSingleRestoreDialog, setShowSingleRestoreDialog] = useState(false);
  const [showSingleDeleteDialog, setShowSingleDeleteDialog] = useState(false);

  const canManageBusinesses = 
    organizationUser?.user_type?.permission_level === 'organization_admin' ||
    organizationUser?.user_type?.permission_level === 'program_manager';

  useEffect(() => {
    if (organizationUser?.organization_id) {
      fetchBusinesses();
      fetchHighPriorityCount();
    }
  }, [organizationUser?.organization_id]);

  const fetchHighPriorityCount = async () => {
    if (!organizationUser?.organization_id) return;
    
    const { count, error } = await supabase
      .from('business_outreach_queue')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationUser.organization_id)
      .gte('priority_score', 80);
      
    if (!error && count !== null) {
      setHighPriorityCount(count);
    }
  };

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      
      // Fetch businesses linked to organization
      const { data: orgBusinesses, error: orgError } = await supabase
        .from("organization_businesses")
        .select("business_id")
        .eq("organization_id", organizationUser?.organization_id);

      if (orgError) throw orgError;

      if (!orgBusinesses || orgBusinesses.length === 0) {
        setBusinesses([]);
        return;
      }

      const businessIds = orgBusinesses.map(ob => ob.business_id);

      // Fetch business details including archived_at
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .in("id", businessIds);

      if (businessError) throw businessError;

      // Fetch linked donors count for each business
      const businessesWithMetrics = await Promise.all(
        (businessData || []).map(async (business) => {
          // Count linked donors
          const { count: donorsCount } = await supabase
            .from("business_donors")
            .select("*", { count: "exact", head: true })
            .eq("business_id", business.id)
            .eq("organization_id", organizationUser?.organization_id);

          // Get linked donor emails to calculate total donations
          const { data: linkedDonors } = await supabase
            .from("business_donors")
            .select("donor_id")
            .eq("business_id", business.id)
            .eq("organization_id", organizationUser?.organization_id);

          let totalDonations = 0;
          let lastDonationDate = null;

          if (linkedDonors && linkedDonors.length > 0) {
            const donorIds = linkedDonors.map(d => d.donor_id);
            
            // First try to get emails from donor_profiles (for proper donor_profile links)
            const { data: donorProfileEmails } = await supabase
              .from("donor_profiles")
              .select("email")
              .in("id", donorIds);

            let emails: string[] = donorProfileEmails?.map(d => d.email) || [];
            
            // If no matches in donor_profiles, the donor_ids might point to profiles table
            // Call edge function to get emails from auth.users
            if (emails.length === 0) {
              const { data: profileEmailsData } = await supabase.functions.invoke("get-profile-emails", {
                body: { profileIds: donorIds }
              });
              emails = profileEmailsData?.emails || [];
            }

            if (emails.length > 0) {
              // Calculate total donations from orders
              const { data: orders } = await supabase
                .from("orders")
                .select("items, created_at")
                .in("customer_email", emails)
                .eq("status", "succeeded");

              if (orders) {
                // Calculate net amount using items (price_at_purchase * quantity) to exclude platform fees
                totalDonations = orders.reduce((sum, order) => {
                  const items = order.items as Array<{ price_at_purchase: number; quantity: number }> | null;
                  const orderTotal = items?.reduce((itemSum, item) => 
                    itemSum + (item.price_at_purchase * item.quantity), 0) || 0;
                  return sum + orderTotal;
                }, 0);
                const sortedOrders = orders.sort((a, b) => 
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                lastDonationDate = sortedOrders[0]?.created_at || null;
              }
            }
          }

          return {
            ...business,
            linked_donors_count: donorsCount || 0,
            total_donations: totalDonations,
            last_donation_date: lastDonationDate,
          };
        })
      );

      setBusinesses(businessesWithMetrics);
    } catch (error: any) {
      console.error("Error fetching businesses:", error);
      toast.error("Failed to load businesses");
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedBusinesses = businesses
    .filter((business) => {
      const matchesSearch =
        business.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.business_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.ein?.includes(searchQuery);

      const matchesVerification =
        verificationFilter === "all" || business.verification_status === verificationFilter;

      const matchesArchive =
        archiveFilter === "all" ||
        (archiveFilter === "active" && !business.archived_at) ||
        (archiveFilter === "archived" && business.archived_at);

      const matchesTag =
        tagFilter === "all" ||
        (business.tags && business.tags.includes(tagFilter));

      const matchesSegment =
        segmentFilter === "all" ||
        business.engagement_segment === segmentFilter;

      return matchesSearch && matchesVerification && matchesArchive && matchesTag && matchesSegment;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.business_name.localeCompare(b.business_name);
        case "donations":
          return b.total_donations - a.total_donations;
        case "donors":
          return b.linked_donors_count - a.linked_donors_count;
        case "recent":
          if (!a.last_donation_date) return 1;
          if (!b.last_donation_date) return -1;
          return new Date(b.last_donation_date).getTime() - new Date(a.last_donation_date).getTime();
        case "engagement":
          return (b.engagement_score || 0) - (a.engagement_score || 0);
        default:
          return 0;
      }
    });

  // Calculate stats
  const stats = {
    totalBusinesses: businesses.length,
    totalValue: businesses.reduce((sum, b) => sum + b.total_donations, 0),
    activePartnerships: businesses.filter(
      (b) => b.last_donation_date && 
      new Date(b.last_donation_date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    ).length,
    avgDonation: businesses.length > 0 
      ? businesses.reduce((sum, b) => sum + b.total_donations, 0) / businesses.length 
      : 0,
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBusinessIds(filteredAndSortedBusinesses.map(b => b.id));
    } else {
      setSelectedBusinessIds([]);
    }
  };

  const handleSelectBusiness = (businessId: string, checked: boolean) => {
    if (checked) {
      setSelectedBusinessIds(prev => [...prev, businessId]);
    } else {
      setSelectedBusinessIds(prev => prev.filter(id => id !== businessId));
    }
  };

  const handleClearSelection = () => {
    setSelectedBusinessIds([]);
  };

  // Bulk operations
  const handleBulkArchive = async () => {
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ 
          archived_at: new Date().toISOString()
        })
        .in('id', selectedBusinessIds);

      if (error) throw error;

      toast.success(`Archived ${selectedBusinessIds.length} business${selectedBusinessIds.length === 1 ? '' : 'es'}`);
      setSelectedBusinessIds([]);
      setShowBulkArchiveDialog(false);
      fetchBusinesses();
    } catch (error) {
      console.error('Error archiving businesses:', error);
      toast.error('Failed to archive businesses');
    }
  };

  const handleBulkDelete = async () => {
    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .in('id', selectedBusinessIds);

      if (error) throw error;

      toast.success(`Deleted ${selectedBusinessIds.length} business${selectedBusinessIds.length === 1 ? '' : 'es'}`);
      setSelectedBusinessIds([]);
      setShowBulkDeleteDialog(false);
      fetchBusinesses();
    } catch (error) {
      console.error('Error deleting businesses:', error);
      toast.error('Failed to delete businesses');
    }
  };

  const handleBulkExport = () => {
    setShowExportDialog(true);
  };

  const handleBulkTag = () => {
    setShowBulkTagDialog(true);
  };

  const handleBulkEmail = () => {
    // Filter out businesses without email addresses
    const businessesWithEmail = businesses.filter(
      b => selectedBusinessIds.includes(b.id) && b.business_email
    );
    
    const businessesWithoutEmail = selectedBusinessIds.length - businessesWithEmail.length;
    
    if (businessesWithoutEmail > 0) {
      toast.warning(
        `${businessesWithoutEmail} business${businessesWithoutEmail === 1 ? '' : 'es'} without email ${businessesWithoutEmail === 1 ? 'address will' : 'addresses will'} be skipped`
      );
    }

    if (businessesWithEmail.length === 0) {
      toast.error("None of the selected businesses have email addresses");
      return;
    }

    setShowBulkEmailDialog(true);
  };

  const handleBulkRestore = async () => {
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ 
          archived_at: null,
          archived_by: null
        })
        .in('id', selectedBusinessIds);

      if (error) throw error;

      toast.success(`Restored ${selectedBusinessIds.length} business${selectedBusinessIds.length === 1 ? '' : 'es'}`);
      setSelectedBusinessIds([]);
      setShowBulkRestoreDialog(false);
      fetchBusinesses();
    } catch (error) {
      console.error('Error restoring businesses:', error);
      toast.error('Failed to restore businesses');
    }
  };

  // Helper to determine selection status
  const getSelectedBusinessesStatus = (): 'active' | 'archived' | 'mixed' => {
    const selectedBusinesses = businesses.filter(b => 
      selectedBusinessIds.includes(b.id)
    );
    
    if (selectedBusinesses.length === 0) return 'active';
    
    const hasArchived = selectedBusinesses.some(b => b.archived_at);
    const hasActive = selectedBusinesses.some(b => !b.archived_at);
    
    if (hasArchived && hasActive) return 'mixed';
    if (hasArchived) return 'archived';
    return 'active';
  };

  // Single business action handlers
  const handleSingleArchive = async () => {
    if (!menuBusinessId) return;
    
    try {
      const { error } = await supabase
        .from("businesses")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", menuBusinessId);

      if (error) throw error;
      
      toast.success("Business archived successfully");
      fetchBusinesses();
      setShowSingleArchiveDialog(false);
      setMenuBusinessId(null);
    } catch (error: any) {
      console.error("Error archiving business:", error);
      toast.error("Failed to archive business");
    }
  };

  const handleSingleRestore = async () => {
    if (!menuBusinessId) return;
    
    try {
      const { error } = await supabase
        .from("businesses")
        .update({ archived_at: null, archived_by: null })
        .eq("id", menuBusinessId);

      if (error) throw error;
      
      toast.success("Business restored successfully");
      fetchBusinesses();
      setShowSingleRestoreDialog(false);
      setMenuBusinessId(null);
    } catch (error: any) {
      console.error("Error restoring business:", error);
      toast.error("Failed to restore business");
    }
  };

  const handleSingleDelete = async () => {
    if (!menuBusinessId) return;
    
    try {
      const { error } = await supabase
        .from("businesses")
        .delete()
        .eq("id", menuBusinessId);

      if (error) throw error;
      
      toast.success("Business deleted successfully");
      fetchBusinesses();
      setShowSingleDeleteDialog(false);
      setMenuBusinessId(null);
    } catch (error: any) {
      console.error("Error deleting business:", error);
      toast.error("Failed to delete business");
    }
  };

  // Get all unique tags from all businesses
  const allTags = Array.from(
    new Set(
      businesses
        .flatMap(b => b.tags || [])
        .filter(tag => tag && tag.trim())
    )
  ).sort();

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20">Verified</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20">Pending</Badge>;
    }
  };

  if (orgLoading || loading) {
    return (
      <DashboardPageLayout segments={[{ label: "Businesses" }]}>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout segments={[{ label: "Businesses" }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Business Partnerships</h1>
              <p className="text-muted-foreground">Manage corporate relationships and donations</p>
            </div>
            
            {/* Desktop: Individual Buttons */}
            {!isMobile && (
              <div className="flex gap-2">
                {canManageBusinesses && (
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Business
                  </Button>
                )}
                
                <Button 
                  variant="outline"
                  onClick={() => navigate('/dashboard/businesses/analytics')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <MoreHorizontal className="h-4 w-4 mr-2" />
                      More
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate('/dashboard/businesses/nurture')}>
                      <Mail className="h-4 w-4 mr-2" />
                      Nurture Campaigns
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => navigate('/dashboard/businesses/outreach-queue')}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Outreach Queue
                      {highPriorityCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="ml-2 px-1.5 py-0.5 text-xs"
                        >
                          {highPriorityCount}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/dashboard/businesses/campaign-analytics')}>
                      <Activity className="h-4 w-4 mr-2" />
                      Campaign Analytics
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {canManageBusinesses && (
                      <DropdownMenuItem onClick={() => setShowImportDialog(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Import
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => setShowExportDialog(true)}
                      disabled={filteredAndSortedBusinesses.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Mobile: Consolidated Dropdown */}
          {isMobile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full">
                  <MoreHorizontal className="mr-2 h-4 w-4" />
                  Quick Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {canManageBusinesses && (
                  <DropdownMenuItem onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Business
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate('/dashboard/businesses/analytics')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/dashboard/businesses/nurture')}>
                  <Mail className="h-4 w-4 mr-2" />
                  Nurture Campaigns
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/dashboard/businesses/outreach-queue')}>
                  <Target className="h-4 w-4 mr-2" />
                  Outreach Queue
                  {highPriorityCount > 0 && (
                    <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs">
                      {highPriorityCount}
                    </Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/dashboard/businesses/campaign-analytics')}>
                  <Activity className="h-4 w-4 mr-2" />
                  Campaign Analytics
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {canManageBusinesses && (
                  <DropdownMenuItem onClick={() => setShowImportDialog(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => setShowExportDialog(true)}
                  disabled={filteredAndSortedBusinesses.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Businesses
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalBusinesses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Partnership Value
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Partnerships
              </CardTitle>
              <Handshake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.activePartnerships}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg per Business
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${stats.avgDonation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {/* Row 1: Search + Select All */}
              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or EIN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {canManageBusinesses && filteredAndSortedBusinesses.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => handleSelectAll(selectedBusinessIds.length !== filteredAndSortedBusinesses.length)}
                  >
                    {selectedBusinessIds.length === filteredAndSortedBusinesses.length && filteredAndSortedBusinesses.length > 0 ? (
                      <>
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <Square className="h-4 w-4 mr-2" />
                        Select All
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Row 2: All Filter Dropdowns */}
              <div className="flex flex-col md:flex-row gap-4">
                <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Verification Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={archiveFilter} onValueChange={setArchiveFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Archive Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="archived">Archived Only</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="donations">Total Donated</SelectItem>
                    <SelectItem value="donors">Linked Donors</SelectItem>
                    <SelectItem value="engagement">Engagement Score</SelectItem>
                    <SelectItem value="recent">Recent Activity</SelectItem>
                  </SelectContent>
                </Select>

                {allTags.length > 0 && (
                  <Select value={tagFilter} onValueChange={setTagFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Filter by Tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tags</SelectItem>
                      {allTags.map(tag => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Engagement Segment" />
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Cards Grid */}
        {filteredAndSortedBusinesses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No businesses found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedBusinesses.map((business) => (
              <Card
                key={business.id}
                className={`relative hover:shadow-lg transition-shadow group ${business.archived_at ? 'opacity-60' : ''}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {canManageBusinesses && (
                        <Checkbox
                          checked={selectedBusinessIds.includes(business.id)}
                          onCheckedChange={(checked) => handleSelectBusiness(business.id, checked as boolean)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select ${business.business_name}`}
                          className="mt-1"
                        />
                      )}
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => navigate(`/dashboard/businesses/${business.id}`)}
                      >
                          <CardTitle className="text-base">{business.business_name}</CardTitle>
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            {getVerificationBadge(business.verification_status)}
                            {business.archived_at && (
                              <Badge variant="secondary" className="bg-orange-500/10 text-orange-700 dark:text-orange-400 text-xs">
                                Archived
                              </Badge>
                            )}
                          {business.engagement_segment && business.engagement_score && business.engagement_score > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge 
                                    className={`${getSegmentInfo(business.engagement_segment).bgColor} ${getSegmentInfo(business.engagement_segment).color} border-0 text-xs cursor-help`}
                                  >
                                    {(() => {
                                      const Icon = getSegmentInfo(business.engagement_segment).icon;
                                      return <Icon className="h-3 w-3 mr-1" />;
                                    })()}
                                    Engagement: {business.engagement_score}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">Engagement score reflects how actively this business partners with your organization, based on donation frequency, recency, and total value.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          </div>
                          {business.industry && (
                            <Badge variant="outline" className="mt-1">{business.industry}</Badge>
                          )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Donated:</span>
                      <span className="font-semibold">${business.total_donations.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Linked Employees:</span>
                      <span className="font-semibold">{business.linked_donors_count}</span>
                    </div>
                    {business.last_donation_date && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Donation:</span>
                        <span className="font-semibold">
                          {new Date(business.last_donation_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {business.tags && business.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-border">
                      {business.tags.slice(0, 3).map((tag, idx) => (
                        <Badge 
                          key={idx} 
                          variant="secondary" 
                          className="text-xs border"
                          style={{
                            backgroundColor: getTagBgColor(tag),
                            color: getTagColor(tag),
                            borderColor: getTagColor(tag)
                          }}
                        >
                          {tag}
                        </Badge>
                      ))}
                      {business.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{business.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
                {canManageBusinesses && (
                  <CardFooter className="pt-0 pb-4 px-6 justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4 mr-2" />
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuBusinessId(business.id);
                            setShowSingleEmailDialog(true);
                          }}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuBusinessId(business.id);
                            setShowSingleEnrollDialog(true);
                          }}
                        >
                          <Target className="h-4 w-4 mr-2" />
                          Enroll in Campaign
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuBusinessId(business.id);
                            setShowSingleTagDialog(true);
                          }}
                        >
                          <Tag className="h-4 w-4 mr-2" />
                          Add Tags
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingBusiness(business);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Details
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        {!business.archived_at ? (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuBusinessId(business.id);
                              setShowSingleArchiveDialog(true);
                            }}
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuBusinessId(business.id);
                              setShowSingleRestoreDialog(true);
                            }}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuBusinessId(business.id);
                            setShowSingleDeleteDialog(true);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <CsvExportBusinessDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        selectedBusinessIds={selectedBusinessIds.length > 0 ? selectedBusinessIds : filteredAndSortedBusinesses.map(b => b.id)}
      />

      <AddBusinessDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={fetchBusinesses}
      />

      <ImportBusinessesDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportComplete={fetchBusinesses}
      />

      {editingBusiness && (
        <EditBusinessDialog
          open={!!editingBusiness}
          onOpenChange={(open) => !open && setEditingBusiness(null)}
          business={editingBusiness}
          onSuccess={fetchBusinesses}
        />
      )}

        <BulkActionToolbarBusiness
          selectedCount={selectedBusinessIds.length}
          onClearSelection={handleClearSelection}
          onArchive={() => setShowBulkArchiveDialog(true)}
          onRestore={() => setShowBulkRestoreDialog(true)}
          onDelete={() => setShowBulkDeleteDialog(true)}
          onExportCsv={handleBulkExport}
          onAddTags={handleBulkTag}
          onSendEmail={handleBulkEmail}
          onEnrollInCampaign={() => setShowEnrollmentDialog(true)}
          selectedBusinessesStatus={getSelectedBusinessesStatus()}
        />

      <AlertDialog open={showBulkArchiveDialog} onOpenChange={setShowBulkArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Businesses</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive {selectedBusinessIds.length} business{selectedBusinessIds.length === 1 ? '' : 'es'}? 
              They will be moved to the archived section and can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkArchive}>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBulkRestoreDialog} onOpenChange={setShowBulkRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Businesses</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore {selectedBusinessIds.length} business{selectedBusinessIds.length === 1 ? '' : 'es'}? 
              They will be moved back to active status and will appear in your active businesses list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkRestore}>
              <Archive className="h-4 w-4 mr-2" />
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Businesses</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {selectedBusinessIds.length} business{selectedBusinessIds.length === 1 ? '' : 'es'}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BulkTagDialogBusiness
        open={showBulkTagDialog}
        onOpenChange={setShowBulkTagDialog}
        selectedBusinessIds={selectedBusinessIds}
        onComplete={() => {
          fetchBusinesses();
          setSelectedBusinessIds([]);
        }}
      />

      <BulkEmailDialogBusiness
        open={showBulkEmailDialog}
        onOpenChange={setShowBulkEmailDialog}
        selectedBusinessIds={selectedBusinessIds}
        onComplete={() => {
          setSelectedBusinessIds([]);
        }}
      />

      <ManualEnrollmentDialog
        open={showEnrollmentDialog}
        onOpenChange={setShowEnrollmentDialog}
        organizationId={organizationUser.organization_id}
        preSelectedBusinessIds={selectedBusinessIds}
        onSuccess={() => {
          setSelectedBusinessIds([]);
          fetchBusinesses();
        }}
      />

      {/* Single Business Action Dialogs */}
      {menuBusinessId && (
        <>
          <BulkEmailDialogBusiness
            open={showSingleEmailDialog}
            onOpenChange={setShowSingleEmailDialog}
            selectedBusinessIds={[menuBusinessId]}
            onComplete={() => {
              setShowSingleEmailDialog(false);
              setMenuBusinessId(null);
            }}
          />

          <BulkTagDialogBusiness
            open={showSingleTagDialog}
            onOpenChange={setShowSingleTagDialog}
            selectedBusinessIds={[menuBusinessId]}
            onComplete={() => {
              setShowSingleTagDialog(false);
              setMenuBusinessId(null);
              fetchBusinesses();
            }}
          />

          <ManualEnrollmentDialog
            open={showSingleEnrollDialog}
            onOpenChange={setShowSingleEnrollDialog}
            organizationId={organizationUser.organization_id}
            preSelectedBusinessIds={[menuBusinessId]}
            onSuccess={() => {
              setShowSingleEnrollDialog(false);
              setMenuBusinessId(null);
              toast.success("Business enrolled in campaign");
            }}
          />
        </>
      )}

      {/* Single Business Archive Dialog */}
      <AlertDialog open={showSingleArchiveDialog} onOpenChange={setShowSingleArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Business</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this business? It will be moved to the archived section and can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMenuBusinessId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSingleArchive}>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single Business Restore Dialog */}
      <AlertDialog open={showSingleRestoreDialog} onOpenChange={setShowSingleRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Business</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore this business? It will be moved back to the active businesses list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMenuBusinessId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSingleRestore}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single Business Delete Dialog */}
      <AlertDialog open={showSingleDeleteDialog} onOpenChange={setShowSingleDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Business</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this business? This action cannot be undone.
              All linked donors and donation history will be preserved but the business profile will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMenuBusinessId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSingleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardPageLayout>
  );
};

export default Businesses;
