import { useState, useEffect } from "react";
import { ChevronDown, ArrowLeft, Plus, UserPlus, Upload, Mail } from "lucide-react";
import { NewRosterForm } from "@/components/NewRosterForm";
import { AddParticipantForm } from "@/components/AddParticipantForm";
import { BulkRosterUpload } from "@/components/BulkRosterUpload";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { toast } from "@/hooks/use-toast";

interface SchoolUser {
  id: string;
  user_id: string;
  user_type_id: string;
  roster_id: number;
  active_user: boolean;
  profiles: {
    first_name: string;
    last_name: string;
  };
  user_type: {
    name: string;
  };
  account_status?: "no_invite" | "invite_sent" | "email_opened" | "link_clicked" | "account_created";
  last_sign_in_at?: string | null;
  invite_sent_at?: string | null;
}

interface Roster {
  id: number;
  group_id: string;
  roster_year: number;
  current_roster: boolean;
  created_at: string;
}

interface Group {
  id: string;
  group_name: string;
  school_name: string;
  group_type_name: string;
  organization_type: 'school' | 'nonprofit';
  status: boolean;
}

interface RostersProps {
  selectedGroup: Group;
  onBack: () => void;
}

const Rosters = ({ selectedGroup, onBack }: RostersProps) => {
  const [filterBy, setFilterBy] = useState("active");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [schoolUsers, setSchoolUsers] = useState<SchoolUser[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRosterForm, setShowNewRosterForm] = useState(false);
  const [showAddParticipantForm, setShowAddParticipantForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const { organizationUser } = useOrganizationUser();

  const fetchRosters = async () => {
    if (!selectedGroup) return;

    try {
      setLoading(true);
      console.log("Fetching rosters for group:", selectedGroup.id);
      
      const { data, error } = await supabase
        .from("rosters")
        .select("*")
        .eq("group_id", selectedGroup.id)
        .order("roster_year", { ascending: false });

      if (error) {
        console.error("Error fetching rosters:", error);
        return;
      }

      console.log("Roster data:", data);
      setRosters(data || []);
      
      // Extract unique years and ensure they're properly sorted
      const years = [...new Set((data || []).map(roster => roster.roster_year))].sort((a, b) => b - a);
      console.log("Available years:", years);
      setAvailableYears(years);

      // Set default year to current roster year
      const currentRoster = (data || []).find(roster => roster.current_roster);
      console.log("Current roster:", currentRoster);
      
      if (currentRoster) {
        console.log("Setting selected year to current roster year:", currentRoster.roster_year);
        setSelectedYear(currentRoster.roster_year.toString());
        fetchSchoolUsers(currentRoster.id);
      } else if (years.length > 0) {
        // If no current roster, default to the most recent year
        console.log("No current roster found, defaulting to most recent year:", years[0]);
        setSelectedYear(years[0].toString());
        const firstRoster = (data || []).find(roster => roster.roster_year === years[0]);
        if (firstRoster) {
          fetchSchoolUsers(firstRoster.id);
        }
      } else {
        console.log("No rosters found for this group");
      }
    } catch (error) {
      console.error("Error fetching rosters:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchoolUsers = async (rosterId: number) => {
    try {
      // Get all organization users for this roster (both active and inactive)
      const { data: schoolUsersData, error: schoolUsersError } = await supabase
        .from("organization_user")
        .select("id, user_id, user_type_id, roster_id, active_user")
        .eq("roster_id", rosterId);

      if (schoolUsersError) {
        console.error("Error fetching school users:", schoolUsersError);
        return;
      }

      if (!schoolUsersData || schoolUsersData.length === 0) {
        setSchoolUsers([]);
        return;
      }

      // Get user profiles
      const userIds = schoolUsersData.map(user => user.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", userIds);

      // Get user types
      const userTypeIds = schoolUsersData.map(user => user.user_type_id);
      const { data: userTypesData, error: userTypesError } = await supabase
        .from("user_type")
        .select("id, name")
        .in("id", userTypeIds);

      if (profilesError || userTypesError) {
        console.error("Error fetching user data:", { profilesError, userTypesError });
        return;
      }

      // Pull auth status (last_sign_in_at, email confirmation) and invitation tracking in parallel
      const [authStatusRes, deliveryRes] = await Promise.all([
        supabase.functions.invoke("get-user-auth-status", { body: { userIds } }),
        (async () => {
          // Map user_id -> email so we can match email_delivery_log rows
          const emailById = new Map<string, string>();
          // Use the auth admin lookup via the same function above; emails returned in statuses
          return null;
        })(),
      ]);
      const authStatuses: Record<string, any> = (authStatusRes as any)?.data?.statuses ?? {};

      // Build email -> tracking row map from the most-recent invitation per recipient
      const emails = Object.values(authStatuses)
        .map((s: any) => (s?.email ? String(s.email).toLowerCase() : null))
        .filter(Boolean) as string[];
      const trackingByEmail = new Map<string, { sent_at: string | null; opened_at: string | null; clicked_at: string | null }>();
      if (emails.length > 0) {
        const { data: dlogs } = await supabase
          .from("email_delivery_log")
          .select("recipient_email, sent_at, opened_at, clicked_at, created_at")
          .eq("email_type", "invitation")
          .in("recipient_email", emails)
          .order("created_at", { ascending: false })
          .limit(1000);
        for (const row of dlogs ?? []) {
          const k = (row as any).recipient_email?.toLowerCase();
          if (k && !trackingByEmail.has(k)) {
            trackingByEmail.set(k, {
              sent_at: (row as any).sent_at,
              opened_at: (row as any).opened_at,
              clicked_at: (row as any).clicked_at,
            });
          }
        }
      }

      // Combine the data
      const combinedData = schoolUsersData.map(user => {
        const profile = profilesData?.find(p => p.id === user.user_id);
        const userType = userTypesData?.find(ut => ut.id === user.user_type_id);
        const auth = authStatuses[user.user_id];
        const email = auth?.email ? String(auth.email).toLowerCase() : null;
        const tracking = email ? trackingByEmail.get(email) : null;
        const lastSignIn = auth?.lastSignIn ?? null;
        const inviteSentAt = tracking?.sent_at ?? null;

        let accountStatus: SchoolUser["account_status"] = "no_invite";
        if (lastSignIn || auth?.emailConfirmed) accountStatus = "account_created";
        else if (tracking?.clicked_at) accountStatus = "link_clicked";
        else if (tracking?.opened_at) accountStatus = "email_opened";
        else if (inviteSentAt) accountStatus = "invite_sent";

        return {
          ...user,
          profiles: {
            first_name: profile?.first_name || "",
            last_name: profile?.last_name || ""
          },
          user_type: {
            name: userType?.name || ""
          },
          account_status: accountStatus,
          last_sign_in_at: lastSignIn,
          invite_sent_at: inviteSentAt,
        };
      });

      setSchoolUsers(combinedData);
    } catch (error) {
      console.error("Error fetching school users:", error);
    }
  };

  const handleCreateRoster = async (data: { rosterYear: number; currentRoster: boolean }) => {
    try {
      // If marking as current roster, first set all other rosters for this group to false
      if (data.currentRoster) {
        await supabase
          .from("rosters")
          .update({ current_roster: false })
          .eq("group_id", selectedGroup.id);
      }

      // Create the new roster
      const { error } = await supabase
        .from("rosters")
        .insert({
          group_id: selectedGroup.id,
          roster_year: data.rosterYear,
          current_roster: data.currentRoster,
        });

      if (error) {
        console.error("Error creating roster:", error);
        toast({
          title: "Error",
          description: "Failed to create roster",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Roster created successfully",
      });
      fetchRosters(); // Refresh the rosters list
    } catch (error) {
      console.error("Error creating roster:", error);
      toast({
        title: "Error",
        description: "Failed to create roster",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (selectedGroup) {
      fetchRosters();
    }
  }, [selectedGroup]);

  const handleFilterChange = (filter: string) => {
    setFilterBy(filter);
  };

  const handleYearChange = (year: string) => {
    if (year === "new") {
      setShowNewRosterForm(true);
      return;
    }
    setSelectedYear(year);
    const selectedRoster = rosters.find(roster => roster.roster_year.toString() === year);
    if (selectedRoster) {
      fetchSchoolUsers(selectedRoster.id);
    }
  };

  // Apply filtering to school users
  const filteredSchoolUsers = schoolUsers.filter((user) => {
    switch (filterBy) {
      case "active":
        return user.active_user === true;
      case "inactive":
        return user.active_user === false;
      case "all":
      default:
        return true;
    }
  }).sort((a, b) => {
    // Sort by name (last name, first name)
    const aName = `${a.profiles.last_name}, ${a.profiles.first_name}`;
    const bName = `${b.profiles.last_name}, ${b.profiles.first_name}`;
    return aName.localeCompare(bName);
  });

  const handleRemoveUser = async (userId: string, userName: string) => {
    try {
      const { error } = await supabase
        .from("organization_user")
        .update({ active_user: false })
        .eq("id", userId);

      if (error) {
        console.error("Error removing user:", error);
        toast({
          title: "Error",
          description: "Failed to remove user from roster",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `${userName} has been removed from the roster`,
      });

      // Refresh the users list
      const selectedRoster = rosters.find(r => r.roster_year.toString() === selectedYear);
      if (selectedRoster) {
        fetchSchoolUsers(selectedRoster.id);
      }
    } catch (error) {
      console.error("Error removing user:", error);
      toast({
        title: "Error",
        description: "Failed to remove user from roster",
        variant: "destructive",
      });
    }
  };

  const handleReactivateUser = async (userId: string, userName: string) => {
    try {
      const { error } = await supabase
        .from("organization_user")
        .update({ active_user: true })
        .eq("id", userId);

      if (error) {
        console.error("Error reactivating user:", error);
        toast({
          title: "Error",
          description: "Failed to reactivate user",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `${userName} has been reactivated`,
      });

      // Refresh the users list
      const selectedRoster = rosters.find(r => r.roster_year.toString() === selectedYear);
      if (selectedRoster) {
        fetchSchoolUsers(selectedRoster.id);
      }
    } catch (error) {
      console.error("Error reactivating user:", error);
      toast({
        title: "Error",
        description: "Failed to reactivate user",
        variant: "destructive",
      });
    }
  };

   return (
     <div id="rosters-table" className="space-y-4">
        {showAddParticipantForm ? (
          <AddParticipantForm
            groupId={selectedGroup.id}
            groupName={selectedGroup.group_name}
            groupTypeName={selectedGroup.group_type_name}
            organizationType={selectedGroup.organization_type}
            organizationId={organizationUser?.organization_id || ""}
            rosters={rosters}
           onBack={() => setShowAddParticipantForm(false)}
           onSuccess={() => {
             setShowAddParticipantForm(false);
             const selectedRoster = rosters.find(r => r.roster_year.toString() === selectedYear);
             if (selectedRoster) {
               fetchSchoolUsers(selectedRoster.id);
             }
           }}
         />
       ) : (
         <>
           <div className="flex items-center justify-between">
             <h2 className="text-xl font-semibold text-foreground">
               {selectedGroup.group_name} Roster
             </h2>
             
             <div className="flex items-center gap-3">
            {/* Year Filter */}
            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
                <Separator className="my-1" />
                <SelectItem value="new">
                  <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Roster
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Controls */}
            <Select value={filterBy} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

               {/* Add Participant Button */}
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setShowAddParticipantForm(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Participant
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowBulkUpload(true)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk Upload
                </Button>
             </div>
           </div>

        {/* School Users Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead className="flex items-center gap-2">
                     Name
                     <ChevronDown className="h-4 w-4" />
                   </TableHead>
                   <TableHead>User Type</TableHead>
                   <TableHead>Account Status</TableHead>
                   <TableHead>Last Login</TableHead>
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
                 ) : schoolUsers.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                       No users found for this roster
                     </TableCell>
                   </TableRow>
                 ) : (
                   filteredSchoolUsers.map((user) => (
                      <TableRow 
                        key={user.id} 
                        className={!user.active_user ? "bg-muted/50" : ""}
                      >
                       <TableCell className="font-medium">
                         {user.profiles.last_name}, {user.profiles.first_name}
                       </TableCell>
                       <TableCell>
                         {user.user_type.name}
                       </TableCell>
                       <TableCell>
                         {(() => {
                           const s = user.account_status || "no_invite";
                           const map: Record<string, { label: string; cls: string }> = {
                             account_created: { label: "Account Created", cls: "bg-green-100 text-green-800" },
                             link_clicked: { label: "Link Clicked", cls: "bg-blue-100 text-blue-800" },
                             email_opened: { label: "Email Opened", cls: "bg-sky-100 text-sky-800" },
                             invite_sent: { label: "Invite Sent", cls: "bg-amber-100 text-amber-800" },
                             no_invite: { label: "Not Invited", cls: "bg-gray-100 text-gray-700" },
                           };
                           const m = map[s];
                           return (
                             <span className={`px-2 py-1 rounded-full text-xs font-medium ${m.cls}`}>
                               {m.label}
                             </span>
                           );
                         })()}
                       </TableCell>
                       <TableCell className="text-xs text-muted-foreground">
                         {user.last_sign_in_at
                           ? new Date(user.last_sign_in_at).toLocaleDateString()
                           : "Never"}
                       </TableCell>
                       <TableCell>
                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                           user.active_user 
                             ? "bg-green-100 text-green-800" 
                             : "bg-gray-100 text-gray-800"
                         }`}>
                           {user.active_user ? "Active" : "Inactive"}
                         </span>
                       </TableCell>
                         <TableCell>
                           {user.active_user ? (
                             <AlertDialog>
                               <AlertDialogTrigger asChild>
                                 <Button 
                                   variant="ghost" 
                                   size="sm"
                                   className="text-red-600 hover:text-white hover:bg-red-600"
                                 >
                                   Remove
                                 </Button>
                               </AlertDialogTrigger>
                               <AlertDialogContent>
                                 <AlertDialogHeader>
                                   <AlertDialogTitle>Remove Participant</AlertDialogTitle>
                                   <AlertDialogDescription>
                                     Are you sure you want to remove {user.profiles.first_name} {user.profiles.last_name} from this roster? This action cannot be undone.
                                   </AlertDialogDescription>
                                 </AlertDialogHeader>
                                 <AlertDialogFooter>
                                   <AlertDialogCancel>Cancel</AlertDialogCancel>
                                   <AlertDialogAction 
                                     onClick={() => handleRemoveUser(user.id, `${user.profiles.first_name} ${user.profiles.last_name}`)}
                                     className="bg-red-600 hover:bg-red-700"
                                   >
                                     Remove
                                   </AlertDialogAction>
                                 </AlertDialogFooter>
                               </AlertDialogContent>
                             </AlertDialog>
                           ) : (
                             <Button 
                               variant="link" 
                               size="sm"
                               className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                               onClick={() => handleReactivateUser(user.id, `${user.profiles.first_name} ${user.profiles.last_name}`)}
                             >
                               Reactivate
                             </Button>
                           )}
                         </TableCell>
                     </TableRow>
                   ))
                 )}
               </TableBody>
            </Table>
          </CardContent>
         </Card>
        
           <div className="mt-4">
             <Button variant="ghost" size="sm" onClick={onBack} className="text-xs">
               <ArrowLeft className="h-3 w-3 mr-1" />
               Back to Groups
             </Button>
           </div>
         </>
       )}

      <NewRosterForm
        open={showNewRosterForm}
        onOpenChange={setShowNewRosterForm}
        onSubmit={handleCreateRoster}
        existingYears={availableYears}
      />

      {organizationUser?.organization_id && (
        <BulkRosterUpload
          open={showBulkUpload}
          onOpenChange={setShowBulkUpload}
          organizationId={organizationUser.organization_id}
          groupId={selectedGroup.id}
          rosterId={
            rosters.find(r => r.roster_year.toString() === selectedYear)?.id ?? null
          }
          organizationType={selectedGroup.organization_type}
          groupTypeName={selectedGroup.group_type_name}
          onSuccess={() => {
            const sel = rosters.find(r => r.roster_year.toString() === selectedYear);
            if (sel) fetchSchoolUsers(sel.id);
          }}
        />
      )}
     </div>
   );
};

export default Rosters;