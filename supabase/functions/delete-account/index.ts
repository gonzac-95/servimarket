// ============================================================
// Edge Function: delete-account
// El usuario elimina su cuenta (requisito de Google Play).
// - Borra datos personales: tokens push, notificaciones,
//   credenciales MP, fotos/bio del prestador.
// - Anonimiza la fila de public.users (el historial de trabajos,
//   pagos y reseñas queda, sin datos personales).
// - Elimina el usuario de auth.users (no puede volver a loguearse).
//
// POST /functions/v1/delete-account
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

    const uid = user.id;

    // Datos personales accesorios
    await admin.from("push_tokens").delete().eq("user_id", uid);
    await admin.from("notifications").delete().eq("user_id", uid);

    // Si es prestador: credenciales MP fuera y perfil público vaciado
    const { data: provider } = await admin
      .from("providers")
      .select("id")
      .eq("user_id", uid)
      .maybeSingle();
    if (provider) {
      await admin.from("provider_mp_credentials").delete().eq("provider_id", provider.id);
      await admin.from("providers").update({
        bio: null,
        photos: [],
        price_list: [],
        service_zones: [],
        cuit_cuil: null,
        is_available: false,
        mp_user_id: null,
        mp_connected_at: null,
      }).eq("id", provider.id);
    }

    // Anonimizar el perfil: el historial de la otra parte queda íntegro
    const { error: anonErr } = await admin.from("users").update({
      name: "Usuario eliminado",
      email: `eliminado+${uid}@servimarket.invalid`,
      phone: null,
      avatar_url: null,
      lat: null,
      lng: null,
      is_blocked: true,
    }).eq("id", uid);
    if (anonErr) return json({ error: "anonymize_failed", detail: anonErr.message }, 500);

    // Borrar la identidad de auth (requiere que public.users ya no
    // tenga FK a auth.users — ver migración 20260704_account_deletion)
    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) return json({ error: "delete_failed", detail: delErr.message }, 500);

    return json({ ok: true });
  } catch (e) {
    console.error("delete-account error:", e);
    return json({ error: "internal_error", detail: String(e) }, 500);
  }
});
