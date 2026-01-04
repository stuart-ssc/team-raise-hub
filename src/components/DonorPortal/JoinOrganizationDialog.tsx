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
import { School, Building2, Users, ArrowLeft, Loader2 } from "lucide-react";

const schoolJoinSchema = z.object({
  schoolId: z.string().min(1, "School is required"),
  groupId: z.string().optional(),
  userTypeId: z.string().min(1, "Role is required"),
});

type SchoolJoinFormData = z.infer<typeof schoolJoinSchema>;

interface SchoolData {
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

interface UserType {
  id: string;
  name: string;
  permission_level: string;
}

interface JoinOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinOrganizationDialog({ open, onOpenChange }: JoinOrganizationDialogProps) {
  const [step, setStep] = useState<'type' | 'school' | 'nonprofit'>('type');
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [selectedUserType, setSelectedUserType] = useState<string>("");
  const [schoolSearch, setSchoolSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const form = useForm<SchoolJoinFormData>({
    resolver: zodResolver(schoolJoinSchema),
    defaultValues: {
      schoolId: "",
      groupId: "",
      userTypeId: "",
    },
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setStep('type');
      setSchools([]);
      setGroups([]);
      setSelectedSchoolId("");
      setSelectedUserType("");
      setSchoolSearch("");
      form.reset();
    }
  }, [open, form]);

  // Load user types for school joining (filtered to joining roles)
  useEffect(() => {
    const loadUserTypes = async () => {
      if (step === 'school') {
        // Only show roles appropriate for "joining" (not admin roles)
        const { data } = await supabase
          .from("user_type")
          .select("*")
          .in('name', ['Coach', 'Club Sponsor', 'Booster Leader', 'Team Player', 'Club Participant', 'Family Member', 'Sponsor', 'Volunteer']);

        if (data) setUserTypes(data);
      }
    };

    loadUserTypes();
  }, [step]);

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

  // Helper to determine if group is needed
  const getSelectedUserTypeName = () => {
    return userTypes.find(type => type.id === selectedUserType)?.name || "";
  };

  const shouldShowGroupFields = () => {
    const userTypeName = getSelectedUserTypeName();
    const noGroupRoles = ["Sponsor", "Family Member"];
    return !noGroupRoles.includes(userTypeName);
  };

  // Load groups when school is selected
  useEffect(() => {
    const loadGroups = async () => {
      if (!selectedSchoolId) {
        setGroups([]);
        return;
      }

      const { data } = await supabase
        .from("groups")
        .select("id, group_name")
        .eq("school_id", selectedSchoolId);

      if (data) setGroups(data);
    };

    loadGroups();
  }, [selectedSchoolId]);

  const handleTypeSelect = (type: 'school' | 'nonprofit') => {
    setStep(type);
  };

  const onSubmitSchool = async (data: SchoolJoinFormData) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const selectedSchool = schools.find(s => s.id === data.schoolId);
      if (!selectedSchool?.organization_id) {
        throw new Error("School organization not found");
      }

      // Create organization_user record
      const { error: orgUserError } = await supabase
        .from("organization_user")
        .insert({
          user_id: user.id,
          organization_id: selectedSchool.organization_id,
          group_id: data.groupId || null,
          user_type_id: data.userTypeId,
          active_user: true,
        });

      if (orgUserError) throw orgUserError;

      toast({
        title: "Success!",
        description: "You've joined the organization. Redirecting to dashboard...",
      });

      onOpenChange(false);
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      console.error('Join error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to join organization",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTypeSelection = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Join an Organization</h2>
        <p className="text-sm text-muted-foreground">
          Select the type of organization you'd like to join
        </p>
      </div>

      <div className="grid gap-4">
        <button
          type="button"
          onClick={() => handleTypeSelect('school')}
          className="flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-all text-left"
        >
          <div className="p-3 rounded-full bg-primary/10">
            <School className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">School</h3>
            <p className="text-sm text-muted-foreground">
              Join as a parent, coach, volunteer, or team member
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleTypeSelect('nonprofit')}
          className="flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-all text-left"
        >
          <div className="p-3 rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Non-Profit</h3>
            <p className="text-sm text-muted-foreground">
              Join as a volunteer, board member, or staff
            </p>
          </div>
        </button>
      </div>
    </div>
  );

  const renderSchoolForm = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Join a School</h2>
        <p className="text-sm text-muted-foreground">Search for your school and select your role</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitSchool)} className="space-y-4">
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

          {/* Group Selection */}
          {selectedSchoolId && selectedUserType && shouldShowGroupFields() && groups.length > 0 && (
            <FormField
              control={form.control}
              name="groupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Team/Group</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a group (optional)" />
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
          )}

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-2">
            <Button 
              type="button"
              variant="outline"
              onClick={() => setStep('type')}
              disabled={isSubmitting}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {selectedSchoolId && selectedUserType && (
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Organization"
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );

  const renderNonprofitForm = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Join a Non-Profit</h2>
        <p className="text-sm text-muted-foreground">
          This feature is coming soon. For now, please contact the organization directly.
        </p>
      </div>
      
      <div className="text-center py-8">
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">
          Contact the organization administrator to be added as a member.
        </p>
      </div>

      <Button 
        type="button"
        variant="outline"
        onClick={() => setStep('type')}
        className="w-full"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'type' ? 'Join an Organization' : 
             step === 'nonprofit' ? 'Join a Non-Profit' : 'Join a School'}
          </DialogTitle>
          <DialogDescription>
            {step === 'type' ? 'Become a staff member, volunteer, or parent at an organization' :
             step === 'nonprofit' ? 'Connect with a non-profit organization' :
             'Find your school and select your role'}
          </DialogDescription>
        </DialogHeader>

        {step === 'type' && renderTypeSelection()}
        {step === 'school' && renderSchoolForm()}
        {step === 'nonprofit' && renderNonprofitForm()}
      </DialogContent>
    </Dialog>
  );
}
