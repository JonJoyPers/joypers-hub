import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin or manager
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: callerEmployee } = await supabaseAdmin
      .from("employees")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (!callerEmployee || !["admin", "manager"].includes(callerEmployee.role)) {
      return new Response(
        JSON.stringify({ error: "Only admins and managers can manage employee auth" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const { employeeId, action, email } = await req.json();

    if (!employeeId || !action) {
      return new Response(
        JSON.stringify({ error: "employeeId and action are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["disable", "enable", "reset-password", "update-email"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "action must be 'disable', 'enable', 'reset-password', or 'update-email'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "disable") {
      // Ban the auth user and set employee as inactive
      const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(employeeId, {
        ban_duration: "876600h", // ~100 years
      });
      if (banError) {
        return new Response(
          JSON.stringify({ error: `Failed to ban user: ${banError.message}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: updateError } = await supabaseAdmin
        .from("employees")
        .update({ is_active: false })
        .eq("id", employeeId);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: `Failed to deactivate employee: ${updateError.message}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Employee archived" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "enable") {
      // Unban the auth user and set employee as active
      const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(employeeId, {
        ban_duration: "none",
      });
      if (unbanError) {
        return new Response(
          JSON.stringify({ error: `Failed to unban user: ${unbanError.message}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: updateError } = await supabaseAdmin
        .from("employees")
        .update({ is_active: true })
        .eq("id", employeeId);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: `Failed to reactivate employee: ${updateError.message}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Employee restored" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "update-email") {
      if (!email) {
        return new Response(
          JSON.stringify({ error: "email is required for update-email action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(employeeId, {
        email,
      });

      if (emailError) {
        return new Response(
          JSON.stringify({ error: `Failed to update auth email: ${emailError.message}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Auth email updated" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reset-password") {
      const DEFAULT_PASSWORD = "JoyPers2024!";

      const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(employeeId, {
        password: DEFAULT_PASSWORD,
        user_metadata: { must_change_password: true },
      });

      if (resetError) {
        return new Response(
          JSON.stringify({ error: `Failed to reset password: ${resetError.message}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Password reset to default" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
