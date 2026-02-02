import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

interface UserRecord {
  id: string;
  user_id: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email?: string | null;
  };
  user_type: {
    name: string;
  };
  user_type_id?: string;
  group_id?: string | null;
  group?: {
    group_name: string;
  } | null;
  active_user: boolean;
}

interface EditUserRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserRecord | null;
  organizationId: string;
  organizationType: string;
  onSuccess: () => void;
}

export const EditUserRoleDialog = ({
  open,
  onOpenChange,
  user,
  organizationId,
  organizationType,
  onSuccess,
}: EditUserRoleDialogProps) => {
  const [selectedUserType, setSelectedUserType] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [activeUser, setActiveUser] = useState(true);
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && user) {
      fetchUserTypes();
      fetchGroups();
      // Load current values
      loadUserDetails();
    }
  }, [open, user]);

  const loadUserDetails = async () => {
    if (!user) return;

    // Fetch the full organization_user record with group info
    const { data } = await supabase
      .from("organization_user")
      .select("user_type_id, group_id, active_user")
      .eq("id", user.id)
      .single();

    if (data) {
      setSelectedUserType(data.user_type_id || "");
      setSelectedGroup(data.group_id || "");
      setActiveUser(data.active_user);
    }
  };

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

  const selectedUserTypeName = userTypes.find((ut) => ut.id === selectedUserType)?.name || "";
  const requiresGroup = selectedUserTypeName && !["Principal", "Executive Director"].includes(selectedUserTypeName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !selectedUserType) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a role.",
      });
      return;
    }

    if (requiresGroup && !selectedGroup) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a group for this role.",
      });
      return;
    }

    setLoading(true);

    try {
      const updateData: any = {
        user_type_id: selectedUserType,
        active_user: activeUser,
        group_id: requiresGroup ? selectedGroup : null,
      };

      const { error } = await supabase
        .from("organization_user")
        .update(updateData)
        .eq("id", user.id);

      if (error) {
        console.error("Error updating user:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update user. Please try again.",
        });
        return;
      }

      toast({
        title: "Success",
        description: "User updated successfully!",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const userName =
    user.profiles.first_name && user.profiles.last_name
      ? `${user.profiles.first_name} ${user.profiles.last_name}`
      : "User";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Edit User: {userName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-md text-sm">
            <p>
              <span className="text-muted-foreground">Current Role:</span>{" "}
              <span className="font-medium">{user.user_type.name}</span>
            </p>
            {user.group && (
              <p>
                <span className="text-muted-foreground">Current Group:</span>{" "}
                <span className="font-medium">{user.group.group_name}</span>
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="user-type">New Role *</Label>
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
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.group_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between py-2">
            <div>
              <Label htmlFor="active-status">Active Status</Label>
              <p className="text-sm text-muted-foreground">
                Inactive users cannot access the dashboard
              </p>
            </div>
            <Switch
              id="active-status"
              checked={activeUser}
              onCheckedChange={setActiveUser}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
