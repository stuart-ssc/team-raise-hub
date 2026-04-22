import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ConnectedGuardian {
  id: string;
  firstName: string | null;
  lastName: string | null;
  userTypeName: string | null;
}

/**
 * Fetches active family members (guardians) linked to a given player's
 * organization_user record. Returns an empty array when nothing is connected.
 */
export function useConnectedGuardians(organizationUserId: string | null | undefined) {
  const [guardians, setGuardians] = useState<ConnectedGuardian[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGuardians = useCallback(async () => {
    if (!organizationUserId) {
      setGuardians([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("organization_user")
        .select(`
          id,
          profile:profiles(id, first_name, last_name),
          user_type:user_type(name)
        `)
        .eq("linked_organization_user_id", organizationUserId)
        .eq("active_user", true);

      if (error) throw error;

      setGuardians(
        (data || []).map((g: any) => ({
          id: g.id,
          firstName: g.profile?.first_name ?? null,
          lastName: g.profile?.last_name ?? null,
          userTypeName: g.user_type?.name ?? null,
        }))
      );
    } catch (err) {
      console.error("Error loading connected guardians:", err);
      setGuardians([]);
    } finally {
      setLoading(false);
    }
  }, [organizationUserId]);

  useEffect(() => {
    fetchGuardians();
  }, [fetchGuardians]);

  return { guardians, loading, refresh: fetchGuardians };
}