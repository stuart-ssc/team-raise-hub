import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GA_MEASUREMENT_ID = 'G-6K72ZH7FV9';
const GA_SCRIPT_ID = 'google-analytics-script';
const GA_CONFIG_ID = 'google-analytics-config';

export const GoogleAnalyticsTracker = () => {
  const { pathname } = useLocation();
  
  const isExcludedPage = pathname.startsWith('/dashboard') || pathname.startsWith('/system-admin');

  useEffect(() => {
    if (!isExcludedPage) {
      // Only add scripts if they don't exist
      if (!document.getElementById(GA_SCRIPT_ID)) {
        // Add the gtag.js script to head
        const script = document.createElement('script');
        script.id = GA_SCRIPT_ID;
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
        document.head.insertBefore(script, document.head.firstChild);

        // Add the inline configuration script
        const inlineScript = document.createElement('script');
        inlineScript.id = GA_CONFIG_ID;
        inlineScript.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `;
        document.head.insertBefore(inlineScript, script.nextSibling);
      }
    } else {
      // Remove scripts when on dashboard/system-admin pages
      const gaScript = document.getElementById(GA_SCRIPT_ID);
      const gaConfig = document.getElementById(GA_CONFIG_ID);
      if (gaScript) gaScript.remove();
      if (gaConfig) gaConfig.remove();
    }
  }, [isExcludedPage]);

  return null;
};
