import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  employee_ids: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload: NotificationPayload = await req.json();
    const { employee_ids, title, body, data } = payload;

    if (!employee_ids?.length || !title || !body) {
      return new Response(
        JSON.stringify({ error: "employee_ids, title, and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch push tokens for the target employees
    const { data: tokens, error } = await supabase
      .from("push_tokens")
      .select("token")
      .in("employee_id", employee_ids);

    if (error) {
      throw error;
    }

    if (!tokens?.length) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No push tokens found for given employees" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Expo push messages
    const messages = tokens.map((t: { token: string }) => ({
      to: t.token,
      sound: "default",
      title,
      body,
      data: data || {},
    }));

    // Send via Expo Push API (batches of 100)
    let totalSent = 0;
    for (let i = 0; i < messages.length; i += 100) {
      const batch = messages.slice(i, i + 100);
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Expo push error:", errText);
      } else {
        totalSent += batch.length;
      }
    }

    return new Response(
      JSON.stringify({ sent: totalSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-notification error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
