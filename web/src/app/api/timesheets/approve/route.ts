import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { timesheet_ids, action, note } = await req.json();

  if (!timesheet_ids?.length || !["approve", "unapprove", "dispute"].includes(action)) {
    return NextResponse.json(
      { error: "timesheet_ids (array) and action (approve|unapprove|dispute) are required" },
      { status: 400 }
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get the current user from the auth header
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify manager/admin role
  const { data: emp } = await supabaseAdmin
    .from("employees")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!emp || !["admin", "manager"].includes(emp.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const results: { id: number; status: string; error?: string }[] = [];

  for (const id of timesheet_ids) {
    const { data: ts, error: fetchErr } = await supabaseAdmin
      .from("timesheets")
      .select("id, status, employee_id, worked_minutes")
      .eq("id", id)
      .single();

    if (fetchErr || !ts) {
      results.push({ id, status: "error", error: "Not found" });
      continue;
    }

    if (action === "approve") {
      if (ts.status === "exported") {
        results.push({ id, status: "error", error: "Already exported" });
        continue;
      }

      // Snapshot pay rate at approval time
      const { data: empData } = await supabaseAdmin
        .from("employees")
        .select("pay_rate, pay_type")
        .eq("id", ts.employee_id)
        .single();

      const payRate = empData?.pay_rate ? parseFloat(empData.pay_rate) : null;
      const payAmount = payRate && ts.worked_minutes
        ? Math.round(payRate * (ts.worked_minutes / 60) * 100) / 100
        : null;

      const { error: updateErr } = await supabaseAdmin
        .from("timesheets")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          pay_rate_snapshot: payRate,
          pay_amount: payAmount,
          manager_note: note || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      results.push({ id, status: updateErr ? "error" : "approved", error: updateErr?.message });
    } else if (action === "unapprove") {
      if (ts.status === "exported") {
        results.push({ id, status: "error", error: "Cannot unapprove exported timesheet" });
        continue;
      }

      const { error: updateErr } = await supabaseAdmin
        .from("timesheets")
        .update({
          status: "pending",
          approved_by: null,
          approved_at: null,
          manager_note: note || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      results.push({ id, status: updateErr ? "error" : "pending", error: updateErr?.message });
    } else if (action === "dispute") {
      const { error: updateErr } = await supabaseAdmin
        .from("timesheets")
        .update({
          status: "disputed",
          manager_note: note || "Disputed by manager",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      results.push({ id, status: updateErr ? "error" : "disputed", error: updateErr?.message });
    }
  }

  return NextResponse.json({ results });
}
