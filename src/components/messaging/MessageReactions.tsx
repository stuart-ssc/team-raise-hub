import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";

const AVAILABLE_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

interface Reaction {
  id: string;
  emoji: string;
  user_id: string | null;
  donor_profile_id: string | null;
}

interface MessageReactionsProps {
  messageId: string;
  reactions: Reaction[];
  currentUserId?: string;
  currentDonorProfileId?: string;
  onReactionChange: () => void;
  isOwn?: boolean;
  className?: string;
}

export function MessageReactions({
  messageId,
  reactions,
  currentUserId,
  currentDonorProfileId,
  onReactionChange,
  isOwn = false,
  className = "",
}: MessageReactionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Group reactions by emoji with counts
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = {
        count: 0,
        userReacted: false,
        reactionId: null as string | null,
      };
    }
    acc[reaction.emoji].count++;
    
    // Check if current user/donor has reacted with this emoji
    if (
      (currentUserId && reaction.user_id === currentUserId) ||
      (currentDonorProfileId && reaction.donor_profile_id === currentDonorProfileId)
    ) {
      acc[reaction.emoji].userReacted = true;
      acc[reaction.emoji].reactionId = reaction.id;
    }
    
    return acc;
  }, {} as Record<string, { count: number; userReacted: boolean; reactionId: string | null }>);

  const handleToggleReaction = async (emoji: string) => {
    if (loading) return;
    setLoading(true);

    try {
      const existing = groupedReactions[emoji];
      
      if (existing?.userReacted && existing.reactionId) {
        // Remove reaction
        await supabase
          .from("message_reactions")
          .delete()
          .eq("id", existing.reactionId);
      } else {
        // Add reaction
        const insertData: any = {
          message_id: messageId,
          emoji,
        };
        
        if (currentUserId) {
          insertData.user_id = currentUserId;
        } else if (currentDonorProfileId) {
          insertData.donor_profile_id = currentDonorProfileId;
        }
        
        await supabase.from("message_reactions").insert(insertData);
      }
      
      onReactionChange();
    } catch (error) {
      console.error("Error toggling reaction:", error);
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  const hasReactions = Object.keys(groupedReactions).length > 0;

  return (
    <div className={cn("flex items-center gap-1 flex-wrap", className)}>
      {/* Display existing reactions */}
      {hasReactions && (
        <div className={cn("flex items-center gap-1 flex-wrap", isOwn ? "justify-end" : "justify-start")}>
          {Object.entries(groupedReactions).map(([emoji, data]) => (
            <TooltipProvider key={emoji}>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleToggleReaction(emoji)}
                    disabled={loading}
                    className={cn(
                      "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-colors",
                      data.userReacted
                        ? "bg-primary/20 border border-primary/40"
                        : "bg-muted/80 border border-transparent hover:bg-muted"
                    )}
                  >
                    <span>{emoji}</span>
                    {data.count > 1 && (
                      <span className="text-muted-foreground">{data.count}</span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {data.userReacted ? "Click to remove" : "Click to react"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      )}

      {/* Add reaction button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <SmilePlus className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" side="top" align={isOwn ? "end" : "start"}>
          <div className="flex gap-1">
            {AVAILABLE_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleToggleReaction(emoji)}
                disabled={loading}
                className={cn(
                  "p-1.5 rounded hover:bg-muted transition-colors text-lg",
                  groupedReactions[emoji]?.userReacted && "bg-primary/20"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
