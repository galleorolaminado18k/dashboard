# ✅ ACTUALIZAR FACTURA 000021 CON VALOR REAL DE ENVÍO

## 🎯 Situación Actual

**Factura 000021 - GREYCY SALAMANCA:**
- ❌ `shipping_cost = 0.00` (incorrecto)
- ✅ **Valor REAL del envío: $24.628 COP**

## 📋 Cálculo Correcto

### Desglose del Producto:
| Concepto | Valor |
|----------|-------|
| Producto con IVA | $155.000 |
| Producto sin IVA (÷1.19) | $130.252 |
| IVA 19% del producto | $24.748 |

### Agregar Envío:
| Concepto | Valor |
|----------|-------|
| Envío (sin IVA) | **$24.628** |

### Totales Correctos:
| Concepto | Cálculo | Valor |
|----------|---------|-------|
| **SUBTOTAL** | $130.252 + $24.628 | **$154.880** |
| **IMPUESTOS** | (solo del producto) | **$24.748** |
| **TOTAL NETO** | $155.000 + $24.628 | **$179.628** |

## 🛠️ Script de Actualización

**Archivo:** `scripts/049_update_factura_000021_shipping.sql`

### Ejecuta esto en Supabase SQL Editor:

```sql
-- Actualizar factura 000021 con valores correctos
UPDATE public.invoices
SET 
    shipping_cost = 24628,    -- Valor REAL del envío
    subtotal = 154880,        -- 130.252 + 24.628
    total = 179628            -- 155.000 + 24.628
WHERE invoice_number = '000021';

-- Verificar
SELECT 
    invoice_number,
    client_name,
    subtotal,
    tax_amount,
    shipping_cost,
    total
FROM public.invoices
WHERE invoice_number = '000021';
```

## ✅ Resultado Esperado

### Antes (INCORRECTO):
```
SUBTOTAL:    $155.000
IMPUESTOS:   $29.450
TOTAL NETO:  $184.450
```

### Después (CORRECTO):
```
REF | DESCRIPCIÓN          | UND | IVA 19% | PRECIO BASE | PRECIO NETO
1   | Balines #4MM DORADOS | 1   | $24.748 | $130.252    | $155.000
2   | COSTO DE ENVÍO       | 1   | 0%      | $24.628     | $24.628

SUBTOTAL:    $154.880  ← (productos sin IVA + envío)
IMPUESTOS:   $24.748   ← (solo IVA de productos)
TOTAL NETO:  $179.628  ← (productos con IVA + envío)
```

## 📝 Pasos para Ejecutar

1. **Abre Supabase Dashboard**
2. **Ve a SQL Editor**
3. **Copia y pega** el script `049_update_factura_000021_shipping.sql`
4. **Haz clic en RUN**
5. **Verifica** que `shipping_cost = 24628`
6. **Abre la factura** en el dashboard
7. **Confirma** que se ve correctamente

## 🚨 IMPORTANTE: Para Futuras Facturas

**SIEMPRE debes ingresar el valor REAL del envío** al crear una factura nueva.

El sistema ahora:
- ✅ Tiene el campo `shipping_cost` en la base de datos
- ✅ Muestra la línea "COSTO DE ENVÍO" en todas las facturas
- ✅ Calcula correctamente los totales
- ✅ Guarda el valor que ingreses en el formulario

**Cuando crees una factura:**
1. Agrega los productos
2. **Ingresa el costo de envío REAL** (ej: $24.628)
3. El sistema lo guardará correctamente
4. La factura mostrará el valor real

## 📊 Valores en la Base de Datos

Después de ejecutar el script, la factura 000021 tendrá:

| Campo | Valor Anterior | Valor Nuevo | Estado |
|-------|----------------|-------------|--------|
| `subtotal` | 155000 | **154880** | ✅ Corregido |
| `tax_amount` | 29450 | **24748** | ✅ Corregido |
| `shipping_cost` | 0 | **24628** | ✅ Corregido |
| `total` | 184450 | **179628** | ✅ Corregido |

---

**Fecha:** 2025-11-03  
**Script:** `049_update_factura_000021_shipping.sql`  
**Valor real del envío:** $24.628 COP  
**Estado:** ⏳ PENDIENTE DE EJECUTAR EN SUPABASE  
**Prioridad:** 🚨 ALTA

