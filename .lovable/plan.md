
# Enhanced System Admin Organization Management

## Overview
Add comprehensive group creation, user invitation, and role management capabilities to the System Admin Organization Detail page at `/system-admin/organizations/:orgId`. This will allow system admins to support organizations by creating groups and inviting users on their behalf.

---

## Current State Analysis

The OrganizationDetail page currently has:
- Read-only tabs for Groups, Users, Campaigns, Donations, Donors, and Settings
- Organization editing capabilities in the Settings tab
- Basic table views showing existing data without management actions

**Missing capabilities:**
- Create new groups for the organization
- Invite users to the organization
- Manage user roles and group assignments
- Edit/deactivate users and groups
- Quick actions from the tables

---

## Proposed Changes

### 1. Groups Tab Enhancement

**Add "Create Group" Button**
- Add a "New Group" button in the Groups tab header
- Opens a dialog/form based on the existing `CreateGroupForm` component pattern
- System admin version doesn't require `useOrganizationUser` context (passes orgId directly)

**Add Row Actions**
- Add an actions column to the groups table with dropdown menu:
  - Edit group details
  - Toggle active/inactive status
  - Manage payment setup
  - View roster

**Create New Component: `SystemAdminCreateGroupDialog`**
- Similar to `CreateGroupForm` but adapted for system admin use
- Accepts `organizationId` as prop instead of getting from context
- Fetches group types based on organization type (school vs nonprofit)

### 2. Users Tab Enhancement

**Add "Invite User" Button**
- Add an "Invite User" button in the Users tab header
- Opens a dialog based on the existing `AddUserForm` component pattern

**Add Row Actions**
- Add an actions column to the users table:
  - Edit user role
  - Change group assignment
  - Activate/deactivate user

**Enhance Table Display**
- Add group name column
- Add email column (requires joining to profiles or auth)

**Create New Component: `SystemAdminAddUserDialog`**
- Adapts `AddUserForm` for system admin context
- Passes `organizationId` directly instead of using context
- Filters user types based on organization type

### 3. User Role Management Dialog

**Create New Component: `EditUserRoleDialog`**
- Allow changing user type (role)
- Allow changing group assignment
- Allow changing roster assignment
- Show current assignments

---

## Technical Implementation

### New Components to Create

**1. `src/components/SystemAdmin/CreateGroupDialog.tsx`**
```text
+---------------------------------------------+
|  Create Group                            X  |
+---------------------------------------------+
|  Group Name: [________________]             |
|                                             |
|  Group Type: [Select type      v]           |
|  (Sports Team, Club, PTO, Program, etc.)    |
|                                             |
|  Website URL: [________________] (optional) |
|                                             |
|  Logo: [Upload] (optional)                  |
|                                             |
|         [Cancel]  [Create Group]            |
+---------------------------------------------+
```

**2. `src/components/SystemAdmin/InviteUserDialog.tsx`**
```text
+---------------------------------------------+
|  Invite User to Organization             X  |
+---------------------------------------------+
|  First Name: [________] Last Name: [______] |
|                                             |
|  Email: [_________________________________] |
|                                             |
|  Role: [Select role           v]            |
|  (Principal, Coach, Team Player, etc.)      |
|                                             |
|  Group: [Select group         v]            |
|  (Required for most roles)                  |
|                                             |
|  Roster: [Select roster       v]            |
|  (Auto-selected if group chosen)            |
|                                             |
|         [Cancel]  [Send Invitation]         |
+---------------------------------------------+
```

**3. `src/components/SystemAdmin/EditUserRoleDialog.tsx`**
```text
+---------------------------------------------+
|  Edit User: John Smith                   X  |
+---------------------------------------------+
|  Current Role: Coach                        |
|  Current Group: Varsity Football            |
|                                             |
|  New Role: [Select role       v]            |
|                                             |
|  New Group: [Select group     v]            |
|                                             |
|  Status: [Active v]                         |
|                                             |
|         [Cancel]  [Save Changes]            |
+---------------------------------------------+
```

### File Modifications

**`src/pages/SystemAdmin/OrganizationDetail.tsx`**

1. **Import new dialog components**

2. **Add state variables:**
   - `showCreateGroupDialog`
   - `showInviteUserDialog`  
   - `editingUser`
   - `showEditUserDialog`

3. **Update Groups Tab (around line 635-666):**
   - Add header with "New Group" button
   - Add Actions column to table
   - Add row action dropdown (Edit, Toggle Status)

4. **Update Users Tab (around line 668-700):**
   - Add header with "Invite User" button
   - Add Email and Group columns
   - Add Actions column with Edit Role dropdown
   - Update user fetch to include email from profiles

5. **Add dialog components at end of JSX**

### Database Interactions

All operations use existing infrastructure:
- **Create Group**: Direct insert to `groups` table
- **Invite User**: Uses existing `invite-user` edge function
- **Update User Role**: Direct update to `organization_user` table
- **Toggle Status**: Direct update to `groups.status` or `organization_user.active_user`

No database migrations required - all tables and functions already exist.

---

## User Flow

### Creating a Group
1. System admin navigates to organization detail page
2. Clicks "Groups" tab
3. Clicks "New Group" button
4. Fills in group name, selects type (filtered by org type)
5. Optionally adds website URL and logo
6. Clicks "Create Group"
7. Group appears in table, roster is auto-created via trigger

### Inviting a User
1. System admin navigates to organization detail page
2. Clicks "Users" tab
3. Clicks "Invite User" button
4. Enters user details (name, email)
5. Selects role (filtered by org type)
6. Selects group (if required by role)
7. Roster auto-selects current roster for group
8. Clicks "Send Invitation"
9. User receives email invitation via existing edge function

### Editing User Role
1. System admin clicks "..." menu on user row
2. Selects "Edit Role"
3. Changes role, group, or status
4. Saves changes
5. User's access updates immediately

---

## Files to Create
1. `src/components/SystemAdmin/CreateGroupDialog.tsx`
2. `src/components/SystemAdmin/InviteUserDialog.tsx`
3. `src/components/SystemAdmin/EditUserRoleDialog.tsx`

## Files to Modify
1. `src/pages/SystemAdmin/OrganizationDetail.tsx`

---

## Edge Cases and Validation

- **Empty Groups List**: Show "No groups yet" message with prominent "Create First Group" button
- **User Already Exists**: The `invite-user` function handles this by finding existing profile
- **Inactive Group Selected**: Filter group dropdown to only show active groups
- **Role/Group Mismatch**: Some roles (Principal) don't require a group - handle dynamically
- **Roster Selection**: Auto-select current roster when group is chosen

---

## Summary

This enhancement transforms the System Admin Organization Detail page from a read-only view into a full management interface, enabling support staff to:
- Create groups for organizations getting started
- Invite initial users like coaches and administrators  
- Manage user roles and assignments for support cases
- Activate/deactivate users and groups as needed

All functionality leverages existing database schema and edge functions, requiring no backend changes.
