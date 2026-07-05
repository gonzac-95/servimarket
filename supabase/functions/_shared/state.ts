// ============================================================
// State HMAC para OAuth de MercadoPago.
// Firmamos un payload {provider_id, ts, nonce} con HMAC-SHA256.
// El callback valida la firma y consume el state (single-use).
// ============================================================

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutos

export interface StatePayload {
  provider_id: string;
  ts: number;
  nonce: string;
}

function base64UrlEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  const pad = (4 - (str.length % 4)) % 4;
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacSha256(secret: string, message: string): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  return await crypto.subtle.sign("HMAC", key, enc.encode(message));
}

/** Genera el state firmado para enviar a MP. */
export async function signState(
  payload: StatePayload,
  secret: string,
): Promise<string> {
  const json = JSON.stringify(payload);
  const body = base64UrlEncode(new TextEncoder().encode(json).buffer);
  const sig = base64UrlEncode(await hmacSha256(secret, body));
  return `${body}.${sig}`;
}

/** Valida un state recibido y retorna el payload si es válido. */
export async function verifyState(
  state: string,
  secret: string,
): Promise<StatePayload | null> {
  const dot = state.indexOf(".");
  if (dot < 0) return null;
  const body = state.slice(0, dot);
  const sig = state.slice(dot + 1);

  const expectedSig = base64UrlEncode(await hmacSha256(secret, body));
  if (sig.length !== expectedSig.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  if (diff !== 0) return null;

  let payload: StatePayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body)));
  } catch {
    return null;
  }

  if (Date.now() - payload.ts > STATE_TTL_MS) return null;
  return payload;
}

export function randomNonce(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return base64UrlEncode(buf.buffer);
}
