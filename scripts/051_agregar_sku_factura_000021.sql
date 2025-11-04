-- ========================================
-- SCRIPT 051: AGREGAR SKU A FACTURA 000021
-- ========================================
-- Ejecutar en el SQL Editor de Supabase
-- Fecha: 2025-11-03
-- ========================================

-- Ver la estructura actual de invoice_items
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'invoice_items'
ORDER BY ordinal_position;

-- Ver los items actuales de la factura 000021
SELECT
    id,
    invoice_id,
    description,
    reference,
    quantity,
    unit_price,
    total
FROM public.invoice_items
WHERE invoice_id::text = (
    SELECT id::text
    FROM public.invoices
    WHERE invoice_number = '000021'
);

-- ========================================
-- VERIFICAR SI EXISTE LA COLUMNA reference
-- ========================================
-- Si la columna NO existe, ejecuta esto:
-- ALTER TABLE public.invoice_items
-- ADD COLUMN IF NOT EXISTS reference TEXT;

-- ========================================
-- ACTUALIZAR EL SKU DEL PRODUCTO
-- ========================================
-- Actualizar el item "Balines #4MM DORADOS" con SKU "04-100"
UPDATE public.invoice_items
SET reference = '04-100'
WHERE invoice_id::text = (
    SELECT id::text
    FROM public.invoices
    WHERE invoice_number = '000021'
)
AND description LIKE '%Balines%';

-- ========================================
-- VERIFICAR EL RESULTADO
-- ========================================
SELECT
    i.invoice_number,
    ii.reference AS sku,
    ii.description,
    ii.quantity,
    ii.unit_price,
    ii.total
FROM public.invoice_items ii
JOIN public.invoices i ON ii.invoice_id = i.id
WHERE i.invoice_number = '000021'
ORDER BY ii.created_at;

-- ========================================
-- RESULTADO ESPERADO
-- ========================================
-- La factura 000021 ahora debería mostrar:
-- SKU: 04-100
-- DESCRIPCIÓN: Balines #4MM DORADOS
-- CANT: 1
-- IVA: 19%
-- TOTAL: $155.000

