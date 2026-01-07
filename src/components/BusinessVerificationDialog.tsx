import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldX, Clock } from "lucide-react";
import { toast } from "sonner";

interface BusinessVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  business: {
    id: string;
    business_name: string;
    verification_status: string;
  };
  onSuccess: () => void;
}

type VerificationStatus = "pending" | "verified" | "blocked";

export function BusinessVerificationDialog({
  open,
  onOpenChange,
  business,
  onSuccess,
}: BusinessVerificationDialogProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<VerificationStatus>(
    (business.verification_status as VerificationStatus) || "pending"
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when dialog opens or business changes
  useEffect(() => {
    if (open) {
      setStatus((business.verification_status as VerificationStatus) || "pending");
      setNotes("");
    }
  }, [open, business.verification_status]);

  const handleSubmit = async () => {
    if (status === "blocked" && !notes.trim()) {
      toast.error("Please provide a reason for blocking this business");
      return;
    }

    setIsSubmitting(true);
    try {
      const previousStatus = business.verification_status;
      
      const updateData: Record<string, any> = {
        verification_status: status,
        updated_at: new Date().toISOString(),
      };

      if (status === "verified") {
        updateData.verified_at = new Date().toISOString();
      } else if (status === "pending") {
        updateData.verified_at = null;
      }

      const { data, error } = await supabase
        .from("businesses")
        .update(updateData)
        .eq("id", business.id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error("No rows updated - you may not have permission");

      // Log the status change to activity log (non-blocking)
      try {
        await supabase.from("business_activity_log").insert({
          business_id: business.id,
          activity_type: "verification_status_changed",
          activity_data: {
            old_status: previousStatus,
            new_status: status,
            notes: notes.trim() || null,
            changed_by: user?.id,
            changed_at: new Date().toISOString(),
          },
        });
      } catch (logError) {
        console.warn("Failed to log activity:", logError);
      }

      toast.success(
        status === "verified"
          ? "Business verified successfully"
          : status === "blocked"
          ? "Business blocked successfully"
          : "Business status reset to pending"
      );
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating verification status:", error);
      toast.error(error.message || "Failed to update verification status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (statusValue: string) => {
    switch (statusValue) {
      case "verified":
        return (
          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case "blocked":
        return (
          <Badge className="bg-red-500/10 text-red-700 dark:text-red-400">
            <ShieldX className="h-3 w-3 mr-1" />
            Blocked
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Verification Status</DialogTitle>
          <DialogDescription>
            Change the verification status for {business.business_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Current Status</Label>
            <div>{getStatusBadge(business.verification_status)}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">New Status</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as VerificationStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    Pending
                  </div>
                </SelectItem>
                <SelectItem value="verified">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    Verified
                  </div>
                </SelectItem>
                <SelectItem value="blocked">
                  <div className="flex items-center gap-2">
                    <ShieldX className="h-4 w-4 text-red-600" />
                    Blocked
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes {status === "blocked" && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id="notes"
              placeholder={
                status === "blocked"
                  ? "Reason for blocking (required)..."
                  : "Optional notes about this decision..."
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || status === business.verification_status}
            variant={status === "blocked" ? "destructive" : "default"}
          >
            {isSubmitting ? "Updating..." : "Update Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
