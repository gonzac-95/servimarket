-- ============================================================
-- Fase 1: Comisión fija escalonada por tramo de precio
-- ============================================================

-- Tabla de configuración global editable desde el panel admin
CREATE TABLE IF NOT EXISTS public.app_config (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_by  UUID REFERENCES public.users(id)
);

CREATE TRIGGER app_config_updated_at
  BEFORE UPDATE ON public.app_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Tramos por defecto (mayo 2026, ARS).
-- Formato: array ordenado por max ascendente. max = null significa "sin tope".
INSERT INTO public.app_config (key, value, description) VALUES
('commission_tiers',
 '[
    {"max": 30000,  "fee": 2500},
    {"max": 100000, "fee": 7000},
    {"max": 300000, "fee": 15000},
    {"max": null,   "fee": 25000}
  ]'::jsonb,
 'Tramos de comisión fija aplicados al precio del trabajo. El primero cuyo max >= price gana.'
)
ON CONFLICT (key) DO NOTHING;

-- Función para calcular la comisión a partir del precio del job.
-- Retorna 0 si price es NULL o <= 0.
CREATE OR REPLACE FUNCTION public.calculate_commission(price NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  tiers JSONB;
  tier  JSONB;
BEGIN
  IF price IS NULL OR price <= 0 THEN
    RETURN 0;
  END IF;

  SELECT value INTO tiers FROM public.app_config WHERE key = 'commission_tiers';
  IF tiers IS NULL THEN
    RETURN 0;
  END IF;

  FOR tier IN SELECT * FROM jsonb_array_elements(tiers) LOOP
    IF (tier->>'max') IS NULL OR price <= (tier->>'max')::NUMERIC THEN
      RETURN (tier->>'fee')::NUMERIC;
    END IF;
  END LOOP;

  -- Fallback: último tramo
  RETURN ((tiers->-1)->>'fee')::NUMERIC;
END;
$$ LANGUAGE plpgsql STABLE;

-- RLS para app_config: lectura pública (los tramos no son secretos),
-- escritura solo admin.
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AppConfig read all"
  ON public.app_config FOR SELECT USING (true);

CREATE POLICY "AppConfig write admin"
  ON public.app_config FOR ALL
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- ============================================================
-- payments: clarificar el modelo de comisión fija
-- ============================================================
-- Los campos provider_share y platform_fee ya existen pero estaban
-- pensados como porcentaje. Los seguimos usando con el nuevo modelo:
--   platform_fee   = comisión fija calculada por tramo
--   provider_share = amount - platform_fee  (monto neto al prestador)

-- Constraint: platform_fee no puede ser mayor que amount
ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_fee_lte_amount;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_fee_lte_amount
  CHECK (platform_fee IS NULL OR platform_fee <= amount);

-- Snapshot de los tramos vigentes al momento del pago (auditable).
-- Si después cambiamos los tramos, las liquidaciones viejas siguen siendo trazables.
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS commission_tiers_snapshot JSONB;
