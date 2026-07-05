-- ============================================================
-- Generación automática de notificaciones (triggers) +
-- tabla de push tokens para notificaciones nativas.
-- Los triggers corren como SECURITY DEFINER para poder insertar
-- notificaciones a cualquier usuario sin violar RLS.
-- ============================================================

-- ---------- Nuevo mensaje → notificar a la otra parte ----------
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id UUID;
  v_provider_user_id UUID;
  v_recipient UUID;
  v_sender_name TEXT;
BEGIN
  SELECT j.client_id, p.user_id INTO v_client_id, v_provider_user_id
  FROM public.jobs j
  LEFT JOIN public.providers p ON p.id = j.provider_id
  WHERE j.id = NEW.job_id;

  IF NEW.sender_id = v_client_id THEN
    v_recipient := v_provider_user_id;
  ELSE
    v_recipient := v_client_id;
  END IF;

  IF v_recipient IS NOT NULL AND v_recipient <> NEW.sender_id THEN
    SELECT name INTO v_sender_name FROM public.users WHERE id = NEW.sender_id;
    INSERT INTO public.notifications (user_id, title, body, type, data)
    VALUES (v_recipient, 'Nuevo mensaje',
            COALESCE(v_sender_name, 'Alguien') || ' te escribió',
            'message', jsonb_build_object('job_id', NEW.job_id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS messages_notify ON public.messages;
CREATE TRIGGER messages_notify
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- ---------- Nueva solicitud asignada → notificar al prestador ----------
CREATE OR REPLACE FUNCTION public.notify_new_job()
RETURNS TRIGGER AS $$
DECLARE
  v_provider_user_id UUID;
BEGIN
  IF NEW.provider_id IS NOT NULL THEN
    SELECT user_id INTO v_provider_user_id FROM public.providers WHERE id = NEW.provider_id;
    IF v_provider_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, type, data)
      VALUES (v_provider_user_id, 'Nueva solicitud',
              'Recibiste una solicitud de ' || NEW.category,
              'job_new', jsonb_build_object('job_id', NEW.id));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS jobs_notify_new ON public.jobs;
CREATE TRIGGER jobs_notify_new
  AFTER INSERT ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_job();

-- ---------- Cambios de estado del job ----------
CREATE OR REPLACE FUNCTION public.notify_job_status()
RETURNS TRIGGER AS $$
DECLARE
  v_provider_user_id UUID;
BEGIN
  SELECT user_id INTO v_provider_user_id FROM public.providers WHERE id = NEW.provider_id;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'accepted' THEN
      INSERT INTO public.notifications (user_id, title, body, type, data)
      VALUES (NEW.client_id, 'Solicitud aceptada',
              'Tu solicitud de ' || NEW.category || ' fue aceptada',
              'job_accepted', jsonb_build_object('job_id', NEW.id));
    ELSIF NEW.status = 'in_progress' THEN
      INSERT INTO public.notifications (user_id, title, body, type, data)
      VALUES (NEW.client_id, 'Trabajo en progreso',
              'El prestador comenzó el trabajo',
              'job_progress', jsonb_build_object('job_id', NEW.id));
    ELSIF NEW.status = 'completed' THEN
      IF v_provider_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, body, type, data)
        VALUES (v_provider_user_id, 'Trabajo confirmado',
                'El cliente confirmó el trabajo completado',
                'job_completed', jsonb_build_object('job_id', NEW.id));
      END IF;
    ELSIF NEW.status = 'cancelled' THEN
      INSERT INTO public.notifications (user_id, title, body, type, data)
      VALUES (NEW.client_id, 'Trabajo cancelado', 'El trabajo fue cancelado',
              'job_cancelled', jsonb_build_object('job_id', NEW.id));
      IF v_provider_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, body, type, data)
        VALUES (v_provider_user_id, 'Trabajo cancelado', 'El trabajo fue cancelado',
                'job_cancelled', jsonb_build_object('job_id', NEW.id));
      END IF;
    END IF;
  END IF;

  -- Prestador marcó terminado (espera confirmación del cliente)
  IF NEW.provider_completed_at IS NOT NULL AND OLD.provider_completed_at IS NULL THEN
    INSERT INTO public.notifications (user_id, title, body, type, data)
    VALUES (NEW.client_id, 'Trabajo terminado',
            'El prestador marcó el trabajo como terminado. Confirmá para cerrarlo.',
            'job_done', jsonb_build_object('job_id', NEW.id));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS jobs_notify_status ON public.jobs;
CREATE TRIGGER jobs_notify_status
  AFTER UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.notify_job_status();

-- ---------- Nueva cotización → notificar al cliente ----------
CREATE OR REPLACE FUNCTION public.notify_new_quote()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id UUID;
BEGIN
  SELECT client_id INTO v_client_id FROM public.jobs WHERE id = NEW.job_id;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, type, data)
    VALUES (v_client_id, 'Nueva cotización',
            'Recibiste una cotización por $' || NEW.amount,
            'quote', jsonb_build_object('job_id', NEW.job_id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS quotes_notify ON public.quotes;
CREATE TRIGGER quotes_notify
  AFTER INSERT ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_quote();

-- ---------- Nueva reseña → notificar al prestador ----------
CREATE OR REPLACE FUNCTION public.notify_new_review()
RETURNS TRIGGER AS $$
DECLARE
  v_provider_user_id UUID;
BEGIN
  SELECT user_id INTO v_provider_user_id FROM public.providers WHERE id = NEW.provider_id;
  IF v_provider_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, type, data)
    VALUES (v_provider_user_id, 'Nueva reseña',
            'Recibiste una calificación de ' || NEW.rating || ' estrellas',
            'review', jsonb_build_object('job_id', NEW.job_id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS reviews_notify ON public.reviews;
CREATE TRIGGER reviews_notify
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_review();

-- ============================================================
-- Push tokens (para notificaciones nativas via Capacitor/FCM)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL,
  platform    TEXT CHECK (platform IN ('android','ios','web')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON public.push_tokens(user_id);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Push tokens propios select" ON public.push_tokens
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Push tokens propios insert" ON public.push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Push tokens propios delete" ON public.push_tokens
  FOR DELETE USING (auth.uid() = user_id);
