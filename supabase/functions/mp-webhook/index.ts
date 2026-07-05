// ============================================================
// Edge Function: mp-webhook
// Recibe notificaciones de MercadoPago, valida la firma y actualiza
// el estado del payment correspondiente.
//
// POST /functions/v1/mp-webhook
// Body: { id, type, data: { id }, ... } (formato MP)
// Headers: x-signature, x-request-id
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
const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;
// @ts-ignore deno
const MP_WEBHOOK_SECRET = Deno.env.get("MP_WEBHOOK_SECRET") ?? "";

/**
 * Valida la firma del webhook de MercadoPago.
 * MP envía: x-signature: "ts=<timestamp>,v1=<hmac-sha256-hex>"
 * Payload firmado: id:<data.id>;request-id:<x-request-id>;ts:<timestamp>;
 */
async function verifyMpSignature(
  signatureHeader: string | null,
  requestId: string | null,
  dataId: string | null,
  secret: string,
): Promise<boolean> {
  if (!secret) return true; // sin secret configurado, no validamos (modo dev)
  if (!signatureHeader || !requestId || !dataId) return false;

  // Parsear "ts=xxx,v1=yyy"
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => p.trim().split("=").map((s) => s.trim())),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;

  // HMAC-SHA256
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(manifest));
  const sigHex = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Comparación timing-safe
  if (sigHex.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < sigHex.length; i++) diff |= sigHex.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

/** Mapea status de MP a nuestro enum payment_status */
function mapMpStatus(mp: string): "pending" | "approved" | "rejected" | "refunded" {
  switch (mp) {
    case "approved":
      return "approved";
    case "rejected":
    case "cancelled":
      return "rejected";
    case "refunded":
    case "charged_back":
      return "refunded";
    default:
      return "pending"; // in_process, in_mediation, authorized, pending
  }
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405 });
  }

  try {
    const rawBody = await req.text();
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return new Response("invalid_json", { status: 400 });
    }

    // MP envía varios formatos. Lo importante: tipo y data.id
    const type = body.type ?? body.topic;
    const dataId = body.data?.id?.toString() ?? body.id?.toString() ?? null;

    // Solo nos importa el evento de pago
    if (type !== "payment") {
      return new Response("ignored", { status: 200 });
    }
    if (!dataId) {
      return new Response("missing_data_id", { status: 400 });
    }

    // Validar firma
    const valid = await verifyMpSignature(
      req.headers.get("x-signature"),
      req.headers.get("x-request-id"),
      dataId,
      MP_WEBHOOK_SECRET,
    );
    if (!valid) {
      console.error("Invalid MP signature");
      return new Response("invalid_signature", { status: 401 });
    }

    // Consultar el detalle del pago en MP
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });
    if (!mpRes.ok) {
      const errText = await mpRes.text();
      console.error("MP fetch failed:", mpRes.status, errText);
      return new Response("mp_fetch_failed", { status: 502 });
    }
    const mpPayment = await mpRes.json();

    const jobId = mpPayment.external_reference;
    const newStatus = mapMpStatus(mpPayment.status);

    if (!jobId) {
      console.error("MP payment without external_reference", mpPayment.id);
      return new Response("missing_external_reference", { status: 400 });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Actualizar payment correspondiente (matched por job_id)
    const { error: payErr } = await admin
      .from("payments")
      .update({
        status: newStatus,
        provider_payment_id: dataId,
      })
      .eq("job_id", jobId);

    if (payErr) {
      console.error("Payment update error:", payErr);
      return new Response("payment_update_failed", { status: 500 });
    }

    // Notificar a las partes (cliente + prestador)
    if (newStatus === "approved") {
      const { data: job } = await admin
        .from("jobs")
        .select("client_id, provider_id, providers(user_id)")
        .eq("id", jobId)
        .single();
      if (job) {
        const recipients = [job.client_id];
        const providerUserId = (job as any).providers?.user_id;
        if (providerUserId) recipients.push(providerUserId);
        await admin.from("notifications").insert(
          recipients.map((user_id) => ({
            user_id,
            title: "Pago confirmado",
            body: "El pago del trabajo fue acreditado.",
            type: "payment",
            data: { job_id: jobId },
          })),
        );
      }
    }

    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error("mp-webhook error:", e);
    return new Response("internal_error", { status: 500 });
  }
});
