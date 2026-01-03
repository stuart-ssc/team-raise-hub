import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import NewConversationDialog from "./NewConversationDialog";

interface MessageButtonProps {
  userId?: string;
  donorId?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
  contextType?: 'campaign' | 'order' | null;
  contextId?: string;
  contextLabel?: string;
}

const MessageButton = ({
  userId,
  donorId,
  variant = "outline",
  size = "sm",
  className,
  showLabel = true,
  contextType,
  contextId,
  contextLabel
}: MessageButtonProps) => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setDialogOpen(true)}
      >
        <MessageCircle className="h-4 w-4" />
        {showLabel && <span className="ml-2">Message</span>}
      </Button>

      <NewConversationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConversationCreated={(id) => navigate(`/dashboard/messages/${id}`)}
        preselectedUserId={userId}
        preselectedDonorId={donorId}
        contextType={contextType}
        contextId={contextId}
        contextLabel={contextLabel}
      />
    </>
  );
};

export default MessageButton;