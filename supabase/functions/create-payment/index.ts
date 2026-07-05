// ============================================================
// Edge Function: create-payment
// Crea una preferencia de MercadoPago para un job ya cotizado,
// usando el access_token del prestador (OAuth Marketplace) y
// aplicando marketplace_fee = comisión calculada por tramo.
//
// POST /functions/v1/create-payment
// Body: { job_id: string }
// Auth: Bearer <user JWT>
// ============================================================

// @ts-ignore deno
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore deno
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { calculateCommission, type CommissionTier } from "../_shared/commission.ts";

// @ts-ignore deno
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// @ts-ignore deno
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// @ts-ignore deno
const MP_CLIENT_ID = Deno.env.get("MP_CLIENT_ID") ?? "";
// @ts-ignore deno
const MP_CLIENT_SECRET = Deno.env.get("MP_CLIENT_SECRET") ?? "";
// @ts-ignore deno
const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN") ?? ""; // fallback platform token
// @ts-ignore deno
const APP_URL = Deno.env.get("APP_URL") ?? "http://localhost:5173";

// Si MP_USE_MARKETPLACE=true y el provider tiene OAuth conectado, usar split.
// Mientras MP no apruebe Marketplace, dejamos esto en false (Modelo A: cobro
// entra al platform, comisión se descuenta en la liquidación manual).
// @ts-ignore deno
const USE_MARKETPLACE = Deno.env.get("MP_USE_MARKETPLACE") === "true";

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

/**
 * Obtiene un access_token válido del prestador. Si el actual expira
 * en menos de 60 segundos, lo refresca usando el refresh_token.
 */
