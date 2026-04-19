import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CampaignShareCardProps {
  slug: string | null;
  campaignName: string;
  isPublished?: boolean;
}

export function CampaignShareCard({ slug, campaignName, isPublished = true }: CampaignShareCardProps) {
  const { toast } = useToast();

  const url = slug
    ? `${window.location.origin}/c/${slug}`
    : null;

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: url });
    } catch {
      toast({ title: "Failed to copy link", variant: "destructive" });
    }
  };

  const share = async () => {
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: campaignName, url });
      } catch {
        /* user cancelled */
      }
    } else {
      copy();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Share
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {url ? (
          <>
            <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-2 py-1.5">
              <span className="flex-1 truncate text-xs text-muted-foreground">
                {url.replace(/^https?:\/\//, "")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={copy}
                aria-label="Copy link"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(url, "_blank")}
                className="gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Preview
              </Button>
              <Button size="sm" onClick={share} className="gap-1.5">
                <Share2 className="h-3.5 w-3.5" />
                Share
              </Button>
            </div>
            {!isPublished && (
              <p className="text-xs text-muted-foreground">
                Link will activate when published.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Save your campaign with a URL slug to enable sharing.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
