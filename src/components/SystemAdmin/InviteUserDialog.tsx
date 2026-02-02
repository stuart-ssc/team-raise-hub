import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserType {
  id: string;
  name: string;
}

interface Group {
  id: string;
  group_name: string;
}

interface Roster {
  id: number;
  roster_year: number;
  current_roster: boolean;
  group_id: string;
}

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationType: string;
  onSuccess: () => void;
}

export const InviteUserDialog = ({
  open,
  onOpenChange,
  organizationId,
  organizationType,
  onSuccess,
}: InviteUserDialogProps) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedUserType, setSelectedUserType] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedRoster, setSelectedRoster] = useState("");
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchUserTypes();
      fetchGroups();
    }
  }, [open, organizationId, organizationType]);

  useEffect(() => {
    if (selectedGroup) {
      fetchRosters();
    } else {
      setRosters([]);
      setSelectedRoster("");
    }
  }, [selectedGroup]);

  const fetchUserTypes = async () => {
    const { data, error } = await supabase
      .from("user_type")
      .select("id, name")
      .order("name");

    if (!error && data) {
      // Filter based on organization type
      const filtered = data.filter((type) => {
        if (organizationType === "school") {
          return [
            "Principal",
            "Athletic Director",
            "Coach",
            "Club Sponsor",
            "Booster Leader",
            "Team Player",
            "Club Participant",
          ].includes(type.name);
        } else {
          return [
            "Executive Director",
            "Program Director",
            "Volunteer Coordinator",
            "Volunteer",
            "Board Member",
          ].includes(type.name);
        }
      });
      setUserTypes(filtered);
    }
  };

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from("groups")
      .select("id, group_name")
      .eq("organization_id", organizationId)
      .eq("status", true)
      .order("group_name");

    if (!error && data) {
      setGroups(data);
    }
  };

  const fetchRosters = async () => {
    if (!selectedGroup) return;

    const { data, error } = await supabase
      .from("rosters")
      .select("id, roster_year, current_roster, group_id")
      .eq("group_id", selectedGroup)
      .order("roster_year", { ascending: false });

    if (!error && data) {
      setRosters(data);
      // Auto-select current roster if available
      const currentRoster = data.find((r) => r.current_roster);
      if (currentRoster) {
        setSelectedRoster(currentRoster.id.toString());
      }
    }
  };

  const needsRoster = (userTypeName: string) => {
    return !["Principal", "Athletic Director", "Club Sponsor", "Executive Director", "Board Member"].includes(
      userTypeName
    );
  };

  const selectedUserTypeName = userTypes.find((ut) => ut.id === selectedUserType)?.name || "";
  const requiresGroup = selectedUserTypeName && !["Principal", "Executive Director"].includes(selectedUserTypeName);
  const requiresRoster = selectedUserTypeName && needsRoster(selectedUserTypeName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !selectedUserType) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields.",
      });
      return;
    }

    if (requiresGroup && !selectedGroup) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a group for this user type.",
      });
      return;
    }

    if (requiresRoster && !selectedRoster) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a roster for this user type.",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: inviteData, error: inviteError } = await supabase.functions.invoke("invite-user", {
        body: {
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          userTypeId: selectedUserType,
          organizationId,
          groupId: requiresGroup ? selectedGroup : null,
          rosterId: requiresRoster ? parseInt(selectedRoster) : null,
        },
      });

      if (inviteError) {
        console.error("Error inviting user:", inviteError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to invite user. Please try again.",
        });
        return;
      }

      if (!inviteData?.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: inviteData?.message || "Failed to create user invitation.",
        });
        return;
      }

      toast({
        title: "Success",
        description: "User invitation sent successfully!",
      });

      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setSelectedUserType("");
      setSelectedGroup("");
      setSelectedRoster("");

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite User to Organization</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first-name">First Name *</Label>
              <Input
                id="first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="last-name">Last Name *</Label>
              <Input
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="user-type">Role *</Label>
            <Select value={selectedUserType} onValueChange={setSelectedUserType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {userTypes.map((userType) => (
                  <SelectItem key={userType.id} value={userType.id}>
                    {userType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {requiresGroup && (
            <div>
              <Label htmlFor="group">Group *</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.length === 0 ? (
                    <SelectItem value="no-groups" disabled>
                      No groups available - create one first
                    </SelectItem>
                  ) : (
                    groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.group_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {requiresRoster && selectedGroup && (
            <div>
              <Label htmlFor="roster">Roster *</Label>
              <Select value={selectedRoster} onValueChange={setSelectedRoster} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select roster" />
                </SelectTrigger>
                <SelectContent>
                  {rosters.map((roster) => (
                    <SelectItem key={roster.id} value={roster.id.toString()}>
                      {roster.roster_year} {roster.current_roster ? "(Current)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending Invite..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
