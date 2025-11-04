-- ========================================
-- SCRIPT 051: AGREGAR SKU A FACTURA 000021
-- ========================================
-- Ejecutar en el SQL Editor de Supabase
-- Fecha: 2025-11-03
-- ========================================
--
-- IMPORTANTE: La tabla 'invoices' usa 'invoice_number' como PRIMARY KEY
-- NO tiene columna 'id', solo 'invoice_number' (TEXT)
-- invoice_items.invoice_id es FK a invoices.invoice_number
-- ========================================

-- ========================================
-- PASO 1: VER ESTRUCTURA DE invoice_items
-- ========================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'invoice_items'
ORDER BY ordinal_position;

-- ========================================
-- PASO 2: VER ESTRUCTURA DE invoices
-- ========================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'invoices'
ORDER BY ordinal_position;

-- ========================================
-- PASO 3: VER LA FACTURA 000021
-- ========================================
SELECT
    invoice_number,
    client_name,
    client_nit,
    client_email,
    subtotal,
    tax_amount,
    total,
    status,
    payment_method,
    created_at
FROM public.invoices
WHERE invoice_number = '000021';

-- ========================================
-- PASO 4: VER ITEMS ACTUALES
-- ========================================
SELECT
    id,
    invoice_id,
    description,
    reference,
    quantity,
    unit_price,
    total,
    created_at
FROM public.invoice_items
WHERE invoice_id = '000021';

-- ========================================
-- PASO 5: AGREGAR COLUMNA reference SI NO EXISTE
-- ========================================
ALTER TABLE public.invoice_items
ADD COLUMN IF NOT EXISTS reference TEXT;

-- ========================================
-- PASO 6: ACTUALIZAR EL SKU
-- ========================================
UPDATE public.invoice_items
SET reference = '04-100'
WHERE invoice_id = '000021'
AND description ILIKE '%Balines%';

-- ========================================
-- PASO 7: VERIFICAR RESULTADO FINAL
-- ========================================
SELECT
    i.invoice_number,
    ii.reference AS sku,
    ii.description,
    ii.quantity,
    ii.unit_price,
    ii.total,
    ii.created_at
FROM public.invoice_items ii
JOIN public.invoices i ON ii.invoice_id = i.invoice_number
WHERE i.invoice_number = '000021'
ORDER BY ii.created_at;

-- ========================================
-- RESULTADO ESPERADO
-- ========================================
-- invoice_number: 000021
-- SKU: 04-100
-- DESCRIPCION: Balines #4MM DORADOS
-- CANT: 1
-- P. UNIT: $130.252,10
-- IVA: 19%
-- TOTAL: $155.000,00

