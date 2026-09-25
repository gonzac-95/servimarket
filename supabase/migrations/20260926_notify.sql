-- ============================================================
-- Avisos fuera de la app (sept 2026)
--
-- Cada fila nueva en `notifications` dispara la edge function `notify`,
-- que entrega el aviso por:
--   - push nativa (FCM) a los tokens android/ios,
--   - web push (VAPID) a las suscripciones del navegador,
--   - email (Resend) para los tipos importantes.
--
-- La función recibe sólo el id: vuelve a leer la notificación de la base y
-- la marca como entregada en la misma operación (delivered_at). Así nadie
-- puede usar el endpoint para mandar avisos inventados ni repetir envíos.
-- ============================================================

-- ---------- Esquema privado (no expuesto por la API) ----------
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS private.app_secrets (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS private.email_log (
  id      BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  kind    TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_log_user_kind_idx ON private.email_log (user_id, kind, sent_at DESC);

-- ---------- Notificaciones: marca de entrega ----------
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
-- Lo existente se da por entregado (no reenviar históricos)
UPDATE public.notifications SET delivered_at = now() WHERE delivered_at IS NULL;

-- ---------- Preferencia de email ----------
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN NOT NULL DEFAULT true;
GRANT UPDATE (email_notifications) ON public.users TO authenticated;

-- ---------- push_tokens: el upsert necesita UPDATE ----------
DROP POLICY IF EXISTS "Push tokens propios update" ON public.push_tokens;
CREATE POLICY "Push tokens propios update" ON public.push_tokens
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------- RPCs sólo para la edge function (service_role) ----------

-- Toma la notificación si todavía no se entregó y devuelve todo lo necesario
CREATE OR REPLACE FUNCTION public.notify_claim(p_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  n public.notifications;
  u public.users;
BEGIN
  UPDATE public.notifications SET delivered_at = now()
  WHERE id = p_id AND delivered_at IS NULL AND created_at > now() - interval '1 hour'
  RETURNING * INTO n;
  IF n.id IS NULL THEN RETURN NULL; END IF;

  SELECT * INTO u FROM public.users WHERE id = n.user_id;

  RETURN jsonb_build_object(
    'notification', to_jsonb(n),
    'email', u.email,
    'name', u.name,
    'role', u.role,
    'email_notifications', COALESCE(u.email_notifications, true),
    'tokens', COALESCE((SELECT jsonb_agg(jsonb_build_object('token', token, 'platform', platform))
                        FROM public.push_tokens WHERE user_id = n.user_id), '[]'::jsonb),
    'recent_message_email', EXISTS (
      SELECT 1 FROM private.email_log
      WHERE user_id = n.user_id AND kind = 'message' AND sent_at > now() - interval '30 minutes'
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_log_email(p_user UUID, p_kind TEXT)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER
SET search_path = public, private
AS $$
  INSERT INTO private.email_log (user_id, kind) VALUES (p_user, p_kind);
$$;

CREATE OR REPLACE FUNCTION public.notify_get_secret(p_key TEXT)
RETURNS TEXT
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, private
AS $$
  SELECT value FROM private.app_secrets WHERE key = p_key;
$$;

-- Guarda un secreto sólo si no existe (la función genera las claves VAPID una vez)
CREATE OR REPLACE FUNCTION public.notify_init_secret(p_key TEXT, p_value TEXT)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  INSERT INTO private.app_secrets (key, value) VALUES (p_key, p_value) ON CONFLICT (key) DO NOTHING;
  RETURN (SELECT value FROM private.app_secrets WHERE key = p_key);
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_forget_token(p_token TEXT)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.push_tokens WHERE token = p_token;
$$;

REVOKE ALL ON FUNCTION public.notify_claim(UUID), public.notify_log_email(UUID, TEXT),
  public.notify_get_secret(TEXT), public.notify_init_secret(TEXT, TEXT), public.notify_forget_token(TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_claim(UUID), public.notify_log_email(UUID, TEXT),
  public.notify_get_secret(TEXT), public.notify_init_secret(TEXT, TEXT), public.notify_forget_token(TEXT)
  TO service_role;

-- ---------- Trigger: ahora llama a `notify` sólo con el id ----------
CREATE OR REPLACE FUNCTION public.trigger_send_push()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://nclfmxgretksfymknfye.supabase.co/functions/v1/notify',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('id', NEW.id)
  );
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.trigger_send_push() FROM PUBLIC, anon, authenticated;
