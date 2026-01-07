import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ShieldCheck, ShieldX, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BulkVerificationDialogBusinessProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessIds: string[];
  onComplete: () => void;
}

type VerificationStatus = "pending" | "verified" | "blocked";

export function BulkVerificationDialogBusiness({
  open,
  onOpenChange,
  businessIds,
  onComplete,
}: BulkVerificationDialogBusinessProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<VerificationStatus>("verified");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (status === "blocked" && !notes.trim()) {
      toast.error("Please provide a reason for blocking these businesses");
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const updateData: Record<string, any> = {
        verification_status: status,
        updated_at: new Date().toISOString(),
      };

      if (status === "verified") {
        updateData.verified_at = new Date().toISOString();
      } else if (status === "pending") {
        updateData.verified_at = null;
      }

      // Update all businesses in a single query
      const { data, error } = await supabase
        .from("businesses")
        .update(updateData)
        .in("id", businessIds)
        .select("id");

      if (error) throw error;

      successCount = data?.length || 0;
      errorCount = businessIds.length - successCount;

      // Log activity for each business (non-blocking)
      for (const businessId of businessIds) {
        try {
          await supabase.from("business_activity_log").insert({
            business_id: businessId,
            activity_type: "verification_status_changed",
            activity_data: {
              new_status: status,
              notes: notes.trim() || null,
              changed_by: user?.id,
              changed_at: new Date().toISOString(),
              bulk_action: true,
            },
          });
        } catch (logError) {
          console.warn("Failed to log activity for business:", businessId, logError);
        }
      }

      if (successCount > 0) {
        const statusText = status === "verified" ? "verified" : status === "blocked" ? "blocked" : "reset to pending";
        toast.success(`${successCount} business${successCount === 1 ? "" : "es"} ${statusText}`);
      }
      
      if (errorCount > 0) {
        toast.warning(`${errorCount} business${errorCount === 1 ? "" : "es"} could not be updated`);
      }

      onComplete();
      onOpenChange(false);
      setNotes("");
      setStatus("verified");
    } catch (error: any) {
      console.error("Error updating verification status:", error);
      toast.error(error.message || "Failed to update verification status");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Verification</DialogTitle>
          <DialogDescription>
            Update verification status for {businessIds.length} selected business{businessIds.length === 1 ? "" : "es"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Set Status To</Label>
            <RadioGroup
              value={status}
              onValueChange={(value) => setStatus(value as VerificationStatus)}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50">
                <RadioGroupItem value="verified" id="verified" />
                <label htmlFor="verified" className="flex items-center gap-2 cursor-pointer flex-1">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Verified</span>
                </label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50">
                <RadioGroupItem value="pending" id="pending" />
                <label htmlFor="pending" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium">Pending</span>
                </label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50">
                <RadioGroupItem value="blocked" id="blocked" />
                <label htmlFor="blocked" className="flex items-center gap-2 cursor-pointer flex-1">
                  <ShieldX className="h-4 w-4 text-red-600" />
                  <span className="font-medium">Blocked</span>
                </label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes {status === "blocked" && <span className="text-destructive">*</span>}
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
            disabled={isSubmitting}
            variant={status === "blocked" ? "destructive" : "default"}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              `Update ${businessIds.length} Business${businessIds.length === 1 ? "" : "es"}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}