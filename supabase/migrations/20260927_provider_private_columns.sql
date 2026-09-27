-- ============================================================
-- Datos privados del prestador (sept 2026)
--
-- CUIT/CUIL, número de matrícula y datos de MercadoPago se podían leer
-- sin sesión (la tabla providers tenía SELECT completo para anon).
-- Ahora anon/authenticated sólo leen las columnas públicas; el propio
-- prestador lee su fila completa con la RPC get_my_provider().
-- La web deja de usar select("*") sobre providers.
-- ============================================================

REVOKE SELECT ON public.providers FROM anon, authenticated;
GRANT SELECT (
  id, user_id, categories, bio, price_list, photos, service_radius_km, service_zones,
  documents_verified, dni_verified, license_verified, background_check,
  rating_avg, reviews_count, is_available, created_at
) ON public.providers TO anon, authenticated;

-- La fila completa del prestador logueado (incluye cuit_cuil, license_number, mp_*)
CREATE OR REPLACE FUNCTION public.get_my_provider()
RETURNS SETOF public.providers
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.providers WHERE user_id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.get_my_provider() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_provider() TO authenticated;
