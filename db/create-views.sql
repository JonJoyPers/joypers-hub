-- Leave balances view (run after migrations)
-- Uses security_invoker so RLS on leave_ledger is respected
CREATE OR REPLACE VIEW leave_balances
  WITH (security_invoker = true)
AS
SELECT
  employee_id,
  leave_type_id,
  SUM(delta_hours::numeric) as balance
FROM leave_ledger
GROUP BY employee_id, leave_type_id;
