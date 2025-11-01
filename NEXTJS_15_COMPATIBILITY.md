# Next.js 15 Compatibility Guide

Yes, you can use this waitlist system in Next.js 15 projects! However, there are a few adjustments needed.

## ✅ What Works Out of the Box

- ✅ App Router structure (`app/` directory)
- ✅ API Routes (`app/api/` route handlers)
- ✅ `next/navigation` hooks (`useRouter`, `useSearchParams`)
- ✅ `next/link` component
- ✅ NextAuth.js v4 (fully compatible with Next.js 15)
- ✅ Server Components and Client Components
- ✅ Suspense boundaries

## ⚠️ Required Changes for Next.js 15

### 1. Update Package Dependencies

**Current (Next.js 16):**
```json
{
  "next": "16.0.1",
  "react": "19.2.0",
  "react-dom": "19.2.0",
  "@types/react": "^19",
  "@types/react-dom": "^19"
}
```

**For Next.js 15:**
```json
{
  "next": "^15.0.0",
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "@types/react": "^18",
  "@types/react-dom": "^18",
  "eslint-config-next": "15.0.0"
}
```

### 2. No Code Changes Needed!

The codebase uses standard Next.js APIs that work in both versions:
- ✅ Route handlers (`app/api/*/route.ts`)
- ✅ Server Components and Client Components
- ✅ `useSearchParams` with Suspense (required in both)
- ✅ `next/navigation` hooks

### 3. Optional: Run Next.js 15 Codemod

If you're migrating an existing Next.js 15 project, you can run the codemod to ensure compatibility:

```bash
npx @next/codemod@canary next-async-request-api
```

However, this waitlist code doesn't use the affected APIs (`cookies`, `headers`, etc.) in server components, so this step is optional.

## 📋 Migration Steps

### Step 1: Install Correct Dependencies

```bash
# In your Next.js 15 project
npm install next-auth@^4.24.13 @supabase/supabase-js@^2.78.0
npm install three@^0.181.0 @types/three@^0.181.0
npm install @radix-ui/react-dialog @radix-ui/react-avatar @radix-ui/react-label @radix-ui/react-slot
npm install class-variance-authority clsx tailwind-merge lucide-react
```

### Step 2: Copy Components

Copy these directories/files to your Next.js 15 project:
```
components/
hooks/
lib/
app/api/
app/waitlist/
types/
```

### Step 3: Update Package.json (if creating new project)

If you're copying this into an existing Next.js 15 project, your `package.json` should already have:
- `next: "^15.0.0"`
- `react: "^18.3.0"`
- `react-dom: "^18.3.0"`

Just add the additional dependencies listed above.

### Step 4: Set Environment Variables

Same as before - no changes needed:
```env
TWITTER_CLIENT_ID=...
TWITTER_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Step 5: Set Up Database

Run the SQL schemas in Supabase (same as before):
- `waitlist-entries-schema.sql`
- `supabase-schema.sql`

## 🔍 Key Differences Between Next.js 15 & 16

| Feature | Next.js 15 | Next.js 16 |
|---------|------------|------------|
| React Version | React 18 | React 19 |
| Default Fetch Caching | Not cached | Cached by default |
| Async Request APIs | Required (`await cookies()`) | Same |
| Turbopack | Stable | Default |

## ⚠️ Potential Issues & Solutions

### Issue 1: React Version Mismatch

**Symptom:** Type errors with React types

**Solution:** Ensure you're using React 18 types:
```bash
npm install --save-dev @types/react@^18 @types/react-dom@^18
```

### Issue 2: Fetch Caching Behavior

**Symptom:** API calls might behave differently

**Solution:** The code already uses explicit cache options (`cache: "no-store"`) in API calls, so this shouldn't be an issue.

### Issue 3: TypeScript Errors

**Symptom:** Type mismatches with React types

**Solution:** Make sure your `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler"
  }
}
```

## ✅ Testing Checklist

After migration, verify:

1. ✅ Home page loads correctly
2. ✅ "Join Waitlist" button navigates to `/waitlist`
3. ✅ Waitlist page loads with 3D globe
4. ✅ Twitter authentication works
5. ✅ Waitlist popup opens/closes correctly
6. ✅ Form submission works
7. ✅ Profile images appear on globe
8. ✅ Duplicate prevention works

## 🎯 Summary

**Can you use this in Next.js 15?** ✅ **YES!**

**What needs to change?**
- ✅ Update dependencies (React 18 instead of 19)
- ✅ No code changes needed
- ✅ Same environment variables
- ✅ Same database setup

**Migration time:** ~5-10 minutes (just updating dependencies)

The codebase is designed to work with both Next.js 15 and 16!

