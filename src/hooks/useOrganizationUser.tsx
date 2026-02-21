import { useEffect, useState } from 'react';
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

export const useOrganizationUser = () => {
  const [organizationUser, setOrganizationUser] = useState<OrganizationUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrganizationUser = async () => {
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
          .eq('active_user', true)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching organization user:', error);
          setOrganizationUser(null);
        } else {
          setOrganizationUser(data as unknown as OrganizationUser);
        }
      } catch (error) {
        console.error('Error in fetchOrganizationUser:', error);
        setOrganizationUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationUser();
  }, [user?.id]);

  return { organizationUser, loading };
};
