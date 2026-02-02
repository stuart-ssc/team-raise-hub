

## Add Microsoft Login to Login and Signup Pages

### Summary
Add "Continue with Microsoft" button to both authentication pages, enabling users to sign in with their Microsoft accounts (personal, work, or school).

---

### Changes Required

**1. File: `src/hooks/useAuth.tsx`**

Add a new `signInWithMicrosoft` method to the auth context:

- Add to interface (line 13): `signInWithMicrosoft: () => Promise<{ error: any }>;`
- Add function implementation after `signInWithFacebook` (after line 88):
  ```typescript
  const signInWithMicrosoft = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    return { error };
  };
  ```
- Add to provider value (line 118): `signInWithMicrosoft,`

**2. File: `src/pages/Login.tsx`**

- Import `signInWithMicrosoft` from useAuth (line 25)
- Add `handleMicrosoftLogin` function after `handleGoogleLogin`
- Add Microsoft button after Facebook button (around line 221)

**3. File: `src/pages/Signup.tsx`**

- Import `signInWithMicrosoft` from useAuth (line 36)
- Add `handleMicrosoftSignup` function after `handleFacebookSignup`
- Add Microsoft button after Facebook button (around line 404)

---

### Microsoft Button Design

The button will use the official Microsoft logo with matching styling:

```tsx
<Button
  type="button"
  variant="outline"
  className="w-full"
  size="lg"
  onClick={handleMicrosoftLogin}
  disabled={loading}
>
  <svg className="mr-2 h-4 w-4" viewBox="0 0 21 21">
    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
    <rect x="11" y="1" width="9" height="9" fill="#00a4ef"/>
    <rect x="1" y="11" width="9" height="9" fill="#7fba00"/>
    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
  </svg>
  Continue with Microsoft
</Button>
```

---

### Visual Result

Both Login and Signup pages will display three social login options:
1. Continue with Google
2. Continue with Facebook  
3. Continue with Microsoft

All buttons will have consistent styling with their respective brand colors/logos.

---

### Technical Notes

- Supabase uses `azure` as the provider name for Microsoft OAuth
- The redirect URL will go to `/dashboard` after successful authentication
- Works with personal Microsoft accounts (@outlook.com, @hotmail.com) and work/school accounts based on your Azure AD configuration

