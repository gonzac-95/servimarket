-- ============================================================
-- Bandeja de mensajes: permitir marcar como leído.
--
-- messages sólo tenía policies de SELECT e INSERT, así que el
-- contador de no leídos nunca podía bajar. Se habilita UPDATE
-- para el DESTINATARIO (nunca el emisor) y, por grant de columna,
-- únicamente sobre `read` — el texto de un mensaje ajeno sigue
-- siendo inmodificable.
-- ============================================================

REVOKE UPDATE ON public.messages FROM anon, authenticated;
GRANT UPDATE (read) ON public.messages TO authenticated;

DROP POLICY IF EXISTS "Messages update read recipient" ON public.messages;
CREATE POLICY "Messages update read recipient"
  ON public.messages FOR UPDATE
  USING (
    sender_id <> auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id AND (
        j.client_id = auth.uid() OR
        (SELECT user_id FROM public.providers WHERE id = j.provider_id) = auth.uid()
      )
    )
  );

-- Acelera el conteo de no leídos por conversación
CREATE INDEX IF NOT EXISTS idx_messages_job_read ON public.messages(job_id, read);
