import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { pin } = await req.json();
    if (!pin || typeof pin !== "string" || pin.length !== 4) {
      return new Response(
        JSON.stringify({ error: "A 4-digit PIN is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all active employees with PINs
    const { data: employees, error } = await supabaseAdmin
      .from("employees")
      .select("id, name, first_name, email, role, department, title, worker_type, avatar_url, pin")
      .eq("is_active", true)
      .not("pin", "is", null);

    if (error) throw error;

    // Find matching employee by comparing hashed PIN
    let matchedEmployee = null;
    for (const emp of employees || []) {
      if (!emp.pin) continue;
      const matches = await bcrypt.compare(pin, emp.pin);
      if (matches) {
        matchedEmployee = emp;
        break;
      }
    }

    if (!matchedEmployee) {
      return new Response(
        JSON.stringify({ error: "PIN not recognized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a magic link and extract the token to create a real session
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: matchedEmployee.email,
    });

    if (linkError || !linkData) {
      throw new Error(linkError?.message || "Failed to generate auth link");
    }

    // Extract the token hash from the generated link and verify OTP to get a session
    const token = linkData.properties?.hashed_token;
    if (!token) {
      throw new Error("Failed to extract auth token");
    }

    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.verifyOtp({
      type: "magiclink",
      token_hash: token,
    });

    if (sessionError || !sessionData.session) {
      throw new Error(sessionError?.message || "Failed to create session");
    }

    const user = {
      id: matchedEmployee.id,
      name: matchedEmployee.name,
      firstName: matchedEmployee.first_name || matchedEmployee.name.split(" ")[0],
      email: matchedEmployee.email,
      role: matchedEmployee.role,
      department: matchedEmployee.department,
      title: matchedEmployee.title,
      avatar: matchedEmployee.avatar_url,
      tags: matchedEmployee.worker_type === "remote" ? ["Remote"] : [],
    };

    return new Response(
      JSON.stringify({
        user,
        session: {
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
          expires_in: sessionData.session.expires_in,
        },
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
