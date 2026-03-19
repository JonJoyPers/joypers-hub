-- Add pay fields to employees
CREATE TYPE pay_type AS ENUM ('hourly', 'salary');
ALTER TABLE employees ADD COLUMN pay_rate numeric;
ALTER TABLE employees ADD COLUMN pay_type pay_type DEFAULT 'hourly';

-- Employee availability (weekly schedule preferences)
CREATE TABLE employee_availability (
  id serial PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES employees(id),
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time,
  end_time time,
  is_available boolean NOT NULL DEFAULT true
);

ALTER TABLE employee_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read availability"
  ON employee_availability FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can manage availability"
  ON employee_availability FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    OR employee_id = auth.uid()
  );

-- Employee documents (onboarding / HR)
CREATE TYPE doc_status AS ENUM ('not_sent', 'sent', 'completed');

CREATE TABLE employee_documents (
  id serial PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES employees(id),
  doc_type text NOT NULL,
  label text NOT NULL,
  status doc_status NOT NULL DEFAULT 'not_sent',
  sent_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read documents"
  ON employee_documents FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can manage documents"
  ON employee_documents FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );
