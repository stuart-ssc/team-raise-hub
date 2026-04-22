import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, List, Users, Plus, X } from "lucide-react";

interface AddToListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDonorIds: string[];
  onComplete?: () => void;
}

interface DonorList {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
}

export default function AddToListDialog({
  open,
  onOpenChange,
  selectedDonorIds,
  onComplete,
}: AddToListDialogProps) {
  const { toast } = useToast();
  const { organizationUser } = useOrganizationUser();
  const [lists, setLists] = useState<DonorList[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open && organizationUser?.organization_id) {
      fetchLists();
    }
  }, [open, organizationUser?.organization_id]);

  const fetchLists = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("donor_lists")
        .select("id, name, description")
        .eq("organization_id", organizationUser?.organization_id)
        .order("name");

      if (error) throw error;

      // Get member counts
      const listsWithCounts: DonorList[] = [];
      for (const list of data || []) {
        const { count } = await supabase
          .from("donor_list_members")
          .select("id", { count: "exact", head: true })
          .eq("list_id", list.id);

        listsWithCounts.push({
          ...list,
          member_count: count || 0,
        });
      }

      setLists(listsWithCounts);
    } catch (error) {
      console.error("Error fetching lists:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newListName.trim() || !organizationUser?.organization_id) return;
    setCreating(true);
    try {
      const { data: created, error: createErr } = await supabase
        .from("donor_lists")
        .insert({
          organization_id: organizationUser.organization_id,
          name: newListName.trim(),
          description: newListDescription.trim() || null,
          created_by: organizationUser.user_id,
        })
        .select("id")
        .single();

      if (createErr) throw createErr;

      const rows = selectedDonorIds.map((donorId) => ({
        list_id: created.id,
        donor_id: donorId,
        added_by: organizationUser?.user_id,
      }));

      const { error: addErr } = await supabase
        .from("donor_list_members")
        .upsert(rows, { onConflict: "list_id,donor_id", ignoreDuplicates: true });

      if (addErr) throw addErr;

      toast({
        title: "List created",
        description: `${selectedDonorIds.length} donor(s) added to "${newListName.trim()}"`,
      });

      setNewListName("");
      setNewListDescription("");
      setShowCreate(false);
      onOpenChange(false);
      onComplete?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create list",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleAddToList = async (listId: string) => {
    setAdding(listId);
    try {
      const rows = selectedDonorIds.map((donorId) => ({
        list_id: listId,
        donor_id: donorId,
        added_by: organizationUser?.user_id,
      }));

      const { error } = await supabase
        .from("donor_list_members")
        .upsert(rows, { onConflict: "list_id,donor_id", ignoreDuplicates: true });

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedDonorIds.length} donor(s) added to list`,
      });

      onOpenChange(false);
      onComplete?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add donors to list",
        variant: "destructive",
      });
    } finally {
      setAdding(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {selectedDonorIds.length} Donor(s) to List</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            {/* Create new list inline */}
            {showCreate ? (
              <div className="p-3 border rounded-md space-y-2 bg-muted/30">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">New list</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      setShowCreate(false);
                      setNewListName("");
                      setNewListDescription("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="List name (e.g. Spring Gala Invitees)"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  rows={2}
                />
                <Button
                  size="sm"
                  onClick={handleCreateAndAdd}
                  disabled={!newListName.trim() || creating}
                  className="w-full"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    `Create & add ${selectedDonorIds.length} donor(s)`
                  )}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create new list
              </Button>
            )}

            {lists.length === 0 && !showCreate && (
              <div className="text-center py-6">
                <List className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No lists yet. Create one above.
                </p>
              </div>
            )}

            {lists.map((list) => (
              <div
                key={list.id}
                className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-medium text-foreground">{list.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {list.member_count} members
                    {list.description && ` · ${list.description}`}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAddToList(list.id)}
                  disabled={adding === list.id}
                >
                  {adding === list.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Add"
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
