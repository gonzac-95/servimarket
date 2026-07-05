// ============================================================
// Edge Function: mp-oauth-start
// El prestador llama acá desde Settings → genera state firmado +
// inserta en oauth_states (single-use) → devuelve la URL de auth.
//
// POST /functions/v1/mp-oauth-start
// Auth: Bearer <user JWT>
// Response: { url: string }
// ============================================================

// @ts-ignore deno
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore deno
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { randomNonce, signState } from "../_shared/state.ts";

// @ts-ignore deno
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// @ts-ignore deno
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// @ts-ignore deno
const MP_CLIENT_ID = Deno.env.get("MP_CLIENT_ID")!;
// @ts-ignore deno
const MP_OAUTH_REDIRECT_URI = Deno.env.get("MP_OAUTH_REDIRECT_URI")!;
// @ts-ignore deno
const MP_OAUTH_STATE_SECRET = Deno.env.get("MP_OAUTH_STATE_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "missing_auth" }, 401);
    const jwt = authHeader.replace(/^Bearer\s+/i, "");

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: { user }, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !user) return json({ error: "invalid_token" }, 401);

    // Buscar el provider del usuario
    const { data: provider, error: provErr } = await admin
      .from("providers")
      .select("id, user_id")
      .eq("user_id", user.id)
      .single();

    if (provErr || !provider) return json({ error: "not_a_provider" }, 403);

    // Generar state firmado + persistir para single-use
    const payload = {
      provider_id: provider.id,
      ts: Date.now(),
      nonce: randomNonce(),
    };
    const state = await signState(payload, MP_OAUTH_STATE_SECRET);

    const { error: insErr } = await admin.from("oauth_states").insert({
      state,
      provider_id: provider.id,
    });
    if (insErr) {
      console.error("oauth_states insert failed:", insErr);
      return json({ error: "state_insert_failed" }, 500);
    }

    const params = new URLSearchParams({
      client_id: MP_CLIENT_ID,
      response_type: "code",
      platform_id: "mp",
      redirect_uri: MP_OAUTH_REDIRECT_URI,
      state,
    });

    return json({
      url: `https://auth.mercadopago.com.ar/authorization?${params.toString()}`,
    });
  } catch (e) {
    console.error("mp-oauth-start error:", e);
    return json({ error: "internal_error", detail: String(e) }, 500);
  }
});
