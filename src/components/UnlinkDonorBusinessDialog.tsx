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
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface UnlinkDonorBusinessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donorName: string;
  businessName: string;
  donorId: string;
  businessId: string;
  organizationId: string;
  isPrimaryContact: boolean;
  onSuccess: () => void;
}

export const UnlinkDonorBusinessDialog = ({
  open,
  onOpenChange,
  donorName,
  businessName,
  donorId,
  businessId,
  organizationId,
  isPrimaryContact,
  onSuccess,
}: UnlinkDonorBusinessDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleUnlink = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("unlink-donor-from-business", {
        body: {
          donorId,
          businessId,
          organizationId,
        },
      });

      if (error) throw error;

      toast.success("Employee unlinked from business successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error unlinking donor from business:", error);
      toast.error(error.message || "Failed to unlink employee from business");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unlink Employee from Business?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to unlink <strong>{donorName}</strong> from{" "}
            <strong>{businessName}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isPrimaryContact && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This employee is the primary contact. Another employee will be automatically
              promoted to primary contact if available.
            </AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleUnlink} disabled={loading}>
            {loading ? "Unlinking..." : "Unlink"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
