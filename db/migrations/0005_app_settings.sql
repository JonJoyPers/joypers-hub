CREATE TABLE app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage settings"
  ON app_settings FOR ALL
  TO authenticated
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());
