-- =====================================================
-- ACTUALIZAR FACTURA 000021 CON VALOR REAL DE ENVÍO
-- =====================================================
-- Factura: 000021
-- Cliente: GREYCY SALAMANCA
-- Valor de envío real: $24.628 COP
-- Fecha: 2025-11-03

-- =====================================================
-- PASO 1: Ver datos actuales de la factura
-- =====================================================

SELECT
    invoice_number,
    client_name,
    subtotal AS subtotal_actual,
    tax_amount,
    shipping_cost AS shipping_actual,
    total AS total_actual,
    created_at
FROM public.invoices
WHERE invoice_number = '000021';

-- =====================================================
-- PASO 2: Actualizar el shipping_cost
-- =====================================================

-- La factura tiene:
-- - Producto: $155.000 (con IVA incluido)
-- - Producto sin IVA: $130.252
-- - IVA (19%): $24.748
-- - Envío: $24.628
--
-- El subtotal debe ser: $130.252 + $24.628 = $154.880
-- El total debe ser: $155.000 + $24.628 = $179.628

UPDATE public.invoices
SET
    shipping_cost = 24628,
    subtotal = 154880,  -- productos sin IVA + envío
    total = 179628      -- productos con IVA + envío
WHERE invoice_number = '000021';

-- =====================================================
-- PASO 3: Verificar los cambios
-- =====================================================

SELECT
    invoice_number,
    client_name,
    subtotal AS subtotal_nuevo,
    tax_amount AS iva,
    shipping_cost AS shipping_nuevo,
    total AS total_nuevo,
    CASE
        WHEN shipping_cost = 24628 THEN '✅ CORRECTO'
        ELSE '❌ INCORRECTO'
    END as estado_envio,
    CASE
        WHEN total = 179628 THEN '✅ CORRECTO'
        ELSE '❌ INCORRECTO'
    END as estado_total
FROM public.invoices
WHERE invoice_number = '000021';

-- =====================================================
-- PASO 4: Ver el desglose completo
-- =====================================================

SELECT
    '000021' as factura,
    'Producto (con IVA)' as concepto,
    155000 as valor
UNION ALL
SELECT
    '000021',
    'Producto (sin IVA)',
    130252
UNION ALL
SELECT
    '000021',
    'IVA (19%)',
    24748
UNION ALL
SELECT
    '000021',
    'Envío (sin IVA)',
    24628
UNION ALL
SELECT
    '000021',
    'SUBTOTAL (sin IVA + envío)',
    154880
UNION ALL
SELECT
    '000021',
    'TOTAL (con IVA + envío)',
    179628;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- ✅ shipping_cost: 24628 (era 0)
-- ✅ subtotal: 154880 (era 155000)
-- ✅ total: 179628 (era 184450)
-- ✅ La factura ahora muestra el valor REAL del envío

-- =====================================================
-- NOTA IMPORTANTE
-- =====================================================
-- Ahora cuando abras la factura 000021 verás:
--
-- REF | DESCRIPCIÓN          | UND | IVA 19% | PRECIO BASE | PRECIO NETO
-- 1   | Balines #4MM DORADOS | 1   | $24.748 | $130.252    | $155.000
-- 2   | COSTO DE ENVÍO       | 1   | 0%      | $24.628     | $24.628
--
-- SUBTOTAL:    $154.880  (130.252 + 24.628)
-- IMPUESTOS:   $24.748   (solo del producto)
-- TOTAL NETO:  $179.628  (155.000 + 24.628)

