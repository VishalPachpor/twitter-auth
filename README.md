# Twitter Authentication App with Supabase

A Next.js application that implements Twitter OAuth authentication and stores user profiles with wallet addresses in Supabase.

## Features

- 🔐 Twitter OAuth 2.0 authentication using NextAuth.js
- 💾 Profile storage with Supabase database
- 👤 User profile management with editable username
- 💼 Wallet address submission and storage
- 🎨 Modern UI with Tailwind CSS and dark mode support
- 📱 Responsive design

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Authentication**: NextAuth.js v4
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Twitter Developer account
- A Supabase account

### Installation

1. Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/twitter-auth.git
cd twitter-auth
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
# NextAuth Configuration
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

4. Set up Supabase database:

- Run the SQL schema from `supabase-schema.sql` in your Supabase SQL Editor
- See `SUPABASE_SETUP.md` for detailed instructions (if available)

5. Configure Twitter App:

- Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
- Set app type to "Web App, Automated App or Bot"
- Add callback URL: `http://localhost:3000/api/auth/callback/twitter`

6. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
twitter-auth/
├── app/
│   ├── api/
│   │   ├── auth/          # NextAuth configuration
│   │   └── profile/       # Profile API routes
│   ├── page.tsx           # Main page component
│   └── layout.tsx         # Root layout
├── lib/
│   └── supabase.ts        # Supabase client
├── types/
│   └── next-auth.d.ts    # NextAuth type definitions
├── supabase-schema.sql    # Database schema
└── DEPLOYMENT.md          # Deployment guide
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on:

- Pushing to GitHub
- Deploying to Vercel
- Configuring Twitter callback URLs
- Setting up environment variables

## Environment Variables

| Variable                        | Description                       | Required |
| ------------------------------- | --------------------------------- | -------- |
| `TWITTER_CLIENT_ID`             | Twitter OAuth Client ID           | Yes      |
| `TWITTER_CLIENT_SECRET`         | Twitter OAuth Client Secret       | Yes      |
| `NEXTAUTH_SECRET`               | Secret for NextAuth.js encryption | Yes      |
| `NEXTAUTH_URL`                  | Base URL of your application      | Yes      |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL              | Yes      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key            | Yes      |

## Database Schema

The app uses a `profiles` table with the following structure:

- `id` (UUID) - Primary key
- `username` (TEXT) - Twitter username
- `wallet_address` (TEXT) - User's wallet address
- `name` (TEXT) - User's display name
- `image` (TEXT) - Profile image URL
- `email` (TEXT) - User's email (optional)
- `user_id` (TEXT) - Link to NextAuth user ID
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

## Security

- Environment variables are never committed to version control
- Row Level Security (RLS) is enabled on Supabase tables
- Authentication is verified in API routes before database operations
- Secrets are stored securely in Vercel environment variables

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - ⭐ **Start here!** Complete guide for using this waitlist system in any project
- **[NEXTJS_15_COMPATIBILITY.md](./NEXTJS_15_COMPATIBILITY.md)** - Guide for using this in Next.js 15 projects
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Complete guide on how Twitter authentication was implemented from start to finish
- **[QUICK_DEPLOY.md](./QUICK_DEPLOY.md)** - Quick reference for deployment
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Troubleshooting guide

## Support

For issues and questions:

- Check the [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for detailed implementation steps
- Review the [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) guide
- Open an issue on GitHub
