## Why you're still seeing 404

Good news: the page is live. I just fetched `sponsorly.io/g/sample-school/varsity-basketball` directly and the server returned the real hub page with "Sample School — Varsity Basketball", Banner Sales, Donation Station, etc.

So why does your browser show 404? **A stale service worker.** `src/main.tsx` registers `/sw.js` on every load, which means an older version of the app (built before the `/g/...` and `/o/...` routes existed) cached itself on your machine. That cached bundle has no `/g/...` route, so React Router falls through to `<NotFound />`. The cache only refreshes once an hour (`registration.update()` interval), and only if the service worker code itself changes.

This will hit every existing user who has visited `sponsorly.io` in the past — not just you.

## Fix

### 1. Add a kill-switch service worker
Create `public/sw.js` that immediately unregisters itself and clears all caches:

```js
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll();
    clients.forEach(c => c.navigate(c.url));
  })());
});
```

When the browser polls for a new `sw.js`, it gets this one, wipes its caches, unregisters, and reloads the open tab. After that, normal network fetches resume and `/g/sample-school/varsity-basketball` works.

### 2. Stop registering a service worker we don't actually use
Remove the `navigator.serviceWorker.register('/sw.js', ...)` block from `src/main.tsx`. The project doesn't have offline/PWA features wired up — the registration was setting us up for exactly this kind of stale-cache problem with no upside.

### 3. Republish
After both changes, click **Publish → Update** so `sponsorly.io` serves the kill-switch `sw.js`. Existing users will pick it up on their next visit (within an hour, or immediately on hard refresh).

## What you can do right now to verify the route works
While we wait for the publish, you can confirm it's a cache issue:
- Open `https://sponsorly.io/g/sample-school/varsity-basketball` in an **incognito window** — it should load the team hub.
- Or in your normal window: DevTools → Application → Service Workers → "Unregister", then Application → Storage → "Clear site data", then refresh.

## Files touched
- new: `public/sw.js` (kill-switch)
- edit: `src/main.tsx` (remove registration)

## Out of scope
- Building a real PWA / offline mode (separate decision).
- Slug changes — those are correct now (`sample-school` / `varsity-basketball`).
