# ✅ FIX SCRIPT 051 - Error UUID Solucionado

## 🚨 Error Original

```
ERROR: 42883: operator does not exist: text = uuid
LINE 24: WHERE invoice_id = (
HINT: No operator matches the given name and argument types. 
You might need to add explicit type casts.
```

## 🔍 Causa del Error

PostgreSQL no puede comparar directamente un tipo **UUID** con un tipo **TEXT** sin un cast explícito.

En la tabla `invoice_items`, la columna `invoice_id` es de tipo **UUID**, pero la subconsulta devuelve el `id` de `invoices` que también es UUID. El problema ocurre cuando PostgreSQL intenta comparar estos valores.

## ✅ Solución Aplicada

He agregado el cast explícito `::text` a ambos lados de la comparación:

### ANTES (con error):
```sql
WHERE invoice_id = (
    SELECT id
    FROM public.invoices
    WHERE invoice_number = '000021'
)
```

### DESPUÉS (corregido):
```sql
WHERE invoice_id::text = (
    SELECT id::text
    FROM public.invoices
    WHERE invoice_number = '000021'
)
```

## 📝 Cambios Realizados

### Query 1: Ver items actuales
```sql
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
```

### Query 2: Actualizar SKU
```sql
UPDATE public.invoice_items
SET reference = '04-100'
WHERE invoice_id::text = (
    SELECT id::text
    FROM public.invoices
    WHERE invoice_number = '000021'
)
AND description LIKE '%Balines%';
```

## 🎯 Ahora el Script Completo Funciona

Ejecuta nuevamente el script completo en Supabase SQL Editor:

1. **Copia** todo el contenido del archivo `scripts/051_agregar_sku_factura_000021.sql`
2. **Pega** en SQL Editor
3. **RUN** - Ahora NO debería dar error
4. **Verifica** que el SKU "04-100" aparece en los resultados

## ✅ Resultado Esperado

Después de ejecutar el script, deberías ver:

```
invoice_number | sku    | description           | quantity | unit_price | total
000021         | 04-100 | Balines #4MM DORADOS  | 1        | 155000     | 155000
000021         | null   | COSTO DE ENVÍO        | 1        | 24628      | 24628
```

El producto ahora tiene SKU "04-100" y aparecerá en la factura.

## 📊 Datos Reales de la Factura

La factura 000021 contiene:
- **Cliente:** GREYCY SALAMANCA
- **Producto:** Balines #4MM DORADOS
- **SKU:** 04-100 (después del UPDATE)
- **Cantidad:** 1
- **Total producto:** $155.000
- **Costo envío:** $24.628
- **Total factura:** $179.628

---

**Fecha:** 2025-11-03  
**Fix:** Cast UUID a TEXT  
**Estado:** ✅ CORREGIDO Y SUBIDO A GITHUB  
**Listo para:** Ejecutar en Supabase SQL Editor

