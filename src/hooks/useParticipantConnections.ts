import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";

interface ParticipantConnections {
  connectedDonorEmails: string[];
  connectedBusinessIds: string[];
  loading: boolean;
  isParticipantView: boolean;
}

/**
 * Hook to fetch donors and businesses connected to a participant/supporter
 * through roster-attributed orders. Returns empty arrays for admins/managers.
 */
export const useParticipantConnections = (): ParticipantConnections => {
  const { organizationUser, allRoles } = useOrganizationUser();
  const [connectedDonorEmails, setConnectedDonorEmails] = useState<string[]>([]);
  const [connectedBusinessIds, setConnectedBusinessIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const permissionLevel = organizationUser?.user_type?.permission_level;
  const isParticipantView = 
    permissionLevel === 'participant' || 
    permissionLevel === 'supporter' || 
    permissionLevel === 'sponsor';

  useEffect(() => {
    if (!isParticipantView || !organizationUser) {
      setConnectedDonorEmails([]);
      setConnectedBusinessIds([]);
      return;
    }

    const fetchConnections = async () => {
      setLoading(true);
      try {
        // Collect org user IDs: current user's ID + any linked children (for parents)
        const orgUserIds: string[] = [organizationUser.id];

        // If this is a parent (supporter with linked_organization_user_id), include the child's ID
        if (organizationUser.linked_organization_user_id) {
          orgUserIds.push(organizationUser.linked_organization_user_id);
        }

        // Also check if any other roles are linked children
        for (const role of allRoles) {
          if (role.linked_organization_user_id && !orgUserIds.includes(role.linked_organization_user_id)) {
            orgUserIds.push(role.linked_organization_user_id);
          }
          // Include all participant/supporter role IDs for this user
          if (
            role.organization_id === organizationUser.organization_id &&
            (role.user_type?.permission_level === 'participant' || role.user_type?.permission_level === 'supporter')
          ) {
            if (!orgUserIds.includes(role.id)) {
              orgUserIds.push(role.id);
            }
          }
        }

        // Fetch orders attributed to these org user IDs
        const { data: attributedOrders, error } = await supabase
          .from('orders')
          .select('customer_email, business_id')
          .in('attributed_roster_member_id', orgUserIds)
          .in('status', ['succeeded', 'completed']);

        if (error) {
          console.error('Error fetching attributed orders:', error);
          return;
        }

        const emails = [...new Set(
          (attributedOrders || [])
            .map(o => o.customer_email)
            .filter(Boolean) as string[]
        )];

        const businessIds = [...new Set(
          (attributedOrders || [])
            .map(o => o.business_id)
            .filter(Boolean) as string[]
        )];

        setConnectedDonorEmails(emails);
        setConnectedBusinessIds(businessIds);
      } catch (error) {
        console.error('Error fetching participant connections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, [organizationUser?.id, isParticipantView]);

  return { connectedDonorEmails, connectedBusinessIds, loading, isParticipantView };
};
