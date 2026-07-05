-- ============================================================
-- Doble confirmación de finalización de trabajo
-- El prestador marca "terminé" (provider_completed_at) y el cliente
-- confirma (client_confirmed_at) → recién ahí status = 'completed'.
-- ============================================================

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS provider_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS client_confirmed_at  TIMESTAMPTZ;
