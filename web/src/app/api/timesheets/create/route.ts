import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { employee_id, date, clock_in, clock_out, break_minutes, lunch_minutes, note } = await req.json();

  if (!employee_id || !date) {
    return NextResponse.json({ error: "employee_id and date are required" }, { status: 400 });
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
  const { data: actingEmp } = await supabaseAdmin
    .from("employees")
    .select("role, name")
    .eq("id", user.id)
    .single();

  if (!actingEmp || !["admin", "manager"].includes(actingEmp.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  // Get target employee's pay rate
  const { data: targetEmp, error: empErr } = await supabaseAdmin
    .from("employees")
    .select("id, is_active, pay_rate")
    .eq("id", employee_id)
    .single();

  if (empErr || !targetEmp?.is_active) {
    return NextResponse.json({ error: "Employee not found or inactive" }, { status: 404 });
  }

  // Calculate worked minutes — clock_in/clock_out are full ISO strings from client
  const breakMins = Math.max(0, parseInt(break_minutes) || 0);
  const lunchMins = Math.max(0, parseInt(lunch_minutes) || 0);
  let workedMinutes = 0;
  const clockInIso: string | null = clock_in || null;
  const clockOutIso: string | null = clock_out || null;

  if (clockInIso && clockOutIso) {
    const inMs = new Date(clockInIso).getTime();
    const outMs = new Date(clockOutIso).getTime();
    if (outMs > inMs) {
      const totalMinutes = (outMs - inMs) / 60000;
      workedMinutes = Math.round(totalMinutes - lunchMins); // breaks paid, lunch unpaid
    }
  }

  const payRate = targetEmp.pay_rate ? parseFloat(targetEmp.pay_rate) : null;
  const payAmount = payRate && workedMinutes > 0
    ? Math.round(payRate * (workedMinutes / 60) * 100) / 100
    : null;

  const createdNote = `Manually created by ${actingEmp.name} on ${new Date().toLocaleDateString()}`;
  const fullNote = note ? `${note} — ${createdNote}` : createdNote;

  // Upsert — if a timesheet already exists for this employee+date, update it
  const { data: created, error: insertErr } = await supabaseAdmin
    .from("timesheets")
    .upsert({
      employee_id,
      date,
      clock_in: clockInIso,
      clock_out: clockOutIso,
      worked_minutes: workedMinutes,
      break_minutes: breakMins,
      lunch_minutes: lunchMins,
      has_open_punch: false,
      status: "pending",
      pay_rate_snapshot: payRate,
      pay_amount: payAmount,
      manager_note: fullNote,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "employee_id,date",
    })
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ timesheet: created });
}
