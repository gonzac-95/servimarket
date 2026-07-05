// ============================================================
// Edge Function: mp-oauth-callback
// MercadoPago redirige acá después de que el prestador autoriza.
// Validamos state, intercambiamos code por tokens, guardamos en
// provider_mp_credentials y redirigimos a la app.
//
// GET /functions/v1/mp-oauth-callback?code=...&state=...
// (deploy con --no-verify-jwt: MP no envía JWT de Supabase)
// ============================================================

// @ts-ignore deno
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore deno
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { verifyState } from "../_shared/state.ts";

// @ts-ignore deno
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// @ts-ignore deno
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// @ts-ignore deno
const MP_CLIENT_ID = Deno.env.get("MP_CLIENT_ID")!;
// @ts-ignore deno
const MP_CLIENT_SECRET = Deno.env.get("MP_CLIENT_SECRET")!;
// @ts-ignore deno
const MP_OAUTH_REDIRECT_URI = Deno.env.get("MP_OAUTH_REDIRECT_URI")!;
// @ts-ignore deno
const MP_OAUTH_STATE_SECRET = Deno.env.get("MP_OAUTH_STATE_SECRET")!;
// @ts-ignore deno
const APP_URL = Deno.env.get("APP_URL") ?? "http://localhost:5173";

function redirectTo(target: string) {
  return new Response(null, { status: 302, headers: { Location: target } });
}

serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  // Si el usuario canceló o MP devolvió error, redirigir con flag
  if (errorParam) {
    return redirectTo(`${APP_URL}/settings?mp_error=${encodeURIComponent(errorParam)}`);
  }
  if (!code || !state) {
    return redirectTo(`${APP_URL}/settings?mp_error=missing_params`);
  }

  try {
    // Validar firma del state
    const payload = await verifyState(state, MP_OAUTH_STATE_SECRET);
    if (!payload) {
      return redirectTo(`${APP_URL}/settings?mp_error=invalid_state`);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Validar single-use: marcar como consumido (atómico)
    const { data: consumed, error: consumeErr } = await admin
      .from("oauth_states")
      .update({ consumed_at: new Date().toISOString() })
      .eq("state", state)
      .is("consumed_at", null)
      .select("state")
      .maybeSingle();

    if (consumeErr || !consumed) {
      console.error("state consume failed:", consumeErr);
      return redirectTo(`${APP_URL}/settings?mp_error=state_used`);
    }

    // Exchange code → tokens
    const tokenRes = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: MP_CLIENT_ID,
        client_secret: MP_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: MP_OAUTH_REDIRECT_URI,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("MP token exchange failed:", tokenRes.status, errText);
      return redirectTo(`${APP_URL}/settings?mp_error=token_exchange_failed`);
    }

    const tokens = await tokenRes.json();
    // tokens: { access_token, refresh_token, expires_in, scope, user_id, public_key, live_mode, ... }

    const expiresAt = new Date(Date.now() + Number(tokens.expires_in) * 1000).toISOString();
    const mpUserId = String(tokens.user_id);

    // Upsert credentials
    const { error: credErr } = await admin
      .from("provider_mp_credentials")
      .upsert({
        provider_id: payload.provider_id,
        mp_user_id: mpUserId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        public_key: tokens.public_key,
        scope: tokens.scope,
        live_mode: !!tokens.live_mode,
      }, { onConflict: "provider_id" });

    if (credErr) {
      console.error("credentials upsert failed:", credErr);
      return redirectTo(`${APP_URL}/settings?mp_error=save_failed`);
    }

    // Marcar provider como conectado (info pública)
    await admin
      .from("providers")
      .update({ mp_user_id: mpUserId, mp_connected_at: new Date().toISOString() })
      .eq("id", payload.provider_id);

    return redirectTo(`${APP_URL}/settings?mp_connected=true`);
  } catch (e) {
    console.error("mp-oauth-callback error:", e);
    return redirectTo(`${APP_URL}/settings?mp_error=internal`);
  }
});
