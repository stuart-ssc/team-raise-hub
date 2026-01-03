import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ChevronDown,
  Image as ImageIcon,
  FileText,
  Download,
  Building2,
  ExternalLink,
} from "lucide-react";

interface CampaignAsset {
  id: string;
  campaign_id: string;
  campaign_name: string;
  campaign_logo_url: string | null;
  use_default_logo: boolean;
  additional_files: Array<{ name: string; url: string; type: string }>;
  notes: string | null;
  created_at: string;
}

interface BusinessCampaignAssetsListProps {
  businessId: string | undefined;
  businessLogoUrl: string | null;
}

export function BusinessCampaignAssetsList({ businessId, businessLogoUrl }: BusinessCampaignAssetsListProps) {
  const [assets, setAssets] = useState<CampaignAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const fetchAssets = async () => {
      if (!businessId) return;

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("business_campaign_assets")
          .select(`
            id,
            campaign_id,
            campaign_logo_url,
            use_default_logo,
            additional_files,
            notes,
            created_at,
            campaigns (
              name
            )
          `)
          .eq("business_id", businessId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const formattedAssets: CampaignAsset[] = (data || []).map((item: any) => ({
          id: item.id,
          campaign_id: item.campaign_id,
          campaign_name: item.campaigns?.name || "Unknown Campaign",
          campaign_logo_url: item.campaign_logo_url,
          use_default_logo: item.use_default_logo || false,
          additional_files: Array.isArray(item.additional_files)
            ? (item.additional_files as Array<{ name: string; url: string; type: string }>)
            : [],
          notes: item.notes,
          created_at: item.created_at,
        }));

        setAssets(formattedAssets);
      } catch (error) {
        console.error("Error fetching campaign assets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [businessId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (assets.length === 0) {
    return null; // Don't show the section if there are no assets
  }

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <Card>
        <CollapsibleTrigger className="w-full text-left">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Campaign Branding Assets</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {assets.length} {assets.length === 1 ? "campaign" : "campaigns"}
                </Badge>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    expanded ? "rotate-180" : ""
                  }`}
                />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Logo Preview */}
                    {asset.campaign_logo_url && !asset.use_default_logo ? (
                      <img
                        src={asset.campaign_logo_url}
                        alt="Campaign logo"
                        className="h-10 w-10 rounded object-contain bg-muted"
                      />
                    ) : businessLogoUrl ? (
                      <img
                        src={businessLogoUrl}
                        alt="Default logo"
                        className="h-10 w-10 rounded object-contain bg-muted"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{asset.campaign_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {asset.use_default_logo ? "Using default logo" : "Custom campaign logo"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {new Date(asset.created_at).toLocaleDateString()}
                  </Badge>
                </div>

                {/* Additional Files */}
                {asset.additional_files.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Additional Files</p>
                    <div className="flex flex-wrap gap-2">
                      {asset.additional_files.map((file, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          asChild
                          className="gap-1"
                        >
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FileText className="h-3 w-3" />
                            {file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name}
                            <Download className="h-3 w-3" />
                          </a>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {asset.notes && (
                  <div className="text-sm text-muted-foreground bg-muted/30 rounded p-2">
                    <p className="font-medium text-foreground text-xs mb-1">Notes:</p>
                    {asset.notes}
                  </div>
                )}

                {/* View Campaign Logo */}
                {asset.campaign_logo_url && !asset.use_default_logo && (
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={asset.campaign_logo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Full Logo
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
