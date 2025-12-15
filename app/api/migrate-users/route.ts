import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Migration endpoint to create users table
 * This creates a public.users table that tracks user information and subscription status
 */
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // SQL migration to create users table
    // SECURITY NOTES:
    // - Users CANNOT update their subscription_status (prevents self-upgrades)
    // - Users CANNOT update their id or timestamps
    // - Users CANNOT delete their records
    // - subscription_status should only be updated via admin functions or payment webhooks
    const migrationSQL = `
-- Create users table to track user information and subscription status
-- IMPORTANT: subscription_status uses 'base' (NOT 'free') for the free tier
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  subscription_status text DEFAULT 'base' CHECK (subscription_status IN ('base', 'standard', 'pro', 'lifetime')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Update existing table constraint if table already exists
-- Also migrate any 'free' values to 'base' for consistency
-- IMPORTANT: The subscription status must be 'base' (NOT 'free') for the free tier
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    -- Migrate any 'free' subscription_status values to 'base'
    -- This ensures consistency - we use 'base' not 'free' in the database
    UPDATE public.users 
    SET subscription_status = 'base', updated_at = now()
    WHERE subscription_status = 'free' OR subscription_status IS NULL;
    
    -- Drop existing constraint if it exists
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_subscription_status_check;
    -- Add new constraint with correct values (explicitly excludes 'free')
    ALTER TABLE public.users ADD CONSTRAINT users_subscription_status_check 
      CHECK (subscription_status IN ('base', 'standard', 'pro', 'lifetime'));
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for migration)
DROP POLICY IF EXISTS "Users can select their own record" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own record" ON public.users;
DROP POLICY IF EXISTS "Users can update their own record" ON public.users;
DROP POLICY IF EXISTS "Users cannot delete their record" ON public.users;

-- Policy: Users can read their own record only
CREATE POLICY "Users can select their own record"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can insert their own record only (with strict validation)
CREATE POLICY "Users can insert their own record"
ON public.users
FOR INSERT
WITH CHECK (
  auth.uid() = id 
  AND subscription_status = 'base'  -- Users can only create with 'base' status
  AND id = auth.uid()  -- Double-check id matches authenticated user
);

-- Policy: Users can update limited fields of their own record
-- SECURITY: Users CANNOT update subscription_status, id, or timestamps
-- Only email can be updated by users (though email sync happens via trigger)
CREATE POLICY "Users can update their own record"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND id = OLD.id  -- Prevent id changes
  AND subscription_status = OLD.subscription_status  -- Prevent subscription_status changes
  AND created_at = OLD.created_at  -- Prevent created_at changes
  -- updated_at is handled by trigger, but we prevent manual updates
);

-- Policy: Explicitly deny DELETE operations for all users
-- Users should not be able to delete their records (data integrity)
CREATE POLICY "Users cannot delete their record"
ON public.users
FOR DELETE
USING (false);  -- Always deny DELETE operations

-- Function to automatically create user record on signup
-- SECURITY: Only creates records with 'base' subscription_status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, subscription_status, created_at, updated_at)
  VALUES (NEW.id, COALESCE(NEW.email, ''), 'base', now(), now())
  ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email,
        updated_at = now()
    WHERE public.users.id = NEW.id;  -- Safety check
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to sync email updates from auth.users to public.users
-- SECURITY: Only updates email and updated_at, never subscription_status or id
CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS trigger AS $$
BEGIN
  UPDATE public.users
  SET email = COALESCE(NEW.email, ''),
      updated_at = now()
  WHERE id = NEW.id
    AND id = OLD.id;  -- Additional safety check
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync email updates
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.handle_user_email_update();

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);

-- Create trigger to automatically update updated_at timestamp
-- This ensures updated_at is always current and prevents manual manipulation
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to ensure user exists (can be called by users to create their own record)
-- Uses SECURITY DEFINER to bypass RLS for inserts
-- SECURITY: Validates that the user_id matches the authenticated user
CREATE OR REPLACE FUNCTION public.ensure_user_exists(user_id uuid, user_email text)
RETURNS void AS $$
BEGIN
  -- Security check: Ensure the user_id matches the authenticated user
  IF user_id IS NULL OR user_id != auth.uid() THEN
    RAISE EXCEPTION 'User ID does not match authenticated user';
  END IF;
  
  INSERT INTO public.users (id, email, subscription_status)
  VALUES (user_id, COALESCE(user_email, ''), 'base')
  ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email,
        updated_at = now()
    WHERE public.users.id = user_id;  -- Additional safety check
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

    // Supabase JS client doesn't support raw SQL execution
    // You need to run this in the Supabase SQL Editor
    return NextResponse.json({
      message: "Please run the migration SQL in your Supabase SQL Editor",
      sql: migrationSQL.trim(),
      instructions: [
        "1. Go to your Supabase Dashboard",
        "2. Navigate to SQL Editor",
        "3. Paste and run the SQL provided above",
        "4. This will create the users table, set up RLS policies, and create triggers to automatically sync user data",
      ],
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
