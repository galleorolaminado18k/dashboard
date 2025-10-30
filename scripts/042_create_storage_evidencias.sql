-- ========================================
-- SCRIPT 042: CREAR STORAGE PARA EVIDENCIAS
-- ========================================
-- Ejecutar en el SQL Editor de Supabase
-- Fecha: 2025-10-29

-- Crear bucket para facturas/evidencias
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Primero eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;

-- Política: Permitir subida PÚBLICA (sin autenticación)
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'invoices');

-- Política: Permitir lectura pública
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'invoices');

-- Política: Permitir eliminar cualquier archivo (público)
CREATE POLICY "Allow public delete"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'invoices');

-- Mensaje final
DO $$
BEGIN
  RAISE NOTICE '✅ Storage bucket "invoices" creado exitosamente';
  RAISE NOTICE '✅ Políticas de acceso configuradas';
END $$;

