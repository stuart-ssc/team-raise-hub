import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface OrganizationUser {
  id: string;
  user_id: string;
  organization_id: string;
  group_id: string | null;
  user_type_id: string;
  roster_id: number | null;
  active_user: boolean;
  linked_organization_user_id: string | null;
  user_type: {
    id: string;
    name: string;
    permission_level: string;
  };
  organization: {
    id: string;
    name: string;
    organization_type: 'school' | 'nonprofit';
    city: string | null;
    state: string | null;
  };
  groups?: {
    id: string;
    group_name: string;
  };
}

const PERMISSION_PRIORITY: Record<string, number> = {
  organization_admin: 1,
  program_manager: 2,
  participant: 3,
  supporter: 4,
  sponsor: 5,
};

function sortByPermissionLevel(roles: OrganizationUser[]): OrganizationUser[] {
  return [...roles].sort((a, b) => {
    const aPriority = PERMISSION_PRIORITY[a.user_type?.permission_level] ?? 99;
    const bPriority = PERMISSION_PRIORITY[b.user_type?.permission_level] ?? 99;
    return aPriority - bPriority;
  });
}

export const useOrganizationUser = () => {
  const [allRoles, setAllRoles] = useState<OrganizationUser[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchRoles = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('organization_user')
        .select(`
          *,
          user_type:user_type_id (
            id,
            name,
            permission_level
          ),
          organization:organization_id (
            id,
            name,
            organization_type,
            city,
            state
          ),
          groups:group_id (
            id,
            group_name
          )
        `)
        .eq('user_id', user.id)
        .eq('active_user', true);

      if (error) {
        console.error('Error fetching organization user:', error);
        setAllRoles([]);
      } else {
        const sorted = sortByPermissionLevel((data || []) as unknown as OrganizationUser[]);
        setAllRoles(sorted);
        // If no role is selected yet, default to highest priority
        if (!selectedRoleId && sorted.length > 0) {
          setSelectedRoleId(sorted[0].id);
        }
      }
    } catch (error) {
      console.error('Error in fetchOrganizationUser:', error);
      setAllRoles([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const switchRole = useCallback((orgUserId: string) => {
    setSelectedRoleId(orgUserId);
  }, []);

  const refreshRoles = useCallback(async () => {
    await fetchRoles();
  }, [fetchRoles]);

  const organizationUser = allRoles.find(r => r.id === selectedRoleId) || allRoles[0] || null;

  return { organizationUser, allRoles, switchRole, refreshRoles, loading };
};
