-- ============================================================
-- LIMPIEZA DE LANZAMIENTO — correr UNA sola vez, el día de salir.
--
-- Deja la base sin datos de prueba. Se conservan SÓLO estas cuentas
-- (decisión de Gonzalo, 27/09/2026):
--   servimarket.admin@gmail.com   → admin
--   cardonagonzalo95@gmail.com    → cuenta de Gonzalo (prestador, queda sin verificar)
--   angtomatis@gmail.com, angietomatis@hotmail.com, fetomatis98@gmail.com → clientes
-- Todo lo demás (cuentas de prueba, trabajos, mensajes, reseñas,
-- presupuestos, notificaciones, documentos) se borra.
--
-- ANTES DE CORRER:
--   1. En Supabase → Authentication → Users → "Add user": crear
--      servimarket.admin@gmail.com con una contraseña nueva y "Auto confirm".
--   2. Revisar el paso 0 (sólo lectura).
--
-- Todo va dentro de una transacción: si algo falla, no se borra nada.
-- ============================================================

-- Paso 0 (sólo lectura): qué cuentas se borran
-- select u.email, pu.role, pu.name, u.created_at::date
-- from auth.users u left join public.users pu on pu.id = u.id
-- where u.email not in ('servimarket.admin@gmail.com','cardonagonzalo95@gmail.com',
--   'angtomatis@gmail.com','angietomatis@hotmail.com','fetomatis98@gmail.com')
-- order by u.created_at;

BEGIN;

CREATE TEMP TABLE keep_accounts ON COMMIT DROP AS
SELECT id, email FROM auth.users
WHERE email IN ('servimarket.admin@gmail.com', 'cardonagonzalo95@gmail.com',
                'angtomatis@gmail.com', 'angietomatis@hotmail.com', 'fetomatis98@gmail.com');

-- 1) La cuenta nueva pasa a ser admin
UPDATE public.users SET role = 'admin', name = 'ServiMarket'
WHERE id = (SELECT id FROM auth.users WHERE email = 'servimarket.admin@gmail.com');

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users u JOIN auth.users a ON a.id = u.id
                 WHERE a.email = 'servimarket.admin@gmail.com' AND u.role = 'admin') THEN
    RAISE EXCEPTION 'Primero creá servimarket.admin@gmail.com en Authentication → Users';
  END IF;
END $$;

-- 2) Datos transaccionales: todo es de prueba (también el de las cuentas que quedan)
DELETE FROM public.payments;
DELETE FROM public.reviews;
DELETE FROM public.quotes;
DELETE FROM public.messages;
DELETE FROM public.jobs;
DELETE FROM public.notifications;
DELETE FROM public.favorites;
DELETE FROM public.verification_documents;
DELETE FROM public.oauth_states;
DELETE FROM public.provider_mp_credentials;
DELETE FROM public.push_tokens WHERE user_id NOT IN (SELECT id FROM keep_accounts);
DELETE FROM private.email_log;
UPDATE public.app_config SET updated_by = NULL;

-- 3) Perfiles y cuentas que no se conservan
DELETE FROM public.providers WHERE user_id NOT IN (SELECT id FROM keep_accounts);
DELETE FROM public.users     WHERE id      NOT IN (SELECT id FROM keep_accounts);
DELETE FROM auth.users       WHERE id      NOT IN (SELECT id FROM keep_accounts);

-- 4) Prestadores que quedan: arrancan de cero (sin reseñas y sin verificar;
--    tienen que volver a enviar el DNI desde /verificacion)
UPDATE public.providers SET
  rating_avg = 0, reviews_count = 0,
  documents_verified = FALSE, dni_verified = FALSE,
  background_check = FALSE, license_verified = FALSE,
  mp_user_id = NULL, mp_connected_at = NULL;

-- 5) Chequeo final: 5 cuentas, 1 prestador, 0 trabajos
SELECT (SELECT count(*) FROM auth.users)       AS auth_users,
       (SELECT count(*) FROM public.users)     AS users,
       (SELECT count(*) FROM public.providers) AS providers,
       (SELECT count(*) FROM public.jobs)      AS jobs;

COMMIT;

-- 6) Archivos: Supabase no deja borrarlos por SQL. Después del COMMIT:
--    Storage → bucket "avatars" y "verification-documents" → Empty bucket.
--    (Al 27/09 había 1 solo archivo, de una cuenta de prueba.)
