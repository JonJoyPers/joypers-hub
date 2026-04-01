-- Use pgcrypto (enabled by default in Supabase) to verify bcrypt PINs
-- in compiled C instead of slow pure-JS bcrypt in Deno edge functions.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION verify_employee_pin(p_pin text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_emp record;
BEGIN
  SELECT id, name, first_name, email, role, department, title, worker_type, avatar_url
  INTO v_emp
  FROM employees
  WHERE is_active = true
    AND pin IS NOT NULL
    AND pin = crypt(p_pin, pin)
  LIMIT 1;

  IF v_emp IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN row_to_json(v_emp);
END;
$$;
