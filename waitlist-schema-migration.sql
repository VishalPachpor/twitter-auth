-- Migration: Add user_id column to waitlist_entries table
-- Run this SQL in your Supabase SQL Editor

-- Add user_id column to waitlist_entries table (if it doesn't exist)
ALTER TABLE waitlist_entries 
ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_user_id ON waitlist_entries(user_id);

-- Create index on wallet_address for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_wallet_address ON waitlist_entries(wallet_address);

-- Optional: Add unique constraint on wallet_address to prevent duplicates
-- Uncomment the line below if you want to enforce unique wallet addresses at database level
-- ALTER TABLE waitlist_entries ADD CONSTRAINT unique_waitlist_wallet_address UNIQUE (wallet_address);

-- Optional: Add unique constraint on user_id to prevent duplicate Twitter IDs
-- Uncomment the line below if you want to enforce unique user IDs at database level
-- ALTER TABLE waitlist_entries ADD CONSTRAINT unique_waitlist_user_id UNIQUE (user_id);

