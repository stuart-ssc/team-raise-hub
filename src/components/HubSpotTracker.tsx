import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const HUBSPOT_SCRIPT_ID = 'hs-script-loader';
const HUBSPOT_SCRIPT_SRC = '//js.hs-scripts.com/50749855.js';

export const HubSpotTracker = () => {
  const { pathname } = useLocation();
  
  const isMarketingPage = !pathname.startsWith('/dashboard') && !pathname.startsWith('/system-admin');

  useEffect(() => {
    if (isMarketingPage) {
      // Check if script already exists
      if (!document.getElementById(HUBSPOT_SCRIPT_ID)) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.id = HUBSPOT_SCRIPT_ID;
        script.async = true;
        script.defer = true;
        script.src = HUBSPOT_SCRIPT_SRC;
        document.body.appendChild(script);
      }
    } else {
      // Remove script when on dashboard/system-admin pages
      const existingScript = document.getElementById(HUBSPOT_SCRIPT_ID);
      if (existingScript) {
        existingScript.remove();
      }
    }

    return () => {
      // Cleanup on unmount
      const existingScript = document.getElementById(HUBSPOT_SCRIPT_ID);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [isMarketingPage]);

  return null;
};
