import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseLandingPageTrackingProps {
  pageType: 'home' | 'school' | 'district' | 'state' | 'marketing';
  pagePath: string;
  schoolId?: string;
  districtId?: string;
  state?: string;
}

// Generate or retrieve anonymous session ID
const getSessionId = (): string => {
  const storageKey = 'sponsorly_session_id';
  let sessionId = localStorage.getItem(storageKey);
  
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
};

/**
 * Hook to track landing page views for marketing analytics
 * Debounced to avoid duplicate tracking on rapid navigation
 */
export const useLandingPageTracking = ({
  pageType,
  pagePath,
  schoolId,
  districtId,
  state,
}: UseLandingPageTrackingProps) => {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Reset tracking flag when page changes
    hasTracked.current = false;
  }, [pagePath]);

  useEffect(() => {
    if (hasTracked.current) return;

    const trackView = async () => {
      try {
        const { error } = await supabase.functions.invoke("track-landing-page-view", {
          body: {
            pageType,
            pagePath,
            schoolId: schoolId || undefined,
            districtId: districtId || undefined,
            state: state || undefined,
            sessionId: getSessionId(),
            referrer: document.referrer || undefined,
            userAgent: navigator.userAgent || undefined,
          },
        });

        if (error) {
          console.error("Error tracking landing page view:", error);
        }
      } catch (error) {
        console.error("Failed to track landing page view:", error);
      }
    };

    // Delay tracking to avoid counting accidental clicks
    const timeoutId = setTimeout(() => {
      trackView();
      hasTracked.current = true;
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [pageType, pagePath, schoolId, districtId, state]);
};
