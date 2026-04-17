import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CampaignPublicationControl } from "@/components/CampaignPublicationControl";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface CampaignQuickActionsProps {
  campaignId: string;
  campaignName: string;
  groupId: string;
  slug: string | null;
  publicationStatus: string;
  onPublicationChange: () => void;
  /** When true, render actions as dropdown menu items instead of buttons */
  compact?: boolean;
}

export function CampaignQuickActions({
  campaignId,
  campaignName,
  groupId,
  slug,
  publicationStatus,
  onPublicationChange,
  compact = false,
}: CampaignQuickActionsProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

  const campaignUrl = slug ? `${window.location.origin}/c/${slug}` : null;
  const isPublished = publicationStatus === "published";

  const handleCopyLink = () => {
    if (campaignUrl) {
      navigator.clipboard.writeText(campaignUrl);
      setCopied(true);
      toast({
        title: "Link copied",
        description: "Campaign link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePreview = () => {
    if (slug) {
      window.open(`/c/${slug}`, "_blank");
    }
  };

  const handlePublicationChange = () => {
    setPublishDialogOpen(false);
    onPublicationChange();
  };

  const publicationControl = (
    <CampaignPublicationControl
      campaignId={campaignId}
      campaignName={campaignName}
      groupId={groupId}
      currentStatus={publicationStatus}
      enableRosterAttribution={false}
      onStatusChange={handlePublicationChange}
      triggerOpen={publishDialogOpen}
      onClose={() => setPublishDialogOpen(false)}
      hideButton={true}
    />
  );

  if (compact) {
    return (
      <>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setPublishDialogOpen(true); }}>
          {isPublished ? "Unpublish" : "Publish"}
        </DropdownMenuItem>
        {slug && (
          <>
            <DropdownMenuItem onSelect={handlePreview}>
              <ExternalLink className="h-4 w-4" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleCopyLink(); }}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy Link"}
            </DropdownMenuItem>
          </>
        )}
        {publicationControl}
      </>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPublishDialogOpen(true)}
      >
        {isPublished ? "Unpublish" : "Publish"}
      </Button>

      {slug && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Preview
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="gap-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy Link"}
          </Button>
        </>
      )}

      {publicationControl}
    </div>
  );
}

export { DropdownMenuSeparator };
