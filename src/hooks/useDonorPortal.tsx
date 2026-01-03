import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface DonorProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  total_donations: number | null;
  donation_count: number | null;
  organization_id: string;
  message_notification_email: boolean | null;
}

interface LinkedBusiness {
  id: string;
  business_id: string;
  role: string | null;
  is_primary_contact: boolean | null;
  business: {
    id: string;
    business_name: string;
    business_email: string | null;
    logo_url: string | null;
  };
}

interface DonorPortalData {
  isDonorOnly: boolean;
  isLoading: boolean;
  donorProfiles: DonorProfile[];
  linkedBusinesses: LinkedBusiness[];
  hasOrgAccess: boolean;
  refetch: () => Promise<void>;
}

export function useDonorPortal(): DonorPortalData {
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [donorProfiles, setDonorProfiles] = useState<DonorProfile[]>([]);
  const [linkedBusinesses, setLinkedBusinesses] = useState<LinkedBusiness[]>([]);
  const [hasOrgAccess, setHasOrgAccess] = useState(false);

  const fetchDonorData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Check if user has organization access (staff member)
      const { data: orgUser, error: orgError } = await supabase
        .from('organization_user')
        .select('id')
        .eq('user_id', user.id)
        .eq('active_user', true)
        .limit(1)
        .maybeSingle();

      if (orgError) {
        console.error('Error checking org access:', orgError);
      }

      setHasOrgAccess(!!orgUser);

      // Fetch donor profiles linked to this user
      const { data: profiles, error: profilesError } = await supabase
        .from('donor_profiles')
        .select('id, email, first_name, last_name, phone, total_donations, donation_count, organization_id, message_notification_email')
        .eq('user_id', user.id);

      if (profilesError) {
        console.error('Error fetching donor profiles:', profilesError);
      } else {
        setDonorProfiles(profiles || []);
      }

      // Fetch linked businesses for this donor
      if (profiles && profiles.length > 0) {
        const donorIds = profiles.map(p => p.id);
        
        const { data: businesses, error: businessesError } = await supabase
          .from('business_donors')
          .select(`
            id,
            business_id,
            role,
            is_primary_contact,
            business:businesses (
              id,
              business_name,
              business_email,
              logo_url
            )
          `)
          .in('donor_id', donorIds)
          .is('blocked_at', null);

        if (businessesError) {
          console.error('Error fetching linked businesses:', businessesError);
        } else {
          // Type assertion needed because of the nested select
          setLinkedBusinesses((businesses || []) as unknown as LinkedBusiness[]);
        }
      }
    } catch (error) {
      console.error('Error in useDonorPortal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchDonorData();
    }
  }, [user, authLoading]);

  // User is donor-only if they have donor profiles but no organization access
  const isDonorOnly = !hasOrgAccess && donorProfiles.length > 0;

  return {
    isDonorOnly,
    isLoading: authLoading || isLoading,
    donorProfiles,
    linkedBusinesses,
    hasOrgAccess,
    refetch: fetchDonorData,
  };
}
