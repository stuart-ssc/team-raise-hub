import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseCampaignViewTrackingProps {
  campaignId: string;
  donorEmail?: string;
}

/**
 * Hook to automatically track campaign page views
 * Logs views to campaign_views table which triggers donor activity logging
 */
export const useCampaignViewTracking = ({ 
  campaignId, 
  donorEmail 
}: UseCampaignViewTrackingProps) => {
  useEffect(() => {
    // Only track if we have a campaign ID
    if (!campaignId) return;

    const trackView = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("track-campaign-view", {
          body: {
            campaignId,
            donorEmail: donorEmail || undefined,
            referrer: document.referrer || undefined,
            userAgent: navigator.userAgent || undefined,
          },
        });

        if (error) {
          console.error("Error tracking campaign view:", error);
        }
      } catch (error) {
        console.error("Failed to track campaign view:", error);
      }
    };

    // Track view after a short delay to avoid counting accidental clicks
    const timeoutId = setTimeout(trackView, 2000);

    return () => clearTimeout(timeoutId);
  }, [campaignId, donorEmail]);
};
