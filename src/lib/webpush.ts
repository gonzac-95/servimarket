// webpush.ts — notificaciones del navegador (web push con VAPID).
// En la app nativa se usan las push de Capacitor (lib/push.ts); acá sólo web.
//
// Flujo: el usuario toca "Activar" → pedimos permiso → nos suscribimos con la
// clave pública VAPID (app_config.vapid_public_key) → guardamos la suscripción
// en push_tokens (platform = "web"). La edge function `notify` la usa después.
import { Capacitor } from "@capacitor/core";
import { supabase } from "./supabase";

export type PushState = "unsupported" | "ios-install" | "denied" | "enabled" | "disabled";

export function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isStandalone(): boolean {
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true;
}

export function pushSupported(): boolean {
  if (typeof window === "undefined" || Capacitor.isNativePlatform()) return false;
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** Registra el service worker (llamar una vez al iniciar la web). */
export function registerServiceWorker() {
  if (Capacitor.isNativePlatform() || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(e => console.warn("SW register failed:", e));
  });
}

export async function getPushState(): Promise<PushState> {
  // En iPhone la web push sólo funciona con la web agregada a la pantalla de inicio
  if (isIos() && !isStandalone()) return "ios-install";
  if (!pushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  return sub && Notification.permission === "granted" ? "enabled" : "disabled";
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function vapidPublicKey(): Promise<string | null> {
  const { data } = await supabase.from("app_config").select("value").eq("key", "vapid_public_key").maybeSingle();
  return typeof data?.value === "string" ? data.value : null;
}

/** Pide permiso y suscribe este navegador. Devuelve el estado final. */
export async function enablePush(userId: string): Promise<PushState> {
  if (!pushSupported()) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "disabled";

  const key = await vapidPublicKey();
  if (!key) throw new Error("vapid_missing");

  const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription())
    ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) }));

  const { error } = await supabase.from("push_tokens").upsert(
    { user_id: userId, token: JSON.stringify(sub.toJSON()), platform: "web" },
    { onConflict: "user_id,token" },
  );
  if (error) throw error;
  return "enabled";
}

/** Desuscribe este navegador y borra el token. */
export async function disablePush(userId: string): Promise<PushState> {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await supabase.from("push_tokens").delete().eq("user_id", userId).eq("token", JSON.stringify(sub.toJSON()));
    await sub.unsubscribe();
  }
  return "disabled";
}
