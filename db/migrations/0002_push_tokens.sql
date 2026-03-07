-- Push notification token storage
-- Safe to run multiple times

CREATE TABLE IF NOT EXISTS push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  platform text,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'push_tokens_own') THEN
    CREATE POLICY push_tokens_own ON push_tokens
      FOR ALL USING (employee_id = auth.uid());
  END IF;
END $$;

-- Index for lookup by employee
CREATE INDEX IF NOT EXISTS idx_push_tokens_employee ON push_tokens(employee_id);
