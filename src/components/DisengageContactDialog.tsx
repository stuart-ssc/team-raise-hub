import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BellOff, Bell } from "lucide-react";
import { toast } from "sonner";

interface DisengageContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donorName: string;
  businessName: string;
  donorId: string;
  businessId: string;
  organizationId: string;
  mode: "disengage" | "reengage";
  onSuccess: () => void;
}

export const DisengageContactDialog = ({
  open,
  onOpenChange,
  donorName,
  businessName,
  donorId,
  businessId,
  organizationId,
  mode,
  onSuccess,
}: DisengageContactDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      const fnName = mode === "disengage" ? "disengage-business-contact" : "reengage-business-contact";
      const { error } = await supabase.functions.invoke(fnName, {
        body: { donorId, businessId, organizationId },
      });
      if (error) throw error;

      toast.success(
        mode === "disengage"
          ? "Contact disengaged from outreach"
          : "Contact re-engaged for outreach"
      );
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error(`Error in ${mode} contact:`, error);
      toast.error(error.message || `Failed to ${mode} contact`);
    } finally {
      setLoading(false);
    }
  };

  const isDisengage = mode === "disengage";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isDisengage ? "Disengage contact?" : "Re-engage contact?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDisengage ? (
              <>
                <strong>{donorName}</strong> will stop receiving outreach emails and
                communications from your organization for{" "}
                <strong>{businessName}</strong>. The contact remains linked and can
                be re-engaged at any time.
              </>
            ) : (
              <>
                <strong>{donorName}</strong> will be added back to the outreach pool
                for <strong>{businessName}</strong> and may receive future
                communications.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Alert>
          {isDisengage ? (
            <BellOff className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          <AlertDescription>
            {isDisengage
              ? "This does not remove the contact link — only stops outreach."
              : "This contact will be eligible for outreach again immediately."}
          </AlertDescription>
        </Alert>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleAction} disabled={loading}>
            {loading
              ? isDisengage
                ? "Disengaging..."
                : "Re-engaging..."
              : isDisengage
              ? "Disengage"
              : "Re-engage"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};