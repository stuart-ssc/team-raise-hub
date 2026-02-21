import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
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
import { useAuth } from "@/hooks/useAuth";
import { OrganizationTypeSelector } from "./OrganizationTypeSelector";
import { NonProfitSetupForm } from "./NonProfitSetupForm";

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
  organization_id: string;
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
  permission_level: string;
}

interface OrganizationSetupModalProps {
  open: boolean;
  onComplete: (organizationUserData: any) => void;
  userId: string;
}

export const OrganizationSetupModal = ({ open, onComplete, userId }: OrganizationSetupModalProps) => {
  const [step, setStep] = useState<'type' | 'school' | 'nonprofit'>('type');
  const [organizationType, setOrganizationType] = useState<'school' | 'nonprofit' | null>(null);
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
  const { signOut } = useAuth();
  const navigate = useNavigate();

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

  // Check if user already has an organization_user record (e.g., from invitation)
  useEffect(() => {
    if (!open || !userId) return;

    const checkExistingOrgUser = async () => {
      const { data } = await supabase
        .from('organization_user')
        .select(`
          *,
          user_type:user_type_id (id, name, permission_level),
          organization:organization_id (id, name, organization_type, city, state),
          groups:group_id (id, group_name)
        `)
        .eq('user_id', userId)
        .eq('active_user', true)
        .limit(1)
        .maybeSingle();

      if (data) {
        // User already has an org record (e.g., from invitation) -- skip setup
        onComplete(data);
      }
    };

    checkExistingOrgUser();
  }, [open, userId]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (organizationType === 'school') {
        // Load school-specific user types and group types
        const [userTypesRes, groupTypesRes] = await Promise.all([
          supabase.from("user_type")
            .select("*")
            .in('name', ['Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader', 'Team Player', 'Club Participant', 'Family Member', 'Sponsor']),
          supabase.from("group_type").select("*"),
        ]);

        if (userTypesRes.data) setUserTypes(userTypesRes.data);
        if (groupTypesRes.data) setGroupTypes(groupTypesRes.data);
      }
    };

    if (open && organizationType) {
      loadData();
    }
  }, [open, organizationType]);

  // Load schools based on search
  useEffect(() => {
    const loadSchools = async () => {
      if (schoolSearch.length < 2) {
        setSchools([]);
        return;
      }

      const { data } = await supabase
        .from("schools")
        .select("id, school_name, city, state, organization_id")
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

  const handleOrganizationTypeSelect = (type: 'school' | 'nonprofit' | 'donor') => {
    if (type === 'donor') {
      // Donors go directly to the portal - no org setup needed
      navigate('/portal', { replace: true });
      return;
    }
    setOrganizationType(type);
    setStep(type);
  };

  const handleNonProfitComplete = () => {
    // Reload the page to fetch the new organization_user record
    window.location.reload();
  };

  const onSubmit = async (data: SchoolUserFormData) => {
    setIsSubmitting(true);

    try {
      let groupId = data.groupId;

      // Create new group if needed
      if (showNewGroupFields && data.newGroupName && data.groupTypeId) {
        const selectedSchool = schools.find(s => s.id === data.schoolId);
        if (!selectedSchool?.organization_id) {
          throw new Error("School organization not found");
        }

        const { data: newGroup, error: groupError } = await supabase
          .from("groups")
          .insert({
            group_name: data.newGroupName,
            school_id: data.schoolId,
            organization_id: selectedSchool.organization_id,
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

      const selectedSchool = schools.find(s => s.id === data.schoolId);
      if (!selectedSchool?.organization_id) {
        throw new Error("School organization not found");
      }

      // Create organization_user record
      const { data: organizationUser, error: orgUserError } = await supabase
        .from("organization_user")
        .insert({
          user_id: userId,
          organization_id: selectedSchool.organization_id,
          group_id: groupId || null,
          user_type_id: data.userTypeId,
        })
        .select(`
          *,
          organization:organization_id (
            id, 
            name,
            organization_type,
            city,
            state
          ),
          groups:group_id (id, group_name),
          user_type:user_type_id (id, name, permission_level)
        `)
        .single();

      if (orgUserError) throw orgUserError;

      toast({
        title: "Setup Complete",
        description: "Your organization profile has been created successfully.",
      });

      onComplete(organizationUser);
    } catch (error: any) {
      console.error('Setup error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete setup",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (step === 'type') {
      return <OrganizationTypeSelector onSelect={handleOrganizationTypeSelect} />;
    }

    if (step === 'nonprofit') {
      return (
        <NonProfitSetupForm
          userId={userId}
          onComplete={handleNonProfitComplete}
          onBack={() => setStep('type')}
        />
      );
    }

    // School flow
    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">School Setup</h2>
          <p className="text-sm text-muted-foreground">Select your school and role</p>
        </div>

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
            <div className="flex gap-4">
              <Button 
                type="button"
                variant="outline"
                onClick={() => setStep('type')}
                disabled={isSubmitting}
                className="flex-1"
              >
                Back
              </Button>
              {selectedSchoolId && selectedUserType && (
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={isSubmitting || (shouldShowGroupFields() && !form.watch("groupId") && !canCreateGroup())}
                >
                  {isSubmitting ? "Setting up..." : "Complete Setup"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && signOut()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'type' ? 'Welcome to Sponsorly' : 
             step === 'nonprofit' ? 'Non-Profit Setup' : 'School Setup'}
          </DialogTitle>
          <DialogDescription>
            {step === 'type' ? 'Let\'s get you started with your organization' :
             step === 'nonprofit' ? 'Tell us about your non-profit organization' :
             'Select your school and role to continue'}
          </DialogDescription>
        </DialogHeader>

        {renderContent()}

        {/* Exit Setup Link - Always visible */}
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => signOut()}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Exit Setup
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
