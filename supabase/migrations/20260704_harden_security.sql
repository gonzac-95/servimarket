-- ============================================================
-- Endurecimiento de seguridad (pre-lanzamiento Play Store).
--
-- 1) users: email / teléfono / lat-lng dejan de ser legibles por
--    cualquiera. El front lee sólo columnas públicas de perfil;
--    el perfil propio completo sale de get_my_profile() y el panel
--    admin usa admin_list_users() / admin_set_blocked().
-- 2) users: por columna, sólo se editan campos de perfil
--    (antes un usuario podía setearse role='admin' o desbloquearse).
-- 3) jobs: trigger jobs_guard valida transiciones de estado y quién
--    puede cambiar qué (precio congelado después de aceptar, etc.).
-- 4) reviews: exige pago aprobado — "cada reseña es real" pasa a
--    estar garantizado en la base, no sólo en la UI.
-- ============================================================

-- ---------- 1) users: lectura por columna ----------
REVOKE SELECT ON public.users FROM anon, authenticated;
GRANT SELECT (id, role, name, avatar_url, city, province, country, created_at, is_blocked)
  ON public.users TO anon, authenticated;

-- ---------- 2) users: escritura por columna ----------
REVOKE UPDATE ON public.users FROM anon, authenticated;
GRANT UPDATE (name, phone, avatar_url, city, province, country, lat, lng)
  ON public.users TO authenticated;
REVOKE INSERT, DELETE ON public.users FROM anon, authenticated;

-- Perfil propio completo (incluye email y teléfono)
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.users
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT * FROM public.users WHERE id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- Listado completo de usuarios para el panel admin
CREATE OR REPLACE FUNCTION public.admin_list_users(p_limit INT DEFAULT 50)
RETURNS SETOF public.users
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public
AS $$
BEGIN
  IF (SELECT role FROM public.users WHERE id = auth.uid()) IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY SELECT * FROM public.users ORDER BY created_at DESC LIMIT p_limit;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_list_users(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_users(INT) TO authenticated;

-- Bloquear / desbloquear usuarios (is_blocked ya no es editable directo)
CREATE OR REPLACE FUNCTION public.admin_set_blocked(p_user UUID, p_blocked BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT role FROM public.users WHERE id = auth.uid()) IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.users SET is_blocked = p_blocked WHERE id = p_user;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_blocked(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_blocked(UUID, BOOLEAN) TO authenticated;

-- ---------- 3) jobs: transiciones válidas ----------
CREATE OR REPLACE FUNCTION public.jobs_guard()
RETURNS TRIGGER AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_provider_user UUID;
  v_is_client BOOLEAN;
  v_is_provider BOOLEAN;
BEGIN
  -- Sin JWT (service role / procesos internos): sin restricciones
  IF v_actor IS NULL THEN RETURN NEW; END IF;
  -- Admin: sin restricciones
  IF (SELECT role FROM public.users WHERE id = v_actor) = 'admin' THEN RETURN NEW; END IF;

  SELECT user_id INTO v_provider_user FROM public.providers WHERE id = OLD.provider_id;
  v_is_client   := (v_actor = OLD.client_id);
  v_is_provider := (v_actor = v_provider_user);

  -- Las partes nunca cambian a quién pertenece el trabajo
  IF NEW.client_id IS DISTINCT FROM OLD.client_id
     OR NEW.provider_id IS DISTINCT FROM OLD.provider_id THEN
    RAISE EXCEPTION 'jobs_guard: campo inmutable';
  END IF;

  -- Precio: sólo se fija mientras está pendiente (al aceptar una cotización)
  IF NEW.price IS DISTINCT FROM OLD.price AND OLD.status <> 'pending' THEN
    RAISE EXCEPTION 'jobs_guard: el precio no se puede cambiar después de aceptar';
  END IF;

  -- Detalles del pedido: sólo el cliente y sólo con el pedido pendiente
  IF (NEW.category IS DISTINCT FROM OLD.category
      OR NEW.description IS DISTINCT FROM OLD.description
      OR NEW.address IS DISTINCT FROM OLD.address
      OR NEW.scheduled_at IS DISTINCT FROM OLD.scheduled_at
      OR NEW.photos IS DISTINCT FROM OLD.photos)
     AND NOT (v_is_client AND OLD.status = 'pending') THEN
    RAISE EXCEPTION 'jobs_guard: detalles sólo editables por el cliente en pendiente';
  END IF;

  -- provider_completed_at: lo marca el prestador con el trabajo en curso
  IF NEW.provider_completed_at IS DISTINCT FROM OLD.provider_completed_at
     AND NOT (v_is_provider AND OLD.status = 'in_progress'
              AND OLD.provider_completed_at IS NULL
              AND NEW.provider_completed_at IS NOT NULL) THEN
    RAISE EXCEPTION 'jobs_guard: marca de finalizado inválida';
  END IF;

  -- client_confirmed_at: lo marca el cliente al confirmar
  IF NEW.client_confirmed_at IS DISTINCT FROM OLD.client_confirmed_at
     AND NOT (v_is_client AND OLD.client_confirmed_at IS NULL
              AND NEW.client_confirmed_at IS NOT NULL) THEN
    RAISE EXCEPTION 'jobs_guard: confirmación inválida';
  END IF;

  -- Transiciones de estado permitidas
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'cancelled') THEN
      NULL; -- prestador acepta/rechaza; cliente acepta cotización o cancela
    ELSIF OLD.status = 'accepted' AND NEW.status = 'in_progress' AND v_is_provider THEN
      NULL; -- el prestador inicia el trabajo
    ELSIF OLD.status = 'accepted' AND NEW.status = 'cancelled' THEN
      NULL; -- cualquiera de las partes puede cancelar antes de iniciar
    ELSIF OLD.status = 'in_progress' AND NEW.status = 'completed'
          AND v_is_client AND OLD.provider_completed_at IS NOT NULL THEN
      NULL; -- el cliente confirma después de que el prestador marcó terminado
    ELSE
      RAISE EXCEPTION 'jobs_guard: transición de estado no permitida (% -> %)', OLD.status, NEW.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS jobs_guard ON public.jobs;
CREATE TRIGGER jobs_guard
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.jobs_guard();

-- ---------- 4) reviews: sólo con pago aprobado ----------
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
    ) AND
    EXISTS (
      SELECT 1 FROM public.payments p
      WHERE p.job_id = reviews.job_id AND p.status = 'approved'
    )
  );
