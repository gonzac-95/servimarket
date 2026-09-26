// analytics.ts — eventos del funnel con PostHog.
//
// Se activa sólo si están VITE_POSTHOG_KEY (y opcional VITE_POSTHOG_HOST) en
// el entorno de build (Vercel → Settings → Environment Variables). Sin key,
// todas las funciones son no-op: no se carga nada ni se manda nada.
//
// Privacidad: no mandamos email, nombre ni teléfono. Sólo el id interno del
// usuario, su rol y su ciudad. Sin grabación de sesiones.
import { Capacitor } from "@capacitor/core";
import type { PostHog } from "posthog-js";

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || "https://us.i.posthog.com";

let ph: PostHog | null = null;
let loading: Promise<PostHog | null> | null = null;
const queue: ((p: PostHog) => void)[] = [];

function isBotUA(): boolean {
  return /bot|crawler|spider|crawling|facebookexternalhit|whatsapp|lighthouse|headless/i.test(navigator.userAgent);
}

/** Carga PostHog en segundo plano (no bloquea el primer render). */
export function initAnalytics() {
  if (!KEY || loading || typeof window === "undefined" || isBotUA()) return;
  loading = import("posthog-js").then(({ default: posthog }) => {
    posthog.init(KEY, {
      api_host: HOST,
      person_profiles: "identified_only",
      capture_pageview: "history_change",
      capture_pageleave: true,
      autocapture: true,
      disable_session_recording: true,
      respect_dnt: true,
      persistence: "localStorage+cookie",
    });
    posthog.register({ platform: Capacitor.isNativePlatform() ? Capacitor.getPlatform() : "web" });
    ph = posthog;
    queue.splice(0).forEach(fn => fn(posthog));
    return posthog;
  }).catch(e => { console.warn("analytics off:", e); return null; });
}

function run(fn: (p: PostHog) => void) {
  if (!KEY) return;
  if (ph) fn(ph);
  else if (queue.length < 50) queue.push(fn);
}

export type AnalyticsEvent =
  | "signup_completed"      // { role, method }
  | "login"                 // { method }
  | "search"                // { category, city, results, landing }
  | "provider_viewed"       // { provider_id, category, verified }
  | "contact_started"       // { provider_id }
  | "job_requested"         // { category, provider_id }
  | "quote_sent"            // { job_id }
  | "quote_accepted"        // { job_id }
  | "job_confirmed_done"    // { job_id, role }
  | "review_submitted"      // { rating }
  | "verification_uploaded" // { type }
  | "push_enabled"          // { source }
  | "whatsapp_support"      // { source }
  | "provider_signup_cta";  // { source }

export function track(event: AnalyticsEvent, props?: Record<string, unknown>) {
  run(p => p.capture(event, props));
}

/** Asocia la sesión al usuario (sólo id + rol + ciudad). */
export function identify(userId: string, props: { role?: string; city?: string | null }) {
  run(p => {
    if (p.get_distinct_id() === userId) { p.setPersonProperties({ role: props.role, city: props.city ?? undefined }); return; }
    p.identify(userId, { role: props.role, city: props.city ?? undefined });
  });
}

/** Al cerrar sesión: nueva identidad anónima. */
export function resetAnalytics() {
  run(p => p.reset());
}
