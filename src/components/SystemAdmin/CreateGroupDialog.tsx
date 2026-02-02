import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Image } from "lucide-react";

interface GroupType {
  id: string;
  name: string;
}

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationType: string;
  onSuccess: () => void;
}

export const CreateGroupDialog = ({
  open,
  onOpenChange,
  organizationId,
  organizationType,
  onSuccess,
}: CreateGroupDialogProps) => {
  const [groupName, setGroupName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [groupTypeId, setGroupTypeId] = useState("");
  const [groupTypes, setGroupTypes] = useState<GroupType[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadGroupTypes();
    }
  }, [open, organizationType]);

  const loadGroupTypes = async () => {
    const { data } = await supabase
      .from("group_type")
      .select("id, name")
      .order("name");

    if (data) {
      // Filter based on organization type
      const filtered = data.filter((type) => {
        if (organizationType === "school") {
          return ["Sports Team", "Club", "PTO"].includes(type.name);
        } else {
          return ["Program", "Initiative", "Chapter", "Campaign"].includes(type.name);
        }
      });
      setGroupTypes(filtered);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("group-logos")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Error uploading file:", uploadError);
        return null;
      }

      const { data } = supabase.storage.from("group-logos").getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading logo:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupName.trim() || !groupTypeId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let logoUrl = null;

      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
        if (!logoUrl) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to upload logo",
          });
          setIsSubmitting(false);
          return;
        }
      }

      const { error } = await supabase.from("groups").insert({
        group_name: groupName.trim(),
        website_url: websiteUrl.trim() || null,
        group_type_id: groupTypeId,
        organization_id: organizationId,
        logo_url: logoUrl,
        status: true,
      });

      if (error) {
        console.error("Error creating group:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create group",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Group created successfully. A roster has been automatically created.",
      });

      // Reset form
      setGroupName("");
      setWebsiteUrl("");
      setGroupTypeId("");
      setLogoFile(null);
      setLogoPreview(null);

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating group:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="group-name">Group Name *</Label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Varsity Football, Chess Club"
              required
            />
          </div>

          <div>
            <Label htmlFor="group-type">Group Type *</Label>
            <Select value={groupTypeId} onValueChange={setGroupTypeId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select group type" />
              </SelectTrigger>
              <SelectContent>
                {groupTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="website-url">Website URL (optional)</Label>
            <Input
              id="website-url"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Logo (optional)</Label>
            <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
              <CardContent className="p-4">
                {logoPreview ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-12 h-12 object-cover rounded-md border"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{logoFile?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {logoFile && (logoFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <Image className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <span className="text-sm font-medium text-foreground hover:text-primary">
                        Click to upload
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
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
