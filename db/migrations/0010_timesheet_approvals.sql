-- ============================================================
-- Migration 0010: Timesheet approvals, export batches, rebuild function
-- ============================================================

-- ── Enums ──
CREATE TYPE timesheet_status AS ENUM ('pending', 'approved', 'disputed', 'exported');

-- ── Export batches (must exist before timesheets FK) ──
CREATE TABLE export_batches (
  id SERIAL PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_hours NUMERIC,
  total_amount NUMERIC,
  employee_count INTEGER,
  exported_by UUID REFERENCES employees(id),
  exported_at TIMESTAMPTZ DEFAULT now(),
  format TEXT,
  notes TEXT
);

-- ── Timesheets ──
CREATE TABLE timesheets (
  id SERIAL PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id),
  date DATE NOT NULL,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  worked_minutes INTEGER DEFAULT 0,
  break_minutes INTEGER DEFAULT 0,
  lunch_minutes INTEGER DEFAULT 0,
  has_open_punch BOOLEAN DEFAULT false,
  status timesheet_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMPTZ,
  manager_note TEXT,
  employee_note TEXT,
  pay_rate_snapshot NUMERIC,
  pay_amount NUMERIC,
  export_batch_id INTEGER REFERENCES export_batches(id),
  exported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, date)
);

CREATE INDEX idx_timesheets_employee_date ON timesheets(employee_id, date);
CREATE INDEX idx_timesheets_status ON timesheets(status);
CREATE INDEX idx_timesheets_date ON timesheets(date);

-- ── RLS ──
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own timesheets" ON timesheets
  FOR SELECT USING (employee_id = auth.uid());
