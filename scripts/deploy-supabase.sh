#!/bin/bash
set -euo pipefail

# Joy-Per's Hub — Supabase Deployment Script
# Usage: ./scripts/deploy-supabase.sh [--functions-only | --db-only]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== Joy-Per's Hub — Supabase Deployment ==="
echo ""

# Check prerequisites
if ! command -v supabase &> /dev/null; then
  echo "Error: Supabase CLI not found. Install with: brew install supabase/tap/supabase"
  exit 1
fi

MODE="${1:-all}"

# --- Database Migrations ---
if [[ "$MODE" == "all" || "$MODE" == "--db-only" ]]; then
  echo "--- Running Database Migrations ---"
  cd "$PROJECT_ROOT/db"

  if [ ! -f .env ]; then
    echo "Error: db/.env not found. Copy .env.example and fill in DATABASE_URL."
    exit 1
  fi

  npm run migrate
  echo "Migrations complete."
  echo ""

  echo "--- Applying RLS Policies ---"
  # RLS policies need to be applied via psql or Supabase SQL editor
  echo "NOTE: Run the following SQL files manually in Supabase SQL Editor:"
  echo "  1. db/rls-policies.sql"
  echo "  2. db/create-views.sql"
  echo ""
fi

# --- Edge Functions ---
if [[ "$MODE" == "all" || "$MODE" == "--functions-only" ]]; then
  echo "--- Deploying Edge Functions ---"
  cd "$PROJECT_ROOT"

  FUNCTIONS=(
    "pin-login"
    "approve-leave"
    "accrue-leave"
    "create-employee"
    "manage-employee-auth"
  )

  for fn in "${FUNCTIONS[@]}"; do
    echo "  Deploying: $fn"
    supabase functions deploy "$fn" --no-verify-jwt 2>/dev/null || {
      echo "  Warning: Failed to deploy $fn (is supabase CLI linked to your project?)"
    }
  done

  echo ""
  echo "Edge functions deployed."
  echo ""
fi

echo "--- Post-Deployment Checklist ---"
echo "  [ ] Verify edge functions at: supabase dashboard > Edge Functions"
echo "  [ ] Run RLS policies SQL in SQL Editor"
echo "  [ ] Run create-views.sql in SQL Editor"
echo "  [ ] Set up cron for leave accrual:"
echo "      SELECT cron.schedule('accrue-leave', '0 0 1,15 * *',"
echo "        \$\$SELECT net.http_post("
echo "          url:='<SUPABASE_URL>/functions/v1/accrue-leave',"
echo "          headers:='{\"Authorization\": \"Bearer <SERVICE_ROLE_KEY>\"}' ::jsonb"
echo "        )\$\$"
echo "      );"
echo ""
echo "=== Deployment Complete ==="
