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
    const migrationSQL = `
-- Create users table to track user information and subscription status
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  subscription_status text DEFAULT 'base' CHECK (subscription_status IN ('base', 'pro', 'enterprise')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own record
CREATE POLICY "Users can select their own record"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can insert their own record
CREATE POLICY "Users can insert their own record"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own record (except id)
CREATE POLICY "Users can update their own record"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Function to automatically create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, subscription_status)
  VALUES (NEW.id, NEW.email, 'base')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
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
CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS trigger AS $$
BEGIN
  UPDATE public.users
  SET email = NEW.email, updated_at = now()
  WHERE id = NEW.id;
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

-- Function to ensure user exists (can be called by users to create their own record)
-- Uses SECURITY DEFINER to bypass RLS for inserts
CREATE OR REPLACE FUNCTION public.ensure_user_exists(user_id uuid, user_email text)
RETURNS void AS $$
BEGIN
  INSERT INTO public.users (id, email, subscription_status)
  VALUES (user_id, user_email, 'base')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
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
