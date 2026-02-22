import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MoreHorizontal, ChevronDown, Search, RefreshCw, Mail } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { MembershipRequestsTab } from "@/components/MembershipRequestsTab";
import { MembershipRequestHistory } from "@/components/MembershipRequestHistory";
import { ReinviteUserDialog } from "@/components/ReinviteUserDialog";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { AddUserForm } from "@/components/AddUserForm";
type AccountStatus = "signed_up" | "invited" | "not_confirmed";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  group_name: string | null;
  roster_year: number | null;
  status: boolean;
  school_user_id: string;
  accountStatus?: AccountStatus;
  email?: string | null;
}

const Users = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState("last_name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterBy, setFilterBy] = useState("active");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<{id: string, group_name: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null);
  const [reinviteUser, setReinviteUser] = useState<{ user: User; mode: "resend" | "change-email" } | null>(null);
  const { organizationUser } = useOrganizationUser();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Get initial tab from URL params
  const activeTab = searchParams.get("tab") || "users";

  // Check if user has permission to access this page
  const permissionLevel = organizationUser?.user_type.permission_level;
  const hasAccess = permissionLevel === 'organization_admin' || permissionLevel === 'program_manager';

  // Redirect unauthorized users
  useEffect(() => {
    if (organizationUser && !hasAccess) {
      navigate("/dashboard");
    }
  }, [organizationUser, hasAccess, navigate]);

  // Don't render anything for unauthorized users
  if (organizationUser && !hasAccess) {
    return null;
  }

  const fetchUsers = async () => {
    if (!organizationUser) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from("organization_user")
        .select(`
          id,
          user_id,
          active_user,
          user_type!inner(name, permission_level),
          groups(group_name),
          rosters(roster_year)
        `);

      const permissionLevel = organizationUser.user_type.permission_level;
      
      if (permissionLevel === 'organization_admin') {
        query = query.eq("organization_id", organizationUser.organization_id);
      } else if (permissionLevel === 'program_manager') {
        if (organizationUser.group_id) {
          query = query.eq("group_id", organizationUser.group_id);
        } else {
          setUsers([]);
          setLoading(false);
          return;
        }
      } else {
        setUsers([]);
        setLoading(false);
        return;
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching users:", error);
        return;
      }

      const userIds = (data || []).map((user: any) => user.user_id);
      
      let profilesData: any[] = [];
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", userIds);

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          return;
        }
        profilesData = profiles || [];
      }

      // Fetch auth statuses
      let authStatuses: Record<string, { emailConfirmed: boolean; lastSignIn: string | null; email: string | null; createdAt: string | null }> = {};
      if (userIds.length > 0) {
        try {
          const { data: statusData, error: statusError } = await supabase.functions.invoke("get-user-auth-status", {
            body: { userIds },
          });
          if (!statusError && statusData?.statuses) {
            authStatuses = statusData.statuses;
          }
        } catch (err) {
          console.error("Error fetching auth statuses:", err);
        }
      }

      const formattedUsers: User[] = (data || []).map((user: any) => {
        const profile = profilesData.find((p: any) => p.id === user.user_id);
        const authStatus = authStatuses[user.user_id];
        
        let accountStatus: AccountStatus = "invited";
        if (authStatus) {
          const lastSignIn = authStatus.lastSignIn ? new Date(authStatus.lastSignIn).getTime() : null;
          const createdAt = authStatus.createdAt ? new Date(authStatus.createdAt).getTime() : null;
          const isRealLogin = lastSignIn && createdAt && (lastSignIn - createdAt) > 60000;
          
          if (isRealLogin) {
            accountStatus = "signed_up";
          }
          // If lastSignIn exists but gap is tiny, it was the automated invite flow — keep as "invited"
        }

        return {
          id: user.user_id,
          school_user_id: user.id,
          first_name: profile?.first_name || "",
          last_name: profile?.last_name || "",
          role: user.user_type?.name || "",
          group_name: user.groups?.group_name || null,
          roster_year: user.rosters?.roster_year || null,
          status: user.active_user ?? true,
          accountStatus,
          email: authStatus?.email || null,
        };
      });

      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequestsCount = async () => {
    if (!organizationUser?.organization_id) return;
    
    const { count } = await supabase
      .from("membership_requests")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationUser.organization_id)
      .eq("status", "pending");
    
    setPendingRequestsCount(count || 0);
  };

  useEffect(() => {
    if (organizationUser) {
      fetchUsers();
      fetchPendingRequestsCount();
    }
  }, [organizationUser, selectedGroup]);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const handleGroupClick = async (groupId: string | null) => {
    if (groupId) {
      const { data: groupData } = await supabase
        .from("groups")
        .select("id, group_name")
        .eq("id", groupId)
        .single();
        
      if (groupData) {
        setSelectedGroup(groupData);
      }
    } else {
      setSelectedGroup(null);
    }
  };

  const handleUpdateUserStatus = async (organizationUserId: string, newStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("organization_user")
        .update({ active_user: newStatus })
        .eq("id", organizationUserId);

      if (error) {
        console.error("Error updating user status:", error);
        return;
      }
      fetchUsers();
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const handleResendInvite = (user: User) => {
    setReinviteUser({ user, mode: "resend" });
  };

  const handleChangeEmailInvite = (user: User) => {
    setReinviteUser({ user, mode: "change-email" });
  };

  const handleSort = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortDirection(newSortBy === "last_name" || newSortBy === "first_name" ? "asc" : "desc");
    }
  };

  const getAccountStatusBadge = (status?: AccountStatus) => {
    switch (status) {
      case "signed_up":
        return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Signed Up</Badge>;
      case "invited":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">Invited</Badge>;
      case "not_confirmed":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100">Not Confirmed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // Apply filtering
  const filteredUsers = users.filter((user) => {
    if (filterBy === "active" && user.status !== true) return false;
    if (filterBy === "inactive" && user.status !== false) return false;
    if (filterBy === "invited" && user.accountStatus !== "invited") return false;
    if (filterBy === "signed_up" && user.accountStatus !== "signed_up") return false;
    
    if (selectedGroup && user.group_name !== selectedGroup.group_name) return false;
    
    if (searchTerm.length >= 3) {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      if (!fullName.includes(searchLower)) return false;
    }
    
    return true;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue: string;
    let bValue: string;

    switch (sortBy) {
      case "last_name":
        aValue = a.last_name;
        bValue = b.last_name;
        break;
      case "first_name":
        aValue = a.first_name;
        bValue = b.first_name;
        break;
      case "role":
        aValue = a.role;
        bValue = b.role;
        break;
      case "group":
        aValue = a.group_name || "";
        bValue = b.group_name || "";
        break;
      case "status":
        aValue = a.status ? "Active" : "Inactive";
        bValue = b.status ? "Active" : "Inactive";
        break;
      default:
        aValue = a.last_name;
        bValue = b.last_name;
    }

    const comparison = aValue.localeCompare(bValue);
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const getFilterLabel = () => {
    switch (filterBy) {
      case "all": return "All";
      case "active": return "Active";
      case "inactive": return "Inactive";
      case "invited": return "Invited";
      case "signed_up": return "Signed Up";
      default: return "Filter";
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          activeGroup={selectedGroup}
          onGroupClick={handleGroupClick}
        />
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <h2 className="text-xl font-semibold text-foreground">Users</h2>
            
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value="users">Active Users</TabsTrigger>
                <TabsTrigger value="pending" className="relative">
                  Pending Requests
                  {pendingRequestsCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="ml-2 h-5 min-w-5 px-1.5 text-xs"
                    >
                      {pendingRequestsCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="history">Request History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="users" className="mt-4">
                <div id="users-admin-table" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by name (min 3 characters)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  {/* Sort Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full sm:w-24">
                        Sort
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleSort("last_name")}>
                        Last Name {sortBy === "last_name" ? (sortDirection === "desc" ? "↓" : "↑") : ""}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSort("first_name")}>
                        First Name {sortBy === "first_name" ? (sortDirection === "desc" ? "↓" : "↑") : ""}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSort("role")}>
                        Role {sortBy === "role" ? (sortDirection === "desc" ? "↓" : "↑") : ""}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSort("group")}>
                        Group {sortBy === "group" ? (sortDirection === "desc" ? "↓" : "↑") : ""}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSort("status")}>
                        Status {sortBy === "status" ? (sortDirection === "desc" ? "↓" : "↑") : ""}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Filter Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full sm:w-28">
                        {getFilterLabel()}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setFilterBy("all")}>
                        All
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterBy("active")}>
                        Active
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterBy("inactive")}>
                        Inactive
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setFilterBy("invited")}>
                        Invited Only
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterBy("signed_up")}>
                        Signed Up Only
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Add User Button */}
                  <Button onClick={() => setShowAddUserForm(true)} className="w-full sm:w-auto">
                    Add User
                  </Button>
                </div>
              </div>

              {/* Users Table/Cards */}
              {isMobile ? (
                // Mobile Card View
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {loading ? (
                    <Card>
                      <CardContent className="py-4 text-center">Loading...</CardContent>
                    </Card>
                  ) : users.length === 0 ? (
                    <Card>
                      <CardContent className="py-4 text-center text-muted-foreground">
                        No users found
                      </CardContent>
                    </Card>
                  ) : (
                    sortedUsers.map((user) => (
                      <Card key={user.school_user_id}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base truncate">{user.last_name}, {user.first_name}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">{user.role}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant={user.status ? "default" : "secondary"}>
                                {user.status ? "Active" : "Inactive"}
                              </Badge>
                              {getAccountStatusBadge(user.accountStatus)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Group:</span>
                              <span className="font-medium">{user.group_name || "-"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Roster Year:</span>
                              <span className="font-medium">{user.roster_year || "-"}</span>
                            </div>
                            {user.email && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Email:</span>
                                <span className="font-medium text-xs truncate max-w-[180px]">{user.email}</span>
                              </div>
                            )}
                            
                            <div className="flex gap-2 mt-2">
                              {user.status ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => setDeactivateUser(user)}
                                >
                                  Deactivate
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handleUpdateUserStatus(user.school_user_id, true)}
                                >
                                  Activate
                                </Button>
                              )}
                              {user.accountStatus === "invited" && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleResendInvite(user)}>
                                      <RefreshCw className="mr-2 h-4 w-4" />
                                      Re-send Invite
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleChangeEmailInvite(user)}>
                                      <Mail className="mr-2 h-4 w-4" />
                                      Change Email & Re-invite
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              ) : (
                // Desktop Table View
                <Card>
                  <CardContent className="p-0">
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Group</TableHead>
                        <TableHead>Roster Year</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedUsers.map((user) => (
                          <TableRow key={user.school_user_id}>
                            <TableCell className="font-medium">
                              {user.last_name}, {user.first_name}
                            </TableCell>
                            <TableCell>{user.role}</TableCell>
                            <TableCell>{user.group_name || "-"}</TableCell>
                            <TableCell>{user.roster_year || "-"}</TableCell>
                            <TableCell>
                              <span className={user.status ? "text-green-600" : "text-muted-foreground"}>
                                {user.status ? "Active" : "Inactive"}
                              </span>
                            </TableCell>
                            <TableCell>
                              {getAccountStatusBadge(user.accountStatus)}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {user.status ? (
                                    <DropdownMenuItem onClick={() => setDeactivateUser(user)}>
                                      Deactivate
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => handleUpdateUserStatus(user.school_user_id, true)}>
                                      Activate
                                    </DropdownMenuItem>
                                  )}
                                  {user.accountStatus === "invited" && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleResendInvite(user)}>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Re-send Invite
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleChangeEmailInvite(user)}>
                                        <Mail className="mr-2 h-4 w-4" />
                                        Change Email & Re-invite
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              )}
              
              <p className="text-sm text-muted-foreground italic mt-4">
                Note: Once a person is added to the system, only they can update their person information (Name, email).
              </p>
                </div>
              </TabsContent>
              
              <TabsContent value="pending" className="mt-4">
                <MembershipRequestsTab 
                  organizationId={organizationUser?.organization_id || ""}
                  onRequestProcessed={() => {
                    fetchPendingRequestsCount();
                    fetchUsers();
                  }}
                />
              </TabsContent>
              
              <TabsContent value="history" className="mt-4">
                <MembershipRequestHistory 
                  organizationId={organizationUser?.organization_id || ""}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <AddUserForm
        open={showAddUserForm}
        onOpenChange={setShowAddUserForm}
        organizationId={organizationUser?.organization_id || ""}
        onSuccess={fetchUsers}
      />

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={!!deactivateUser} onOpenChange={(open) => !open && setDeactivateUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deactivation of {deactivateUser?.first_name} {deactivateUser?.last_name}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {deactivateUser?.first_name} {deactivateUser?.last_name}? 
              They will no longer be able to participate in that groups campaigns.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (deactivateUser) {
                  handleUpdateUserStatus(deactivateUser.school_user_id, false);
                  setDeactivateUser(null);
                }
              }}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reinvite Dialog */}
      <ReinviteUserDialog
        open={!!reinviteUser}
        onOpenChange={(open) => !open && setReinviteUser(null)}
        user={reinviteUser ? {
          id: reinviteUser.user.id,
          first_name: reinviteUser.user.first_name,
          last_name: reinviteUser.user.last_name,
          email: reinviteUser.user.email || null,
        } : null}
        organizationId={organizationUser?.organization_id || ""}
        onSuccess={fetchUsers}
        mode={reinviteUser?.mode || "resend"}
      />
    </div>
  );
};

export default Users;
