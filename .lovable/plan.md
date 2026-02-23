
# Fix: Campaign URL Path + Add Copy/Share/QR to All Campaigns

## Problem
1. "View Campaign" links use `/campaign/` instead of the correct `/c/` path
2. Non-roster-enabled campaigns only show a plain "View Campaign" button, missing the Copy, Share, and QR code actions that roster-enabled campaigns get

## Changes

### 1. `src/pages/FamilyDashboard.tsx` (lines 770-778)

Replace the simple "View Campaign" button for non-roster campaigns with the same Copy, Share, and QR actions -- just using the main campaign URL (`/c/{slug}`) instead of a personal link:

```typescript
) : (
  <>
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open(`/c/${stat.campaignSlug}`, '_blank')}
      >
        <ExternalLink className="h-4 w-4 mr-1" />
        View
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => copyToClipboard(`${window.location.origin}/c/${stat.campaignSlug}`)}
      >
        <Copy className="h-4 w-4 mr-1" />
        Copy
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => shareLink(`${window.location.origin}/c/${stat.campaignSlug}`, stat.childName)}
      >
        <Share2 className="h-4 w-4 mr-1" />
        Share
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowQRCode(showQRCode === stat.campaignSlug ? null : stat.campaignSlug)}
      >
        <QrCode className="h-4 w-4" />
      </Button>
    </div>
    {showQRCode === stat.campaignSlug && (
      <div className="bg-white p-3 rounded-lg">
        <QRCode value={`${window.location.origin}/c/${stat.campaignSlug}`} size={100} />
      </div>
    )}
  </>
)}
```

### 2. `src/pages/MyFundraising.tsx` (lines 683-692)

Same treatment -- replace the plain "View Campaign Page" button with Copy, Share, QR, and View actions using the main campaign URL:

```typescript
) : (
  <>
    <div className="flex flex-wrap gap-2 justify-center">
      <Button variant="outline" size="sm" onClick={() => window.open(`/c/${stat.campaignSlug}`, '_blank')}>
        <ExternalLink className="h-4 w-4 mr-1" />
        View
      </Button>
      <Button variant="outline" size="sm" onClick={() => copyToClipboard(`${window.location.origin}/c/${stat.campaignSlug}`)}>
        <Copy className="h-4 w-4 mr-1" />
        Copy
      </Button>
      <Button variant="outline" size="sm" onClick={() => shareLink(`${window.location.origin}/c/${stat.campaignSlug}`, stat.campaignName)}>
        <Share2 className="h-4 w-4 mr-1" />
        Share
      </Button>
      <Button variant="outline" size="sm" onClick={() => setShowQRCode(showQRCode === stat.campaignSlug ? null : stat.campaignSlug)}>
        <QrCode className="h-4 w-4" />
      </Button>
    </div>
    {showQRCode === stat.campaignSlug && (
      <div className="flex justify-center p-4 bg-white rounded-md">
        <QRCode value={`${window.location.origin}/c/${stat.campaignSlug}`} size={200} />
      </div>
    )}
  </>
)}
```

### 3. Fix existing roster-enabled URLs

Also fix the roster-enabled campaign URLs in both files that already use `/campaign/` to use `/c/` instead (if any exist in the personal URL generation).

## Summary

| File | What Changes |
|------|-------------|
| `src/pages/FamilyDashboard.tsx` | Fix `/campaign/` to `/c/`, add Copy/Share/QR to non-roster campaigns |
| `src/pages/MyFundraising.tsx` | Fix `/campaign/` to `/c/`, add Copy/Share/QR to non-roster campaigns |

No new dependencies needed -- `Copy`, `Share2`, `QrCode`, `ExternalLink` icons and `copyToClipboard`/`shareLink` helpers are already imported and used in both files.
