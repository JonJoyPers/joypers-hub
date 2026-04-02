import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { timesheet_id, clock_in, clock_out, break_minutes, lunch_minutes, note } = await req.json();

  if (!timesheet_id) {
    return NextResponse.json({ error: "timesheet_id is required" }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify auth
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
    .select("role, name")
    .eq("id", user.id)
    .single();

  if (!emp || !["admin", "manager"].includes(emp.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  // Fetch current timesheet
  const { data: ts, error: fetchErr } = await supabaseAdmin
    .from("timesheets")
    .select("*")
    .eq("id", timesheet_id)
    .single();

  if (fetchErr || !ts) {
    return NextResponse.json({ error: "Timesheet not found" }, { status: 404 });
  }

  if (ts.status === "exported") {
    return NextResponse.json({ error: "Cannot adjust exported timesheets" }, { status: 400 });
  }

  // Build the update
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (clock_in !== undefined) update.clock_in = clock_in;
  if (clock_out !== undefined) update.clock_out = clock_out;
  if (break_minutes !== undefined) update.break_minutes = Math.max(0, parseInt(break_minutes) || 0);
  if (lunch_minutes !== undefined) update.lunch_minutes = Math.max(0, parseInt(lunch_minutes) || 0);

  // Recalculate worked_minutes from clock_in/out minus lunch
  const finalClockIn = update.clock_in ?? ts.clock_in;
  const finalClockOut = update.clock_out ?? ts.clock_out;
  const finalLunch = (update.lunch_minutes ?? ts.lunch_minutes) as number;

  if (finalClockIn && finalClockOut) {
    const inMs = new Date(finalClockIn as string).getTime();
    const outMs = new Date(finalClockOut as string).getTime();
    if (outMs > inMs) {
      const totalMinutes = (outMs - inMs) / 60000;
      // Worked = total time minus lunch (breaks are paid, so not subtracted)
      update.worked_minutes = Math.round(totalMinutes - finalLunch);
    }
  }

  // Clear open punch flag if we now have both in/out
  if (finalClockIn && finalClockOut) {
    update.has_open_punch = false;
  }

  // Recalculate pay if rate exists
  const { data: empData } = await supabaseAdmin
    .from("employees")
    .select("pay_rate")
    .eq("id", ts.employee_id)
    .single();

  const payRate = empData?.pay_rate ? parseFloat(empData.pay_rate) : null;
  if (payRate && update.worked_minutes) {
    update.pay_rate_snapshot = payRate;
    update.pay_amount = Math.round(payRate * ((update.worked_minutes as number) / 60) * 100) / 100;
  }

  // Append adjustment note
  const adjustNote = `Adjusted by ${emp.name} on ${new Date().toLocaleDateString()}`;
  const fullNote = note
    ? `${note} — ${adjustNote}`
    : ts.manager_note
      ? `${ts.manager_note}\n${adjustNote}`
      : adjustNote;
  update.manager_note = fullNote;

  const { data: updated, error: updateErr } = await supabaseAdmin
    .from("timesheets")
    .update(update)
    .eq("id", timesheet_id)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ timesheet: updated });
}
