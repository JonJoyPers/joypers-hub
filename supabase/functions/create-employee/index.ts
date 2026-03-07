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
        JSON.stringify({ error: "Only admins and managers can create employees" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { name, email, role, department, title, worker_type } = await req.json();

    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: "Name and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const DEFAULT_PASSWORD = "JoyPers2024!";

    // Step 1: Create Supabase Auth user with must_change_password flag
    const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name,
        role: role || "employee",
        must_change_password: true,
      },
    });

    if (createError) {
      return new Response(
        JSON.stringify({ error: `Auth user creation failed: ${createError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Insert employee record with matching UUID
    const firstName = name.trim().split(" ")[0];
    const { data: employee, error: insertError } = await supabaseAdmin
      .from("employees")
      .insert({
        id: authUser.user.id,
        name: name.trim(),
        first_name: firstName,
        email,
        role: role || "employee",
        department: department || null,
        title: title || null,
        worker_type: worker_type || "in_store",
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      // Rollback: delete the auth user if DB insert fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return new Response(
        JSON.stringify({ error: `Employee record creation failed: ${insertError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ employee }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
