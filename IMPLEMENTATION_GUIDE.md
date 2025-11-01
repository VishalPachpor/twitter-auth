# Twitter Authentication Implementation Guide

This document provides a comprehensive guide on how we implemented Twitter OAuth authentication with Supabase integration, from initial setup to production deployment.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Initial Setup](#initial-setup)
3. [Twitter Authentication Implementation](#twitter-authentication-implementation)
4. [Supabase Integration](#supabase-integration)
5. [UI Components & Features](#ui-components--features)
6. [API Routes](#api-routes)
7. [Deployment](#deployment)
8. [Key Changes Summary](#key-changes-summary)

---

## Project Overview

We built a Next.js application that:
- Authenticates users via Twitter OAuth 2.0
- Allows users to edit their username
- Collects and stores wallet addresses
- Stores all profile data in Supabase database
- Displays submitted profiles in a formatted card

**Tech Stack:**
- Next.js 16 (App Router)
- NextAuth.js v4
- Supabase (PostgreSQL)
- TypeScript
- Tailwind CSS

---

## Initial Setup

### 1. Project Creation

Started with a Next.js project using Create Next App:

```bash
npx create-next-app@latest twitter-auth
```

### 2. Dependencies Installed

```json
{
  "dependencies": {
    "next": "16.0.1",
    "next-auth": "^4.24.13",
    "@supabase/supabase-js": "^2.78.0",
    "react": "19.2.0",
    "react-dom": "19.2.0"
  }
}
```

---

## Twitter Authentication Implementation

### Step 1: Configure NextAuth

**File:** `app/api/auth/[...nextauth]/route.ts`

#### Key Implementation:

1. **Twitter Provider Setup:**
```typescript
Twitter({
  clientId: process.env.TWITTER_CLIENT_ID!,
  clientSecret: process.env.TWITTER_CLIENT_SECRET!,
  version: "2.0", // OAuth 2.0
  authorization: {
    params: {
      scope: "users.read tweet.read offline.access",
    },
  },
})
```

2. **Callbacks Implementation:**

   - **signIn Callback:** Logs user data during sign-in
   - **jwt Callback:** 
     - Stores access tokens
     - Fetches user profile from Twitter API
     - Stores username and profile picture in token
   - **session Callback:**
     - Adds username and profile picture to session
     - Makes data available to client components

3. **Custom Pages:**
```typescript
pages: {
  signIn: "/auth/signin",
  error: "/auth/error",
}
```

### Step 2: Type Definitions

**File:** `types/next-auth.d.ts`

Extended NextAuth types to include:
- `username` in Session and User
- `accessToken` in Session
- Custom JWT fields

### Step 3: Providers Setup

**File:** `app/providers.tsx`

Wrapped the app with `SessionProvider` to enable session access in client components.

**File:** `app/layout.tsx`

Integrated the providers into the root layout.

---

## Supabase Integration

### Step 1: Database Schema

**File:** `supabase-schema.sql`

Created a `profiles` table with:
- `id` (UUID) - Primary key
- `username` (TEXT)
- `wallet_address` (TEXT)
- `name` (TEXT)
- `image` (TEXT)
- `email` (TEXT, optional)
- `user_id` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Features:**
- Indexes on frequently queried fields
- Row Level Security (RLS) policies
- Auto-update trigger for `updated_at`

### Step 2: Supabase Client

**File:** `lib/supabase.ts`

**Initial Implementation (Problem):**
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Issue:** This caused build failures on Vercel because environment variables weren't available during build time.

**Final Implementation (Solution):**
```typescript
let supabaseClient: SupabaseClient | null = null

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }

  return supabaseClient
}

// Lazy-loading proxy for backward compatibility
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient]
  },
})
```

**Benefits:**
- Client only initializes at runtime
- Build succeeds even without environment variables
- Error thrown only when actually used (runtime, not build time)

---

## UI Components & Features

### Main Page Component

**File:** `app/page.tsx`

#### Features Implemented:

1. **Session Management:**
   - Uses `useSession` hook for authentication state
   - Shows loading state while checking session
   - Redirects to sign-in if not authenticated

2. **Username Editing:**
   - Editable username field
   - Save/Cancel functionality
   - Keyboard shortcuts (Enter to save, Escape to cancel)
   - State management: `savedUsername`, `editedUsername`, `isEditing`

3. **Wallet Address Input:**
   - Text input field
   - Validation (disabled submit if empty)
   - Styling with Tailwind CSS

4. **Profile Submission:**
   - Async submission handler
   - Loading state with spinner
   - Error handling and display
   - Success feedback via stored profile card

5. **Stored Profile Display:**
   - Shows submitted profile data
   - Displays: name, username, email, wallet address, submission timestamp
   - Green border to indicate successful submission
   - Profile picture display

#### State Management:

```typescript
const [editedUsername, setEditedUsername] = useState("")
const [savedUsername, setSavedUsername] = useState<string | null>(null)
const [isEditing, setIsEditing] = useState(false)
const [walletAddress, setWalletAddress] = useState("")
const [storedProfile, setStoredProfile] = useState<StoredProfileData | null>(null)
const [isSubmitting, setIsSubmitting] = useState(false)
const [submitError, setSubmitError] = useState<string | null>(null)
```

---

## API Routes

### Profile Save Endpoint

**File:** `app/api/profile/save/route.ts`

#### Implementation:

1. **Authentication Check:**
```typescript
const session = await getServerSession()
if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

2. **Request Validation:**
```typescript
const { username, walletAddress, name, image, email } = body

if (!walletAddress || !name || !username) {
  return NextResponse.json(
    { error: 'Missing required fields' },
    { status: 400 }
  )
}
```

3. **Database Insert:**
```typescript
const { data, error } = await supabase
  .from('profiles')
  .insert({
    username,
    wallet_address: walletAddress,
    name,
    image,
    email: email || null,
    user_id: session.user.email || null,
    created_at: new Date().toISOString(),
  })
  .select()
  .single()
```

4. **Error Handling:**
   - Validates authentication
   - Validates required fields
   - Handles Supabase errors
   - Returns appropriate HTTP status codes

#### Key Fixes:

**Issue 1:** TypeScript error with `session.user.id`
- **Problem:** `id` property doesn't exist on Session user type
- **Solution:** Changed to use `session.user.email` only

**Issue 2:** Build-time environment variable access
- **Problem:** Supabase client initialized at module load
- **Solution:** Implemented lazy loading pattern

---

## Deployment

### Step 1: Git Repository Setup

1. **Initialized Git:**
```bash
git init
git add .
git commit -m "Initial commit"
```

2. **Configured Git User:**
```bash
git config --global user.name "VishalPachpor"
git config --global user.email "Vishalpatil080502@gmail.com"
```

3. **Created GitHub Repository:**
   - Repository: `twitter-auth`
   - URL: `https://github.com/VishalPachpor/twitter-auth`

4. **Pushed to GitHub:**
```bash
git remote add origin https://github.com/VishalPachpor/twitter-auth.git
git branch -M main
git push -u origin main
```

### Step 2: Vercel Deployment

1. **Created Vercel Project:**
   - Connected GitHub repository
   - Automatic deployment on push

2. **Environment Variables Added:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://twitter-auth-lac.vercel.app
```

3. **Production URL:**
   - `https://twitter-auth-lac.vercel.app`

### Step 3: Twitter App Configuration

**Callback URLs Added:**
- Production: `https://twitter-auth-lac.vercel.app/api/auth/callback/twitter`
- Development: `http://localhost:3000/api/auth/callback/twitter`

**App Settings:**
- Type: "Web App, Automated App or Bot"
- OAuth 2.0: Enabled
- Scopes: `users.read tweet.read offline.access`

---

## Key Changes Summary

### Phase 1: Basic Authentication
- ✅ Set up NextAuth with Twitter provider
- ✅ Configured OAuth 2.0 callbacks
- ✅ Created custom sign-in page
- ✅ Added session management

### Phase 2: User Profile Features
- ✅ Added username editing functionality
- ✅ Implemented profile picture display
- ✅ Created user-friendly UI with Tailwind CSS

### Phase 3: Wallet Address Feature
- ✅ Added wallet address input field
- ✅ Implemented form validation
- ✅ Added submit button with loading states

### Phase 4: Data Storage
- ✅ Created Supabase database schema
- ✅ Implemented Supabase client
- ✅ Created API route for saving profiles
- ✅ Added error handling

### Phase 5: Display & Feedback
- ✅ Created stored profile card component
- ✅ Added success/error feedback
- ✅ Implemented loading states
- ✅ Added submission timestamp

### Phase 6: Deployment & Fixes
- ✅ Fixed TypeScript errors
- ✅ Implemented lazy-loading for Supabase client
- ✅ Deployed to Vercel
- ✅ Configured Twitter callback URLs
- ✅ Set up environment variables

---

## Environment Variables Required

### Development (.env.local)
```env
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Production (Vercel)
Same variables, but `NEXTAUTH_URL` should be your production URL:
```env
NEXTAUTH_URL=https://twitter-auth-lac.vercel.app
```

---

## File Structure

```
twitter-auth/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/
│   │   │   │   └── route.ts          # NextAuth configuration
│   │   │   ├── error/
│   │   │   │   └── page.tsx          # Error page
│   │   │   └── signin/
│   │   │       └── page.tsx          # Sign-in page
│   │   └── profile/
│   │       └── save/
│   │           └── route.ts          # Profile save API
│   ├── page.tsx                      # Main page component
│   ├── layout.tsx                    # Root layout
│   └── providers.tsx                 # Session provider wrapper
├── lib/
│   └── supabase.ts                   # Supabase client
├── types/
│   └── next-auth.d.ts               # NextAuth type definitions
├── supabase-schema.sql               # Database schema
└── package.json
```

---

## Testing Flow

1. **User visits:** `https://twitter-auth-lac.vercel.app`
2. **Sees:** "Sign in with Twitter" button
3. **Clicks:** Redirected to Twitter for authentication
4. **After auth:** Redirected back with profile data
5. **Can edit:** Username field
6. **Enters:** Wallet address
7. **Submits:** Data saved to Supabase
8. **Sees:** Success card with all profile details

---

## Troubleshooting Issues Encountered

### Issue 1: Twitter OAuth 403 Error
- **Cause:** Incorrect app type in Twitter Developer Portal
- **Solution:** Changed app type to "Web App, Automated App or Bot"

### Issue 2: Username Not Available
- **Cause:** Twitter API response structure
- **Solution:** Implemented multiple fallbacks in JWT callback

### Issue 3: Build Failure - Missing Environment Variables
- **Cause:** Supabase client initialized at module load
- **Solution:** Implemented lazy-loading pattern

### Issue 4: TypeScript Error - session.user.id
- **Cause:** Type definition doesn't include `id`
- **Solution:** Used `session.user.email` instead

### Issue 5: Git Authentication Issues
- **Cause:** Cached credentials for different account
- **Solution:** Used personal access token for authentication

---

## Best Practices Implemented

1. **Security:**
   - Server-side authentication checks
   - Environment variables never committed
   - Row Level Security in Supabase

2. **Error Handling:**
   - Try-catch blocks in API routes
   - User-friendly error messages
   - Proper HTTP status codes

3. **User Experience:**
   - Loading states
   - Form validation
   - Success feedback
   - Keyboard shortcuts

4. **Code Quality:**
   - TypeScript for type safety
   - Modular code structure
   - Proper error handling
   - Clean component structure

---

## Future Enhancements (Optional)

- [ ] Add profile update functionality
- [ ] Implement profile deletion
- [ ] Add wallet address validation
- [ ] Create admin dashboard
- [ ] Add pagination for profiles list
- [ ] Implement profile search
- [ ] Add email notifications
- [ ] Create API documentation

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Supabase Documentation](https://supabase.com/docs)
- [Twitter API Documentation](https://developer.twitter.com/en/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)

---

## Conclusion

This implementation successfully creates a complete Twitter authentication system with:
- ✅ Secure OAuth 2.0 authentication
- ✅ User profile management
- ✅ Wallet address collection
- ✅ Database storage with Supabase
- ✅ Production deployment on Vercel
- ✅ Proper error handling and user feedback

The application is production-ready and follows Next.js and React best practices.

