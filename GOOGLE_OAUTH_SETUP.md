# Google OAuth Setup Guide for Supabase

This guide walks you through setting up Google authentication with Supabase step-by-step.

## Prerequisites

- A Supabase project (you should already have this)
- A Google account
- Your Supabase project reference ID (found in your Supabase project URL: `https://<PROJECT-REF>.supabase.co`)

---

## Step 1: Create Google OAuth Credentials

### 1.1 Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. If you don't have a project, create one:
   - Click the project dropdown at the top
   - Click "New Project"
   - Enter a project name (e.g., "Scoreboard App")
   - Click "Create"

### 1.2 Enable Google+ API

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google+ API" or "Google Identity Services"
3. Click on it and click **Enable**

### 1.3 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** at the top
3. Select **OAuth client ID**

### 1.4 Configure OAuth Consent Screen (if prompted)

If this is your first time, you'll need to configure the consent screen:

1. Select **External** (unless you have a Google Workspace account)
2. Click **Create**
3. Fill in the required fields:
   - **App name**: Your app name (e.g., "Scoreboard")
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Click **Save and Continue**
5. On the **Scopes** page, click **Save and Continue** (default scopes are fine)
6. On the **Test users** page, click **Save and Continue** (you can add test users later)
7. Click **Back to Dashboard**

### 1.5 Create OAuth Client ID

1. Application type: Select **Web application**
2. Name: Enter a name (e.g., "Scoreboard Web Client")
3. **Authorized redirect URIs**: Add this URI (replace `<YOUR-PROJECT-REF>` with your Supabase project reference):
   ```
   https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback
   ```
   
   **How to find your project reference:**
   - Go to your Supabase Dashboard
   - Look at the URL: `https://supabase.com/dashboard/project/<PROJECT-REF>`
   - Or check your `.env.local` file - the URL is `https://<PROJECT-REF>.supabase.co`
   
   **Example:**
   ```
   https://abcdefghijklmnop.supabase.co/auth/v1/callback
   ```
4. Click **Create**
5. **IMPORTANT**: Copy both the **Client ID** and **Client Secret** - you'll need these in the next step
   - Keep these secure and never commit them to git

---

## Step 2: Configure Google OAuth in Supabase

### 2.1 Open Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project

### 2.2 Navigate to Authentication Settings

1. In the left sidebar, click **Authentication**
2. Click **Providers** (or go to Authentication → Providers)

### 2.3 Enable Google Provider

1. Find **Google** in the list of providers
2. Toggle it **ON**
3. Enter your credentials:
   - **Client ID (for OAuth)**: Paste the Client ID from Google Cloud Console
   - **Client Secret (for OAuth)**: Paste the Client Secret from Google Cloud Console
4. Click **Save**

### 2.4 Configure Redirect URLs

1. Still in **Authentication**, click **URL Configuration**
2. Set **Site URL** to your development URL:
   - For local development: `http://localhost:3000`
   - For production: Your production URL (e.g., `https://yourdomain.com`)
3. Under **Redirect URLs**, make sure you have:
   - `http://localhost:3000/dashboard` (for local dev)
   - `http://localhost:3000/auth/update-password` (for password resets)
   - Your production URLs if applicable
4. Click **Save**

---

## Step 3: Verify Your Setup

### 3.1 Check Your Environment Variables

Make sure your `.env.local` file has:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://<YOUR-PROJECT-REF>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

### 3.2 Restart Your Development Server

If your dev server is running, restart it to pick up any changes:
```bash
# Stop the server (Ctrl+C) and restart
pnpm dev
```

---

## Step 4: Test Google Authentication

### 4.1 Test the Flow

1. Navigate to `http://localhost:3000/auth`
2. Click the **"Continue with Google"** button
3. You should be redirected to Google's sign-in page
4. After signing in, you should be redirected back to `/dashboard`
5. You should now be authenticated!

### 4.2 Verify Authentication

1. Check that you're redirected to `/dashboard`
2. Your user should be created in Supabase
3. You can verify in Supabase Dashboard → **Authentication** → **Users** to see your new user

---

## Troubleshooting

### Issue: "redirect_uri_mismatch" error

**Solution:**
- Make sure the redirect URI in Google Cloud Console exactly matches:
  ```
  https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback
  ```
- Check for typos, extra spaces, or missing `https://`
- Make sure you're using the correct project reference

### Issue: "OAuth provider not enabled" error

**Solution:**
- Go to Supabase Dashboard → Authentication → Providers
- Make sure Google is toggled **ON**
- Verify the Client ID and Client Secret are correctly entered
- Click **Save** again

### Issue: Redirected but not authenticated

**Solution:**
- Check that your Site URL in Supabase matches your current URL
- Verify redirect URLs include `/dashboard`
- Check browser console for errors
- Make sure your `.env.local` has the correct Supabase URL and key

### Issue: "Invalid client" error

**Solution:**
- Double-check your Client ID and Client Secret in Supabase
- Make sure you copied them correctly (no extra spaces)
- Regenerate credentials in Google Cloud Console if needed

### Issue: OAuth consent screen issues

**Solution:**
- If your app is in "Testing" mode, only test users can sign in
- Add your email to "Test users" in Google Cloud Console
- Or publish your app (requires verification for production)

---

## Additional Notes

- **Development vs Production**: You may need separate OAuth credentials for production
- **Multiple Environments**: Consider creating separate Google OAuth clients for dev/staging/prod
- **Security**: Never commit your Client Secret to git - it's only stored in Supabase Dashboard
- **User Data**: Google will provide email, name, and profile picture to your app automatically

---

## Next Steps

Once Google OAuth is working:
- Test the full authentication flow
- Verify users can create scoreboards
- Check that anonymous users can convert to Google accounts
- Consider adding more OAuth providers (Discord is already set up in your code)

---

## Quick Reference

**Google Cloud Console:**
- Redirect URI: `https://<PROJECT-REF>.supabase.co/auth/v1/callback`

**Supabase Dashboard:**
- Authentication → Providers → Google → Toggle ON
- Authentication → URL Configuration → Set Site URL

**Your App:**
- The frontend code is already implemented in `components/AuthForm.tsx`
- No code changes needed!