async function getProviderToken(
  admin: ReturnType<typeof createClient>,
  providerId: string,
): Promise<{ token: string; mp_user_id: string } | { error: string }> {
  const { data: cred } = await admin
    .from("provider_mp_credentials")
    .select("access_token, refresh_token, expires_at, mp_user_id")
    .eq("provider_id", providerId)
    .maybeSingle();

  if (!cred) return { error: "provider_not_connected" };

  const expiresAt = new Date(cred.expires_at).getTime();
  const expiresInMs = expiresAt - Date.now();

  // Token vigente con margen de 60s
  if (expiresInMs > 60_000) {
    return { token: cred.access_token, mp_user_id: cred.mp_user_id };
  }

  // Refresh
  const res = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: MP_CLIENT_ID,
      client_secret: MP_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: cred.refresh_token,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("refresh_token failed:", res.status, txt);
    return { error: "token_refresh_failed" };
  }

  const tokens = await res.json();
  const newExpires = new Date(Date.now() + Number(tokens.expires_in) * 1000).toISOString();

  await admin.from("provider_mp_credentials").update({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: newExpires,
  }).eq("provider_id", providerId);

  return { token: tokens.access_token, mp_user_id: String(tokens.user_id) };
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
    if (userErr || !user) return json({ error: "invalid_token", detail: userErr?.message }, 401);

    const { job_id } = await req.json().catch(() => ({}));
    if (!job_id) return json({ error: "missing_job_id" }, 400);

    const { data: job, error: jobErr } = await admin
      .from("jobs")
      .select("id, client_id, provider_id, price, status, description, category")
      .eq("id", job_id)
      .single();

    if (jobErr || !job) return json({ error: "job_not_found" }, 404);
    if (job.client_id !== user.id) return json({ error: "only_client_can_pay" }, 403);
    if (!job.provider_id) return json({ error: "job_has_no_provider" }, 400);
    if (!job.price || job.price <= 0) return json({ error: "job_has_no_price" }, 400);
    if (!["accepted", "in_progress"].includes(job.status)) {
      return json({ error: "job_not_payable", status: job.status }, 400);
    }

    // Evita duplicar payments aprobados/pendientes para el mismo job
    const { data: existing } = await admin
      .from("payments")
      .select("id, status, checkout_url")
      .eq("job_id", job_id)
      .in("status", ["pending", "approved"])
      .maybeSingle();
    if (existing?.status === "approved") return json({ error: "already_paid" }, 409);
    if (existing?.checkout_url) {
      return json({ payment_id: existing.id, checkout_url: existing.checkout_url, reused: true });
    }

    // Tramos vigentes
    const { data: cfg, error: cfgErr } = await admin
      .from("app_config")
      .select("value")
      .eq("key", "commission_tiers")
      .single();
    if (cfgErr || !cfg) return json({ error: "commission_config_missing" }, 500);

    const tiers = cfg.value as CommissionTier[];
    const breakdown = calculateCommission(Number(job.price), tiers);

    // Decidir si usar OAuth Marketplace (cuando MP lo apruebe) o el platform token (Modelo A).
    // Por defecto: Modelo A — el cobro entra a la cuenta del platform y la comisión
    // se registra para liquidación manual al prestador.
    let mpToken = MP_ACCESS_TOKEN;
    let useMarketplaceFee = false;
    let providerMpUserId: string | null = null;

    if (USE_MARKETPLACE) {
      const tokenResult = await getProviderToken(admin, job.provider_id);
      if ("error" in tokenResult) {
        return json({
          error: tokenResult.error,
          message: tokenResult.error === "provider_not_connected"
            ? "El prestador todavía no conectó su cuenta de MercadoPago"
            : "No se pudo obtener autorización del prestador",
        }, tokenResult.error === "provider_not_connected" ? 409 : 502);
      }
      mpToken = tokenResult.token;
      useMarketplaceFee = true;
      providerMpUserId = tokenResult.mp_user_id;
    }

    if (!mpToken) {
      return json({ error: "mp_token_missing" }, 500);
    }

    // Crear preferencia
    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [{
          id: job.id,
          title: `ServiMarket - ${job.category}`,
          description: job.description?.slice(0, 250) ?? job.category,
          quantity: 1,
          unit_price: breakdown.amount,
          currency_id: "ARS",
        }],
        ...(useMarketplaceFee ? { marketplace_fee: breakdown.fee } : {}),
        external_reference: job.id,
        back_urls: {
          success: `${APP_URL}/jobs/${job.id}?payment=success`,
          failure: `${APP_URL}/jobs/${job.id}?payment=failure`,
          pending: `${APP_URL}/jobs/${job.id}?payment=pending`,
        },
        ...(APP_URL.startsWith("https://") ? { auto_return: "approved" } : {}),
        notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
        metadata: {
          job_id: job.id,
          client_id: job.client_id,
          provider_id: job.provider_id,
          ...(providerMpUserId ? { provider_mp_user_id: providerMpUserId } : {}),
          mode: useMarketplaceFee ? "marketplace" : "platform_collects",
        },
      }),
    });

    if (!mpRes.ok) {
      const errBody = await mpRes.text();
      console.error("MP preference error:", mpRes.status, errBody);
      return json({ error: "mp_create_failed", detail: errBody }, 502);
    }

    const pref = await mpRes.json();

    const { data: payment, error: payErr } = await admin
      .from("payments")
      .insert({
        job_id: job.id,
        amount: breakdown.amount,
        platform_fee: breakdown.fee,
        provider_share: breakdown.providerNet,
        commission_tiers_snapshot: tiers,
        status: "pending",
        payment_provider: "mercadopago",
        preference_id: pref.id,
        checkout_url: pref.init_point,
      })
      .select()
      .single();

    if (payErr) {
      console.error("Payment insert error:", payErr);
      return json({ error: "payment_insert_failed" }, 500);
    }

    return json({
      payment_id: payment.id,
      checkout_url: pref.init_point,
      breakdown: {
        amount: breakdown.amount,
        fee: breakdown.fee,
        provider_net: breakdown.providerNet,
      },
    });
  } catch (e) {
    console.error("create-payment error:", e);
    return json({ error: "internal_error", detail: String(e) }, 500);
  }
});
