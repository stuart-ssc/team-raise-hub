import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, AlertCircle } from "lucide-react";

interface BulkEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDonorIds: string[];
  onComplete: () => void;
}

const BulkEmailDialog = ({
  open,
  onOpenChange,
  selectedDonorIds,
  onComplete,
}: BulkEmailDialogProps) => {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both subject and message",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("bulk-email-donors", {
        body: {
          donorIds: selectedDonorIds,
          subject: subject.trim(),
          message: message.trim(),
        },
      });

      if (error) throw error;

      toast({
        title: "Emails Queued",
        description: `${data.queued} emails have been queued for sending`,
      });

      onComplete();
      onOpenChange(false);
      setSubject("");
      setMessage("");
    } catch (error) {
      console.error("Error sending emails:", error);
      toast({
        title: "Error",
        description: "Failed to send emails to donors",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Email to Donors</DialogTitle>
          <DialogDescription>
            Send an email to {selectedDonorIds.length} selected {selectedDonorIds.length === 1 ? "donor" : "donors"}
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This will send a personalized email to each selected donor. Make sure your message is appropriate for bulk sending.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email-subject">Subject Line</Label>
            <Input
              id="email-subject"
              placeholder="Enter email subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {subject.length}/200 characters
            </p>
          </div>

          <div>
            <Label htmlFor="email-message">Message</Label>
            <Textarea
              id="email-message"
              placeholder="Enter your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {message.length}/5000 characters • Use {"{firstName}"} to personalize
            </p>
          </div>

          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              <strong>Preview:</strong> The email will be sent from your organization's email address
              and will include an unsubscribe link at the bottom.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !message.trim()}
          >
            {sending ? "Sending..." : `Send to ${selectedDonorIds.length} Donors`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEmailDialog;
