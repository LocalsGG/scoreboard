#!/bin/bash

# Migration script to add element_positions column to scoreboards table
# This script uses Supabase CLI to execute the migration

MIGRATION_FILE="MIGRATION_add_element_positions.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "Error: Migration file $MIGRATION_FILE not found"
  exit 1
fi

echo "Running migration to add element_positions column..."
echo ""

# Check if supabase CLI is available
if command -v supabase &> /dev/null; then
  echo "Using Supabase CLI..."
  supabase db execute --file "$MIGRATION_FILE"
else
  echo "Supabase CLI not found. Please run the migration manually:"
  echo ""
  echo "1. Go to your Supabase Dashboard: https://supabase.com/dashboard"
  echo "2. Navigate to SQL Editor"
  echo "3. Copy and paste the contents of $MIGRATION_FILE"
  echo "4. Run the SQL"
  echo ""
  echo "Or install Supabase CLI: https://supabase.com/docs/guides/cli"
fi
