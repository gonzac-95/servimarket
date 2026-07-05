-- ============================================================
-- Fase 2: OAuth Marketplace con MercadoPago
-- Cada prestador conecta su cuenta MP via OAuth; el platform usa
-- el token del prestador para crear preferencias con marketplace_fee.
-- ============================================================

-- mp_user_id en providers indica que ya conectaron su cuenta MP
-- (es público — info no sensible). Los tokens van en tabla aparte.
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS mp_user_id TEXT,
  ADD COLUMN IF NOT EXISTS mp_connected_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_providers_mp_user_id
  ON public.providers(mp_user_id);

-- ============================================================
-- provider_mp_credentials: tokens sensibles, sólo service role.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.provider_mp_credentials (
  provider_id    UUID PRIMARY KEY REFERENCES public.providers(id) ON DELETE CASCADE,
  mp_user_id     TEXT NOT NULL,
  access_token   TEXT NOT NULL,
  refresh_token  TEXT NOT NULL,
  expires_at     TIMESTAMPTZ NOT NULL,
  public_key     TEXT,
  scope          TEXT,
  live_mode      BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER provider_mp_credentials_updated_at
  BEFORE UPDATE ON public.provider_mp_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: nadie puede SELECT/INSERT/UPDATE/DELETE a través de la API anon ni user JWT.
-- Sólo el service role (usado en edge functions) puede operar.
ALTER TABLE public.provider_mp_credentials ENABLE ROW LEVEL SECURITY;

-- Sin policies = todo denegado para roles no privilegiados.
-- El service role bypassea RLS automáticamente.

-- ============================================================
-- oauth_states: state HMAC firmado tiene TTL implícito, pero
-- también guardamos en DB para single-use (anti-replay).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.oauth_states (
  state         TEXT PRIMARY KEY,
  provider_id   UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  consumed_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_provider
  ON public.oauth_states(provider_id);

-- Cleanup helper (lo podés llamar manualmente o desde un cron job)
CREATE OR REPLACE FUNCTION public.cleanup_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM public.oauth_states
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;
-- Sin policies: solo service role.
