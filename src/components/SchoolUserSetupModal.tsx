import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const schoolUserSchema = z.object({
  schoolId: z.string().min(1, "School is required"),
  groupId: z.string().optional(),
  newGroupName: z.string().optional(),
  groupTypeId: z.string().optional(),
  userTypeId: z.string().min(1, "User type is required"),
});

type SchoolUserFormData = z.infer<typeof schoolUserSchema>;

interface School {
  id: string;
  school_name: string;
  city: string;
  state: string;
}

interface Group {
  id: string;
  group_name: string;
}

interface GroupType {
  id: string;
  name: string;
}

interface UserType {
  id: string;
  name: string;
}

interface SchoolUserSetupModalProps {
  open: boolean;
  onComplete: (schoolUserData: any) => void;
  userId: string;
}

export const SchoolUserSetupModal = ({ open, onComplete, userId }: SchoolUserSetupModalProps) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupTypes, setGroupTypes] = useState<GroupType[]>([]);
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [selectedUserType, setSelectedUserType] = useState<string>("");
  const [showNewGroupFields, setShowNewGroupFields] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<SchoolUserFormData>({
    resolver: zodResolver(schoolUserSchema),
    defaultValues: {
      schoolId: "",
      groupId: "",
      newGroupName: "",
      groupTypeId: "",
      userTypeId: "",
    },
  });

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      // Load user types and group types
      const [userTypesRes, groupTypesRes] = await Promise.all([
        supabase.from("user_type").select("*"),
        supabase.from("group_type").select("*"),
      ]);

      if (userTypesRes.data) setUserTypes(userTypesRes.data);
      if (groupTypesRes.data) setGroupTypes(groupTypesRes.data);
    };

    if (open) {
      loadData();
    }
  }, [open]);

  // Load schools based on search
  useEffect(() => {
    const loadSchools = async () => {
      if (schoolSearch.length < 2) {
        setSchools([]);
        return;
      }

      const { data } = await supabase
        .from("schools")
        .select("id, school_name, city, state")
        .or(`school_name.ilike.%${schoolSearch}%,city.ilike.%${schoolSearch}%`)
        .limit(20);

      if (data) setSchools(data);
    };

    const debounce = setTimeout(loadSchools, 300);
    return () => clearTimeout(debounce);
  }, [schoolSearch]);

  // Helper functions to determine group field visibility
  const getSelectedUserTypeName = () => {
    return userTypes.find(type => type.id === selectedUserType)?.name || "";
  };

  const shouldShowGroupFields = () => {
    const userTypeName = getSelectedUserTypeName();
    const noGroupRoles = ["Principal", "Athletic Director", "Sponsor"];
    return !noGroupRoles.includes(userTypeName);
  };

  const canCreateGroup = () => {
    const userTypeName = getSelectedUserTypeName();
    const canCreateRoles = ["Coach", "Club Sponsor", "Booster Leader"];
    return canCreateRoles.includes(userTypeName);
  };

  // Load groups when school is selected
  useEffect(() => {
    const loadGroups = async () => {
      if (!selectedSchoolId) {
        setGroups([]);
        setShowNewGroupFields(false);
        return;
      }

      const { data } = await supabase
        .from("groups")
        .select("id, group_name")
        .eq("school_id", selectedSchoolId);

      if (data) {
        setGroups(data);
        setShowNewGroupFields(data.length === 0 && canCreateGroup());
      }
    };

    loadGroups();
  }, [selectedSchoolId, selectedUserType]);

  const onSubmit = async (data: SchoolUserFormData) => {
    setIsSubmitting(true);

    try {
      let groupId = data.groupId;

      // Create new group if needed
      if (showNewGroupFields && data.newGroupName && data.groupTypeId) {
        const { data: newGroup, error: groupError } = await supabase
          .from("groups")
          .insert({
            group_name: data.newGroupName,
            school_id: data.schoolId,
            group_type_id: data.groupTypeId,
          })
          .select()
          .single();

        if (groupError) throw groupError;
        groupId = newGroup.id;
      }

      // Only require group for roles that need groups
      if (shouldShowGroupFields() && !groupId) {
        throw new Error("Group is required for your role");
      }

      // Create school_user record
      const { data: schoolUser, error: schoolUserError } = await supabase
        .from("school_user")
        .insert({
          user_id: userId,
          school_id: data.schoolId,
          group_id: groupId,
          user_type_id: data.userTypeId,
        })
        .select(`
          *,
          schools!inner(id, school_name, city, state),
          groups!inner(id, group_name),
          user_type!inner(id, name)
        `)
        .single();

      if (schoolUserError) throw schoolUserError;

      toast({
        title: "Setup Complete",
        description: "Your school and group association has been created successfully.",
      });

      onComplete(schoolUser);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete setup",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            To continue, please select your school, group, and role.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* School Search */}
            <div className="space-y-2">
              <Label htmlFor="schoolSearch">Search for your school</Label>
              <Input
                id="schoolSearch"
                placeholder="Type school name or city..."
                value={schoolSearch}
                onChange={(e) => setSchoolSearch(e.target.value)}
              />
              {schools.length > 0 && (
                <div className="border rounded-md max-h-40 overflow-y-auto">
                  {schools.map((school) => (
                    <div
                      key={school.id}
                      className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                      onClick={() => {
                        setSelectedSchoolId(school.id);
                        form.setValue("schoolId", school.id);
                        setSchoolSearch(`${school.school_name} - ${school.city}, ${school.state}`);
                        setSchools([]);
                      }}
                    >
                      <div className="font-medium">{school.school_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {school.city}, {school.state}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User Role Selection */}
            {selectedSchoolId && (
              <FormField
                control={form.control}
                name="userTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Role</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedUserType(value);
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Group Selection or Creation */}
            {selectedSchoolId && selectedUserType && shouldShowGroupFields() && (
              <>
                {groups.length > 0 ? (
                  <FormField
                    control={form.control}
                    name="groupId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Group</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a group" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {groups.map((group) => (
                              <SelectItem key={group.id} value={group.id}>
                                {group.group_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : canCreateGroup() ? (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="newGroupName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Group Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter group name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="groupTypeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Group Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select group type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {groupTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No groups available for this school. Please contact an administrator.
                  </div>
                )}
              </>
            )}

            {/* Submit Button */}
            {selectedSchoolId && selectedUserType && (
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Setting up..." : "Complete Setup"}
              </Button>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};