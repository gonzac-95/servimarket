-- ============================================================
-- LIMPIEZA DE LANZAMIENTO — correr UNA sola vez, el día de salir.
-- Deja la base vacía salvo la cuenta admin servimarket.admin@gmail.com.
--
-- ANTES DE CORRER:
--   1. En Supabase → Authentication → Users → "Add user": crear
--      servimarket.admin@gmail.com con una contraseña nueva y "Auto confirm".
--   2. Revisar la lista de la consulta de abajo (paso 0): si alguna
--      cuenta es de un prestador o cliente REAL, avisar antes de borrar.
--
-- Todo va dentro de una transacción: si algo falla, no se borra nada.
-- ============================================================

-- Paso 0 (sólo lectura): qué se va a borrar
-- select u.email, pu.role, pu.name, u.created_at::date
-- from auth.users u left join public.users pu on pu.id = u.id
-- where u.email <> 'servimarket.admin@gmail.com' order by u.created_at;

BEGIN;

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

-- 2) Datos transaccionales (todo es de prueba)
DELETE FROM public.payments;
DELETE FROM public.reviews;
DELETE FROM public.quotes;
DELETE FROM public.messages;
DELETE FROM public.jobs;
DELETE FROM public.notifications;
DELETE FROM public.favorites;
DELETE FROM public.push_tokens;
DELETE FROM public.verification_documents;
DELETE FROM public.oauth_states;
DELETE FROM public.provider_mp_credentials;
UPDATE public.app_config SET updated_by = NULL;

-- 3) Perfiles y cuentas, menos el admin
DELETE FROM public.providers
WHERE user_id <> (SELECT id FROM auth.users WHERE email = 'servimarket.admin@gmail.com');
DELETE FROM public.users
WHERE id <> (SELECT id FROM auth.users WHERE email = 'servimarket.admin@gmail.com');
DELETE FROM auth.users
WHERE email <> 'servimarket.admin@gmail.com';

-- 4) Archivos subidos: Supabase no permite borrarlos por SQL.
--    Después del COMMIT: Storage → bucket "avatars" y "verification-documents"
--    → seleccionar todo → Delete (o "Empty bucket").

-- 5) Chequeo final: tiene que devolver 1 usuario (el admin)
SELECT (SELECT count(*) FROM auth.users) AS auth_users,
       (SELECT count(*) FROM public.users) AS users,
       (SELECT count(*) FROM public.providers) AS providers,
       (SELECT count(*) FROM public.jobs) AS jobs;

COMMIT;
