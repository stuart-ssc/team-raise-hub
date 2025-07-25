import { useState, useEffect } from "react";
import { MoreHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolUser } from "@/hooks/useSchoolUser";

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
  }, [schoolUser]);

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
    if (filterBy === "active") return user.status === true;
    if (filterBy === "inactive") return user.status === false;
    return true; // "all" shows everything
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
        <DashboardHeader />
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <div id="users-admin-table" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Users</h2>
                
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
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Edit</DropdownMenuItem>
                                  {user.status ? (
                                    <DropdownMenuItem 
                                      onClick={() => handleUpdateUserStatus(user.school_user_id, false)}
                                    >
                                      Remove
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem 
                                      onClick={() => handleUpdateUserStatus(user.school_user_id, true)}
                                    >
                                      Reactivate
                                    </DropdownMenuItem>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;