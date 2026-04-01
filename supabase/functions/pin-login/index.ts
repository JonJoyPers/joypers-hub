import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Create a JWT using Web Crypto (built into Deno — no external deps)
function base64url(data: ArrayBuffer | string): string {
  const str = typeof data === "string"
    ? btoa(data)
    : btoa(String.fromCharCode(...new Uint8Array(data)));
  return str.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function signJwt(
  payload: Record<string, unknown>,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(`${header}.${body}`));
  return `${header}.${body}.${base64url(sig)}`;
}

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

    // Use PostgreSQL's pgcrypto to verify the bcrypt PIN in compiled C
    // (much faster than the pure-JS bcrypt that runs in Deno edge functions)
    const { data: matchedEmployee, error } = await supabaseAdmin
      .rpc("verify_employee_pin", { p_pin: pin });

    if (error) throw error;

    if (!matchedEmployee) {
      return new Response(
        JSON.stringify({ error: "PIN not recognized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Employee ID = Auth user ID (set at creation time in create-employee).
    // Sign a JWT locally instead of the slow generateLink + verifyOtp round-trips.
    const jwtSecret = Deno.env.get("APP_JWT_SECRET");
    if (!jwtSecret) {
      throw new Error("APP_JWT_SECRET not configured");
    }

    const now = Math.floor(Date.now() / 1000);
    const accessToken = await signJwt(
      {
        aud: "authenticated",
        exp: now + 3600,
        sub: matchedEmployee.id,
        email: matchedEmployee.email,
        role: "authenticated",
        iat: now,
      },
      jwtSecret
    );

    const user = {
      id: matchedEmployee.id,
      name: matchedEmployee.name,
      firstName: matchedEmployee.first_name || matchedEmployee.name.split(" ")[0],
      email: matchedEmployee.email,
      role: matchedEmployee.role,
      department: matchedEmployee.department,
      title: matchedEmployee.title,
      avatar: matchedEmployee.avatar_url,
      tags: matchedEmployee.worker_type === "remote" || matchedEmployee.worker_type === "both" ? ["Remote"] : [],
    };

    return new Response(
      JSON.stringify({
        user,
        session: {
          access_token: accessToken,
          refresh_token: null,
          expires_in: 3600,
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
