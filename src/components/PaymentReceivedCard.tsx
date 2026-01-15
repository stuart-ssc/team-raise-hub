import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Clock, CheckCircle, Banknote, CreditCard, FileText, Loader2 } from "lucide-react";

interface PaymentReceivedCardProps {
  orderId: string;
  manualEntry: boolean;
  paymentReceived: boolean;
  paymentReceivedAt: string | null;
  paymentReceivedBy: string | null;
  offlinePaymentType: string | null;
  paymentNotes: string | null;
  onUpdate: () => void;
}

const PAYMENT_TYPE_LABELS: Record<string, { label: string; icon: typeof Banknote }> = {
  check: { label: "Check", icon: FileText },
  cash: { label: "Cash", icon: Banknote },
  invoice: { label: "Invoice", icon: FileText },
  wire: { label: "Wire Transfer", icon: CreditCard },
  other: { label: "Other", icon: CreditCard },
};

export function PaymentReceivedCard({
  orderId,
  manualEntry,
  paymentReceived,
  paymentReceivedAt,
  paymentReceivedBy,
  offlinePaymentType,
  paymentNotes,
  onUpdate,
}: PaymentReceivedCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [notes, setNotes] = useState(paymentNotes || "");

  // Don't show for non-manual orders
  if (!manualEntry) return null;

  const paymentTypeInfo = offlinePaymentType
    ? PAYMENT_TYPE_LABELS[offlinePaymentType] || PAYMENT_TYPE_LABELS.other
    : PAYMENT_TYPE_LABELS.other;
  const PaymentIcon = paymentTypeInfo.icon;

  const handleMarkReceived = async () => {
    if (!user) return;
    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          payment_received: true,
          payment_received_at: new Date().toISOString(),
          payment_received_by: user.id,
          payment_notes: notes || null,
        })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Payment Confirmed",
        description: "The order has been marked as payment received.",
      });
      onUpdate();
    } catch (error: any) {
      console.error("Error updating payment status:", error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkNotReceived = async () => {
    if (!user) return;
    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          payment_received: false,
          payment_received_at: null,
          payment_received_by: null,
        })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Payment Status Updated",
        description: "The order has been marked as awaiting payment.",
      });
      onUpdate();
    } catch (error: any) {
      console.error("Error updating payment status:", error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (paymentReceived) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300 text-base">
            <CheckCircle className="h-5 w-5" />
            Payment Received
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <PaymentIcon className="h-4 w-4 text-muted-foreground" />
              <span>{paymentTypeInfo.label}</span>
            </div>
            {paymentReceivedAt && (
              <span className="text-muted-foreground">
                Confirmed on {format(new Date(paymentReceivedAt), "PPP")}
              </span>
            )}
          </div>
          {paymentNotes && (
            <p className="text-sm text-muted-foreground">{paymentNotes}</p>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkNotReceived}
            disabled={isUpdating}
            className="mt-2"
          >
            {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Undo (Mark as Pending)
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-base">
          <Clock className="h-5 w-5" />
          Awaiting Payment
        </CardTitle>
        <CardDescription>
          This is a manual order. Confirm when payment has been received.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <PaymentIcon className="h-3 w-3" />
            {paymentTypeInfo.label}
          </Badge>
        </div>
        <div>
          <Label htmlFor="payment-notes" className="text-sm">
            Payment Notes (optional)
          </Label>
          <Textarea
            id="payment-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Check #1234 received on..."
            rows={2}
            className="mt-1"
          />
        </div>
        <Button onClick={handleMarkReceived} disabled={isUpdating}>
          {isUpdating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          Mark Payment Received
        </Button>
      </CardContent>
    </Card>
  );
}
