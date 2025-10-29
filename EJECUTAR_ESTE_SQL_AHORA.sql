-- =====================================================
-- ⚠️ EJECUTAR ESTE SQL EN SUPABASE AHORA ⚠️
-- =====================================================
-- Actualización: Migración completa para facturación
-- =====================================================

-- 1. Agregar columnas de medidas a la tabla inventory (si no existen)
ALTER TABLE public.inventory
ADD COLUMN IF NOT EXISTS tamano TEXT,
ADD COLUMN IF NOT EXISTS grosor TEXT,
ADD COLUMN IF NOT EXISTS medida_mm TEXT;

-- 2. Agregar columna reference (SKU) a invoice_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoice_items'
    AND column_name = 'reference'
  ) THEN
    ALTER TABLE public.invoice_items
    ADD COLUMN reference TEXT;

    -- Crear índice para mejorar búsquedas
    CREATE INDEX IF NOT EXISTS idx_invoice_items_reference
    ON public.invoice_items(reference);

    RAISE NOTICE 'Columna reference agregada exitosamente a invoice_items';
  ELSE
    RAISE NOTICE 'La columna reference ya existe en invoice_items';
  END IF;
END $$;

-- 3. Verificar estructura de inventory
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'inventory'
  AND table_schema = 'public'
  AND column_name IN ('tamano', 'grosor', 'medida_mm')
ORDER BY column_name;

-- 4. Verificar estructura de invoice_items
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'invoice_items'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- INSTRUCCIONES PARA EJECUTAR:
-- =====================================================
-- 1. Ir a: https://supabase.com/dashboard
-- 2. Seleccionar tu proyecto
-- 3. Click en "SQL Editor" en el menú lateral
-- 4. Click en "New query"
-- 5. Copiar y pegar TODO este contenido
-- 6. Click en "RUN" o presionar Ctrl+Enter
-- 7. Verificar que las columnas se hayan creado correctamente
-- =====================================================


