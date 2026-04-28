import { useState } from "react";
import { ExternalLink, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ShareHubDialog from "@/components/public-hub/ShareHubDialog";
import { usePublicHubUrl } from "@/hooks/usePublicHubUrl";

interface PublicHubLinkButtonProps {
  organizationId?: string | null;
  groupId?: string | null;
  /** Style preset. "hero" matches the dark gradient on the dashboard hero. */
  variant?: "default" | "hero";
  /** Hide the View button (e.g. when the parent already shows the URL). */
  hideView?: boolean;
  /** Hide the Share button (e.g. read-only contexts). */
  hideShare?: boolean;
  /** Custom label for the View button. */
  viewLabel?: string;
}

const PublicHubLinkButton = ({
  organizationId,
  groupId,
  variant = "default",
  hideView = false,
  hideShare = false,
  viewLabel = "View public page",
}: PublicHubLinkButtonProps) => {
  const { url, enabled, loading, displayName } = usePublicHubUrl(organizationId, groupId);
  const [shareOpen, setShareOpen] = useState(false);

  if (loading || !enabled || !url) return null;

  const heroBtn = "border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white";

  return (
    <>
      {!hideView && (
        <Button
          size="sm"
          variant="outline"
          className={variant === "hero" ? heroBtn : ""}
          asChild
        >
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-1" /> {viewLabel}
          </a>
        </Button>
      )}
      {!hideShare && (
        <Button
          size="sm"
          variant="outline"
          className={variant === "hero" ? heroBtn : ""}
          onClick={() => setShareOpen(true)}
        >
          <Share2 className="h-4 w-4 mr-1" /> Share
        </Button>
      )}
      <ShareHubDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        url={url}
        title={displayName || "our page"}
      />
    </>
  );
};

export default PublicHubLinkButton;