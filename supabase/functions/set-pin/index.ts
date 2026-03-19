import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { pin, employee_id } = await req.json();

    if (!employee_id) {
      return new Response(
        JSON.stringify({ error: "employee_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!pin || typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
      return new Response(
        JSON.stringify({ error: "PIN must be exactly 4 digits" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the caller is the employee or a manager/admin
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");

      // Skip auth check if using the service role key (admin call)
      const isServiceRole = token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (!isServiceRole) {
        const {
          data: { user },
        } = await supabaseAdmin.auth.getUser(token);

        if (!user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Allow if setting own PIN, or if caller is manager/admin
        if (user.id !== employee_id) {
          const { data: caller } = await supabaseAdmin
            .from("employees")
            .select("role")
            .eq("id", user.id)
            .single();

          if (!caller || !["admin", "manager"].includes(caller.role)) {
            return new Response(
              JSON.stringify({ error: "Not authorized to set PIN for this employee" }),
              {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        }
      }
    }

    // Hash the PIN with bcrypt
    const hashedPin = await bcrypt.hash(pin);

    // Save to employees table
    const { error } = await supabaseAdmin
      .from("employees")
      .update({ pin: hashedPin, updated_at: new Date().toISOString() })
      .eq("id", employee_id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
