import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { getPermissionLevel, PermissionLevel } from "@/lib/permissions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface EditDonorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donor: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    tags: string[] | null;
    preferred_communication: string | null;
    notes: string | null;
    added_by_organization_user_id?: string | null;
    user_id?: string | null;
  } | null;
  onComplete: () => void;
}

export default function EditDonorDialog({
  open,
  onOpenChange,
  donor,
  onComplete,
}: EditDonorDialogProps) {
  const { toast } = useToast();
  const { organizationUser } = useOrganizationUser();
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [preferredComm, setPreferredComm] = useState<string>("email");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [ownerOrgUserId, setOwnerOrgUserId] = useState<string>("unassigned");
  const [orgMembers, setOrgMembers] = useState<Array<{ id: string; label: string }>>([]);

  const canManageOwnership = (() => {
    const name = organizationUser?.user_type?.name;
    if (!name) return false;
    const lvl = getPermissionLevel(name);
    return lvl === PermissionLevel.ORGANIZATION_ADMIN || lvl === PermissionLevel.PROGRAM_MANAGER;
  })();

  const emailLocked = !!donor?.user_id;

  useEffect(() => {
    if (donor && open) {
      setFirstName(donor.first_name || "");
      setLastName(donor.last_name || "");
      setEmail(donor.email || "");
      setPhone(donor.phone || "");
      setNotes(donor.notes || "");
      setPreferredComm(donor.preferred_communication || "email");
      setTags(donor.tags || []);
      setOwnerOrgUserId(donor.added_by_organization_user_id || "unassigned");
    }
  }, [donor, open]);

  useEffect(() => {
    if (!open || !canManageOwnership || !organizationUser?.organization_id) return;

    const loadMembers = async () => {
      const { data, error } = await supabase
        .from("organization_user")
        .select("id, profiles!inner(first_name, last_name), user_type!inner(name)")
        .eq("organization_id", organizationUser.organization_id)
        .eq("active_user", true);

      if (error) {
        console.error("Error loading org members:", error);
        return;
      }

      const members = (data || []).map((m: any) => {
        const fn = m.profiles?.first_name || "";
        const ln = m.profiles?.last_name || "";
        const fullName = `${fn} ${ln}`.trim() || "Unnamed user";
        const role = m.user_type?.name ? ` · ${m.user_type.name}` : "";
        return { id: m.id, label: `${fullName}${role}` };
      });
      members.sort((a, b) => a.label.localeCompare(b.label));
      setOrgMembers(members);
    };

    loadMembers();
  }, [open, canManageOwnership, organizationUser?.organization_id]);

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    if (!donor) return;

    if (!email.trim()) {
      toast({
        title: "Validation Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const updatePayload: Record<string, unknown> = {
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        phone: phone.trim() || null,
        notes: notes.trim() || null,
        preferred_communication: preferredComm,
        tags: tags.length > 0 ? tags : null,
        updated_at: new Date().toISOString(),
      };
      if (!emailLocked) {
        updatePayload.email = email.trim();
      }

      const { error } = await supabase
        .from("donor_profiles")
        .update(updatePayload)
        .eq("id", donor.id);

      if (error) throw error;

      // If admin/manager changed ownership, call the secure RPC
      if (canManageOwnership) {
        const newOwner = ownerOrgUserId === "unassigned" ? null : ownerOrgUserId;
        const currentOwner = donor.added_by_organization_user_id ?? null;
        if (newOwner !== currentOwner) {
          const { error: reassignError } = await supabase.rpc("reassign_donor_ownership", {
            _donor_id: donor.id,
            _new_owner_org_user_id: newOwner,
          });
          if (reassignError) throw reassignError;
        }
      }

      toast({
        title: "Success",
        description: "Donor information updated successfully",
      });

      onComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating donor:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update donor information",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Donor Details</DialogTitle>
          <DialogDescription>
            Update donor information and preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john.doe@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredComm">Preferred Communication</Label>
            <Select value={preferredComm} onValueChange={setPreferredComm}>
              <SelectTrigger id="preferredComm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="text">Text Message</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a tag..."
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this donor..."
              rows={4}
            />
          </div>

          {canManageOwnership && (
            <div className="space-y-2">
              <Label htmlFor="owner">Owner / Added by</Label>
              <Select value={ownerOrgUserId} onValueChange={setOwnerOrgUserId}>
                <SelectTrigger id="owner">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {orgMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Reassign this donor to a different team member. They will see this donor in their supporters list.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
