import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const VALID_TYPES = [
  "clock_in",
  "clock_out",
  "break_start",
  "break_end",
  "lunch_start",
  "lunch_end",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { employee_id, type, timestamp, location, action } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── "status" action: return today's punches for the employee ──
    if (action === "status") {
      if (!employee_id) {
        return new Response(
          JSON.stringify({ error: "employee_id is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: punches, error } = await supabaseAdmin
        .from("punches")
        .select("*")
        .eq("employee_id", employee_id)
        .gte("timestamp", todayStart.toISOString())
        .order("timestamp", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ punches: punches || [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── "punch" action (default): record a punch ──
    if (!employee_id || !type) {
      return new Response(
        JSON.stringify({ error: "employee_id and type are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!VALID_TYPES.includes(type)) {
      return new Response(
        JSON.stringify({ error: `Invalid punch type: ${type}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify employee exists and is active
    const { data: emp, error: empError } = await supabaseAdmin
      .from("employees")
      .select("id, is_active")
      .eq("id", employee_id)
      .single();

    if (empError || !emp?.is_active) {
      return new Response(
        JSON.stringify({ error: "Employee not found or inactive" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const row: Record<string, unknown> = {
      employee_id,
      type,
      timestamp: timestamp || new Date().toISOString(),
    };

    if (location?.latitude && location?.longitude) {
      row.location = `(${location.longitude},${location.latitude})`;
    }

    const { data: punch, error: insertError } = await supabaseAdmin
      .from("punches")
      .insert(row)
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ punch }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