CREATE POLICY "Managers can read all timesheets" ON timesheets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );
CREATE POLICY "Managers can update timesheets" ON timesheets
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );
CREATE POLICY "Service role can insert timesheets" ON timesheets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Managers can read export batches" ON export_batches
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );
CREATE POLICY "Managers can create export batches" ON export_batches
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- ============================================================
-- rebuild_timesheets: Aggregate punches into timesheet rows
-- Only updates numeric fields for 'pending' timesheets (won't overwrite approved ones)
-- ============================================================
CREATE OR REPLACE FUNCTION rebuild_timesheets(p_start DATE, p_end DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rec RECORD;
  v_count INTEGER := 0;
  v_worked_ms BIGINT;
  v_break_ms BIGINT;
  v_lunch_ms BIGINT;
  v_active_start TIMESTAMPTZ;
  v_break_start TIMESTAMPTZ;
  v_lunch_start TIMESTAMPTZ;
  v_clock_in TIMESTAMPTZ;
  v_clock_out TIMESTAMPTZ;
  v_has_open BOOLEAN;
  v_punch RECORD;
  v_pay_rate NUMERIC;
  v_pay_type TEXT;
BEGIN
  -- Loop through each (employee_id, date) that has punches in the range
  FOR v_rec IN
    SELECT DISTINCT
      p.employee_id,
      (p.timestamp AT TIME ZONE 'America/Chicago')::date AS punch_date
    FROM punches p
    WHERE (p.timestamp AT TIME ZONE 'America/Chicago')::date BETWEEN p_start AND p_end
  LOOP
    -- Skip if already approved/exported
    IF EXISTS (
      SELECT 1 FROM timesheets
      WHERE employee_id = v_rec.employee_id
        AND date = v_rec.punch_date
        AND status IN ('approved', 'exported')
    ) THEN
      CONTINUE;
    END IF;

    -- Calculate stats from punches
    v_worked_ms := 0;
    v_break_ms := 0;
    v_lunch_ms := 0;
    v_active_start := NULL;
    v_break_start := NULL;
    v_lunch_start := NULL;
    v_clock_in := NULL;
    v_clock_out := NULL;
    v_has_open := false;

    FOR v_punch IN
      SELECT type, timestamp
      FROM punches
      WHERE employee_id = v_rec.employee_id
        AND (timestamp AT TIME ZONE 'America/Chicago')::date = v_rec.punch_date
      ORDER BY timestamp ASC
    LOOP
      IF v_punch.type IN ('clock_in', 'break_end', 'lunch_end') THEN
        v_active_start := v_punch.timestamp;

        IF v_punch.type = 'clock_in' AND v_clock_in IS NULL THEN
          v_clock_in := v_punch.timestamp;
        END IF;

        IF v_punch.type = 'break_end' AND v_break_start IS NOT NULL THEN
          v_break_ms := v_break_ms + EXTRACT(EPOCH FROM (v_punch.timestamp - v_break_start)) * 1000;
          v_break_start := NULL;
        END IF;

        IF v_punch.type = 'lunch_end' AND v_lunch_start IS NOT NULL THEN
          v_lunch_ms := v_lunch_ms + EXTRACT(EPOCH FROM (v_punch.timestamp - v_lunch_start)) * 1000;
          v_lunch_start := NULL;
        END IF;

      ELSIF v_punch.type IN ('clock_out', 'break_start', 'lunch_start') THEN
        IF v_active_start IS NOT NULL THEN
          v_worked_ms := v_worked_ms + EXTRACT(EPOCH FROM (v_punch.timestamp - v_active_start)) * 1000;
          v_active_start := NULL;
        END IF;

        IF v_punch.type = 'clock_out' THEN
          v_clock_out := v_punch.timestamp;
        END IF;
        IF v_punch.type = 'break_start' THEN
          v_break_start := v_punch.timestamp;
        END IF;
        IF v_punch.type = 'lunch_start' THEN
          v_lunch_start := v_punch.timestamp;
        END IF;
      END IF;
    END LOOP;

    -- Detect open punches (clocked in but never clocked out)
    IF v_active_start IS NOT NULL OR v_break_start IS NOT NULL OR v_lunch_start IS NOT NULL THEN
      v_has_open := true;
    END IF;

    -- Get pay rate
    SELECT pay_rate, pay_type::text INTO v_pay_rate, v_pay_type
    FROM employees WHERE id = v_rec.employee_id;

    -- Upsert
    INSERT INTO timesheets (
      employee_id, date, clock_in, clock_out,
      worked_minutes, break_minutes, lunch_minutes,
      has_open_punch, pay_rate_snapshot, pay_amount,
      updated_at
    ) VALUES (
      v_rec.employee_id,
      v_rec.punch_date,
      v_clock_in,
      v_clock_out,
      (v_worked_ms / 60000)::integer,
      (v_break_ms / 60000)::integer,
      (v_lunch_ms / 60000)::integer,
      v_has_open,
      v_pay_rate,
      CASE WHEN v_pay_rate IS NOT NULL
        THEN ROUND(v_pay_rate * (v_worked_ms / 3600000.0), 2)
        ELSE NULL
      END,
      now()
    )
    ON CONFLICT (employee_id, date) DO UPDATE SET
      clock_in = EXCLUDED.clock_in,
      clock_out = EXCLUDED.clock_out,
      worked_minutes = EXCLUDED.worked_minutes,
      break_minutes = EXCLUDED.break_minutes,
      lunch_minutes = EXCLUDED.lunch_minutes,
      has_open_punch = EXCLUDED.has_open_punch,
      pay_rate_snapshot = EXCLUDED.pay_rate_snapshot,
      pay_amount = EXCLUDED.pay_amount,
      updated_at = now()
    WHERE timesheets.status = 'pending';

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ── Cron: rebuild timesheets every hour for the last 7 days ──
-- (pg_cron + pg_net are already enabled)
SELECT cron.schedule(
  'rebuild-timesheets-hourly',
  '0 * * * *',
  $$SELECT rebuild_timesheets(CURRENT_DATE - 7, CURRENT_DATE)$$
);
