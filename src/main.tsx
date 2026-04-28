import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Previously this app registered a service worker that aggressively cached
// the built bundle. That cache served stale routes (e.g., 404 on new pages
// like /g/:orgSlug/:groupSlug). We no longer register a service worker.
// We still ship public/sw.js as a kill-switch that any previously-installed
// service worker will pick up on its next update check, clear all caches,
// and unregister itself.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      // Trigger an update so the kill-switch sw.js installs and unregisters.
      registration.update().catch(() => {});
    });
  }).catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
