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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the requester is a manager or admin
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: reviewer } = await supabaseAdmin
      .from("employees")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (!reviewer || !["admin", "manager"].includes(reviewer.role)) {
      return new Response(
        JSON.stringify({ error: "Only managers and admins can approve/decline leave" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { leave_request_id, action } = await req.json();

    if (!leave_request_id || !["approve", "decline"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "leave_request_id and action (approve|decline) are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the leave request
    const { data: request, error: fetchError } = await supabaseAdmin
      .from("leave_requests")
      .select("*")
      .eq("id", leave_request_id)
      .single();

    if (fetchError || !request) {
      return new Response(
        JSON.stringify({ error: "Leave request not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (request.status !== "pending") {
      return new Response(
        JSON.stringify({ error: `Cannot ${action} a request with status: ${request.status}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date().toISOString();
    const newStatus = action === "approve" ? "approved" : "declined";

    // Update the leave request
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("leave_requests")
      .update({
        status: newStatus,
        reviewed_by: reviewer.id,
        reviewed_at: now,
      })
      .eq("id", leave_request_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // If approved, create a negative ledger entry (idempotent: skip if already exists)
    if (action === "approve" && request.hours) {
      const { data: existingLedger } = await supabaseAdmin
        .from("leave_ledger")
        .select("id")
        .eq("reference_id", request.id)
        .eq("reason", "approved_leave")
        .maybeSingle();

      if (!existingLedger) {
        await supabaseAdmin.from("leave_ledger").insert({
          employee_id: request.employee_id,
          leave_type_id: request.leave_type_id,
          delta_hours: -Math.abs(Number(request.hours)),
          reason: "approved_leave",
          reference_id: request.id,
          effective_date: request.start_date,
        });
      }
    }

    // Send push notification to the employee
    const { data: tokens } = await supabaseAdmin
      .from("push_tokens")
      .select("token")
      .eq("employee_id", request.employee_id);

    if (tokens?.length) {
      const messages = tokens.map((t: { token: string }) => ({
        to: t.token,
        sound: "default",
        title: `Leave ${newStatus === "approved" ? "Approved" : "Declined"}`,
        body: `Your leave request has been ${newStatus}.`,
        data: { screen: "LeaveScreen" },
      }));

      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messages),
      }).catch(() => {}); // Non-critical, don't fail the request
    }

    return new Response(
      JSON.stringify({ request: updated }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
