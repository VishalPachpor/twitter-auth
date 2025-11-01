# Deployment Guide

This guide will help you push your code to GitHub and deploy it to Vercel, then configure your Twitter app with the deployment URL.

## Step 1: Push to GitHub

### 1.1 Initialize Git Repository (if not already done)

```bash
cd twitter-auth
git init
```

### 1.2 Stage All Files

```bash
git add .
```

### 1.3 Commit Changes

```bash
git commit -m "Add Twitter auth with Supabase integration"
```

### 1.4 Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right → "New repository"
3. Fill in:
   - Repository name: `twitter-auth` (or your preferred name)
   - Description: "Twitter authentication app with Supabase"
   - Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Click "Create repository"

### 1.5 Link Local Repository to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name.

## Step 2: Deploy to Vercel

### 2.1 Create Vercel Account

1. Go to [Vercel](https://vercel.com)
2. Sign up/Login with your GitHub account (recommended for easy integration)

### 2.2 Import Your GitHub Repository

1. In Vercel dashboard, click "Add New..." → "Project"
2. Import your GitHub repository
3. Select your `twitter-auth` repository
4. Click "Import"

### 2.3 Configure Environment Variables

In the Vercel project settings, add these environment variables:

**NextAuth Configuration:**
- `TWITTER_CLIENT_ID` - Your Twitter Client ID
- `TWITTER_CLIENT_SECRET` - Your Twitter Client Secret
- `NEXTAUTH_SECRET` - Generate a random secret (you can use: `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Will be auto-set to your Vercel URL (e.g., `https://your-app.vercel.app`)

**Supabase Configuration:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

**Steps:**
1. In Vercel project settings, go to "Environment Variables"
2. Add each variable above
3. Select all environments (Production, Preview, Development)
4. Click "Save"

### 2.4 Deploy

1. Click "Deploy" button
2. Wait for deployment to complete (usually 2-3 minutes)
3. Your app will be live at: `https://your-app-name.vercel.app`

## Step 3: Update Twitter App Configuration

### 3.1 Get Your Deployment URL

After deployment, your app URL will be something like:
```
https://your-app-name.vercel.app
```

### 3.2 Update Twitter App Callback URLs

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Select your app
3. Go to **Settings** → **User authentication settings**
4. In the **Callback URI / Redirect URL** section, add:
   ```
   https://your-app-name.vercel.app/api/auth/callback/twitter
   ```
5. Also add your localhost URL for development:
   ```
   http://localhost:3000/api/auth/callback/twitter
   ```
6. Click **Save**

### 3.3 Update App Type (if needed)

Make sure your app type is set to:
- **Type of App**: "Web App, Automated App or Bot"
- **OAuth 2.0**: Enabled

## Step 4: Update Supabase (if needed)

If you're using the same Supabase database for both local and production:

1. The Supabase URL and keys should work for both environments
2. No changes needed - the same database will be used

## Step 5: Test Your Deployment

1. Visit your Vercel URL: `https://your-app-name.vercel.app`
2. Try signing in with Twitter
3. Enter a wallet address and submit
4. Check Supabase dashboard to verify data is being saved

## Troubleshooting

### Error: "Invalid callback URL"
- Make sure you added the callback URL in Twitter Developer Portal
- Format: `https://your-app-name.vercel.app/api/auth/callback/twitter`
- Wait 2-3 minutes after saving for changes to propagate

### Error: "Missing environment variables"
- Check Vercel dashboard → Settings → Environment Variables
- Make sure all variables are added and saved
- Redeploy after adding variables

### Error: "NEXTAUTH_URL mismatch"
- Set `NEXTAUTH_URL` in Vercel environment variables to your production URL
- Format: `https://your-app-name.vercel.app`

### Deployments not updating
- Push new changes to GitHub main branch
- Vercel will automatically redeploy
- Or manually trigger redeploy in Vercel dashboard

## Continuous Deployment

Once set up, Vercel will automatically:
- Deploy when you push to the `main` branch
- Create preview deployments for pull requests
- Show deployment status in GitHub

## Useful Commands

```bash
# Check deployment status
vercel ls

# View logs
vercel logs

# Redeploy
vercel --prod
```

## Security Notes

- Never commit `.env.local` to GitHub (already in .gitignore)
- Keep your Twitter Client Secret and Supabase keys secure
- Use Vercel's environment variables for production secrets
- Consider enabling Vercel's security features like rate limiting

