# 🚨 URGENTE: Factura 000021 Sin Items

## ❌ Problema Actual

La factura 000021 muestra:
- **"No hay items en esta factura"**
- Solo muestra el subtotal, impuestos y total
- NO muestra los productos

## 🎯 Causa

La tabla `invoice_items` NO tiene registros para la factura 000021. Por eso el modal no puede mostrar los productos.

## ✅ Solución: Ejecutar 2 Scripts en Orden

### Script 1: Agregar Items Faltantes

**Archivo:** `scripts/050_fix_factura_000021_items.sql`

Este script agrega el producto "Balines #4MM DORADOS" que falta en la tabla `invoice_items`.

### Script 2: Actualizar Valores de Envío

**Archivo:** `scripts/049_update_factura_000021_shipping.sql`

Este script actualiza el `shipping_cost` al valor real ($24.628).

## 📋 Ejecuta AMBOS Scripts en Orden

### **1️⃣ PRIMERO - Agregar Items:**

```sql
-- Agregar el producto faltante
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
```

### **2️⃣ SEGUNDO - Actualizar Envío:**

```sql
-- Actualizar valores de envío y totales
UPDATE public.invoices
SET
    shipping_cost = 24628,
    subtotal = 154880,
    total = 179628
WHERE invoice_number = '000021';
```

## ✅ Resultado Esperado

Después de ejecutar AMBOS scripts, la factura mostrará:

### Tabla de Productos:

| REF | DESCRIPCIÓN | UND | IVA 19% | PRECIO BASE | PRECIO NETO |
|-----|-------------|-----|---------|-------------|-------------|
| 1 | Balines #4MM DORADOS | 1 | $24.748 | $130.252 | $155.000 |
| 2 | COSTO DE ENVÍO | 1 | 0% | $24.628 | $24.628 |

### Totales:

```
SUBTOTAL:    $154.880  (productos sin IVA + envío)
IMPUESTOS:   $24.748   (solo IVA de productos)
TOTAL NETO:  $179.628  (productos con IVA + envío)
```

## 🔍 Verificar que Funcionó

Después de ejecutar los scripts:

1. **Ve a Supabase** y ejecuta:
```sql
SELECT 
    i.invoice_number,
    i.client_name,
    ii.description,
    ii.quantity,
    ii.unit_price,
    i.shipping_cost
FROM public.invoices i
LEFT JOIN public.invoice_items ii ON ii.invoice_id = i.id
WHERE i.invoice_number = '000021';
```

Deberías ver:
- ✅ 1 fila con "Balines #4MM DORADOS"
- ✅ shipping_cost = 24628

2. **Abre el dashboard** y abre la factura 000021
3. **Confirma** que se ven los productos y el envío

## 🚨 IMPORTANTE

Este problema ocurrió porque:
- La factura se creó pero NO se guardaron los items en `invoice_items`
- Probablemente hubo un error al crear la factura originalmente

### Para Futuras Facturas:

Asegúrate de que cuando crees una factura:
1. ✅ Se guarda la factura en `invoices`
2. ✅ Se guardan los items en `invoice_items`
3. ✅ Se guarda el `shipping_cost` correcto

## 📊 Scripts Creados

1. `050_fix_factura_000021_items.sql` - Agrega items faltantes
2. `049_update_factura_000021_shipping.sql` - Actualiza envío

**Ejecuta el 050 PRIMERO, luego el 049**

---

**Fecha:** 2025-11-03  
**Estado:** 🚨 URGENTE - EJECUTAR AHORA  
**Prioridad:** CRÍTICA  
**Orden:** 050 → 049

