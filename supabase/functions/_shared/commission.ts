// ============================================================
// Cálculo de comisión por tramos (compartido entre edge functions)
// ============================================================

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
  tiers: CommissionTier[];
}

/**
 * Calcula la comisión fija aplicable a un monto dado los tramos vigentes.
 * Tramos deben estar ordenados por `max` ascendente (null al final).
 */
export function calculateCommission(
  amount: number,
  tiers: CommissionTier[],
): CommissionBreakdown {
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;

  if (safeAmount === 0 || tiers.length === 0) {
    return { amount: safeAmount, fee: 0, providerNet: safeAmount, tiers };
  }

  const tier =
    tiers.find((t) => t.max === null || safeAmount <= t.max) ??
    tiers[tiers.length - 1];

  const fee = Math.min(tier.fee, safeAmount);
  return {
    amount: safeAmount,
    fee,
    providerNet: safeAmount - fee,
    tiers,
  };
}

/** Valida la forma de los tramos antes de guardar en app_config. */
export function validateTiers(raw: unknown): CommissionTier[] {
  if (!Array.isArray(raw)) {
    throw new Error("commission_tiers debe ser un array");
  }

  const tiers = raw.map((t, i): CommissionTier => {
    if (typeof t !== "object" || t === null) {
      throw new Error(`Tramo ${i} inválido`);
    }
    const max = (t as Record<string, unknown>).max;
    const fee = (t as Record<string, unknown>).fee;
    if (max !== null && (typeof max !== "number" || max <= 0)) {
      throw new Error(`Tramo ${i}: max debe ser número positivo o null`);
    }
    if (typeof fee !== "number" || fee < 0) {
      throw new Error(`Tramo ${i}: fee debe ser número >= 0`);
    }
    return { max: max as number | null, fee };
  });

  // Validar orden ascendente y único null al final
  const nullCount = tiers.filter((t) => t.max === null).length;
  if (nullCount > 1) throw new Error("Solo un tramo puede tener max=null");
  if (nullCount === 1 && tiers[tiers.length - 1].max !== null) {
    throw new Error("El tramo con max=null debe ser el último");
  }
  for (let i = 1; i < tiers.length; i++) {
    const prev = tiers[i - 1].max;
    const curr = tiers[i].max;
    if (prev !== null && curr !== null && curr <= prev) {
      throw new Error(`Tramos no están ordenados ascendentemente (índice ${i})`);
    }
  }
  return tiers;
}
