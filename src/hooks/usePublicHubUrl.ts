import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface HubInfo {
  url: string | null;
  orgSlug: string | null;
  groupSlug: string | null;
  enabled: boolean;
  loading: boolean;
  displayName: string | null;
}

/**
 * Resolves the public hub URL for a given group (and its parent org).
 * If groupId is null/undefined, falls back to the org-level hub when an
 * organizationId is provided.
 */
export const usePublicHubUrl = (
  organizationId?: string | null,
  groupId?: string | null
): HubInfo => {
  const [info, setInfo] = useState<HubInfo>({
    url: null,
    orgSlug: null,
    groupSlug: null,
    enabled: false,
    loading: true,
    displayName: null,
  });

  useEffect(() => {
    let cancelled = false;
    if (!organizationId) {
      setInfo({ url: null, orgSlug: null, groupSlug: null, enabled: false, loading: false, displayName: null });
      return;
    }

    (async () => {
      try {
        const { data: org } = await supabase
          .from("organizations")
          .select("name,public_slug,public_page_enabled")
          .eq("id", organizationId)
          .maybeSingle();

        if (!org) {
          if (!cancelled) {
            setInfo({ url: null, orgSlug: null, groupSlug: null, enabled: false, loading: false, displayName: null });
          }
          return;
        }

        let groupSlug: string | null = null;
        let groupEnabled = true;
        let groupName: string | null = null;
        if (groupId) {
          const { data: group } = await supabase
            .from("groups")
            .select("group_name,public_slug,public_page_enabled")
            .eq("id", groupId)
            .maybeSingle();
          groupSlug = group?.public_slug ?? null;
          groupEnabled = group?.public_page_enabled ?? false;
          groupName = group?.group_name ?? null;
        }

        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const enabled = !!org.public_slug && org.public_page_enabled !== false && (!groupId || (!!groupSlug && groupEnabled));
        const url = enabled
          ? groupId && groupSlug
            ? `${origin}/g/${org.public_slug}/${groupSlug}`
            : `${origin}/o/${org.public_slug}`
          : null;

        if (!cancelled) {
          setInfo({
            url,
            orgSlug: org.public_slug ?? null,
            groupSlug,
            enabled,
            loading: false,
            displayName: groupName ? `${org.name} — ${groupName}` : org.name,
          });
        }
      } catch {
        if (!cancelled) {
          setInfo({ url: null, orgSlug: null, groupSlug: null, enabled: false, loading: false, displayName: null });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [organizationId, groupId]);

  return info;
};