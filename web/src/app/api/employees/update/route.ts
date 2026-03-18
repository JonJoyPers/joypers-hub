import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { employeeId, update } = await req.json();

  if (!employeeId || !update) {
    return NextResponse.json({ error: "Missing employeeId or update" }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Update employees table — stamp updated_at so Deputy sync won't overwrite hub edits
  const { error } = await supabaseAdmin
    .from("employees")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", employeeId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sync email and name to Supabase Auth user
  const authUpdate: Record<string, unknown> = {};
  if (update.email) authUpdate.email = update.email;
  if (update.name) authUpdate.user_metadata = { name: update.name, display_name: update.name };

  if (Object.keys(authUpdate).length > 0) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      employeeId,
      authUpdate
    );
    if (authError) {
      return NextResponse.json({ error: `Saved but auth sync failed: ${authError.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
