import { useEffect } from 'react';

const COOKIEYES_SCRIPT_ID = 'cookieyes';
const COOKIEYES_SCRIPT_SRC = 'https://cdn-cookieyes.com/client_data/f46aae8052af6bf45c0190fac24c29c5/script.js';

export const CookieYesTracker = () => {
  useEffect(() => {
    // Only add script if it doesn't exist
    if (!document.getElementById(COOKIEYES_SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = COOKIEYES_SCRIPT_ID;
      script.type = 'text/javascript';
      script.src = COOKIEYES_SCRIPT_SRC;
      // Insert at the beginning of head to load early for consent management
      document.head.insertBefore(script, document.head.firstChild);
    }
  }, []);

  return null;
};
