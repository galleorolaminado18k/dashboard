-- =====================================================
-- SCRIPT 040: Agregar campos de medidas a inventory
-- =====================================================

-- Agregar columnas de medidas
ALTER TABLE public.inventory
ADD COLUMN IF NOT EXISTS tamano TEXT,
ADD COLUMN IF NOT EXISTS grosor TEXT,
ADD COLUMN IF NOT EXISTS medida_mm TEXT;

-- Comentarios para documentar
COMMENT ON COLUMN public.inventory.tamano IS 'Tamaño - Obligatorio para CADENAS, PULSERAS, TOBILLERAS';
COMMENT ON COLUMN public.inventory.grosor IS 'Grosor - Obligatorio para CADENAS, PULSERAS, TOBILLERAS';
COMMENT ON COLUMN public.inventory.medida_mm IS 'Medida en MM - Obligatorio para ARETES, DIJES, MANILLAS, BALINES, ANILLOS, CANDONGAS, HERRAJES';

-- Verificar estructura
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'inventory'
  AND table_schema = 'public'
  AND column_name IN ('tamano', 'grosor', 'medida_mm')
ORDER BY ordinal_position;

