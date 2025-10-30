-- ═══════════════════════════════════════════════════════════════════════════════
-- Script 047: FIX CRÍTICO - Corregir tipo de invoice_id en invoice_items
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- PROBLEMA: invoice_id en invoice_items es UUID pero debería ser TEXT
-- SOLUCIÓN: Recrear la tabla con el tipo correcto
--
-- IMPORTANTE: Este script eliminará todos los items de factura existentes
-- Si tienes datos importantes, haz un backup primero
-- ═══════════════════════════════════════════════════════════════════════════════

-- Paso 1: Eliminar la tabla invoice_items existente
DROP TABLE IF EXISTS public.invoice_items CASCADE;

-- Paso 2: Recrear la tabla con el esquema correcto
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id TEXT NOT NULL REFERENCES public.invoices(invoice_number) ON DELETE CASCADE,
  description TEXT NOT NULL DEFAULT '',
  reference TEXT,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Paso 3: Crear índices
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_description ON public.invoice_items(description);

-- Paso 4: Habilitar RLS
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Paso 5: Crear políticas RLS
DROP POLICY IF EXISTS "Enable read access for all users" ON public.invoice_items;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.invoice_items;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.invoice_items;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.invoice_items;

CREATE POLICY "Enable read access for all users"
ON public.invoice_items FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON public.invoice_items FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON public.invoice_items FOR UPDATE
USING (true);

CREATE POLICY "Enable delete access for all users"
ON public.invoice_items FOR DELETE
USING (true);

-- Paso 6: Agregar comentarios
COMMENT ON TABLE public.invoice_items IS 'Items de factura con referencia TEXT a invoice_number';
COMMENT ON COLUMN public.invoice_items.invoice_id IS 'Referencia al invoice_number (TEXT) de la tabla invoices';
COMMENT ON COLUMN public.invoice_items.description IS 'Descripción del producto/servicio';
COMMENT ON COLUMN public.invoice_items.reference IS 'Referencia o SKU del producto (opcional)';
COMMENT ON COLUMN public.invoice_items.quantity IS 'Cantidad de unidades';
COMMENT ON COLUMN public.invoice_items.unit_price IS 'Precio unitario';
COMMENT ON COLUMN public.invoice_items.total IS 'Total calculado (quantity * unit_price)';

-- Verificación final
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'invoice_items'
ORDER BY ordinal_position;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ TABLA invoice_items RECREADA CORRECTAMENTE';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Cambios realizados:';
    RAISE NOTICE '  ✅ invoice_id ahora es TEXT (correcto)';
    RAISE NOTICE '  ✅ Referencia correcta a invoices(invoice_number)';
    RAISE NOTICE '  ✅ Todas las columnas configuradas';
    RAISE NOTICE '  ✅ Políticas RLS creadas';
    RAISE NOTICE '  ✅ Índices creados';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANTE:';
    RAISE NOTICE '  ⚠️ Los items de factura anteriores se eliminaron';
    RAISE NOTICE '  ✅ Nuevas facturas funcionarán correctamente';
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

