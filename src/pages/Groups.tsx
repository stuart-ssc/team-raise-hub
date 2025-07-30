import { useState, useEffect } from "react";
import { MoreHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CreateGroupForm } from "@/components/CreateGroupForm";
import Rosters from "@/pages/Rosters";
import { StripeConnectManager } from "@/components/StripeConnectManager";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolUser } from "@/hooks/useSchoolUser";

interface Group {
  id: string;
  group_name: string;
  school_name: string;
  group_type_name: string;
  status: boolean;
  stripe_account_id?: string;
  stripe_account_enabled?: boolean;
}

const Groups = () => {
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filterBy, setFilterBy] = useState("active");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showRosters, setShowRosters] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const { schoolUser } = useSchoolUser();

  const fetchGroups = async () => {
    if (!schoolUser) return;

    try {
      setLoading(true);
      let query = supabase
        .from("groups")
        .select(`
          id,
          group_name,
          status,
          stripe_account_id,
          stripe_account_enabled,
          schools!school_id(school_name),
          group_type!group_type_id(name)
        `);

      // Apply role-based filtering
      if (schoolUser.user_type.name === "Principal") {
        // Principals see all groups for their school
        query = query.eq("school_id", schoolUser.school_id);
      } else if (schoolUser.user_type.name === "Athletic Director") {
        // Athletic Directors see all sports teams at their school
        query = query
          .eq("school_id", schoolUser.school_id)
          .eq("group_type.name", "Sport");
      } else if (["Coach", "Club Sponsor", "Booster Leader"].includes(schoolUser.user_type.name)) {
        // These roles see only groups they are connected to
        if (schoolUser.group_id) {
          query = query.eq("id", schoolUser.group_id);
        } else {
          // If no group assigned, show empty results
          setGroups([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching groups:", error);
        return;
      }

      const formattedGroups: Group[] = (data || []).map((group: any) => ({
        id: group.id,
        group_name: group.group_name,
        school_name: group.schools.school_name,
        group_type_name: group.group_type.name,
        status: group.status ?? true,
        stripe_account_id: group.stripe_account_id,
        stripe_account_enabled: group.stripe_account_enabled,
      }));

      setGroups(formattedGroups);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolUser) {
      fetchGroups();
      createMissingRosters();
    }
  }, [schoolUser]);

  const createMissingRosters = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-missing-rosters');
      
      if (error) {
        console.error('Error creating missing rosters:', error);
        return;
      }
      
      console.log('Missing rosters creation result:', data);
    } catch (error) {
      console.error('Error calling create-missing-rosters function:', error);
    }
  };

  const handleNewGroupClick = () => {
    setShowCreateForm(true);
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setShowCreateForm(true);
  };

  const handleFormCancel = () => {
    setShowCreateForm(false);
    setEditingGroup(null);
  };

  const handleFormSuccess = () => {
    setShowCreateForm(false);
    setEditingGroup(null);
    fetchGroups(); // Refresh the groups list
  };

  const handleManageRoster = (group: Group) => {
    setSelectedGroup(group);
    setShowRosters(true);
  };

  const handleBackToGroups = () => {
    setShowRosters(false);
    setSelectedGroup(null);
  };

  const handleGroupClick = (groupId: string | null) => {
    if (groupId === null) {
      // Clicked "All" - go back to groups view
      setShowRosters(false);
      setSelectedGroup(null);
    } else {
      // Clicked a specific group - find it and show its roster
      const group = groups.find(g => g.id === groupId);
      if (group) {
        setSelectedGroup(group);
        setShowRosters(true);
      }
    }
  };

  const handleUpdateGroupStatus = async (groupId: string, newStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("groups")
        .update({ status: newStatus } as any)
        .eq("id", groupId);

      if (error) {
        console.error("Error updating group status:", error);
        return;
      }

      // Refresh the groups list
      fetchGroups();
    } catch (error) {
      console.error("Error updating group status:", error);
    }
  };

  const handleSort = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      // Toggle direction if same sort field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New sort field, default to descending
      setSortBy(newSortBy);
      setSortDirection("desc");
    }
  };

  // Apply filtering first
  const filteredGroups = groups.filter((group) => {
    if (filterBy === "active") return group.status === true;
    if (filterBy === "inactive") return group.status === false;
    return true; // "all" shows everything
  });

  const sortedGroups = [...filteredGroups].sort((a, b) => {
    let aValue: string;
    let bValue: string;

    switch (sortBy) {
      case "name":
        aValue = a.group_name;
        bValue = b.group_name;
        break;
      case "type":
        aValue = a.group_type_name;
        bValue = b.group_type_name;
        break;
      case "status":
        aValue = a.status ? "Active" : "Inactive";
        bValue = b.status ? "Active" : "Inactive";
        break;
      default:
        aValue = a.group_name;
        bValue = b.group_name;
    }

    const comparison = aValue.localeCompare(bValue);
    return sortDirection === "asc" ? comparison : -comparison;
  });

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          activeGroup={showRosters ? selectedGroup : null}
          onGroupClick={handleGroupClick}
          showRosters={showRosters}
        />
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">

            {showRosters && selectedGroup ? (
              // Show Rosters Page
              <Rosters 
                selectedGroup={selectedGroup}
                onBack={handleBackToGroups}
              />
            ) : showCreateForm ? (
              // Show Create Group Form
              <CreateGroupForm 
                onCancel={handleFormCancel}
                onSuccess={handleFormSuccess}
                editingGroup={editingGroup}
              />
            ) : (
              // Show Groups Admin Table
              <div id="groups-admin-table" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground">Groups</h2>
                  
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
                         <DropdownMenuItem onClick={() => handleSort("name")}>
                           Name {sortBy === "name" ? (sortDirection === "desc" ? "↓" : "↑") : ""}
                         </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => handleSort("type")}>
                           Type {sortBy === "type" ? (sortDirection === "desc" ? "↓" : "↑") : ""}
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
                          Filter
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

                    {/* New Button */}
                    <Button 
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleNewGroupClick}
                    >
                      New
                    </Button>
                  </div>
                </div>

                {/* Groups Table */}
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                           <TableHead>
                             Group Name
                           </TableHead>
                           <TableHead>School</TableHead>
                           <TableHead>Group Type</TableHead>
                           <TableHead>Manage Roster</TableHead>
                           <TableHead>Stripe Connect</TableHead>
                           <TableHead>Status</TableHead>
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
                         ) : groups.length === 0 ? (
                           <TableRow>
                             <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                               No groups found
                             </TableCell>
                           </TableRow>
                          ) : (
                            sortedGroups.map((group) => (
                             <TableRow key={group.id}>
                               <TableCell className="font-medium">{group.group_name}</TableCell>
                               <TableCell>{group.school_name}</TableCell>
                               <TableCell>{group.group_type_name}</TableCell>
                                <TableCell>
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    onClick={() => handleManageRoster(group)}
                                  >
                                    Manage
                                  </Button>
                                </TableCell>
                                <TableCell>
                                  <StripeConnectManager
                                    groupId={group.id}
                                    groupName={group.group_name}
                                    stripeAccountId={group.stripe_account_id}
                                    stripeAccountEnabled={group.stripe_account_enabled}
                                  />
                                </TableCell>
                                <TableCell>
                                  <span className={group.status ? "text-green-600" : "text-muted-foreground"}>
                                    {group.status ? "Active" : "Inactive"}
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
                                      <DropdownMenuItem onClick={() => handleEditGroup(group)}>Edit</DropdownMenuItem>
                                      {group.status ? (
                                        <DropdownMenuItem onClick={() => handleUpdateGroupStatus(group.id, false)}>
                                          Delete
                                        </DropdownMenuItem>
                                      ) : (
                                        <DropdownMenuItem onClick={() => handleUpdateGroupStatus(group.id, true)}>
                                          Activate
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Groups;