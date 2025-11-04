-- ========================================
-- SCRIPT 051B: VERIFICAR Y ACTUALIZAR SKU EN VENTA 000021
-- ========================================
-- Ejecutar en el SQL Editor de Supabase
-- Fecha: 2025-11-03
-- ========================================

-- ========================================
-- PASO 1: VER LA ESTRUCTURA DE SALES
-- ========================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sales'
ORDER BY ordinal_position;

-- ========================================
-- PASO 2: VER LA VENTA 000021
-- ========================================
SELECT
    id,
    cliente,
    products,
    total,
    factura,
    created_at
FROM public.sales
WHERE factura = '000021';

-- ========================================
-- PASO 3: VER LA ESTRUCTURA DE INVOICES
-- ========================================
SELECT
    id,
    invoice_number,
    client_name,
    invoice_items,
    created_at
FROM public.invoices
WHERE invoice_number = '000021';

-- ========================================
-- PASO 4: VER TODOS LOS INVOICE_ITEMS
-- ========================================
SELECT
    ii.id,
    ii.invoice_id,
    ii.description,
    ii.reference,
    ii.quantity,
    ii.unit_price,
    ii.total,
    i.invoice_number
FROM public.invoice_items ii
JOIN public.invoices i ON ii.invoice_id::text = i.id::text
WHERE i.invoice_number = '000021';

-- ========================================
-- ANÁLISIS: ¿DE DÓNDE VIENE EL SKU?
-- ========================================
-- La columna 'products' en 'sales' es JSONB
-- Puede contener algo como:
-- [{"descripcion": "Balines #4MM DORADOS", "ref": "04-100", ...}]

-- Si la venta tiene el SKU en products.ref, necesitamos:
-- 1. Actualizar el invoice_item con ese valor
-- 2. O asegurarnos que al crear la factura se copie

-- ========================================
-- PASO 5: ACTUALIZAR SKU MANUALMENTE
-- ========================================
UPDATE public.invoice_items
SET reference = '04-100'
WHERE invoice_id::text = (
    SELECT id::text
    FROM public.invoices
    WHERE invoice_number = '000021'
)
AND description ILIKE '%Balines%4MM%';

-- ========================================
-- PASO 6: VERIFICAR RESULTADO FINAL
-- ========================================
SELECT
    i.invoice_number,
    ii.reference AS sku,
    ii.description,
    ii.quantity,
    ii.unit_price,
    ii.total
FROM public.invoice_items ii
JOIN public.invoices i ON ii.invoice_id::text = i.id::text
WHERE i.invoice_number = '000021'
ORDER BY ii.created_at;

-- ========================================
-- RESULTADO ESPERADO
-- ========================================
-- invoice_number | sku    | description           | quantity | unit_price | total
-- 000021         | 04-100 | Balines #4MM DORADOS  | 1        | 155000     | 155000

