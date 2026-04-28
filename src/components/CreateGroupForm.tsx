import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";

const createGroupSchema = z.object({
  groupName: z.string().min(1, "Group name is required"),
  websiteAddress: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  groupTypeId: z.string().min(1, "Group type is required"),
});

type CreateGroupFormData = z.infer<typeof createGroupSchema>;

interface GroupType {
  id: string;
  name: string;
}

interface Group {
  id: string;
  group_name: string;
  school_name: string;
  group_type_name: string;
}

interface CreateGroupFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  editingGroup?: Group | null;
}

export const CreateGroupForm = ({ onCancel, onSuccess, editingGroup }: CreateGroupFormProps) => {
  const [groupTypes, setGroupTypes] = useState<GroupType[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
  const [logoRemoved, setLogoRemoved] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingEditData, setLoadingEditData] = useState<boolean>(!!editingGroup);
  const { toast } = useToast();
  const { organizationUser } = useOrganizationUser();

  const form = useForm<CreateGroupFormData>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      groupName: editingGroup?.group_name || "",
      websiteAddress: "",
      groupTypeId: "",
    },
  });

  // Load group types filtered by organization type
  useEffect(() => {
    const loadGroupTypes = async () => {
      if (!organizationUser) return;

      // Get organization type
      const { data: orgData } = await supabase
        .from("organizations")
        .select("organization_type")
        .eq("id", organizationUser.organization_id)
        .single();

      const orgType = orgData?.organization_type;

      // Fetch all group types
      const { data } = await supabase
        .from("group_type")
        .select("id, name")
        .order("name");
      
      if (data) {
        // Filter based on organization type
        const filtered = data.filter(type => {
          if (orgType === 'school') {
            return ['Sports Team', 'Club', 'PTO'].includes(type.name);
          } else {
            return ['Program', 'Initiative', 'Chapter', 'Campaign'].includes(type.name);
          }
        });
        setGroupTypes(filtered);
      }
    };

    loadGroupTypes();
  }, [organizationUser]);

  // Load existing group data when editing
  useEffect(() => {
    if (editingGroup) {
      // Wait for groupTypes to be populated before resetting the form,
      // otherwise the Radix <Select> can't render the saved value (it
      // needs a matching <SelectItem>) and shows the placeholder instead.
      if (groupTypes.length === 0) {
        return;
      }

      const loadGroupData = async () => {
        setLoadingEditData(true);
        const { data, error } = await supabase
          .from("groups")
          .select("group_name, website_url, group_type_id, logo_url")
          .eq("id", editingGroup.id)
          .maybeSingle();

        if (error) {
          console.error("Error loading group:", error);
          toast({
            title: "Could not load group",
            description: error.message,
            variant: "destructive",
          });
        }

        if (data) {
          const savedTypeId = data.group_type_id || "";
          const typeExistsInOptions =
            !savedTypeId || groupTypes.some((t) => t.id === savedTypeId);

          form.reset({
            groupName: data.group_name ?? editingGroup.group_name,
            websiteAddress: data.website_url || "",
            groupTypeId: savedTypeId,
          });
          setExistingLogoUrl(data.logo_url ?? null);

          if (savedTypeId && !typeExistsInOptions) {
            console.warn(
              "Saved group_type_id is not in the filtered options for this organization type",
              { savedTypeId, available: groupTypes.map((t) => t.id) }
            );
          }
        }
        setLoadingEditData(false);
      };

      loadGroupData();
    } else {
      setExistingLogoUrl(null);
      setLoadingEditData(false);
    }
  }, [editingGroup, form, toast, groupTypes]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoRemoved(false);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('group-logos')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('group-logos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      return null;
    }
  };

  const onSubmit = async (data: CreateGroupFormData) => {
    if (!organizationUser) {
      toast({
        title: "Error",
        description: "Organization user information not found",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let logoUrl = null;

      // Upload logo if provided
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
        if (!logoUrl) {
          toast({
            title: "Error",
            description: "Failed to upload logo",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Create or update group record
      if (editingGroup) {
        // Update existing group
        const expectedWebsite = data.websiteAddress?.trim() ? data.websiteAddress.trim() : null;
        const updateData: Record<string, any> = {
          group_name: data.groupName,
          website_url: expectedWebsite,
          group_type_id: data.groupTypeId,
        };

        let expectedLogo: string | null | undefined = undefined;
        if (logoUrl) {
          updateData.logo_url = logoUrl;
          expectedLogo = logoUrl;
        } else if (logoRemoved && !logoFile) {
          updateData.logo_url = null;
          expectedLogo = null;
        }

        // Scope by organization_id as well so RLS evaluates with the
        // user's assigned organization, and so we don't accidentally
        // attempt to update a group outside the active role.
        const { data: updated, error: groupError } = await supabase
          .from("groups")
          .update(updateData)
          .eq("id", editingGroup.id)
          .eq("organization_id", organizationUser.organization_id)
          .select("id, group_name, website_url, group_type_id, logo_url, updated_at");

        if (groupError) {
          console.error("Error updating group:", groupError);
          toast({
            title: "Failed to save group",
            description: groupError.message,
            variant: "destructive",
          });
          return;
        }

        if (!updated || updated.length === 0) {
          toast({
            title: "Save blocked",
            description:
              "Your active role doesn't have permission to update this group. Switch to the role that owns this group and try again.",
            variant: "destructive",
          });
          return;
        }

        // Verify the database actually persisted what we sent.
        const saved = updated[0] as {
          id: string;
          group_name: string;
          website_url: string | null;
          group_type_id: string | null;
          logo_url: string | null;
          updated_at: string;
        };

        const mismatches: string[] = [];
        if (saved.group_name !== data.groupName) mismatches.push("name");
        if ((saved.website_url ?? null) !== expectedWebsite) mismatches.push("website");
        if ((saved.group_type_id ?? null) !== data.groupTypeId) mismatches.push("group type");
        if (expectedLogo !== undefined && (saved.logo_url ?? null) !== expectedLogo) {
          mismatches.push("logo");
        }

        if (mismatches.length > 0) {
          console.error("Group update did not persist", { sent: updateData, saved, mismatches });
          toast({
            title: "Changes did not save",
            description: `These fields didn't update: ${mismatches.join(", ")}. Please try again or contact support.`,
            variant: "destructive",
          });
          return;
        }

        // Reset local edit state from the source of truth and notify parent.
        setExistingLogoUrl(saved.logo_url ?? null);
        setLogoFile(null);
        setLogoPreview(null);
        setLogoRemoved(false);

        toast({
          title: "Success",
          description: "Group updated successfully",
          variant: "success",
        });
        onSuccess();
      } else {
        // Create new group
        const { error: groupError } = await supabase
          .from("groups")
          .insert({
            group_name: data.groupName,
            website_url: data.websiteAddress || null,
            group_type_id: data.groupTypeId,
            organization_id: organizationUser.organization_id,
            logo_url: logoUrl,
          });

        if (groupError) {
          console.error('Error creating group:', groupError);
          toast({
            title: "Failed to create group",
            description: groupError.message,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Success",
          description: "Group created successfully",
          variant: "success",
        });
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Unexpected error",
        description: error instanceof Error ? error.message : "Failed to save group",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">{editingGroup ? 'Edit Group' : 'Create a Group'}</h2>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <p className="text-muted-foreground">
        A group could be a sports team (Baseball, Soccer, Football, etc), a club (STEM, Student 
        Government, etc), or a PTO/PTA school-wide support group.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {loadingEditData && (
            <p className="text-sm text-muted-foreground">Loading group details…</p>
          )}
          {/* Group Name */}
          <FormField
            control={form.control}
            name="groupName"
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

          {/* Website Address */}
          <FormField
            control={form.control}
            name="websiteAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website Address</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Group Type */}
          <FormField
            control={form.control}
            name="groupTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Group Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Logo</Label>
            <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
              <CardContent className="p-6">
                {logoPreview || existingLogoUrl ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={logoPreview || existingLogoUrl || ""}
                      alt="Logo preview"
                      className="w-16 h-16 object-cover rounded-md border"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {logoFile?.name ?? "Current logo"}
                      </p>
                      {logoFile ? (
                        <p className="text-xs text-muted-foreground">
                          {(logoFile.size / 1024).toFixed(1)} KB
                        </p>
                      ) : (
                        <label htmlFor="logo-upload" className="text-xs text-primary cursor-pointer hover:underline">
                          Replace image
                          <input
                            id="logo-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                          />
                        </label>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(null);
                        setExistingLogoUrl(null);
                        setLogoRemoved(true);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Image className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <div className="mt-4">
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        <span className="text-sm font-medium text-foreground hover:text-primary">
                          Click to upload an image
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </label>
                      <input
                        id="logo-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};