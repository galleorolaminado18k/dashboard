-- =====================================================
-- SCRIPT 048: AGREGAR CAMPO shipping_cost A INVOICES
-- =====================================================
-- Ejecutar en el SQL Editor de Supabase
-- Fecha: 2025-11-03
-- Descripción: Agrega el campo shipping_cost (costo de envío)
--              a la tabla invoices para almacenar el valor del envío

-- =====================================================
-- PASO 1: Agregar columna shipping_cost
-- =====================================================

-- Verificar si la columna ya existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'invoices'
        AND column_name = 'shipping_cost'
    ) THEN
        -- Agregar la columna con valor por defecto 0
        ALTER TABLE public.invoices
        ADD COLUMN shipping_cost NUMERIC(12,2) DEFAULT 0 NOT NULL;

        RAISE NOTICE '✅ Columna shipping_cost agregada exitosamente';
    ELSE
        RAISE NOTICE '✓ La columna shipping_cost ya existe';
    END IF;
END $$;

-- =====================================================
-- PASO 2: Agregar comentario descriptivo
-- =====================================================

COMMENT ON COLUMN public.invoices.shipping_cost IS 'Costo de envío sin IVA. Se suma al subtotal pero no se le calcula IVA.';

-- =====================================================
-- PASO 3: Actualizar facturas existentes (opcional)
-- =====================================================

-- Si quieres que las facturas antiguas tengan un valor de envío por defecto
-- Puedes descomentar y ajustar este UPDATE:

-- UPDATE public.invoices
-- SET shipping_cost = 15000
-- WHERE shipping_cost = 0
-- AND created_at < '2025-11-03';

-- O dejarlas en 0:
UPDATE public.invoices
SET shipping_cost = 0
WHERE shipping_cost IS NULL;

-- =====================================================
-- PASO 4: Verificar la columna
-- =====================================================

-- Ver información de la columna recién creada
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoices'
AND column_name = 'shipping_cost';

-- =====================================================
-- PASO 5: Ver algunas facturas con el nuevo campo
-- =====================================================

SELECT
    invoice_number,
    client_name,
    subtotal,
    tax_amount,
    shipping_cost,
    total,
    created_at
FROM public.invoices
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- ✅ La columna shipping_cost ahora existe en la tabla invoices
-- ✅ Todas las facturas tienen shipping_cost = 0 por defecto
-- ✅ Las nuevas facturas guardarán correctamente el valor del envío
-- ✅ El modal de factura mostrará la línea "COSTO DE ENVÍO"

-- =====================================================
-- NOTA IMPORTANTE
-- =====================================================
-- Después de ejecutar este script:
-- 1. Las facturas NUEVAS guardarán el shipping_cost correctamente
-- 2. Las facturas ANTIGUAS mostrarán shipping_cost = $0
-- 3. Si quieres agregar valores de envío a facturas antiguas,
--    deberás actualizarlas manualmente o con un script UPDATE

