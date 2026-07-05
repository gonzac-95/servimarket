// ============================================================
// Edge Function: send-push
// Se dispara con un Database Webhook de Supabase cuando se inserta
// una fila en `notifications`. Busca los push_tokens del usuario y
// envía la notificación vía Firebase Cloud Messaging (HTTP v1).
//
// Secrets necesarios:
//   FIREBASE_PROJECT_ID
//   FIREBASE_CLIENT_EMAIL
//   FIREBASE_PRIVATE_KEY   (con los \n reales o escapados)
// (deploy con --no-verify-jwt: lo llama el webhook de Supabase)
// ============================================================

// @ts-ignore deno
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore deno
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// @ts-ignore deno
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// @ts-ignore deno
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// @ts-ignore deno
const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID")!;
// @ts-ignore deno
const FIREBASE_CLIENT_EMAIL = Deno.env.get("FIREBASE_CLIENT_EMAIL")!;
// @ts-ignore deno
const FIREBASE_PRIVATE_KEY = (Deno.env.get("FIREBASE_PRIVATE_KEY") ?? "").replace(/\\n/g, "\n");

// ---------- Helpers JWT / OAuth para Google ----------
function base64url(input: ArrayBuffer | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

let cachedToken: { token: string; exp: number } | null = null;

/** Genera (y cachea) un access token de Google con scope de FCM. */
async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.exp - 60_000) return cachedToken.token;

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: FIREBASE_CLIENT_EMAIL,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(FIREBASE_PRIVATE_KEY),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${base64url(sig)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!res.ok) throw new Error("oauth_token_failed: " + (await res.text()));
  const data = await res.json();
  cachedToken = { token: data.access_token, exp: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405 });

  try {
    const payload = await req.json().catch(() => ({}));
    // Formato de Database Webhook de Supabase: { type, record, ... }
    const record = payload.record ?? payload;
    const userId = record?.user_id;
    const title = record?.title ?? "ServiMarket";
    const body = record?.body ?? "";
    const data = record?.data ?? {};
    if (!userId) return new Response("missing_user_id", { status: 400 });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: tokens } = await admin
      .from("push_tokens")
      .select("token, platform")
      .eq("user_id", userId);

    if (!tokens || tokens.length === 0) {
      return new Response("no_tokens", { status: 200 });
    }

    const accessToken = await getAccessToken();
    const url = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;

    for (const t of tokens) {
      const message = {
        message: {
          token: t.token,
          notification: { title, body },
          data: Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v)]),
          ),
        },
      };
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });
      // Token inválido / no registrado → lo borramos
      if (res.status === 404 || res.status === 400) {
        const err = await res.text();
        if (err.includes("UNREGISTERED") || err.includes("INVALID_ARGUMENT")) {
          await admin.from("push_tokens").delete().eq("token", t.token);
        }
      }
    }

    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error("send-push error:", e);
    return new Response("internal_error: " + String(e), { status: 500 });
  }
});
