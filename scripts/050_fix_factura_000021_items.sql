-- =====================================================
-- VERIFICAR Y CORREGIR ITEMS DE FACTURA 000021
-- =====================================================
-- Problema: La factura no muestra productos porque
-- no hay registros en la tabla invoice_items
-- Fecha: 2025-11-03

-- =====================================================
-- PASO 1: Verificar items actuales
-- =====================================================

-- Ver si existen items para la factura 000021
SELECT
    id,
    invoice_id,
    description,
    quantity,
    unit_price,
    total
FROM public.invoice_items
WHERE invoice_id = (
    SELECT id
    FROM public.invoices
    WHERE invoice_number = '000021'
);

-- Ver información completa de la factura
SELECT
    id,
    invoice_number,
    client_name,
    subtotal,
    tax_amount,
    shipping_cost,
    total
FROM public.invoices
WHERE invoice_number = '000021';

-- =====================================================
-- PASO 2: Agregar el item que falta (Balines #4MM DORADOS)
-- =====================================================

-- Primero, obtener el ID de la factura
DO $$
DECLARE
    v_invoice_id UUID;
BEGIN
    -- Obtener el ID de la factura 000021
    SELECT id INTO v_invoice_id
    FROM public.invoices
    WHERE invoice_number = '000021';

    -- Verificar si ya existen items
    IF NOT EXISTS (
        SELECT 1
        FROM public.invoice_items
        WHERE invoice_id = v_invoice_id
    ) THEN
        -- Insertar el producto: Balines #4MM DORADOS
        INSERT INTO public.invoice_items (
            invoice_id,
            description,
            quantity,
            unit_price,
            total
        ) VALUES (
            v_invoice_id,
            'Balines #4MM DORADOS',
            1,
            155000,  -- Precio con IVA incluido
            155000   -- Total = precio * cantidad
        );

        RAISE NOTICE '✅ Item agregado a la factura 000021';
    ELSE
        RAISE NOTICE '✓ La factura ya tiene items';
    END IF;
END $$;

-- =====================================================
-- PASO 3: Verificar que se agregó correctamente
-- =====================================================

SELECT
    ii.id,
    i.invoice_number,
    ii.description,
    ii.quantity,
    ii.unit_price,
    ii.total
FROM public.invoice_items ii
JOIN public.invoices i ON i.id = ii.invoice_id
WHERE i.invoice_number = '000021';

-- =====================================================
-- PASO 4: Ver la factura completa con items
-- =====================================================

SELECT
    i.invoice_number,
    i.client_name,
    i.subtotal,
    i.tax_amount,
    i.shipping_cost,
    i.total,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM public.invoice_items
            WHERE invoice_id = i.id
        ) THEN '✅ TIENE ITEMS'
        ELSE '❌ SIN ITEMS'
    END as estado_items
FROM public.invoices i
WHERE i.invoice_number = '000021';

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- ✅ invoice_items tendrá 1 registro:
--    - Balines #4MM DORADOS
--    - Cantidad: 1
--    - Precio: $155.000
--    - Total: $155.000
--
-- ✅ La factura mostrará:
--    REF | DESCRIPCIÓN          | UND | IVA 19% | PRECIO BASE | PRECIO NETO
--    1   | Balines #4MM DORADOS | 1   | $24.748 | $130.252    | $155.000
--    2   | COSTO DE ENVÍO       | 1   | 0%      | $24.628     | $24.628

