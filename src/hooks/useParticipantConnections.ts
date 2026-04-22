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
  // Track which role context the hook has actually resolved for. While this
  // does not match the current desired key, consumers in participant view
  // must treat the hook as still loading (prevents stale empty-array reads
  // during role/auth transitions).
  const [resolvedKey, setResolvedKey] = useState<string | null>(null);

  const permissionLevel = organizationUser?.user_type?.permission_level;
  const isParticipantView = 
    permissionLevel === 'participant' || 
    permissionLevel === 'supporter' || 
    permissionLevel === 'sponsor';

  // Stable signature of the relevant role context. Changes whenever the
  // active org user OR the set of linked/participant role IDs changes —
  // even if the count stays the same.
  const roleSignature = allRoles
    .map(r => `${r.id}:${r.linked_organization_user_id ?? ''}:${r.user_type?.permission_level ?? ''}`)
    .sort()
    .join('|');
  const desiredKey = organizationUser ? `${organizationUser.id}::${roleSignature}` : null;

  useEffect(() => {
    if (!isParticipantView || !organizationUser) {
      setConnectedDonorEmails([]);
      setConnectedBusinessIds([]);
      // Mark resolved for non-participant context so consumers do not block.
      setResolvedKey(desiredKey ?? '__non_participant__');
      return;
    }

    const fetchConnections = async () => {
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
        setResolvedKey(desiredKey);
      }
    };

    fetchConnections();
  }, [desiredKey, isParticipantView]);

  // Loading is true whenever the hook has not yet resolved for the current
  // desired role context. This prevents the one-render stale window where
  // organizationUser has just loaded but the fetch has not started.
  const loading = isParticipantView
    ? resolvedKey !== desiredKey
    : resolvedKey === null;

  return { connectedDonorEmails, connectedBusinessIds, loading, isParticipantView };
};
