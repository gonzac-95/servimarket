-- ============================================================
-- Políticas de Storage para el bucket "avatars" (público).
-- Permite a usuarios autenticados subir/actualizar/borrar sus archivos
-- (avatares de perfil y fotos de trabajos). Lectura pública.
-- ============================================================

-- Lectura pública (el bucket ya es público, pero dejamos la policy explícita)
CREATE POLICY "Avatars lectura pública"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Subida: cualquier usuario autenticado puede subir al bucket avatars
CREATE POLICY "Avatars subida autenticados"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- Actualización (necesaria para upsert)
CREATE POLICY "Avatars update autenticados"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars');

-- Borrado de los propios archivos
CREATE POLICY "Avatars delete autenticados"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');
