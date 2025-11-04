# ✅ AGREGAR SKU A FACTURA 000021

## 🎯 Objetivo

Agregar el SKU "04-100" al producto "Balines #4MM DORADOS" en la factura 000021 para que aparezca en la vista de factura.

## 📋 Situación Actual

En la imagen de la factura se ve:
```
SKU    DESCRIPCIÓN           CANT  IVA   TOTAL
-      Balines #4MM DORADOS  1     19%   $155.000
-      COSTO DE ENVÍO        1     0%    $24.628
```

## ✅ Resultado Esperado

```
SKU      DESCRIPCIÓN           CANT  IVA   TOTAL
04-100   Balines #4MM DORADOS  1     19%   $155.000
-        COSTO DE ENVÍO        1     0%    $24.628
```

## 📝 Instrucciones para Ejecutar

### Paso 1: Abrir Supabase SQL Editor

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral
4. Clic en **New query**

### Paso 2: Ejecutar el Script

Copia y pega el contenido del archivo:
```
scripts/051_agregar_sku_factura_000021.sql
```

### Paso 3: Verificar los Pasos

El script hace lo siguiente:

#### 1️⃣ Verificar estructura de la tabla
```sql
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'invoice_items';
```

#### 2️⃣ Ver items actuales
```sql
SELECT description, reference, total
FROM invoice_items
WHERE invoice_id = (SELECT id FROM invoices WHERE invoice_number = '000021');
```

#### 3️⃣ Actualizar el SKU
```sql
UPDATE invoice_items
SET reference = '04-100'
WHERE invoice_id = (SELECT id FROM invoices WHERE invoice_number = '000021')
AND description LIKE '%Balines%';
```

#### 4️⃣ Verificar el resultado
```sql
SELECT 
    i.invoice_number,
    ii.reference AS sku,
    ii.description,
    ii.total
FROM invoice_items ii
JOIN invoices i ON ii.invoice_id = i.id
WHERE i.invoice_number = '000021';
```

## ✅ Verificación

Después de ejecutar el script:

1. Recarga la página de facturación
2. Abre la factura 000021
3. Deberías ver el SKU "04-100" en lugar del guión "-"

## 🔍 Troubleshooting

### Si la columna `reference` no existe:

Ejecuta primero:
```sql
ALTER TABLE public.invoice_items 
ADD COLUMN IF NOT EXISTS reference TEXT;
```

Luego ejecuta el UPDATE.

### Si no encuentra el producto:

Verifica el nombre exacto:
```sql
SELECT description 
FROM invoice_items 
WHERE invoice_id = (SELECT id FROM invoices WHERE invoice_number = '000021');
```

Ajusta el LIKE en el UPDATE según el nombre real.

## 📊 Resultado Final

Después de ejecutar el script, la factura mostrará:

| SKU | DESCRIPCIÓN | CANT | IVA | TOTAL |
|-----|-------------|------|-----|-------|
| 04-100 | Balines #4MM DORADOS | 1 | 19% | $155.000 |
| - | COSTO DE ENVÍO | 1 | 0% | $24.628 |

**SUBTOTAL PRODUCTOS (sin IVA):** $130.252  
**IVA (19%):** $24.748  
**COSTO ENVÍO:** $24.628  
**SUBTOTAL FINAL:** $154.880  
**TOTAL A PAGAR:** $179.628

---

**Fecha:** 2025-11-03  
**Script:** 051_agregar_sku_factura_000021.sql  
**Estado:** ⏳ PENDIENTE DE EJECUCIÓN EN SUPABASE

