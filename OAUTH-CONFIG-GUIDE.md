# Google OAuth Configuration Guide

## Problem

Google OAuth fails on mobile with `redirect_uri` mismatch error. Desktop works fine.

## Root Cause

Google Cloud Console doesn't have the Supabase callback URL registered as an authorized redirect URI.

## Fix Steps

### Step 1: Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your project
3. Click **OAuth 2.0 Client ID** (the one used for AgentFlow)
4. Under **Authorized redirect URIs**, add:
   ```
   https://fsxdduvwshirrheenmag.supabase.co/auth/v1/callback
   ```
5. Click **Save**

### Step 2: Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/fsxdduvwshirrheenmag)
2. Navigate to **Authentication → Providers → Google**
3. Verify:
   - **Client ID** matches Google Cloud Console
   - **Client Secret** matches Google Cloud Console
   - **Redirect URL** is set to: `https://fsxdduvwshirrheenmag.supabase.co/auth/v1/callback`
4. Click **Save**

### Step 3: Test

1. Open AgentFlow on mobile browser
2. Tap "Continue with Google"
3. Complete Google sign-in
4. Should redirect back to dashboard

### Step 4: Verify in Supabase Logs

If still failing:
1. Go to Supabase Dashboard → **Authentication → Logs**
2. Look for error messages related to OAuth
3. Check if redirect_uri mismatch errors appear

## Environment Variables

Ensure these are set in Vercel:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://fsxdduvwshirrheenmag.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key |
| `NEXT_PUBLIC_APP_URL` | `https://startupvo1.vercel.app` |

## Additional Notes

- Mobile browsers may have stricter cookie handling
- If issues persist, check if third-party cookies are blocked
- Test in incognito/private mode to rule out cache issues
