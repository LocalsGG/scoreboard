import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Migration endpoint to add element_positions column
 * This can be called once to set up the database schema
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

    // Use RPC to execute the migration
    // Note: This requires a database function to be created first
    // For now, we'll return instructions
    const migrationSQL = `
      ALTER TABLE public.scoreboards 
      ADD COLUMN IF NOT EXISTS element_positions jsonb DEFAULT '{
        "title": {"x": 720, "y": 310},
        "a_side": {"x": 100, "y": 450},
        "b_side": {"x": 1200, "y": 450},
        "a_score": {"x": 540, "y": 465},
        "b_score": {"x": 910, "y": 465}
      }'::jsonb;
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
