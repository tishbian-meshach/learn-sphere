# Supabase Configuration for Production

## Current Issue
OAuth redirects are going to `localhost:3000` instead of `https://elearnsphere.vercel.app`

## Required Configuration Steps

### 1. Update Supabase Project Settings

Go to your Supabase Dashboard → Authentication → URL Configuration:

#### A. Site URL
```
https://elearnsphere.vercel.app
```

#### B. Redirect URLs (Add all of these)
```
http://localhost:3000/auth/callback
https://elearnsphere.vercel.app/auth/callback
```

### 2. Email Templates Configuration

Go to Supabase Dashboard → Authentication → Email Templates

#### Confirm Signup Template
Update the confirmation link to use:
```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup&next=/sign-in">Verify your email</a>
```

Or if using magic link:
```html
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/sign-in
```

#### Reset Password Template
```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">Reset Password</a>
```

### 3. Vercel Environment Variables

Make sure these are set in Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_database_url (if using connection pooler)
```

### 4. OAuth Provider Configuration (Google)

Go to Supabase Dashboard → Authentication → Providers → Google

Add these Authorized Redirect URIs in your Google Cloud Console:
```
https://your-project-ref.supabase.co/auth/v1/callback
```

### 5. Redeploy Vercel

After making all Supabase changes:
1. Go to Vercel Dashboard
2. Trigger a new deployment (or push to main branch)
3. Clear browser cache and cookies
4. Test the OAuth flow

## Verification Checklist

- [ ] Site URL updated in Supabase
- [ ] Both localhost and production URLs added to Redirect URLs
- [ ] Email templates updated
- [ ] Vercel environment variables configured
- [ ] Google OAuth redirect URI updated
- [ ] Vercel redeployed
- [ ] Browser cache cleared
- [ ] OAuth tested on production

## Common Issues

**Issue**: Still redirecting to localhost
**Solution**: Clear browser cookies for both localhost and production domain

**Issue**: Email verification links point to localhost
**Solution**: Update email templates to use `{{ .SiteURL }}` variable

**Issue**: "Invalid redirect URL" error
**Solution**: Ensure production URL is added to Supabase Redirect URLs list
