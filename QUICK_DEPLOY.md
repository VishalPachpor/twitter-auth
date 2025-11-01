# Quick Start: Push to GitHub & Deploy

## Quick Commands

### 1. Push to GitHub (First Time)

```bash
# Make sure you're in the project directory
cd twitter-auth

# Stage all files
git add .

# Commit changes
git commit -m "Initial commit: Twitter auth with Supabase"

# Add GitHub remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 2. After Creating GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (don't initialize with README)
3. Copy the repository URL
4. Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` in the commands above

### 3. Deploy to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New..." → "Project"
4. Import your repository
5. Add environment variables (see DEPLOYMENT.md)
6. Click "Deploy"

### 4. Update Twitter App

After deployment, add this callback URL to Twitter Developer Portal:
```
https://your-app-name.vercel.app/api/auth/callback/twitter
```

## Important Notes

- ✅ `.env.local` is already in `.gitignore` - never commit secrets!
- ✅ Make sure to add all environment variables in Vercel
- ✅ Update Twitter callback URLs after deployment
- ✅ Wait 2-3 minutes after updating Twitter settings

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

