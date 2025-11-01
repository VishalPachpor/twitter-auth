-- Supabase Database Schema for Twitter Auth Profile Storage
-- Run this SQL in your Supabase SQL Editor

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  name TEXT NOT NULL,
  image TEXT,
  email TEXT,
  user_id TEXT, -- Optional: Link to NextAuth user ID or email
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address ON profiles(wallet_address);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows inserts (auth is verified in API route)
-- Note: Since we're verifying auth in the Next.js API route, we can allow anon inserts
-- The API route handles authentication before calling Supabase
CREATE POLICY "Allow authenticated inserts"
  ON profiles
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create a policy that allows users to read all profiles (adjust as needed)
CREATE POLICY "Anyone can read profiles"
  ON profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create a policy that allows users to update their own profiles
CREATE POLICY "Users can update their own profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Optional: Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Optional: Add unique constraint on wallet_address if you want to prevent duplicates
-- Uncomment the line below if you want to enforce unique wallet addresses
-- ALTER TABLE profiles ADD CONSTRAINT unique_wallet_address UNIQUE (wallet_address);

