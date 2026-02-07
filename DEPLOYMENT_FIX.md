# 🚨 IMMEDIATE ACTIONS REQUIRED - Fix OAuth Redirect

Your app is deployed at: **https://elearnsphere.vercel.app**  
But OAuth/Email links redirect to: ~~http://localhost:3000~~

## ✅ Step-by-Step Fix (5 minutes)

### Step 1: Update Supabase Site URL

1. Go to: [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to: **Authentication** → **URL Configuration**
4. Update **Site URL** to:
   ```
   https://elearnsphere.vercel.app
   ```
5. Click **Save**

### Step 2: Add Redirect URLs

In the same **URL Configuration** page:

1. Find **Redirect URLs** section
2. Add these URLs (one per line):
   ```
   http://localhost:3000/auth/callback
   https://elearnsphere.vercel.app/auth/callback
   ```
3. Click **Save**

### Step 3: Update Email Templates

1. Navigate to: **Authentication** → **Email Templates**
2. Click **Confirm signup** template
3. Find the confirmation link (look for `<a href=`)
4. Replace any hardcoded `localhost:3000` with `{{ .SiteURL }}`
5. The link should look like:
   ```html
   <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup">
     Confirm your email
   </a>
   ```
6. Click **Save**
7. Repeat for **Magic Link** and **Reset Password** templates

### Step 4: Update Google OAuth (if using)

1. Navigate to: **Authentication** → **Providers** → **Google**
2. Copy the **Redirect URL** shown (format: `https://xxxxx.supabase.co/auth/v1/callback`)
3. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
4. Select your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, ensure this URL is added
6. Click **Save**

### Step 5: Clear Cache & Test

1. Clear your browser cookies and cache
2. Go to: https://elearnsphere.vercel.app
3. Click **Sign Up** or **Sign In with Google**
4. Verify it redirects to `elearnsphere.vercel.app` (NOT localhost)

## 🧪 Test Checklist

- [ ] Site URL updated in Supabase
- [ ] Redirect URLs added for production
- [ ] Email templates updated with `{{ .SiteURL }}`
- [ ] Google OAuth redirect URI configured
- [ ] Browser cache cleared
- [ ] OAuth flow redirects to production URL
- [ ] Email verification links point to production

## 🆘 Still Not Working?

1. **Hard refresh your browser:** `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. **Try incognito/private browsing**
3. **Check Supabase logs:** Go to Supabase Dashboard → Logs → Auth logs
4. **Redeploy Vercel:** Go to Vercel dashboard and trigger a new deployment

## ⚠️ Important Notes

- Changes to Supabase configuration take effect **immediately**
- You don't need to redeploy Vercel for Supabase changes
- Email template changes apply to **new emails only** (not already sent)
- Cookie issues? Try a different browser to test
