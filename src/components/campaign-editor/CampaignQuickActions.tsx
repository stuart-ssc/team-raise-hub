import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

  const isPublished = publicationStatus === "published";

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
        {publicationControl}
      </>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="default"
        onClick={() => setPublishDialogOpen(true)}
      >
        {isPublished ? "Unpublish" : "Publish"}
      </Button>
      {publicationControl}
    </div>
  );
}

export { DropdownMenuSeparator };
