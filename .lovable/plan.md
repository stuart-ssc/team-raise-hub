

## Goal
New incoming messages should bump the count on the **message icon** (already exists in `NotificationDropdown` via `unreadMessageCount`) but should NOT create rows in the `notifications` bell dropdown.

## Root cause
A database trigger `notify_on_new_message` (migration `20260103030255_*.sql`) inserts a row into the `notifications` table for every new internal message. Because of this:
- The bell badge increments
- A "New Message: ..." item appears in the bell list
- The Messages icon's count (which queries `messages` directly) also increments

Result: messages show up twice.

## Changes

### 1. New migration — drop the message-notification trigger
Drop the trigger and function so new messages stop populating the `notifications` table:
```sql
DROP TRIGGER IF EXISTS notify_on_new_message ON public.messages;
DROP FUNCTION IF EXISTS public.notify_new_message();
```
Email + push notifications continue to work — they're handled by the `send-message-notification` edge function, not this trigger.

### 2. Move the message badge onto the Messages icon — `src/components/DashboardHeader.tsx`
Currently the unread message count lives inside the bell dropdown menu. Move it onto the `MessageCircle` button in the header so it's visible at a glance (matching the screenshot's intent).

- Add a small `useEffect` + Supabase subscription (mirrors logic already in `NotificationDropdown.fetchUnreadMessages`) to compute `unreadMessageCount` for the current user.
- Render a red `Badge` overlay on the MessageCircle button when count > 0, identical styling to the bell badge (`absolute -top-1 -right-1 h-5 w-5 ... 9+`).
- Wrap the button in a `relative` container.

### 3. Clean up `NotificationDropdown.tsx`
- Remove the `unreadMessageCount` state, `fetchUnreadMessages`, the messages realtime subscription, and the "Messages" `DropdownMenuItem` with its badge — that role now belongs to the header's MessageCircle button.
- Bell dropdown returns to showing only true notifications (donations, membership requests, etc.).

### 4. Optional: backfill cleanup
Not deleting historical message-type notifications — they'll naturally age out and the user can mark-all-read.

## Out of scope
- Email / push notifications for messages (untouched — handled by edge function)
- The `/dashboard/notifications` full-history page
- SystemAdminHeader (no message icon there currently)

