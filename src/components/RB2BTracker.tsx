import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const RB2B_SCRIPT_ID = 'rb2b-script-loader';
const RB2B_KEY = '5NRP9H7QRJO1';

export const RB2BTracker = () => {
  const { pathname } = useLocation();
  
  const isExcludedPage = pathname.startsWith('/dashboard') || pathname.startsWith('/system-admin');

  useEffect(() => {
    if (!isExcludedPage) {
      if (!document.getElementById(RB2B_SCRIPT_ID) && !(window as any).reb2b) {
        (window as any).reb2b = { loaded: true };
        
        const script = document.createElement('script');
        script.id = RB2B_SCRIPT_ID;
        script.async = true;
        script.src = `https://ddwl4m2hdecbv.cloudfront.net/b/${RB2B_KEY}/${RB2B_KEY}.js.gz`;
        
        const firstScript = document.getElementsByTagName('script')[0];
        if (firstScript && firstScript.parentNode) {
          firstScript.parentNode.insertBefore(script, firstScript);
        } else {
          document.head.appendChild(script);
        }
      }
    } else {
      const existingScript = document.getElementById(RB2B_SCRIPT_ID);
      if (existingScript) existingScript.remove();
      delete (window as any).reb2b;
    }
  }, [isExcludedPage]);

  return null;
};
