

# Capitalize Order Status Display Across All Pages

## Problem
The status badge on the Order Details page and several other pages displays the raw database status (e.g., "succeeded") without capitalizing the first letter.

## Changes

### 1. `src/pages/OrderDetails.tsx` (line 278)
- **Current:** `{order.status}`
- **New:** `{order.status.charAt(0).toUpperCase() + order.status.slice(1)}`

### 2. `src/pages/CampaignOrderDetail.tsx` (lines 594-597)
- **Current:** Hardcoded "Succeeded" for that status, raw `order.status` for others
- **New:** Use `{order.status.charAt(0).toUpperCase() + order.status.slice(1)}` for all statuses, keep the CheckCircle icon for succeeded/completed

### 3. `src/pages/DonorPortal/PurchaseDetails.tsx` (line 431)
- **Current:** `{order.status}`
- **New:** `{order.status.charAt(0).toUpperCase() + order.status.slice(1)}`

### 4. `src/pages/SystemAdmin/OrderRecovery.tsx` (line 137)
- **Current:** `{order.status}`
- **New:** `{order.status.charAt(0).toUpperCase() + order.status.slice(1)}`

`MyOrders.tsx` already has the fix from the previous change, and `DonorPortal/Home.tsx` doesn't display the status text (only the amount), so no change needed there.

