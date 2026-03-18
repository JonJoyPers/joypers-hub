"use server";

import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(`Missing env: URL=${!!url}, KEY=${!!key}`);
  }

  return createClient(url, key);
}

export async function saveEmployee(
  employeeId: string,
  update: Record<string, unknown>
) {
  try {
    const supabaseAdmin = getAdminClient();

    // Update employees table — stamp updated_at so Deputy sync won't overwrite hub edits
    const { error, count } = await supabaseAdmin
      .from("employees")
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq("id", employeeId);

    if (error) {
      return { error: `DB update failed: ${error.message}` };
    }

    // Sync email and name to Supabase Auth user
    const authUpdate: Record<string, unknown> = {};
    if (update.email) authUpdate.email = update.email;
    if (update.name) authUpdate.user_metadata = { display_name: update.name };

    if (Object.keys(authUpdate).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        employeeId,
        authUpdate
      );
      if (authError) {
        return { error: `Saved but auth sync failed: ${authError.message}` };
      }
    }

    return { success: true, debug: { employeeId, fields: Object.keys(update), count } };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: `Server action error: ${msg}` };
  }
}
