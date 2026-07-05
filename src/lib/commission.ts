import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface CommissionTier {
  /** Tope superior del tramo (inclusivo). null = sin tope (último tramo). */
  max: number | null;
  /** Comisión fija en ARS para este tramo. */
  fee: number;
}

export interface CommissionBreakdown {
  amount: number;
  fee: number;
  providerNet: number;
  tier: CommissionTier | null;
}

/** Tramos de fallback si todavía no se cargaron los del backend. */
export const DEFAULT_TIERS: CommissionTier[] = [
  { max: 30000, fee: 2500 },
  { max: 100000, fee: 7000 },
  { max: 300000, fee: 15000 },
  { max: null, fee: 25000 },
];

export function calculateCommission(
  amount: number,
  tiers: CommissionTier[],
): CommissionBreakdown {
  const safe = Number.isFinite(amount) && amount > 0 ? amount : 0;
  if (safe === 0 || tiers.length === 0) {
    return { amount: safe, fee: 0, providerNet: safe, tier: null };
  }
  const tier =
    tiers.find((t) => t.max === null || safe <= t.max) ??
    tiers[tiers.length - 1];
  const fee = Math.min(tier.fee, safe);
  return { amount: safe, fee, providerNet: safe - fee, tier };
}

let cache: { tiers: CommissionTier[]; ts: number } | null = null;
const CACHE_MS = 60_000;

/** Hook que devuelve los tramos vigentes (con cache simple in-memory). */
export function useCommissionTiers() {
  const [tiers, setTiers] = useState<CommissionTier[]>(
    cache?.tiers ?? DEFAULT_TIERS,
  );
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache && Date.now() - cache.ts < CACHE_MS) return;
    supabase
      .from("app_config")
      .select("value")
      .eq("key", "commission_tiers")
      .single()
      .then(({ data }) => {
        if (data?.value) {
          const parsed = data.value as CommissionTier[];
          cache = { tiers: parsed, ts: Date.now() };
          setTiers(parsed);
        }
        setLoading(false);
      });
  }, []);

  return { tiers, loading };
}

/** Formato de moneda ARS. */
export function formatARS(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}
