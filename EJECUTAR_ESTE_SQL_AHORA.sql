-- =====================================================
-- ⚠️ EJECUTAR ESTE SQL EN SUPABASE AHORA ⚠️
-- =====================================================
-- Error actual: "Could not find the 'grosor' column"
-- Solución: Agregar las columnas faltantes
-- =====================================================

-- 1. Agregar columnas de medidas a la tabla inventory
ALTER TABLE public.inventory
ADD COLUMN IF NOT EXISTS tamano TEXT,
ADD COLUMN IF NOT EXISTS grosor TEXT,
ADD COLUMN IF NOT EXISTS medida_mm TEXT;

-- 2. Verificar que se crearon correctamente
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'inventory'
  AND table_schema = 'public'
  AND column_name IN ('tamano', 'grosor', 'medida_mm')
ORDER BY column_name;

-- =====================================================
-- INSTRUCCIONES PARA EJECUTAR:
-- =====================================================
-- 1. Ir a: https://supabase.com/dashboard
-- 2. Seleccionar tu proyecto
-- 3. Click en "SQL Editor" en el menú lateral
-- 4. Click en "New query"
-- 5. Copiar y pegar TODO este contenido
-- 6. Click en "RUN" o presionar Ctrl+Enter
-- 7. Verificar que aparezcan 3 filas en el resultado
-- =====================================================

-- Resultado esperado:
-- column_name | data_type | is_nullable
-- grosor      | text      | YES
-- medida_mm   | text      | YES
-- tamano      | text      | YES

