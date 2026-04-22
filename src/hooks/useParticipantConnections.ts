import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OrganizationUser } from "@/hooks/useOrganizationUser";

interface ParticipantConnections {
  connectedDonorEmails: string[];
  connectedBusinessIds: string[];
  loading: boolean;
  isParticipantView: boolean;
}

/**
 * Hook to fetch donors and businesses connected to a participant/supporter
 * through roster-attributed orders. Returns empty arrays for admins/managers.
 * 
 * Accepts organizationUser and allRoles as parameters to avoid race conditions
 * from multiple useOrganizationUser instances.
 */
export const useParticipantConnections = (
  organizationUser: OrganizationUser | null,
  allRoles: OrganizationUser[]
): ParticipantConnections => {
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

        // Source 1: orders attributed to this user/child via roster
        const ordersPromise = supabase
          .from('orders')
          .select('customer_email, business_id')
          .in('attributed_roster_member_id', orgUserIds)
          .in('status', ['succeeded', 'completed', 'paid']);

        // Source 2: donors this user uploaded/created (added_by_organization_user_id)
        const uploadedDonorsPromise = supabase
          .from('donor_profiles')
          .select('email')
          .eq('organization_id', organizationUser.organization_id)
          .in('added_by_organization_user_id', orgUserIds);

        // Source 3: businesses this user uploaded/created
        const uploadedBusinessesPromise = supabase
          .from('businesses')
          .select('id')
          .in('added_by_organization_user_id', orgUserIds);

        const [ordersRes, uploadedDonorsRes, uploadedBusinessesRes] = await Promise.all([
          ordersPromise,
          uploadedDonorsPromise,
          uploadedBusinessesPromise,
        ]);

        if (ordersRes.error) {
          console.error('Error fetching attributed orders:', ordersRes.error);
        }
        if (uploadedDonorsRes.error) {
          console.error('Error fetching uploaded donors:', uploadedDonorsRes.error);
        }
        if (uploadedBusinessesRes.error) {
          console.error('Error fetching uploaded businesses:', uploadedBusinessesRes.error);
        }

        const orderEmails = (ordersRes.data || [])
          .map(o => o.customer_email)
          .filter(Boolean) as string[];
        const uploadedEmails = (uploadedDonorsRes.data || [])
          .map(d => d.email)
          .filter(Boolean) as string[];

        const orderBusinessIds = (ordersRes.data || [])
          .map(o => o.business_id)
          .filter(Boolean) as string[];
        const uploadedBusinessIds = (uploadedBusinessesRes.data || [])
          .map(b => b.id)
          .filter(Boolean) as string[];

        setConnectedDonorEmails([...new Set([...orderEmails, ...uploadedEmails])]);
        setConnectedBusinessIds([...new Set([...orderBusinessIds, ...uploadedBusinessIds])]);
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
