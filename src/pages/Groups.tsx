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
import { supabase } from "@/integrations/supabase/client";
import { useSchoolUser } from "@/hooks/useSchoolUser";

interface Group {
  id: string;
  group_name: string;
  school_name: string;
  group_type_name: string;
}

const Groups = () => {
  const [sortBy, setSortBy] = useState("name");
  const [filterBy, setFilterBy] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
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

      const formattedGroups: Group[] = (data || []).map((group) => ({
        id: group.id,
        group_name: group.group_name,
        school_name: group.schools.school_name,
        group_type_name: group.group_type.name,
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
    }
  }, [schoolUser]);

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

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">

            {showCreateForm ? (
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
                        <DropdownMenuItem onClick={() => setSortBy("name")}>
                          Name
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy("type")}>
                          Type
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy("status")}>
                          Status
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
                          <TableHead className="flex items-center gap-2">
                            Group Name
                            <ChevronDown className="h-4 w-4" />
                          </TableHead>
                          <TableHead>School</TableHead>
                          <TableHead>Group Type</TableHead>
                          <TableHead>Manage Roster</TableHead>
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
                        ) : groups.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                              No groups found
                            </TableCell>
                          </TableRow>
                        ) : (
                          groups.map((group) => (
                            <TableRow key={group.id}>
                              <TableCell className="font-medium">{group.group_name}</TableCell>
                              <TableCell>{group.school_name}</TableCell>
                              <TableCell>{group.group_type_name}</TableCell>
                              <TableCell>
                                <Button variant="default" size="sm">
                                  Manage
                                </Button>
                              </TableCell>
                              <TableCell>
                                <span className="text-muted-foreground">Inactive</span>
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
                                    <DropdownMenuItem>Delete</DropdownMenuItem>
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