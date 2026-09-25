-- ============================================================
-- Lanzamiento web (sept 2026)
--
-- 1) handle_new_user: el rol del alta sólo puede ser client/provider
--    (antes cualquiera podía registrarse con role='admin' vía metadata).
-- 2) providers_guard: el prestador no puede tocar sus propios campos de
--    verificación, rating ni MercadoPago. Sólo admin o triggers internos.
-- 3) verification_documents: el prestador sube (siempre 'pending') y puede
--    borrar lo no aprobado; nunca aprobarse a sí mismo.
-- 4) sync_provider_verification: cada insignia = existe un doc aprobado de
--    ese tipo. documents_verified (lo que habilita aparecer) = DNI aprobado.
-- 5) Sólo prestadores verificados reciben solicitudes y cotizan.
-- 6) payments_enabled en app_config (arranca en false). Con pagos apagados
--    la reseña sólo exige trabajo confirmado por ambas partes.
-- 7) Se eliminan triggers de notificación duplicados (legacy).
-- 8) Bucket avatars: sólo imágenes, 10 MB, y cada uno edita/borra lo suyo.
-- ============================================================

-- ---------- 1) Alta de usuarios: rol permitido ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT := CASE WHEN NEW.raw_user_meta_data->>'role' = 'provider' THEN 'provider' ELSE 'client' END;
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), 'Usuario'), v_role);
  IF v_role = 'provider' THEN
    INSERT INTO public.providers (user_id, categories) VALUES (NEW.id, ARRAY[]::TEXT[]);
  END IF;
  RETURN NEW;
END;
$$;

-- ---------- 2) providers: campos protegidos ----------
CREATE OR REPLACE FUNCTION public.providers_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Llamadas desde otros triggers (rating, sync de verificación) o sin JWT: permitido
  IF pg_trigger_depth() > 1 OR auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.documents_verified := FALSE;
    NEW.dni_verified       := FALSE;
    NEW.license_verified   := FALSE;
    NEW.background_check   := FALSE;
    NEW.rating_avg         := 0;
    NEW.reviews_count      := 0;
    NEW.mp_user_id         := NULL;
    NEW.mp_connected_at    := NULL;
    RETURN NEW;
  END IF;

  NEW.id                 := OLD.id;
  NEW.user_id            := OLD.user_id;
  NEW.created_at         := OLD.created_at;
  NEW.documents_verified := OLD.documents_verified;
  NEW.dni_verified       := OLD.dni_verified;
  NEW.license_verified   := OLD.license_verified;
  NEW.background_check   := OLD.background_check;
  NEW.rating_avg         := OLD.rating_avg;
  NEW.reviews_count      := OLD.reviews_count;
  NEW.mp_user_id         := OLD.mp_user_id;
  NEW.mp_connected_at    := OLD.mp_connected_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS providers_guard ON public.providers;
CREATE TRIGGER providers_guard
  BEFORE INSERT OR UPDATE ON public.providers
  FOR EACH ROW EXECUTE FUNCTION public.providers_guard();

-- ---------- 3) verification_documents ----------
DROP POLICY IF EXISTS "Providers update own docs" ON public.verification_documents;
DROP POLICY IF EXISTS "Providers delete own pending docs" ON public.verification_documents;
CREATE POLICY "Providers delete own pending docs"
  ON public.verification_documents FOR DELETE
  USING (
    status <> 'approved' AND
    provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.verification_documents_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' THEN
    IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
      NEW.reviewed_at := now();
      NEW.reviewed_by := auth.uid();
    END IF;
    RETURN NEW;
  END IF;
  -- Prestador: todo lo que sube entra como pendiente
  NEW.status           := 'pending';
  NEW.rejection_reason := NULL;
  NEW.reviewed_at      := NULL;
  NEW.reviewed_by      := NULL;
  NEW.uploaded_at      := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS verification_documents_guard ON public.verification_documents;
CREATE TRIGGER verification_documents_guard
  BEFORE INSERT OR UPDATE ON public.verification_documents
  FOR EACH ROW EXECUTE FUNCTION public.verification_documents_guard();

-- ---------- 4) Sincronización de insignias ----------
CREATE OR REPLACE FUNCTION public.sync_provider_verification()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider UUID := COALESCE(NEW.provider_id, OLD.provider_id);
BEGIN
  UPDATE public.providers p SET
    dni_verified     = EXISTS (SELECT 1 FROM public.verification_documents d WHERE d.provider_id = p.id AND d.document_type = 'dni' AND d.status = 'approved'),
    background_check = EXISTS (SELECT 1 FROM public.verification_documents d WHERE d.provider_id = p.id AND d.document_type = 'background_check' AND d.status = 'approved'),
    license_verified = EXISTS (SELECT 1 FROM public.verification_documents d WHERE d.provider_id = p.id AND d.document_type = 'license' AND d.status = 'approved')
  WHERE p.id = v_provider;
  UPDATE public.providers SET documents_verified = dni_verified WHERE id = v_provider;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_provider_verification ON public.verification_documents;
CREATE TRIGGER trg_sync_provider_verification
  AFTER INSERT OR UPDATE OR DELETE ON public.verification_documents
  FOR EACH ROW EXECUTE FUNCTION public.sync_provider_verification();

