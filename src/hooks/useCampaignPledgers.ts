import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CampaignPledger {
  id: string;
  customerName: string;
  amountPerUnit: number;
  maxTotal: number | null;
  attributedRosterMemberId: string | null;
  attributedName: string | null;
  createdAt: string;
}

export function useCampaignPledgers(campaignId: string | null) {
  return useQuery({
    queryKey: ["campaign-pledgers", campaignId],
    queryFn: async (): Promise<CampaignPledger[]> => {
      if (!campaignId) return [];

      const { data: pledges, error } = await supabase
        .from("pledges")
        .select("id, amount_per_unit, max_total_amount, attributed_roster_member_id, order_id, created_at, status")
        .eq("campaign_id", campaignId)
        .in("status", ["active", "charged"])
        .order("amount_per_unit", { ascending: false })
        .limit(50);
      if (error) throw error;

      const orderIds = (pledges || []).map((p: any) => p.order_id).filter(Boolean);
      const rosterIds = (pledges || [])
        .map((p: any) => p.attributed_roster_member_id)
        .filter(Boolean);

      const [ordersRes, rostersRes] = await Promise.all([
        orderIds.length
          ? supabase.from("orders").select("id, customer_name").in("id", orderIds)
          : Promise.resolve({ data: [], error: null } as any),
        rosterIds.length
          ? supabase
              .from("organization_user")
              .select("id, first_name, last_name")
              .in("id", rosterIds)
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      const orderMap = new Map<string, string>();
      (ordersRes.data || []).forEach((o: any) =>
        orderMap.set(o.id, o.customer_name || "Anonymous"),
      );
      const rosterMap = new Map<string, string>();
      (rostersRes.data || []).forEach((r: any) =>
        rosterMap.set(r.id, `${r.first_name || ""} ${r.last_name || ""}`.trim()),
      );

      return (pledges || []).map((p: any) => ({
        id: p.id,
        customerName: orderMap.get(p.order_id) || "Anonymous",
        amountPerUnit: Number(p.amount_per_unit || 0),
        maxTotal: p.max_total_amount != null ? Number(p.max_total_amount) : null,
        attributedRosterMemberId: p.attributed_roster_member_id,
        attributedName: p.attributed_roster_member_id
          ? rosterMap.get(p.attributed_roster_member_id) || null
          : null,
        createdAt: p.created_at,
      }));
    },
    enabled: !!campaignId,
    staleTime: 60 * 1000,
  });
}
