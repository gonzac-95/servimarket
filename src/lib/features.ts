// features.ts — interruptores de producto leídos desde app_config.
// Se cambian desde el panel admin sin redeploy.
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

let paymentsCache: { value: boolean; ts: number } | null = null;
const CACHE_MS = 60_000;

/** Cobro in-app con MercadoPago. false = el pago se arregla entre las partes, sin comisión. */
export function usePaymentsEnabled(): { enabled: boolean; loading: boolean } {
  const [enabled, setEnabled] = useState<boolean>(paymentsCache?.value ?? false);
  const [loading, setLoading] = useState(!paymentsCache);

  useEffect(() => {
    if (paymentsCache && Date.now() - paymentsCache.ts < CACHE_MS) return;
    supabase
      .from("app_config")
      .select("value")
      .eq("key", "payments_enabled")
      .maybeSingle()
      .then(({ data }) => {
        const value = data?.value === true;
        paymentsCache = { value, ts: Date.now() };
        setEnabled(value);
        setLoading(false);
      });
  }, []);

  return { enabled, loading };
}

/** Invalida el cache (lo usa el admin después de cambiar el interruptor). */
export function resetFeatureCache() {
  paymentsCache = null;
}
