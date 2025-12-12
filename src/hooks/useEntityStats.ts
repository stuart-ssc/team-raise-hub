import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EntityStats {
  total_raised: number;
  campaign_count: number;
  active_campaign_count: number;
  supporter_count: number;
  group_count: number;
}

export function useEntityStats(
  entityType: 'school' | 'district',
  entityId: string | null
) {
  return useQuery({
    queryKey: ['entity-stats', entityType, entityId],
    queryFn: async (): Promise<EntityStats> => {
      if (!entityId) {
        return {
          total_raised: 0,
          campaign_count: 0,
          active_campaign_count: 0,
          supporter_count: 0,
          group_count: 0,
        };
      }

      // Get groups for this entity
      let groupIds: string[] = [];
      
      if (entityType === 'school') {
        const { data: groups } = await supabase
          .from('groups')
          .select('id')
          .eq('school_id', entityId);
        groupIds = groups?.map(g => g.id) || [];
      } else {
        // For districts, get all schools in district, then their groups
        const { data: schools } = await supabase
          .from('schools')
          .select('id')
          .eq('school_district_id', entityId);
        
        if (schools && schools.length > 0) {
          const schoolIds = schools.map(s => s.id);
          const { data: groups } = await supabase
            .from('groups')
            .select('id')
            .in('school_id', schoolIds);
          groupIds = groups?.map(g => g.id) || [];
        }
      }

      if (groupIds.length === 0) {
        return {
          total_raised: 0,
          campaign_count: 0,
          active_campaign_count: 0,
          supporter_count: 0,
          group_count: groupIds.length,
        };
      }

      // Get campaigns for these groups
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, amount_raised, status')
        .in('group_id', groupIds);

      const campaignIds = campaigns?.map(c => c.id) || [];
      const totalRaised = campaigns?.reduce((sum, c) => sum + (c.amount_raised || 0), 0) || 0;
      const activeCampaigns = campaigns?.filter(c => c.status === true).length || 0;

      // Get unique supporters (donors) from orders
      let supporterCount = 0;
      if (campaignIds.length > 0) {
        const { data: orders } = await supabase
          .from('orders')
          .select('customer_email')
          .in('campaign_id', campaignIds)
          .in('status', ['succeeded', 'completed']);
        
        const uniqueEmails = new Set(orders?.map(o => o.customer_email).filter(Boolean));
        supporterCount = uniqueEmails.size;
      }

      return {
        total_raised: totalRaised,
        campaign_count: campaigns?.length || 0,
        active_campaign_count: activeCampaigns,
        supporter_count: supporterCount,
        group_count: groupIds.length,
      };
    },
    enabled: !!entityId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
