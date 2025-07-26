import { useState, useEffect } from "react";
import { MoreHorizontal, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolUser } from "@/hooks/useSchoolUser";
import { AddUserForm } from "@/components/AddUserForm";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  group_name: string | null;
  roster_year: number | null;
  status: boolean;
  school_user_id: string;
}

const Users = () => {
  const [sortBy, setSortBy] = useState("last_name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterBy, setFilterBy] = useState("active");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<{id: string, group_name: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const { schoolUser } = useSchoolUser();

  const fetchUsers = async () => {
    if (!schoolUser) return;

    try {
      setLoading(true);
      
      // Build the base query with proper joins
      let query = supabase
        .from("school_user")
        .select(`
          id,
          user_id,
          active_user,
          user_type!inner(name),
          groups(group_name, group_type!inner(name)),
          rosters(roster_year)
        `);

      // Apply role-based filtering
      if (schoolUser.user_type.name === "Principal") {
        // Principals see all users for their school
        query = query.eq("school_id", schoolUser.school_id);
      } else if (schoolUser.user_type.name === "Athletic Director") {
        // Athletic Directors see users in sports groups at their school
        query = query
          .eq("school_id", schoolUser.school_id)
          .eq("groups.group_type.name", "Sports Team");
      } else if (["Coach", "Club Sponsor", "Booster Leader"].includes(schoolUser.user_type.name)) {
        // These roles see only users in groups they are connected to
        if (schoolUser.group_id) {
          query = query.eq("group_id", schoolUser.group_id);
        } else {
          // If no group assigned, show empty results
          setUsers([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching users:", error);
        return;
      }

      // Now fetch profile data for each user
      const userIds = (data || []).map((user: any) => user.user_id);
      
      let profilesData = [];
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

      // Merge the data
      const formattedUsers: User[] = (data || []).map((user: any) => {
        const profile = profilesData.find((p: any) => p.id === user.user_id);
        
        return {
          id: user.user_id,
          school_user_id: user.id,
          first_name: profile?.first_name || "",
          last_name: profile?.last_name || "",
          role: user.user_type?.name || "",
          group_name: user.groups?.group_name || null,
          roster_year: user.rosters?.roster_year || null,
          status: user.active_user ?? true,
        };
      });

      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolUser) {
      fetchUsers();
    }
  }, [schoolUser, selectedGroup]);

  const handleGroupClick = async (groupId: string | null) => {
    if (groupId) {
      // Fetch the group details to get the name
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

  const handleUpdateUserStatus = async (schoolUserId: string, newStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("school_user")
        .update({ active_user: newStatus })
        .eq("id", schoolUserId);

      if (error) {
        console.error("Error updating user status:", error);
        return;
      }

      // Refresh the users list
      fetchUsers();
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const handleSort = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      // Toggle direction if same sort field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New sort field, default to ascending for names
      setSortBy(newSortBy);
      setSortDirection(newSortBy === "last_name" || newSortBy === "first_name" ? "asc" : "desc");
    }
  };

  // Apply filtering first
  const filteredUsers = users.filter((user) => {
    // Apply status filter
    if (filterBy === "active" && user.status !== true) return false;
    if (filterBy === "inactive" && user.status !== false) return false;
    
    // Apply group filter if a specific group is selected
    if (selectedGroup && user.group_name !== selectedGroup.group_name) return false;
    
    // Apply search filter if search term is 3+ characters
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
                
                <div className="flex items-center gap-3">
                  {/* Sort Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-24">
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
                      <Button variant="outline" className="w-24">
                        {filterBy === "all" ? "All" : filterBy === "active" ? "Active" : "Inactive"}
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
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Add User Button */}
                  <Button onClick={() => setShowAddUserForm(true)}>
                    Add User
                  </Button>
                </div>
              </div>

              {/* Users Table */}
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
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedUsers.map((user) => (
                          <TableRow key={user.id}>
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
                              {user.status ? (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <button className="text-primary hover:text-primary/80 text-sm underline">
                                      Deactivate
                                    </button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirm Deactivation of {user.first_name} {user.last_name}</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to deactivate {user.first_name} {user.last_name}? 
                                        They will no longer be able to participate in that groups campaigns.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleUpdateUserStatus(user.school_user_id, false)}
                                      >
                                        Deactivate
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              ) : (
                                <button
                                  onClick={() => handleUpdateUserStatus(user.school_user_id, true)}
                                  className="text-primary hover:text-primary/80 text-sm underline"
                                >
                                  Activate
                                </button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              
              <p className="text-sm text-muted-foreground italic mt-4">
                Note: Once a person is added to the system, only they can update their person information (Name, email).
              </p>
            </div>
          </div>
        </div>
      </div>

      <AddUserForm
        open={showAddUserForm}
        onOpenChange={setShowAddUserForm}
        schoolId={schoolUser?.school_id || ""}
        onSuccess={fetchUsers}
      />
    </div>
  );
};

export default Users;