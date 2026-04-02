import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { timesheet_ids, notes, period_start, period_end } = await req.json();

  if (!timesheet_ids?.length) {
    return NextResponse.json({ error: "timesheet_ids array is required" }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get the current user
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

  // Verify manager/admin
  const { data: emp } = await supabaseAdmin
    .from("employees")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!emp || !["admin", "manager"].includes(emp.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  // Fetch the timesheets to export
  const { data: sheets, error: fetchErr } = await supabaseAdmin
    .from("timesheets")
    .select("*, employee:employees(name, title, pay_rate, pay_type)")
    .in("id", timesheet_ids)
    .order("date", { ascending: true });

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!sheets?.length) {
    return NextResponse.json({ error: "No timesheets found" }, { status: 404 });
  }

  // Calculate totals
  const totalMinutes = sheets.reduce((s, t) => s + (t.worked_minutes || 0), 0);
  const totalAmount = sheets.reduce((s, t) => s + parseFloat(t.pay_amount || "0"), 0);
  const employeeIds = new Set(sheets.map((t) => t.employee_id));

  // Create export batch
  const { data: batch, error: batchErr } = await supabaseAdmin
    .from("export_batches")
    .insert({
      period_start: period_start || sheets[0].date,
      period_end: period_end || sheets[sheets.length - 1].date,
      total_hours: Math.round((totalMinutes / 60) * 100) / 100,
      total_amount: Math.round(totalAmount * 100) / 100,
      employee_count: employeeIds.size,
      exported_by: user.id,
      format: "csv",
      notes: notes || null,
    })
    .select()
    .single();

  if (batchErr) {
    return NextResponse.json({ error: batchErr.message }, { status: 500 });
  }

  // Mark timesheets as exported
  const now = new Date().toISOString();
  await supabaseAdmin
    .from("timesheets")
    .update({
      status: "exported",
      export_batch_id: batch.id,
      exported_at: now,
      updated_at: now,
    })
    .in("id", timesheet_ids);

  return NextResponse.json({ batch, timesheets: sheets });
}
