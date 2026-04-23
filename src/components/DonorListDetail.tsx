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
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Trash2, Loader2, Users } from "lucide-react";
import { Megaphone } from "lucide-react";
import ContactFundraiserDialog from "@/components/ContactFundraiserDialog";

interface DonorListDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId: string;
  listName: string;
  onMembersChanged?: () => void;
}

interface ListMember {
  id: string;
  donor_id: string;
  added_at: string;
  donor: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    rfm_segment: string | null;
  };
}

interface SearchDonor {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  rfm_segment: string | null;
}

export default function DonorListDetail({
  open,
  onOpenChange,
  listId,
  listName,
  onMembersChanged,
}: DonorListDetailProps) {
  const { toast } = useToast();
  const { organizationUser } = useOrganizationUser();
  const [members, setMembers] = useState<ListMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchDonor[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  useEffect(() => {
    if (open && listId) {
      fetchMembers();
    }
  }, [open, listId]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("donor_list_members")
        .select("id, donor_id, added_at, donor:donor_profiles(id, email, first_name, last_name, rfm_segment)")
        .eq("list_id", listId)
        .order("added_at", { ascending: false });

      if (error) throw error;

      // Type-safe mapping
      const mapped = (data || []).map((row: any) => ({
        id: row.id,
        donor_id: row.donor_id,
        added_at: row.added_at,
        donor: row.donor,
      }));
      setMembers(mapped);
    } catch (error) {
      console.error("Error fetching list members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("donor_profiles")
        .select("id, email, first_name, last_name, rfm_segment")
        .eq("organization_id", organizationUser?.organization_id)
        .or(`email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      // Filter out donors already in the list
      const memberDonorIds = new Set(members.map((m) => m.donor_id));
      setSearchResults((data || []).filter((d) => !memberDonorIds.has(d.id)));
    } catch (error) {
      console.error("Error searching donors:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddDonor = async (donorId: string) => {
    setAdding(donorId);
    try {
      const { error } = await supabase.from("donor_list_members").insert({
        list_id: listId,
        donor_id: donorId,
        added_by: organizationUser?.user_id,
      });

      if (error) throw error;

      toast({ title: "Donor added to list" });
      setSearchQuery("");
      setSearchResults([]);
      await fetchMembers();
      onMembersChanged?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add donor",
        variant: "destructive",
      });
    } finally {
      setAdding(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setRemoving(memberId);
    try {
      const { error } = await supabase
        .from("donor_list_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast({ title: "Donor removed from list" });
      await fetchMembers();
      onMembersChanged?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove donor",
        variant: "destructive",
      });
    } finally {
      setRemoving(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {listName}
            <Badge variant="secondary">{members.length} members</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Search & Add */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search donors to add..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
              {searchResults.map((donor) => (
                <div key={donor.id} className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {donor.first_name} {donor.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{donor.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddDonor(donor.id)}
                    disabled={adding === donor.id}
                  >
                    {adding === donor.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
          {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
            <p className="text-sm text-muted-foreground text-center py-2">No donors found</p>
          )}
        </div>

        {/* Members List */}
        <div className="space-y-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No members yet. Search above to add donors.</p>
            </div>
          ) : (
            <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {member.donor?.first_name} {member.donor?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{member.donor?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.donor?.rfm_segment && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {member.donor.rfm_segment.replace("_", " ")}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={removing === member.id}
                    >
                      {removing === member.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
