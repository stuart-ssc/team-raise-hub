

# Capitalize Order Status in My Orders

## Change
In `src/pages/MyOrders.tsx`, line 192, the status badge displays `{order.status}` directly from the database (lowercase "succeeded"). Update to capitalize the first letter.

**Current:** `{order.status}`
**New:** `{order.status.charAt(0).toUpperCase() + order.status.slice(1)}`

Single line change, no other files affected.
