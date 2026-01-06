import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Copy, Link2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CampaignPublicationControl } from "@/components/CampaignPublicationControl";

interface CampaignQuickActionsProps {
  campaignId: string;
  campaignName: string;
  groupId: string;
  slug: string | null;
  publicationStatus: string;
  enableRosterAttribution: boolean;
  onPublicationChange: () => void;
}

export function CampaignQuickActions({
  campaignId,
  campaignName,
  groupId,
  slug,
  publicationStatus,
  enableRosterAttribution,
  onPublicationChange,
}: CampaignQuickActionsProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [generatingLinks, setGeneratingLinks] = useState(false);

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

  const handleGenerateRosterLinks = async () => {
    setGeneratingLinks(true);
    try {
      const { error } = await supabase.functions.invoke("generate-roster-member-links", {
        body: { campaignId },
      });

      if (error) throw error;

      toast({
        title: "Links generated",
        description: "Roster member links have been generated successfully",
      });
    } catch (error) {
      console.error("Error generating roster links:", error);
      toast({
        title: "Error",
        description: "Failed to generate roster links",
        variant: "destructive",
      });
    } finally {
      setGeneratingLinks(false);
    }
  };

  const handlePublicationChange = () => {
    setPublishDialogOpen(false);
    onPublicationChange();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={isPublished ? "default" : "secondary"}>
        {isPublished ? "Published" : "Draft"}
      </Badge>

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

      {enableRosterAttribution && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateRosterLinks}
          disabled={generatingLinks}
          className="gap-2"
        >
          <Link2 className="h-4 w-4" />
          {generatingLinks ? "Generating..." : "Generate Roster Links"}
        </Button>
      )}

      <CampaignPublicationControl
        campaignId={campaignId}
        campaignName={campaignName}
        groupId={groupId}
        currentStatus={publicationStatus}
        enableRosterAttribution={enableRosterAttribution}
        onStatusChange={handlePublicationChange}
        triggerOpen={publishDialogOpen}
        onClose={() => setPublishDialogOpen(false)}
        hideButton={true}
      />
    </div>
  );
}
