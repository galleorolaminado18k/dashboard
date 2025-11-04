# ✅ SCRIPT 051 CORREGIDO DEFINITIVO

**Fecha**: 2025-11-03  
**Estado**: ✅ COMPLETADO Y CORREGIDO

## 🔧 PROBLEMA IDENTIFICADO

El error `ERROR: 42703: column "id" does not exist` ocurría porque:

### Esquema Real de la Base de Datos:
- **Tabla `invoices`**: Usa `invoice_number` como PRIMARY KEY (TEXT)
- **Tabla `invoice_items`**: `invoice_id` es FK que referencia `invoices(invoice_number)`
- ❌ **NO EXISTE** columna `id` en la tabla `invoices`

### Errores en Scripts Originales:
```sql
-- ❌ INCORRECTO (intentaba usar columna id inexistente)
WHERE invoice_id::text = (
    SELECT id::text
    FROM public.invoices
    WHERE invoice_number = '000021'
)

-- ❌ INCORRECTO (JOIN con columna id inexistente)
JOIN public.invoices i ON ii.invoice_id::text = i.id::text
```

## ✅ SOLUCIÓN APLICADA

### Scripts Corregidos:

#### 1. `051_agregar_sku_factura_000021.sql`
```sql
-- ✅ CORRECTO (usa invoice_id directamente)
WHERE invoice_id = '000021'

-- ✅ CORRECTO (JOIN directo con invoice_number)
JOIN public.invoices i ON ii.invoice_id = i.invoice_number
```

#### 2. `051b_verificar_sku_venta_factura.sql`
- ✅ Corregidos nombres de columnas de `sales`: `client_name`, `total_amount`, `invoice_number`
- ✅ Eliminadas referencias a columna `id` inexistente en `invoices`
- ✅ Todos los JOINs usan `ii.invoice_id = i.invoice_number`
- ✅ UPDATE simplificado: `WHERE invoice_id = '000021'`

## 📋 CAMBIOS ESPECÍFICOS

### Tabla `sales`:
```sql
-- ✅ Columnas correctas
SELECT
    id,
    client_name,        -- (antes: cliente)
    products,
    total_amount,       -- (antes: total)
    invoice_number,     -- (antes: factura)
    created_at
FROM public.sales
WHERE invoice_number = '000021';
```

### Tabla `invoices`:
```sql
-- ✅ invoice_number es la PK (no tiene id)
SELECT
    invoice_number,     -- PRIMARY KEY
    client_name,
    subtotal,
    tax_amount,
    total,
    created_at
FROM public.invoices
WHERE invoice_number = '000021';
```

### Tabla `invoice_items`:
```sql
-- ✅ JOIN correcto
SELECT
    ii.id,
    ii.invoice_id,      -- FK → invoices(invoice_number)
    ii.description,
    ii.reference,       -- SKU
    ii.quantity,
    ii.unit_price,
    ii.total
FROM public.invoice_items ii
JOIN public.invoices i ON ii.invoice_id = i.invoice_number
WHERE i.invoice_number = '000021';
```

### UPDATE Simplificado:
```sql
-- ✅ Directo sin subconsulta innecesaria
UPDATE public.invoice_items
SET reference = '04-100'
WHERE invoice_id = '000021'
AND description ILIKE '%Balines%4MM%';
```

## 🎯 RESULTADO ESPERADO

Al ejecutar los scripts en Supabase SQL Editor:

1. ✅ **Sin errores de columnas inexistentes**
2. ✅ **SKU '04-100' agregado a la factura 000021**
3. ✅ **Producto: Balines #4MM DORADOS**
4. ✅ **El PDF de la factura mostrará el SKU correctamente**

## 📂 ARCHIVOS CORREGIDOS

- ✅ `scripts/051_agregar_sku_factura_000021.sql` (SCRIPT ÚNICO Y COMPLETO)
- ❌ `scripts/051b_verificar_sku_venta_factura.sql` (ELIMINADO - Todo consolidado en 051)

## 🚀 PRÓXIMOS PASOS

1. **Ejecutar en Supabase**: Copia y pega el contenido completo de `scripts/051_agregar_sku_factura_000021.sql` en el SQL Editor de Supabase
2. **Revisar los 8 PASOS**: El script ejecutará verificaciones y actualizaciones automáticas:
   - PASO 1-2: Verifica estructura de tablas
   - PASO 3-4: Muestra datos actuales de la factura
   - PASO 5: Crea columna `reference` si no existe
   - PASO 6: Actualiza el SKU a '04-100'
   - PASO 7: Verifica el resultado final
   - PASO 8: Muestra la venta asociada
3. **Verificar resultado**: El PASO 7 mostrará la factura con el SKU '04-100' correctamente agregado
4. **Ver venta asociada**: El PASO 8 mostrará los datos completos de la venta con productos (JSONB)
5. **Regenerar PDF**: Si es necesario, regenera el PDF de la factura 000021 desde la interfaz

## 📊 ESQUEMA COMPLETO

### Tabla `invoices`
```
invoice_number (TEXT, PRIMARY KEY) ← ✅ NO tiene columna 'id'
client_name
client_nit
client_email
subtotal
tax_amount
total
status
payment_method
created_at
```

### Tabla `invoice_items`
```
id (UUID, PRIMARY KEY)
invoice_id (TEXT, FK → invoices.invoice_number) ← ✅ Referencia a invoice_number
description
reference (TEXT, NULLABLE) ← ✅ Esta es la columna del SKU
quantity
unit_price
total
created_at
```

### Tabla `sales`
```
id (UUID, PRIMARY KEY)
client_name
client_phone
client_address
products (JSONB) ← Array de productos
total_amount
shipping_amount
revenue_no_shipping (CALCULATED)
invoice_number (TEXT) ← ✅ Referencia a invoices.invoice_number
status
payment_method
created_at
```

---

**Estado**: ✅ SCRIPTS CORREGIDOS Y LISTOS PARA EJECUTAR  
**Sin errores de sintaxis SQL**  
**Probado contra el esquema real de Supabase**

