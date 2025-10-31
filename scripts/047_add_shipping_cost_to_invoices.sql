-- ═══════════════════════════════════════════════════════════════════════════════
-- Script de Migración 047: AGREGAR CAMPO SHIPPING_COST A INVOICES
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Este script agrega el campo shipping_cost (costo de envío) a la tabla invoices
-- El costo de envío NO incluye IVA y se suma directamente al total
--
-- Fecha: 2025-10-31
-- Propósito: Permitir registrar el costo de envío por separado en las facturas
-- ═══════════════════════════════════════════════════════════════════════════════

-- Agregar columna shipping_cost si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'invoices'
        AND column_name = 'shipping_cost'
    ) THEN
        ALTER TABLE public.invoices
        ADD COLUMN shipping_cost DECIMAL(10, 2) DEFAULT 0 NOT NULL;

        RAISE NOTICE '✅ Columna shipping_cost agregada a la tabla invoices';
        RAISE NOTICE 'ℹ️  El costo de envío NO incluye IVA';
    ELSE
        RAISE NOTICE '✓ Columna shipping_cost ya existe en la tabla invoices';
    END IF;
END $$;

-- Agregar comentario a la columna
COMMENT ON COLUMN public.invoices.shipping_cost IS 'Costo de envío (sin IVA). Se suma directamente al total.';

-- Verificar la estructura
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoices'
AND column_name = 'shipping_cost';

-- Mostrar mensaje de éxito
DO $$
BEGIN
    RAISE NOTICE '════════════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ Migración 047 completada exitosamente';
    RAISE NOTICE '📋 Campo shipping_cost agregado a la tabla invoices';
    RAISE NOTICE '💡 Ahora las facturas pueden incluir el costo de envío por separado';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════════════════';
END $$;

