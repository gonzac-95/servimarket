// ============================================================
// Edge Function: notify
// La dispara el trigger de `notifications` (pg_net) con { id }.
// Entrega el aviso por:
//   - push nativa (FCM) a tokens android / ios   [si hay secrets de Firebase]
//   - web push (VAPID) a suscripciones del navegador
//   - email (Resend) para los tipos importantes    [si hay RESEND_API_KEY]
//
// Seguridad: no confía en el body. Sólo usa el id para "reclamar" la
// notificación con notify_claim(), que la marca como entregada en la misma
// operación: cada aviso sale una sola vez y no se pueden inyectar avisos.
//
// { action: "setup" } genera las claves VAPID la primera vez y publica la
// clave pública en app_config.vapid_public_key.
//
// Secrets:
//   RESEND_API_KEY                      (emails)
//   FIREBASE_PROJECT_ID / _CLIENT_EMAIL / _PRIVATE_KEY   (push nativa, opcional)
// Deploy: verify_jwt = false (lo llama la base de datos).
// ============================================================

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import webpush from "npm:web-push@3.6.7";

const SITE_URL = "https://servimarket.app";
const FROM = "ServiMarket <no-responder@servimarket.app>";
const VAPID_SUBJECT = "mailto:servimarket.admin@gmail.com";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "";
const FIREBASE_CLIENT_EMAIL = Deno.env.get("FIREBASE_CLIENT_EMAIL") ?? "";
const FIREBASE_PRIVATE_KEY = (Deno.env.get("FIREBASE_PRIVATE_KEY") ?? "").replace(/\\n/g, "\n");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Tipos que además del push mandan email. "message" se limita a 1 cada 30 min.
const EMAIL_TYPES = new Set([
  "job_new", "quote", "job_accepted", "job_done", "job_completed", "job_cancelled",
  "message", "verification", "review",
]);

type Claimed = {
  notification: { id: string; user_id: string; title: string; body: string; type: string | null; data: Record<string, unknown> | null };
  email: string | null;
  name: string | null;
  role: string | null;
  email_notifications: boolean;
  tokens: { token: string; platform: string | null }[];
  recent_message_email: boolean;
};

function linkFor(n: Claimed["notification"]): string {
  const jobId = n.data && typeof n.data.job_id === "string" ? n.data.job_id : null;
  if (jobId) return `${SITE_URL}/jobs/${jobId}`;
  if (n.type === "verification") return `${SITE_URL}/verificacion`;
  return `${SITE_URL}/notifications`;
}

// ---------- VAPID ----------
let vapid: { publicKey: string; privateKey: string } | null = null;

async function getVapid(create: boolean) {
  if (vapid) return vapid;
  const [{ data: pub }, { data: priv }] = await Promise.all([
    admin.rpc("notify_get_secret", { p_key: "vapid_public" }),
    admin.rpc("notify_get_secret", { p_key: "vapid_private" }),
  ]);
  if (pub && priv) {
    vapid = { publicKey: pub as string, privateKey: priv as string };
  } else if (create) {
    const keys = webpush.generateVAPIDKeys();
    // init_secret no pisa valores existentes: si dos llamadas compiten, gana la primera
    const { data: p } = await admin.rpc("notify_init_secret", { p_key: "vapid_public", p_value: keys.publicKey });
    const { data: k } = await admin.rpc("notify_init_secret", { p_key: "vapid_private", p_value: keys.privateKey });
    vapid = { publicKey: p as string, privateKey: k as string };
  } else {
    return null;
  }
  await admin.from("app_config").upsert({
    key: "vapid_public_key", value: vapid.publicKey,
    description: "Clave pública VAPID para web push (la privada vive en private.app_secrets).",
  });
  webpush.setVapidDetails(VAPID_SUBJECT, vapid.publicKey, vapid.privateKey);
  return vapid;
}

// ---------- FCM (push nativa) ----------
function b64url(input: ArrayBuffer | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let s = ""; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
let fcmToken: { token: string; exp: number } | null = null;
async function getFcmToken(): Promise<string | null> {
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) return null;
  if (fcmToken && Date.now() < fcmToken.exp - 60_000) return fcmToken.token;
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify({
    iss: FIREBASE_CLIENT_EMAIL, scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
  }))}`;
  const der = Uint8Array.from(atob(FIREBASE_PRIVATE_KEY.replace(/-----[^-]+-----/g, "").replace(/\s/g, "")), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${unsigned}.${b64url(sig)}`,
  });
  if (!res.ok) { console.error("fcm oauth", await res.text()); return null; }
  const d = await res.json();
  fcmToken = { token: d.access_token, exp: Date.now() + d.expires_in * 1000 };
  return fcmToken.token;
}

async function sendNative(c: Claimed, url: string) {
  const tokens = c.tokens.filter(t => t.platform === "android" || t.platform === "ios");
  if (tokens.length === 0) return 0;
  const access = await getFcmToken();
  if (!access) return 0;
  const data = Object.fromEntries(Object.entries(c.notification.data ?? {}).map(([k, v]) => [k, String(v)]));
  let sent = 0;
  for (const t of tokens) {
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message: { token: t.token, notification: { title: c.notification.title, body: c.notification.body }, data: { ...data, url } } }),
    });
    if (res.ok) sent++;
    else {
      const err = await res.text();
      if (err.includes("UNREGISTERED") || err.includes("INVALID_ARGUMENT")) await admin.rpc("notify_forget_token", { p_token: t.token });
    }
  }
  return sent;
}

