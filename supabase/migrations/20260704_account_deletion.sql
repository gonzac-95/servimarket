-- ============================================================
-- Eliminación de cuenta (requisito Google Play).
--
-- Al borrar el usuario de auth.users, la fila de public.users
-- debe SOBREVIVIR anonimizada: jobs, payments y reviews la
-- referencian sin ON DELETE CASCADE y el historial de la otra
-- parte no debe romperse. Por eso se quita la FK hacia auth.users
-- (el borrado en cascada fallaría por esas referencias).
--
-- La edge function `delete-account` se encarga de:
--   1. borrar push_tokens / notifications / credenciales MP
--   2. anonimizar public.users (nombre, email, teléfono, avatar)
--   3. borrar el usuario de auth.users (ya sin cascada)
-- ============================================================

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
