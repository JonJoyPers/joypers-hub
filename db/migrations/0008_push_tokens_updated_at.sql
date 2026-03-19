-- Add updated_at column to push_tokens for stale-token tracking
ALTER TABLE push_tokens
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