-- Aviso al prestador cuando se revisa un documento
CREATE OR REPLACE FUNCTION public.notify_document_reviewed()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID;
  v_label TEXT := CASE NEW.document_type WHEN 'dni' THEN 'DNI' WHEN 'background_check' THEN 'certificado de antecedentes' ELSE 'matrícula' END;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status OR NEW.status = 'pending' THEN RETURN NEW; END IF;
  SELECT user_id INTO v_user FROM public.providers WHERE id = NEW.provider_id;
  IF v_user IS NULL THEN RETURN NEW; END IF;
  IF NEW.status = 'approved' THEN
    INSERT INTO public.notifications (user_id, title, body, type, data)
    VALUES (v_user, 'Documento aprobado', 'Aprobamos tu ' || v_label || '.', 'verification', jsonb_build_object('document_type', NEW.document_type));
  ELSE
    INSERT INTO public.notifications (user_id, title, body, type, data)
    VALUES (v_user, 'Documento rechazado', 'Revisá tu ' || v_label || COALESCE(': ' || NEW.rejection_reason, '') , 'verification', jsonb_build_object('document_type', NEW.document_type));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS verification_documents_notify ON public.verification_documents;
CREATE TRIGGER verification_documents_notify
  AFTER UPDATE OF status ON public.verification_documents
  FOR EACH ROW EXECUTE FUNCTION public.notify_document_reviewed();

-- Backfill: documents_verified pasa a reflejar el DNI aprobado
UPDATE public.providers SET documents_verified = dni_verified WHERE documents_verified IS DISTINCT FROM dni_verified;

-- ---------- 5) Sólo verificados reciben pedidos y cotizan ----------
CREATE OR REPLACE FUNCTION public.jobs_require_verified_provider()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.provider_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.providers WHERE id = NEW.provider_id AND documents_verified
  ) THEN
    RAISE EXCEPTION 'provider_not_verified';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS jobs_require_verified_provider ON public.jobs;
CREATE TRIGGER jobs_require_verified_provider
  BEFORE INSERT ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.jobs_require_verified_provider();

DROP POLICY IF EXISTS "Quotes insert provider" ON public.quotes;
CREATE POLICY "Quotes insert provider"
  ON public.quotes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = quotes.provider_id AND p.user_id = auth.uid() AND p.documents_verified
    )
  );

-- ---------- 6) Pagos apagados + reseñas ----------
INSERT INTO public.app_config (key, value, description)
VALUES ('payments_enabled', 'false'::jsonb, 'Cobro in-app con MercadoPago. false = el pago se arregla entre cliente y prestador, sin comisión.')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.payments_enabled()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT (value)::text = 'true' FROM public.app_config WHERE key = 'payments_enabled'), false);
$$;
GRANT EXECUTE ON FUNCTION public.payments_enabled() TO anon, authenticated;

DROP POLICY IF EXISTS "Reviews insert client" ON public.reviews;
CREATE POLICY "Reviews insert client"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = client_id AND
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id
        AND j.status = 'completed'
        AND j.client_id = auth.uid()
        AND j.provider_id = reviews.provider_id
        AND j.provider_completed_at IS NOT NULL
        AND j.client_confirmed_at IS NOT NULL
    ) AND (
      NOT public.payments_enabled() OR
      EXISTS (
        SELECT 1 FROM public.payments p
        WHERE p.job_id = reviews.job_id AND p.status = 'approved'
      )
    )
  );

-- ---------- 7) Triggers de notificación duplicados ----------
DROP TRIGGER IF EXISTS on_job_created ON public.jobs;
DROP TRIGGER IF EXISTS jobs_notify_provider ON public.jobs;
DROP TRIGGER IF EXISTS on_job_status_changed ON public.jobs;
DROP TRIGGER IF EXISTS on_message_created ON public.messages;

-- ---------- 8) Bucket avatars ----------
UPDATE storage.buckets
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif']
WHERE id = 'avatars';

DROP POLICY IF EXISTS "Avatars update autenticados" ON storage.objects;
CREATE POLICY "Avatars update autenticados"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "Avatars delete autenticados" ON storage.objects;
CREATE POLICY "Avatars delete autenticados"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "Avatars subida autenticados" ON storage.objects;
CREATE POLICY "Avatars subida autenticados"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- ---------- 9) Rating: el trigger corre con permisos propios ----------
-- Antes corría como el cliente que reseña y RLS le impedía actualizar
-- providers, así que rating_avg / reviews_count nunca se movían.
CREATE OR REPLACE FUNCTION public.update_provider_rating()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.providers
  SET rating_avg    = COALESCE((SELECT AVG(rating) FROM public.reviews WHERE provider_id = NEW.provider_id), 0),
      reviews_count = (SELECT COUNT(*) FROM public.reviews WHERE provider_id = NEW.provider_id)
  WHERE id = NEW.provider_id;
  RETURN NEW;
END;
$$;

-- ---------- 10) Realtime ----------
-- La publicación supabase_realtime estaba vacía: el chat, los estados del
-- trabajo y la campana no se actualizaban en vivo. RLS sigue aplicando.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['messages','jobs','notifications','quotes','payments','verification_documents'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- ---------- 11) Limpieza de funciones ----------
-- Funciones de triggers legacy que quedaron huérfanas
DROP FUNCTION IF EXISTS public.notify_provider_new_job();
DROP FUNCTION IF EXISTS public.notify_provider_on_new_job();
DROP FUNCTION IF EXISTS public.notify_job_status_change();

-- Las funciones de triggers no tienen que ser invocables por la API
REVOKE EXECUTE ON FUNCTION
  public.handle_new_user(), public.notify_document_reviewed(), public.notify_job_status(),
  public.notify_new_job(), public.notify_new_message(), public.notify_new_quote(),
  public.notify_new_review(), public.sync_provider_verification(), public.trigger_send_push(),
  public.update_provider_rating()
FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_list_users(INT), public.admin_set_blocked(UUID, BOOLEAN), public.get_my_profile() FROM anon;
