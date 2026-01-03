import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CampaignSponsor {
  id: string;
  businessName: string;
  defaultLogo: string | null;
  campaignLogo: string | null;
  useDefaultLogo: boolean;
  displayLogo: string | null;
  websiteUrl: string | null;
  totalContribution: number;
}

interface RawSponsorData {
  business_id: string;
  business_name: string;
  default_logo: string | null;
  campaign_logo_url: string | null;
  use_default_logo: boolean | null;
  website_url: string | null;
  total_amount: number;
}

function resolveDisplayLogo(
  campaignLogo: string | null,
  useDefaultLogo: boolean | null,
  defaultLogo: string | null
): string | null {
  // If campaign-specific logo exists and not using default
  if (campaignLogo && !useDefaultLogo) {
    return campaignLogo;
  }
  // Fall back to default business logo
  return defaultLogo || null;
}

export function useCampaignSponsors(campaignId: string | null) {
  return useQuery({
    queryKey: ["campaign-sponsors", campaignId],
    queryFn: async (): Promise<CampaignSponsor[]> => {
      if (!campaignId) return [];

      // Get all completed orders with business_id for this campaign
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(`
          business_id,
          total_amount,
          businesses!inner (
            id,
            business_name,
            logo_url,
            website_url
          )
        `)
        .eq("campaign_id", campaignId)
        .not("business_id", "is", null)
        .eq("status", "complete");

      if (ordersError) throw ordersError;
      if (!orders || orders.length === 0) return [];

      // Get unique business IDs
      const businessIds = [...new Set(orders.map((o) => o.business_id).filter(Boolean))] as string[];

      // Get campaign-specific assets for these businesses
      const { data: assets, error: assetsError } = await supabase
        .from("business_campaign_assets")
        .select("business_id, campaign_logo_url, use_default_logo")
        .eq("campaign_id", campaignId)
        .in("business_id", businessIds);

      if (assetsError) throw assetsError;

      // Create a map of assets by business_id
      const assetsMap = new Map(
        (assets || []).map((a) => [a.business_id, a])
      );

      // Aggregate contributions by business
      const businessContributions = new Map<string, RawSponsorData>();

      for (const order of orders) {
        if (!order.business_id || !order.businesses) continue;

        const business = order.businesses as {
          id: string;
          business_name: string;
          logo_url: string | null;
          website_url: string | null;
        };

        const existing = businessContributions.get(order.business_id);
        const asset = assetsMap.get(order.business_id);

        if (existing) {
          existing.total_amount += order.total_amount || 0;
        } else {
          businessContributions.set(order.business_id, {
            business_id: order.business_id,
            business_name: business.business_name,
            default_logo: business.logo_url,
            campaign_logo_url: asset?.campaign_logo_url || null,
            use_default_logo: asset?.use_default_logo ?? true,
            website_url: business.website_url,
            total_amount: order.total_amount || 0,
          });
        }
      }

      // Convert to array and sort by contribution amount
      const sponsors: CampaignSponsor[] = Array.from(businessContributions.values())
        .map((raw) => ({
          id: raw.business_id,
          businessName: raw.business_name,
          defaultLogo: raw.default_logo,
          campaignLogo: raw.campaign_logo_url,
          useDefaultLogo: raw.use_default_logo ?? true,
          displayLogo: resolveDisplayLogo(
            raw.campaign_logo_url,
            raw.use_default_logo,
            raw.default_logo
          ),
          websiteUrl: raw.website_url,
          totalContribution: raw.total_amount,
        }))
        .sort((a, b) => b.totalContribution - a.totalContribution);

      return sponsors;
    },
    enabled: !!campaignId,
    staleTime: 5 * 60 * 1000,
  });
}
