# ✅ SCRIPT CORREGIDO - Agregar Items a Factura 000021

## 🔧 Problema Resuelto

El script anterior tenía un error de tipo de datos. **YA ESTÁ CORREGIDO**.

## ✅ Script Correcto (Ejecuta Este)

**Archivo:** `scripts/050_fix_factura_000021_items.sql`

### Ejecuta ESTE código en Supabase SQL Editor:

```sql
-- Verificar si ya existen items y agregar si no existen
DO $$
BEGIN
    -- Verificar si ya existen items para la factura 000021
    IF NOT EXISTS (
        SELECT 1
        FROM public.invoice_items
        WHERE invoice_id = '000021'
    ) THEN
        -- Insertar el producto: Balines #4MM DORADOS
        INSERT INTO public.invoice_items (
            invoice_id,
            description,
            quantity,
            unit_price,
            total
        ) VALUES (
            '000021',  -- invoice_id es TEXT
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

-- Verificar que se agregó
SELECT
    ii.id,
    ii.invoice_id,
    ii.description,
    ii.quantity,
    ii.unit_price,
    ii.total
FROM public.invoice_items ii
WHERE ii.invoice_id = '000021';
```

## ✅ Resultado Esperado

Deberías ver:

```
✅ Item agregado a la factura 000021

id | invoice_id | description          | quantity | unit_price | total
---|------------|----------------------|----------|------------|--------
...| 000021     | Balines #4MM DORADOS | 1        | 155000     | 155000
```

## 📋 Después de Ejecutar Este Script

**EJECUTA TAMBIÉN el script 049** para actualizar el envío:

```sql
UPDATE public.invoices
SET
    shipping_cost = 24628,
    subtotal = 154880,
    total = 179628
WHERE invoice_number = '000021';
```

## 🎯 Resultado Final

La factura mostrará:

| REF | DESCRIPCIÓN | UND | IVA 19% | PRECIO BASE | PRECIO NETO |
|-----|-------------|-----|---------|-------------|-------------|
| 1 | Balines #4MM DORADOS | 1 | $24.748 | $130.252 | $155.000 |
| 2 | COSTO DE ENVÍO | 1 | 0% | $24.628 | $24.628 |

```
SUBTOTAL:    $154.880
IMPUESTOS:   $24.748
TOTAL NETO:  $179.628
```

---

**Fecha:** 2025-11-03  
**Commit:** `1113b85`  
**Estado:** ✅ CORREGIDO - LISTO PARA EJECUTAR  
**Orden:** Ejecuta 050 primero, luego 049

