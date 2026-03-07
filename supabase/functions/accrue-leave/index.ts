import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Leave Accrual Edge Function
 *
 * Designed to be called on a schedule (e.g., biweekly on payday).
 * For each active employee and leave type, inserts a positive
 * accrual entry into the leave_ledger.
 *
 * Schedule via Supabase cron:
 *   SELECT cron.schedule('accrue-leave', '0 0 1,15 * *',
 *     $$SELECT net.http_post(
 *       url:='https://your-project.supabase.co/functions/v1/accrue-leave',
 *       headers:='{"Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb
 *     )$$
 *   );
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all active employees
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("id")
      .eq("is_active", true);

    if (empError) throw empError;

    // Fetch all leave types with accrual rates
    const { data: leaveTypes, error: ltError } = await supabase
      .from("leave_types")
      .select("id, name, accrual_rate, max_balance");

    if (ltError) throw ltError;

    const today = new Date().toISOString().split("T")[0];
    let accrued = 0;
    let skipped = 0;
    let alreadyRan = 0;

    for (const employee of employees || []) {
      for (const lt of leaveTypes || []) {
        if (!lt.accrual_rate || Number(lt.accrual_rate) <= 0) continue;

        // Idempotency: check if accrual already ran for this employee/type/date
        const { data: existingAccrual } = await supabase
          .from("leave_ledger")
          .select("id")
          .eq("employee_id", employee.id)
          .eq("leave_type_id", lt.id)
          .eq("reason", "accrual")
          .eq("effective_date", today)
          .maybeSingle();

        if (existingAccrual) {
          alreadyRan++;
          continue;
        }

        // Check current balance against max
        if (lt.max_balance) {
          const { data: balanceData } = await supabase
            .from("leave_ledger")
            .select("delta_hours")
            .eq("employee_id", employee.id)
            .eq("leave_type_id", lt.id);

          const currentBalance = (balanceData || []).reduce(
            (sum: number, row: { delta_hours: string }) => sum + Number(row.delta_hours),
            0
          );

          if (currentBalance >= Number(lt.max_balance)) {
            skipped++;
            continue;
          }
        }

        // Insert accrual entry
        await supabase.from("leave_ledger").insert({
          employee_id: employee.id,
          leave_type_id: lt.id,
          delta_hours: lt.accrual_rate,
          reason: "accrual",
          effective_date: today,
        });

        accrued++;
      }
    }

    return new Response(
      JSON.stringify({
        message: `Accrual complete: ${accrued} created, ${skipped} skipped (at max), ${alreadyRan} skipped (already ran today)`,
        date: today,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
