CREATE TABLE store_closures (
  id serial PRIMARY KEY,
  location_id integer REFERENCES locations(id),
  date date NOT NULL,
  reason text NOT NULL,
  created_by uuid REFERENCES employees(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(location_id, date)
);

-- RLS
ALTER TABLE store_closures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view closures"
  ON store_closures FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage closures"
  ON store_closures FOR ALL
  TO authenticated
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());
