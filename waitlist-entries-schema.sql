-- Complete Waitlist Entries Table Schema
-- Run this SQL in your Supabase SQL Editor if the table doesn't exist

-- Create waitlist_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  avatar TEXT NOT NULL,
  avatar_type TEXT NOT NULL CHECK (avatar_type IN ('upload', 'avatar_seed', 'emoji')),
  avatar_seed TEXT,
  avatar_style TEXT,
  profile_id INTEGER NOT NULL,
  user_id TEXT, -- Twitter email/ID for duplicate prevention
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add user_id column if it doesn't exist (for existing tables)
ALTER TABLE waitlist_entries 
ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_user_id ON waitlist_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_wallet_address ON waitlist_entries(wallet_address);
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_profile_id ON waitlist_entries(profile_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_created_at ON waitlist_entries(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for waitlist_entries
-- Allow anyone to read waitlist entries
DROP POLICY IF EXISTS "Anyone can read waitlist entries" ON waitlist_entries;
CREATE POLICY "Anyone can read waitlist entries"
  ON waitlist_entries
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated users to insert waitlist entries
DROP POLICY IF EXISTS "Allow authenticated inserts" ON waitlist_entries;
CREATE POLICY "Allow authenticated inserts"
  ON waitlist_entries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Optional: Add unique constraint on wallet_address to prevent duplicates at database level
-- Uncomment the line below if you want to enforce unique wallet addresses
-- ALTER TABLE waitlist_entries ADD CONSTRAINT unique_waitlist_wallet_address UNIQUE (wallet_address);

-- Optional: Add unique constraint on user_id to prevent duplicate Twitter IDs
-- Uncomment the line below if you want to enforce unique user IDs at database level
-- ALTER TABLE waitlist_entries ADD CONSTRAINT unique_waitlist_user_id UNIQUE (user_id);

