

## Add Facebook Login to Signup Page

### Summary
Add a "Continue with Facebook" button to the Signup page to match the Login page, providing users with consistent social login options across both authentication flows.

---

### Changes Required

**File: `src/pages/Signup.tsx`**

1. Import `signInWithFacebook` from the auth hook (line 36)
2. Add a `handleFacebookSignup` function similar to `handleGoogleSignup`
3. Add the Facebook button below the Google button (after line 365)

---

### Implementation Details

The Facebook button will:
- Use the same SVG icon and styling as the Login page
- Call `signInWithFacebook()` from the auth context
- Handle loading state and error toasts consistently
- Support the invitation flow (OAuth redirect will preserve the session)

---

### Visual Result

The signup form's social login section will display:
1. "Continue with Google" button
2. "Continue with Facebook" button

Both buttons will have matching styles with their respective brand colors.

