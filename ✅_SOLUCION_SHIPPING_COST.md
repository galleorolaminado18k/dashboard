# ✅ SOLUCIÓN: Agregar Campo shipping_cost a la Tabla invoices

## 🎯 Problema Identificado

**CAUSA RAÍZ:** El campo `shipping_cost` **NO EXISTE** en la tabla `invoices` de Supabase.

### Evidencia:
- ✅ El código del frontend está correcto
- ✅ El API envía el valor correctamente
- ❌ **La columna NO existe en la base de datos**
- ❌ Por eso siempre muestra `$0` o `null`

## 🛠️ Solución: Ejecutar Migración SQL

### Paso 1: Abrir Supabase Dashboard

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral

### Paso 2: Ejecutar el Script de Migración

**Archivo:** `scripts/048_add_shipping_cost_to_invoices.sql`

Copia y pega el contenido del archivo en el SQL Editor y haz clic en **RUN** (o presiona Ctrl+Enter).

**El script hace lo siguiente:**

1. ✅ **Agrega la columna `shipping_cost`** (NUMERIC, default 0)
2. ✅ **Agrega comentario** descriptivo a la columna
3. ✅ **Actualiza facturas existentes** a shipping_cost = 0
4. ✅ **Verifica** que la columna se creó correctamente
5. ✅ **Muestra** algunas facturas de ejemplo

### Paso 3: Verificar que Funcionó

Después de ejecutar el script, deberías ver:

```
✅ Columna shipping_cost agregada exitosamente
```

Y en la consulta final verás:

| invoice_number | client_name | subtotal | tax_amount | **shipping_cost** | total |
|----------------|-------------|----------|------------|-------------------|-------|
| 000021         | GREYCY...   | 130252   | 24748      | **0**             | 155000|

## 🎯 Resultado Esperado

### ✅ Facturas NUEVAS:
- Cuando crees una factura nueva e ingreses un valor de envío (ej: $15.000)
- El valor se **GUARDARÁ** correctamente en `shipping_cost`
- El modal **MOSTRARÁ** la línea "COSTO DE ENVÍO: $15.000"

### ⚠️ Facturas ANTIGUAS:
- Las facturas que ya existen mostrarán `shipping_cost = $0`
- Esto es normal porque fueron creadas antes de que existiera el campo
- Puedes editarlas manualmente si necesitas agregar el costo de envío

## 🧪 Probar que Funciona

### Test 1: Ver Factura Existente
1. Abre el dashboard
2. Ve a **Facturación**
3. Abre la factura 000021
4. Deberías ver la línea: **COSTO DE ENVÍO: $0**

### Test 2: Crear Factura Nueva
1. Ve a **Facturación** → **Nueva Factura**
2. Agrega un producto: Balines $155.000
3. **Ingresa costo de envío: $15.000**
4. Crea la factura
5. Ábrela
6. Deberías ver:

```
REF | DESCRIPCIÓN          | UND | IVA 19% | PRECIO BASE | PRECIO NETO
1   | Balines #4MM DORADOS | 1   | $24.748 | $130.252    | $155.000
2   | COSTO DE ENVÍO       | 1   | 0%      | $15.000     | $15.000

SUBTOTAL:    $145.252  ← (130.252 + 15.000)
IMPUESTOS:   $24.748   ← (solo del producto)
TOTAL NETO:  $170.000  ← (155.000 + 15.000)
```

## 📝 Script SQL Completo

```sql
-- Agregar columna shipping_cost si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'invoices' 
        AND column_name = 'shipping_cost'
    ) THEN
        ALTER TABLE public.invoices 
        ADD COLUMN shipping_cost NUMERIC(12,2) DEFAULT 0 NOT NULL;
        
        RAISE NOTICE '✅ Columna shipping_cost agregada exitosamente';
    ELSE
        RAISE NOTICE '✓ La columna shipping_cost ya existe';
    END IF;
END $$;

-- Agregar comentario
COMMENT ON COLUMN public.invoices.shipping_cost IS 'Costo de envío sin IVA';

-- Actualizar facturas existentes a 0
UPDATE public.invoices 
SET shipping_cost = 0 
WHERE shipping_cost IS NULL;

-- Verificar
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'invoices' 
AND column_name = 'shipping_cost';
```

## 🚨 IMPORTANTE

**DEBES ejecutar este script AHORA** para que el sistema funcione correctamente.

Sin este campo en la base de datos:
- ❌ Los valores de envío NO se guardarán
- ❌ Siempre mostrará $0 en las facturas
- ❌ Los cálculos de totales estarán incorrectos

Con este campo:
- ✅ Los valores se guardan correctamente
- ✅ Las facturas muestran el envío real
- ✅ Los totales se calculan bien

## 📊 Próximos Pasos

1. **AHORA:** Ejecuta el script SQL en Supabase
2. **Verifica:** Abre una factura y confirma que aparece "COSTO DE ENVÍO"
3. **Prueba:** Crea una factura nueva con envío
4. **Confirma:** El valor se guarda y muestra correctamente

---

**Fecha:** 2025-11-03  
**Script:** `048_add_shipping_cost_to_invoices.sql`  
**Estado:** ⏳ PENDIENTE DE EJECUTAR EN SUPABASE  
**Prioridad:** 🚨 ALTA - Ejecutar AHORA

