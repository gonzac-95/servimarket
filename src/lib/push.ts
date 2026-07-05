// ============================================================
// Push notifications nativas (Capacitor + FCM/APNs).
// En web es no-op. En iOS/Android pide permiso, registra el device
// y guarda el token en la tabla push_tokens para que el backend
// pueda enviar notificaciones aunque la app esté cerrada.
// ============================================================

import { Capacitor } from "@capacitor/core";
import { supabase } from "./supabase";

const PUSH_MODULE = "@capacitor/push" + "-notifications"; // string partido: Vite no lo analiza en web

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

async function loadPush(): Promise<any> {
  return await import(/* @vite-ignore */ PUSH_MODULE);
}

/**
 * Inicializa push notifications para el usuario logueado.
 * Llamar cuando hay sesión activa (no-op en web).
 */
export async function initPush(userId: string): Promise<void> {
  if (!isNative() || !userId) return;
  try {
    const { PushNotifications } = await loadPush();

    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== "granted") return;

    await PushNotifications.register();

    // Token del dispositivo → lo guardamos en la DB
    PushNotifications.addListener("registration", async (token: { value: string }) => {
      const platform = Capacitor.getPlatform(); // 'ios' | 'android'
      await supabase.from("push_tokens").upsert(
        { user_id: userId, token: token.value, platform },
        { onConflict: "user_id,token" },
      );
    });

    PushNotifications.addListener("registrationError", (err: unknown) => {
      console.warn("Push registration error:", err);
    });
  } catch (e) {
    console.warn("initPush failed:", e);
  }
}

/** Limpia los listeners (llamar al cerrar sesión). */
export async function teardownPush(): Promise<void> {
  if (!isNative()) return;
  try {
    const { PushNotifications } = await loadPush();
    await PushNotifications.removeAllListeners();
  } catch (e) {
    console.warn("teardownPush failed:", e);
  }
}
