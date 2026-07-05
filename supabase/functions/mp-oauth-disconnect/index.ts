// ============================================================
// Edge Function: mp-oauth-disconnect
// El prestador desconecta su cuenta MP. Borramos las credenciales
// y limpiamos mp_user_id del provider.
//
// POST /functions/v1/mp-oauth-disconnect
// Auth: Bearer <user JWT>
// ============================================================

// @ts-ignore deno
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore deno
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// @ts-ignore deno
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// @ts-ignore deno
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    // Verificar que el usuario es dueño del provider
    const { data: provider } = await admin
      .from("providers")
      .select("id, user_id")
      .eq("user_id", user.id)
      .single();

    if (!provider) return json({ error: "not_a_provider" }, 403);

    // Borrar credenciales y limpiar flag
    await admin.from("provider_mp_credentials").delete().eq("provider_id", provider.id);
    await admin.from("providers")
      .update({ mp_user_id: null, mp_connected_at: null })
      .eq("id", provider.id);

    return json({ ok: true });
  } catch (e) {
    console.error("mp-oauth-disconnect error:", e);
    return json({ error: "internal_error", detail: String(e) }, 500);
  }
});
