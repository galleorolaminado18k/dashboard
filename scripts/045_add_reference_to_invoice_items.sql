-- =====================================================
-- SCRIPT 045: Agregar columna reference a invoice_items
-- =====================================================
-- Descripción: Agrega la columna reference (SKU) a la tabla
-- invoice_items para vincular con productos del inventario
-- =====================================================

-- Agregar columna reference si no existe
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

-- Verificar la estructura actualizada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoice_items'
ORDER BY ordinal_position;

