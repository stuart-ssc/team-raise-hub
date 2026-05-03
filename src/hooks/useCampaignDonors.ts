import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CampaignDonor {
  id: string;
  name: string;
  amount: number;
  createdAt: string;
  message: string | null;
}

export function useCampaignDonors(campaignId: string | null) {
  return useQuery({
    queryKey: ["campaign-donors", campaignId],
    queryFn: async (): Promise<CampaignDonor[]> => {
      if (!campaignId) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("id, customer_name, items_total, total_amount, created_at, dedication_type, dedication_name")
        .eq("campaign_id", campaignId)
        .eq("status", "complete")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []).map((o: any) => ({
        id: o.id,
        name: o.customer_name || "Anonymous",
        amount: Number(o.items_total ?? o.total_amount ?? 0),
        createdAt: o.created_at,
        message: o.dedication_type && o.dedication_name
          ? `${o.dedication_type === "in_memory_of" ? "In memory of" : "In honor of"} ${o.dedication_name}`
          : null,
      }));
    },
    enabled: !!campaignId,
    staleTime: 60 * 1000,
  });
}