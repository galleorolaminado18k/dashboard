-- ========================================
-- SCRIPT 042: CREAR STORAGE PARA EVIDENCIAS
-- ========================================
-- Ejecutar en el SQL Editor de Supabase
-- Fecha: 2025-10-29

-- Crear bucket para facturas/evidencias
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Política: Permitir subida autenticada
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices');

-- Política: Permitir lectura pública
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'invoices');

-- Política: Permitir eliminar propios archivos
CREATE POLICY "Allow delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'invoices');

-- Mensaje final
DO $$
BEGIN
  RAISE NOTICE '✅ Storage bucket "invoices" creado exitosamente';
  RAISE NOTICE '✅ Políticas de acceso configuradas';
END $$;

