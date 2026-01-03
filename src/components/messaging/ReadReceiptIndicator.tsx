import { Check, CheckCheck, Clock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";

interface ReadReceiptIndicatorProps {
  status: 'sending' | 'sent' | 'read';
  readAt?: string;
  readBy?: number;
  totalRecipients?: number;
  className?: string;
}

export function ReadReceiptIndicator({
  status,
  readAt,
  readBy,
  totalRecipients,
  className = "",
}: ReadReceiptIndicatorProps) {
  const getTooltipText = () => {
    if (status === 'sending') return 'Sending...';
    if (status === 'sent') return 'Sent';
    if (status === 'read') {
      if (readAt) {
        return `Read ${format(new Date(readAt), 'MMM d, h:mm a')}`;
      }
      if (readBy !== undefined && totalRecipients !== undefined && totalRecipients > 1) {
        return `Read by ${readBy} of ${totalRecipients}`;
      }
      return 'Read';
    }
    return '';
  };

  const getIcon = () => {
    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-muted-foreground" />;
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-primary" />;
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center ${className}`}>
            {getIcon()}
            {status === 'read' && readBy !== undefined && totalRecipients !== undefined && totalRecipients > 1 && (
              <span className="text-[9px] text-muted-foreground ml-0.5">
                ({readBy}/{totalRecipients})
              </span>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {getTooltipText()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
