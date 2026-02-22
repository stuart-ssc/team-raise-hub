import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ReinviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
  } | null;
  organizationId: string;
  onSuccess: () => void;
  mode: "resend" | "change-email";
}

export function ReinviteUserDialog({
  open,
  onOpenChange,
  user,
  organizationId,
  onSuccess,
  mode,
}: ReinviteUserDialogProps) {
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!user) return;

    if (mode === "change-email" && !newEmail.trim()) {
      toast({ title: "Please enter a new email address", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("reinvite-user", {
        body: {
          userId: user.id,
          newEmail: mode === "change-email" ? newEmail.trim() : undefined,
          organizationId,
          firstName: user.first_name,
          lastName: user.last_name,
        },
      });

      if (error) throw error;

      toast({
        title: mode === "change-email"
          ? `Invitation sent to ${data.email}`
          : "Invitation re-sent successfully",
      });

      setNewEmail("");
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error("Reinvite error:", err);
      toast({
        title: "Failed to send invitation",
        description: err.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "change-email" ? "Change Email & Re-invite" : "Re-send Invitation"}
          </DialogTitle>
          <DialogDescription>
            {mode === "change-email"
              ? `Update the email address for ${user.first_name} ${user.last_name} and send a new invitation.`
              : `Send a new invitation email to ${user.first_name} ${user.last_name}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-muted-foreground">Current Email</Label>
            <p className="text-sm font-medium mt-1">{user.email || "Unknown"}</p>
          </div>

          {mode === "change-email" && (
            <div>
              <Label htmlFor="new-email">New Email Address</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="Enter new email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="mt-1"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading
              ? "Sending..."
              : mode === "change-email"
              ? "Update & Send Invite"
              : "Re-send Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