// ---------- Web push ----------
async function sendWeb(c: Claimed, url: string) {
  const tokens = c.tokens.filter(t => t.platform === "web");
  if (tokens.length === 0) return 0;
  if (!(await getVapid(false))) return 0;
  const payload = JSON.stringify({
    title: c.notification.title, body: c.notification.body, url,
    tag: c.notification.type === "message" ? `msg-${(c.notification.data as any)?.job_id ?? ""}` : c.notification.id,
  });
  let sent = 0;
  for (const t of tokens) {
    try {
      await webpush.sendNotification(JSON.parse(t.token), payload, { TTL: 60 * 60 * 24 });
      sent++;
    } catch (e: any) {
      const code = e?.statusCode;
      if (code === 404 || code === 410) await admin.rpc("notify_forget_token", { p_token: t.token });
      else console.error("webpush", code, e?.body ?? String(e));
    }
  }
  return sent;
}

// ---------- Email ----------
function esc(s: string) {
  return s.replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]!));
}

function emailHtml(name: string | null, title: string, body: string, url: string, cta: string) {
  const hello = name ? `Hola ${esc(name.split(" ")[0])},` : "Hola,";
  return `<!doctype html><html lang="es"><body style="margin:0;background:#F4F4F3;font-family:Helvetica,Arial,sans-serif;color:#0A0A0A">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F3;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #ECECEC">
<tr><td style="padding:22px 28px;border-bottom:1px solid #F0F0F0;font-size:20px;font-weight:700;letter-spacing:-0.02em">Servi<span style="color:#16A34A">Market</span></td></tr>
<tr><td style="padding:28px">
<p style="margin:0 0 6px;font-size:14px;color:#6B6B6B">${hello}</p>
<h1 style="margin:0 0 10px;font-size:22px;line-height:1.25;letter-spacing:-0.01em">${esc(title)}</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:#3A3A3A">${esc(body)}</p>
<a href="${url}" style="display:inline-block;background:#15803D;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:15px;padding:13px 24px;border-radius:10px">${esc(cta)}</a>
</td></tr>
<tr><td style="padding:18px 28px;background:#FAFAFA;border-top:1px solid #F0F0F0;font-size:12px;line-height:1.5;color:#8A8A8A">
Recibís este correo porque tenés una cuenta en ServiMarket. Podés desactivar los avisos por email en
<a href="${SITE_URL}/notifications" style="color:#15803D">Notificaciones</a>.
</td></tr></table></td></tr></table></body></html>`;
}

const CTA: Record<string, string> = {
  job_new: "Ver la solicitud", quote: "Ver la cotización", job_accepted: "Abrir el trabajo",
  job_done: "Confirmar el trabajo", job_completed: "Ver el trabajo", job_cancelled: "Ver el trabajo",
  message: "Responder", verification: "Ver mi verificación", review: "Ver la reseña",
};

async function sendEmail(c: Claimed, url: string) {
  const n = c.notification;
  const type = n.type ?? "";
  if (!RESEND_API_KEY || !c.email || !c.email_notifications || !EMAIL_TYPES.has(type)) return false;
  if (type === "message" && c.recent_message_email) return false;
  const subject = type === "message" ? "Tenés mensajes nuevos en ServiMarket" : `${n.title} · ServiMarket`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM, to: [c.email], subject,
      html: emailHtml(c.name, n.title, n.body, url, CTA[type] ?? "Abrir ServiMarket"),
      text: `${n.title}\n\n${n.body}\n\n${url}`,
      tags: [{ name: "type", value: type || "other" }],
    }),
  });
  if (!res.ok) { console.error("resend", res.status, await res.text()); return false; }
  await admin.rpc("notify_log_email", { p_user: n.user_id, p_kind: type });
  return true;
}

// ---------- Handler ----------
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405 });
  const body = await req.json().catch(() => ({}));

  try {
    if (body?.action === "setup") {
      const v = await getVapid(true);
      return Response.json({ ok: true, publicKey: v?.publicKey ?? null, email: !!RESEND_API_KEY, fcm: !!FIREBASE_PROJECT_ID });
    }

    const id = typeof body?.id === "string" ? body.id : body?.record?.id;
    if (!id) return new Response("missing_id", { status: 400 });

    const { data, error } = await admin.rpc("notify_claim", { p_id: id });
    if (error) throw error;
    if (!data) return Response.json({ skipped: true });
    const c = data as Claimed;
    const url = linkFor(c.notification);

    const [native, web, email] = await Promise.all([
      sendNative(c, url).catch(e => { console.error("native", e); return 0; }),
      sendWeb(c, url).catch(e => { console.error("web", e); return 0; }),
      sendEmail(c, url).catch(e => { console.error("email", e); return false; }),
    ]);
    return Response.json({ ok: true, native, web, email });
  } catch (e) {
    console.error("notify error:", e);
    return new Response("internal_error", { status: 500 });
  }
});
